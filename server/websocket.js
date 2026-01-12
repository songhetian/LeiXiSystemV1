const socketIO = require('socket.io')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 存储用户连接 userId -> Set of socket ids
const userConnections = new Map()

/**
 * 设置WebSocket服务器
 * @param {http.Server} server - HTTP服务器实例
 * @param {object} redis - Redis 实例
 * @returns {SocketIO.Server} Socket.IO服务器实例
 */
function setupWebSocket(server, redis) {
  const io = socketIO(server, {
    cors: {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  })

  // 挂载 redis 实例到 io 方便后续工具函数使用
  io.redis = redis;

  // 服务器启动时清理在线列表（防止旧数据污染）
  if (redis) {
    redis.del('online_users').catch(err => console.error('Redis 清理在线列表失败:', err));
  }

  // 认证中间件
  io.use((socket, next) => {
    // ... 原有逻辑保持不变
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error('Authentication error: No token provided'))
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      socket.userId = decoded.id
      socket.username = decoded.username || decoded.real_name
      socket.userRole = decoded.role
      next()
    } catch (err) {
      console.error('WebSocket认证失败:', err.message)
      next(new Error('Authentication error: Invalid token'))
    }
  })

  // 连接处理
  io.on('connection', async (socket) => {
    const userId = socket.userId
    console.log(`✅ [WebSocket] 用户 ${socket.username} (ID: ${userId}) 已连接`)

    // 1. 记录连接 (本地内存)
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set())
    }
    userConnections.get(userId).add(socket.id)

    // 2. 记录在线状态 (Redis 全局)
    if (redis) {
      await redis.sadd('online_users', userId);
    }

    // 加入用户专属房间
    socket.join(`user_${userId}`)

    // 发送欢迎消息
    socket.emit('connected', {
      message: '已连接到实时通知服务器',
      userId: userId,
      timestamp: new Date().toISOString()
    })

    // 广播全系统在线人数 (从 Redis 获取)
    const onlineCount = redis ? await redis.scard('online_users') : userConnections.size;
    io.emit('online_users_count', {
      count: onlineCount
    })

    // 心跳检测
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() })
    })

    // 客户端请求未读通知数
    socket.on('request_unread_count', async () => {
      socket.emit('unread_count', { count: 0 })
    })

    // 断开连接
    socket.on('disconnect', async (reason) => {
      console.log(`❌ [WebSocket] 用户 ${socket.username} 已断开连接 (原因: ${reason})`)

      const connections = userConnections.get(userId)
      if (connections) {
        connections.delete(socket.id)
        if (connections.size === 0) {
          userConnections.delete(userId)
          // 3. 从 Redis 移除在线状态
          if (redis) {
            await redis.srem('online_users', userId);
          }
        }
      }

      // 再次广播全系统在线人数
      const currentOnlineCount = redis ? await redis.scard('online_users') : userConnections.size;
      io.emit('online_users_count', {
        count: currentOnlineCount
      })
    })

    // 错误处理
    socket.on('error', (error) => {
      console.error(`❌ [WebSocket] Socket错误 (用户: ${socket.username}):`, error)
    })
  })

  console.log('🔌 [WebSocket] 服务器已启动')
  return io
}

/**
 * 发送通知给指定用户
 * @param {SocketIO.Server} io - Socket.IO服务器实例
 * @param {number} userId - 用户ID
 * @param {object} notification - 通知对象
 */
function sendNotificationToUser(io, userId, notification) {
  io.to(`user_${userId}`).emit('new_notification', notification)
  console.log(`📨 [WebSocket] 通知已发送给用户 ${userId}:`, notification.title)
}

/**
 * 发送备忘录给指定用户
 * @param {SocketIO.Server} io - Socket.IO服务器实例
 * @param {number} userId - 用户ID
 * @param {object} memo - 备忘录对象
 */
function sendMemoToUser(io, userId, memo) {
  io.to(`user_${userId}`).emit('new_memo', memo)
  console.log(`📝 [WebSocket] 备忘录已发送给用户 ${userId}:`, memo.title)
}

/**
 * 批量发送通知
 * @param {SocketIO.Server} io - Socket.IO服务器实例
 * @param {number[]} userIds - 用户ID数组
 * @param {object} notification - 通知对象
 */
function broadcastNotification(io, userIds, notification) {
  userIds.forEach(userId => {
    sendNotificationToUser(io, userId, notification)
  })
  console.log(`📢 [WebSocket] 广播通知已发送给 ${userIds.length} 个用户`)
}

/**
 * 发送广播消息
 * @param {SocketIO.Server} io - Socket.IO服务器实例
 * @param {number[]} userIds - 用户ID数组
 * @param {object} broadcast - 广播对象
 */
function sendBroadcast(io, userIds, broadcast) {
  userIds.forEach(userId => {
    io.to(`user_${userId}`).emit('new_broadcast', broadcast)
  })
  console.log(`📣 [WebSocket] 系统广播已发送给 ${userIds.length} 个用户`)
}

/**
 * 获取在线用户数 (跨进程)
 * @returns {Promise<number>} 在线用户数
 */
async function getOnlineUserCount(io) {
  if (io.redis) {
    return await io.redis.scard('online_users');
  }
  return userConnections.size
}

/**
 * 检查用户是否在线 (跨进程)
 * @param {object} io - io 实例
 * @param {number} userId - 用户ID
 * @returns {Promise<boolean>} 是否在线
 */
async function isUserOnline(io, userId) {
  if (io.redis) {
    return await io.redis.sismember('online_users', userId) === 1;
  }
  return userConnections.has(userId)
}

/**
 * 获取所有在线用户ID (跨进程)
 * @returns {Promise<number[]>} 在线用户ID数组
 */
async function getOnlineUserIds(io) {
  if (io.redis) {
    const ids = await io.redis.smembers('online_users');
    return ids.map(id => parseInt(id));
  }
  return Array.from(userConnections.keys())
}

module.exports = {
  setupWebSocket,
  sendNotificationToUser,
  sendMemoToUser,
  broadcastNotification,
  sendBroadcast,
  getOnlineUserCount,
  isUserOnline,
  getOnlineUserIds
}
