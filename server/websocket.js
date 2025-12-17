const socketIO = require('socket.io')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 存储用户连接 userId -> Set of socket ids
const userConnections = new Map()

// 存储io实例
let io;

/**
 * 设置WebSocket服务器
 * @param {http.Server} server - HTTP服务器实例
 * @returns {SocketIO.Server} Socket.IO服务器实例
 */
function setupWebSocket(server) {
  io = socketIO(server, {
    cors: {
      origin: true, // 允许所有来源
      credentials: true,
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  })

  // 认证中间件
  io.use((socket, next) => {
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
  io.on('connection', (socket) => {
    const userId = socket.userId
    console.log(`✅ [WebSocket] 用户 ${socket.username} (ID: ${userId}) 已连接`)

    // 记录连接
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set())
    }
    userConnections.get(userId).add(socket.id)

    // 加入用户专属房间
    socket.join(`user_${userId}`)

    // 发送欢迎消息
    socket.emit('connected', {
      message: '已连接到实时通知服务器',
      userId: userId,
      timestamp: new Date().toISOString()
    })

    // 广播在线用户数（可选）
    io.emit('online_users_count', {
      count: userConnections.size
    })

    // 心跳检测
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() })
    })

    // 客户端请求未读通知数
    socket.on('request_unread_count', async () => {
      // 这里可以查询数据库获取未读数
      // 暂时发送一个示例响应
      socket.emit('unread_count', { count: 0 })
    })

    // 断开连接
    socket.on('disconnect', (reason) => {
      console.log(`❌ [WebSocket] 用户 ${socket.username} 已断开连接 (原因: ${reason})`)

      const connections = userConnections.get(userId)
      if (connections) {
        connections.delete(socket.id)
        if (connections.size === 0) {
          userConnections.delete(userId)
        }
      }

      // 广播在线用户数
      io.emit('online_users_count', {
        count: userConnections.size
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
 * 获取在线用户数
 * @returns {number} 在线用户数
 */
function getOnlineUserCount() {
  return userConnections.size
}

/**
 * 检查用户是否在线
 * @param {number} userId - 用户ID
 * @returns {boolean} 是否在线
 */
function isUserOnline(userId) {
  return userConnections.has(userId)
}

/**
 * 获取所有在线用户ID
 * @returns {number[]} 在线用户ID数组
 */
function getOnlineUserIds() {
  return Array.from(userConnections.keys())
}

/**
 * 断开指定用户的WebSocket连接
 * @param {number} userId - 用户ID
 */
function disconnectUser(userId) {
  if (userConnections.has(userId) && io) {
    const socketIds = userConnections.get(userId);
    socketIds.forEach(socketId => {
      // 获取socket实例并断开连接
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
      }
    });
    userConnections.delete(userId);
    console.log(`🔌 [WebSocket] 用户 ${userId} 的连接已被强制断开`);
  }
}

module.exports = {
  setupWebSocket,
  sendNotificationToUser,
  sendMemoToUser,
  broadcastNotification,
  sendBroadcast,
  getOnlineUserCount,
  isUserOnline,
  getOnlineUserIds,
  disconnectUser,
  io,
  userConnections
}
