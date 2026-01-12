import { io } from 'socket.io-client'
import { getApiUrl } from '../utils/apiConfig'

/**
 * WebSocket管理器
 * 负责管理WebSocket连接、事件监听和消息推送
 */
class WebSocketManager {
  constructor() {
    this.socket = null
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.isConnecting = false
  }

  /**
   * 连接到WebSocket服务器
   */
  connect() {
    if (this.socket?.connected || this.isConnecting) {
      console.log('⚠️ [WebSocket] 已连接或正在连接中')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('⚠️ [WebSocket] 未登录，无法连接')
      return
    }

    this.isConnecting = true

    // 获取API地址 - 使用动态获取的方式而不是硬编码
    const API_BASE_URL = getApiUrl('').replace('/api', '')

    console.log(`🔌 [WebSocket] 正在连接到 ${API_BASE_URL}...`)

    this.socket = io(API_BASE_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 10000
    })

    // 连接成功
    this.socket.on('connected', (data) => {
      console.log('✅ [WebSocket] 连接成功:', data.message)
      this.isConnecting = false
      this.reconnectAttempts = 0
      this.emit('connected', data)
    })

    // 连接事件
    this.socket.on('connect', () => {
      console.log('✅ [WebSocket] Socket已连接')
      this.isConnecting = false
    })

    // 新通知
    this.socket.on('new_notification', (notification) => {
      console.log('📨 [WebSocket] 收到新通知:', notification)
      this.emit('notification', notification)
    })

    // 新备忘录
    this.socket.on('new_memo', (memo) => {
      console.log('📝 [WebSocket] 收到新备忘录:', memo)
      this.emit('memo', memo)
    })

    // 新广播
    this.socket.on('new_broadcast', (broadcast) => {
      console.log('📣 [WebSocket] 收到系统广播:', broadcast)
      this.emit('broadcast', broadcast)
    })

    // 在线用户数更新
    this.socket.on('online_users_count', (data) => {
      this.emit('online_users_count', data)
    })

    // 下线指令
    this.socket.on('kicked_out', (data) => {
      console.log('🚨 [WebSocket] 收到下线指令:', data.message)
      this.emit('kicked_out', data)
    })

    // 未读数更新
    this.socket.on('unread_count', (data) => {
      this.emit('unread_count', data)
    })

    // Pong响应
    this.socket.on('pong', (data) => {
      // console.log('🏓 [WebSocket] Pong received')
    })

    // 连接错误
    this.socket.on('connect_error', (error) => {
      console.error('❌ [WebSocket] 连接失败:', error.message)
      this.isConnecting = false
      this.reconnectAttempts++

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ [WebSocket] 达到最大重连次数，停止重连')
        this.emit('connection_failed', { error: error.message })
      }
    })

    // 断开连接
    this.socket.on('disconnect', (reason) => {
      console.log('❌ [WebSocket] 连接已断开:', reason)
      this.isConnecting = false
      this.emit('disconnected', { reason })
    })

    // 重连尝试
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 [WebSocket] 尝试重连 (${attemptNumber}/${this.maxReconnectAttempts})...`)
    })

    // 重连成功
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ [WebSocket] 重连成功 (尝试次数: ${attemptNumber})`)
      this.reconnectAttempts = 0
      this.emit('reconnected', { attemptNumber })
    })

    // 重连失败
    this.socket.on('reconnect_failed', () => {
      console.error('❌ [WebSocket] 重连失败')
      this.emit('reconnect_failed')
    })

    // 启动心跳
    this.startHeartbeat()
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.socket) {
      console.log('🔌 [WebSocket] 主动断开连接')
      this.stopHeartbeat()
      this.socket.disconnect()
      this.socket = null
      this.isConnecting = false
    }
    // 不再清除所有监听器，防止重复注册问题
    // this.listeners.clear()
  }

  /**
   * 启动心跳检测
   */
  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping')
      }
    }, 30000) // 30秒一次心跳
  }

  /**
   * 停止心跳检测
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * 请求未读通知数
   */
  requestUnreadCount() {
    if (this.socket?.connected) {
      this.socket.emit('request_unread_count')
    }
  }

  /**
   * 注册事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * 移除指定事件的所有监听器
   * @param {string} event - 事件名称
   */
  removeAllListeners(event) {
    if (this.listeners.has(event)) {
      this.listeners.delete(event)
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`❌ [WebSocket] 事件处理错误 (${event}):`, error)
        }
      })
    }
  }

  /**
   * 检查是否已连接
   * @returns {boolean}
   */
  isConnected() {
    return this.socket?.connected || false
  }
}

// 创建单例实例
export const wsManager = new WebSocketManager()

// 导出类供测试使用
export { WebSocketManager }
