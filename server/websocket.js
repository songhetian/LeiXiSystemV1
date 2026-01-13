const socketIO = require('socket.io')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 存储用户连接 userId -> Set of socket ids
const userConnections = new Map()

/**
 * 设置WebSocket服务器
 */
function setupWebSocket(server, redis, getPool) {
  const io = socketIO(server, {
    cors: { origin: true, credentials: true, methods: ['GET', 'POST'] },
    pingTimeout: 60000,
    pingInterval: 25000
  })

  io.redis = redis;

  // --- Redis Pub/Sub Integration ---
  if (redis) {
    const subClient = redis.duplicate();
    subClient.subscribe('chat_messages', 'system_notifications', (err, count) => {
      if (err) console.error('Redis 订阅失败:', err);
      else console.log(`🔌 [Redis Pub/Sub] 已订阅 ${count} 个频道`);
    });

    subClient.on('message', (channel, message) => {
      try {
        const data = JSON.parse(message);
        if (channel === 'chat_messages') {
          if (data.group_id) io.to(`group_${data.group_id}`).emit('receive_message', data);
          else if (data.receiver_id) io.to(`user_${data.receiver_id}`).emit('receive_message', data);
        } else if (channel === 'system_notifications') {
          // DEBUG: Trace Redis Notification
          console.log('📨 [Redis Sub] Received system_notification:', message);
          if (data.userId) {
            const msgType = data.sys_type || data.type;
            const event = msgType === 'broadcast' ? 'new_broadcast' : (msgType === 'memo' ? 'new_memo' : 'new_notification');
            console.log(`📤 [Socket] Emitting ${event} to user_${data.userId}`);
            io.to(`user_${data.userId}`).emit(event, data);
          } else {
            io.emit('new_notification', data);
          }
        }
      } catch (e) { console.error('Redis 消息解析失败:', e); }
    });
  }

  if (redis) {
    redis.del('online_users').catch(err => console.error('Redis 清理在线列表失败:', err));
  }

  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('Authentication error: No token provided'))
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      socket.userId = String(decoded.id); // 强制转字符串
      socket.username = decoded.username || decoded.real_name
      next()
    } catch (err) { next(new Error('Authentication error: Invalid token')) }
  })

  io.on('connection', async (socket) => {
    const userId = socket.userId
    console.log(`✅ [WebSocket] 用户 ${socket.username} (ID: ${userId}) 已连接`)

    if (!userConnections.has(userId)) userConnections.set(userId, new Set())
    userConnections.get(userId).add(socket.id)

    // 记录在线状态
    if (redis) {
      await redis.sadd('online_users', userId);
      console.log(`📡 [Redis] 上线登记成功: ${userId}`);

      // 强制触发一次全局统计广播
      const count = await redis.scard('online_users');
      io.emit('online_users_count', { count });
    }

    socket.join(`user_${userId}`)
    socket.emit('connected', { message: '已连接', userId: userId, timestamp: new Date() })

    // 接收心跳时补录状态 (防止Redis意外丢失)
    socket.on('ping', async () => {
      if (redis) await redis.sadd('online_users', userId);
      socket.emit('pong', { timestamp: Date.now() })
    })

    // --- Chat Events ---

    // 加入群组房间
    socket.on('join_group', (groupId) => {
      socket.join(`group_${groupId}`);
      console.log(`User ${userId} joined group_${groupId}`);
    });

    // 离开群组房间
    socket.on('leave_group', (groupId) => {
      socket.leave(`group_${groupId}`);
    });

    // 请求全量未读数 (IM 消息 + 系统通知)
    socket.on('request_unread_count', async () => {
      const pool = getPool ? getPool() : null;
      if (!pool) return;

      try {
        // 1. 获取 IM 未读数
        const [groups] = await pool.query(`
          SELECT SUM(unread.count) as count FROM (
            SELECT (SELECT COUNT(*) FROM chat_messages m WHERE m.group_id = g.id AND m.id > IFNULL(gm.last_read_message_id, 0)) as count
            FROM chat_groups g
            JOIN chat_group_members gm ON g.id = gm.group_id
            WHERE gm.user_id = ?
          ) unread
        `, [userId]);
        
        const chatUnread = parseInt(groups[0]?.count || 0);

        // 2. 获取系统通知未读数
        const [notifs] = await pool.query(
          'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
          [userId]
        );
        const notifUnread = parseInt(notifs[0]?.count || 0);

        socket.emit('unread_count', { 
          count: chatUnread + notifUnread,
          chat: chatUnread,
          notification: notifUnread,
          timestamp: Date.now() 
        });
      } catch (err) {
        console.error('Request Unread Count Error:', err);
      }
    });

    // 发送消息
    socket.on('send_message', async (data) => {
      const pool = getPool ? getPool() : null;
      if (!pool) return;

      try {
        const { targetId, targetType, content, type = 'text', fileUrl } = data;

        // 使用全局队列处理 (由 index.js 初始化并挂载到 io 上)
        if (!io.messageQueue) {
          const MessageQueue = require('./utils/messageQueue');
          io.messageQueue = new MessageQueue(pool, redis);
          await io.messageQueue.initSequence();
        }

        // 1. 快速入队并获取 ID
        const msgToQueue = {
          sender_id: userId,
          group_id: targetId,
          content,
          msg_type: type,
          file_url: fileUrl,
          sender_name: socket.username,
          sender_avatar: socket.handshake.auth.avatar // 假设前端传了，没传也没关系
        };

        const savedMsg = await io.messageQueue.enqueue(msgToQueue);

        // 补全发送者信息 (用于前端显示，无需查库)
        if (!savedMsg.sender_name) savedMsg.sender_name = socket.username;

        // 2. 广播消息
        if (redis) {
          // Redis 极速广播 (不等待写库)
          await redis.publish('chat_messages', JSON.stringify(savedMsg));

          // 更新最后一条消息预览
          const preview = {
            content: type === 'text' ? content : (type === 'image' ? '[图片]' : '[文件]'),
            time: savedMsg.created_at,
            sender: savedMsg.sender_name
          };
          await redis.set(`chat:group:${targetId}:last_msg`, JSON.stringify(preview), 'EX', 86400 * 7);

          // 维护最近消息历史缓存 (List)
          const historyKey = `chat:group:${targetId}:recent_messages`;
          await redis.lpush(historyKey, JSON.stringify(savedMsg));
          await redis.ltrim(historyKey, 0, 99);
          await redis.expire(historyKey, 86400 * 3);
        } else {
          // 无 Redis 时：直接通过 Socket.IO 广播给群组成员
          console.log(`📡 [Direct Broadcast] Group ${targetId}: ${content}`);
          io.to(`group_${targetId}`).emit('receive_message', savedMsg);
        }

      } catch (err) {
        console.error('Chat Send Error:', err);
        socket.emit('error', { message: '消息发送失败' });
      }
    });

    socket.on('disconnect', async (reason) => {
      console.log(`❌ [WebSocket] 用户 ${socket.username} 已断开: ${reason}`)
      const connections = userConnections.get(userId)
      if (connections) {
        connections.delete(socket.id)
        if (connections.size === 0) {
          userConnections.delete(userId)
          if (redis) {
            await redis.srem('online_users', userId);
            console.log(`📡 [Redis] 下线移除成功: ${userId}`);
          }
        }
      }
    })
  })

  return io
}

function sendNotificationToUser(io, userId, notification) {
  // 仅在 Redis 状态为 ready 时通过 Redis 发布
  if (io.redis && io.redis.status === 'ready') {
    io.redis.publish('system_notifications', JSON.stringify({ ...notification, userId }));
  } else {
    // 否则直接通过本地 Socket.io 发送
    io.to(`user_${userId}`).emit('new_notification', notification)
  }
}

function broadcastNotification(io, userIds, notification) {
  userIds.forEach(userId => sendNotificationToUser(io, userId, notification));
}

function sendBroadcast(io, userIds, broadcast) {
  userIds.forEach(userId => {
    if (io.redis && io.redis.status === 'ready') {
      io.redis.publish('system_notifications', JSON.stringify({ ...broadcast, userId, sys_type: 'broadcast' }));
    } else {
      io.to(`user_${userId}`).emit('new_broadcast', broadcast)
    }
  });
}

function sendMemoToUser(io, userId, memo) {
  if (io.redis && io.redis.status === 'ready') {
    io.redis.publish('system_notifications', JSON.stringify({ ...memo, userId, type: 'memo' }));
  } else {
    io.to(`user_${userId}`).emit('new_memo', memo)
  }
}

/**
 * 强制断开用户的所有Socket连接
 */
function forceDisconnectUser(io, userId) {
  const socketIds = userConnections.get(String(userId));
  if (socketIds) {
    socketIds.forEach(sid => {
      const socket = io.sockets.sockets.get(sid);
      if (socket) {
        socket.emit('kicked_out', { message: '您的账号已被停用或删除' });
        socket.disconnect(true);
      }
    });
    userConnections.delete(String(userId));
    console.log(`🚨 [WebSocket] 已强制切断用户 ${userId} 的所有连接`);
  }
}

async function getOnlineUserCount(io) {
  if (io.redis) return await io.redis.scard('online_users');
  return userConnections.size;
}

module.exports = {
  setupWebSocket,
  sendNotificationToUser,
  broadcastNotification,
  sendBroadcast,
  sendMemoToUser,
  getOnlineUserCount,
  forceDisconnectUser
}
