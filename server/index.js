const fastify = require('fastify')({
  logger: true,
  bodyLimit: 10485760 // 10MB
})
const cors = require('@fastify/cors')
const multipart = require('@fastify/multipart')
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const { pipeline } = require('stream')
const util = require('util')
const pump = util.promisify(pipeline)
const dayjs = require('dayjs')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const isProd = process.env.NODE_ENV === 'production'

// 全局错误处理器
fastify.setErrorHandler(async (error, request, reply) => {
  request.log.error(error)
  
  // 异步记录严重错误到操作日志
  if (reply.statusCode >= 500) {
    const { recordLog } = require('./utils/logger');
    const pool = fastify.mysql;
    if (pool) {
      recordLog(pool, {
        module: 'system',
        action: `系统异常: ${error.message}`,
        method: request.method,
        url: request.url,
        status: 0,
        error_msg: error.stack,
        ip: request.ip
      }).catch(() => {});
    }
  }

  if (isProd && reply.statusCode >= 500) {
    return reply.send({ success: false, message: '服务器繁忙，请稍后再试' })
  }
  
  reply.code(error.statusCode || 500).send({
    success: false,
    message: error.message || '操作失败',
    detail: isProd ? null : error.detail,
    stack: isProd ? null : error.stack
  })
})

// 注册插件
fastify.register(cors, {
  origin: true,
  credentials: true
})

fastify.register(multipart, { limits: { fileSize: 100 * 1024 * 1024 } })

// 数据库与 Redis 配置加载
const isPackaged = __dirname.includes('app.asar');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// --- 全局请求预处理 ---
fastify.addHook('onRequest', async (request, reply) => {
  const auth = request.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      request.user = decoded; // 确保 request.user 始终可用
    } catch (err) {
      // Token 无效不中断请求，由具体的权限中间件处理
    }
  }
});

const dbConfigPath = isPackaged
  ? path.join(__dirname, '../../config/db-config.json')
  : path.join(__dirname, '../config/db-config.json');

const { loadConfig } = require('./utils/config-crypto');
let dbConfigJson = {}
try {
  dbConfigJson = loadConfig(dbConfigPath);
} catch (error) {
  console.error('加载数据库配置失败:', error)
}

// 静态文件服务
let uploadDir = path.join(__dirname, '../uploads')
if (dbConfigJson.upload && dbConfigJson.upload.sharedDirectory) {
  uploadDir = path.isAbsolute(dbConfigJson.upload.sharedDirectory) ? dbConfigJson.upload.sharedDirectory : path.resolve(__dirname, dbConfigJson.upload.sharedDirectory)
}
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

fastify.register(require('@fastify/static'), { root: uploadDir, prefix: '/uploads/' })
fastify.decorate('uploadDir', uploadDir)

// 数据库初始化
const dbConfig = {
  host: (dbConfigJson.database && dbConfigJson.database.host) || process.env.DB_HOST || 'localhost',
  user: (dbConfigJson.database && dbConfigJson.database.user) || process.env.DB_USER || 'tian',
  password: (dbConfigJson.database && dbConfigJson.database.password) || process.env.DB_PASSWORD || 'root',
  database: (dbConfigJson.database && dbConfigJson.database.database) || process.env.DB_NAME || 'leixin_customer_service',
  port: (dbConfigJson.database && dbConfigJson.database.port) || 3306,
  timezone: '+08:00'
}

const Redis = require('ioredis');
const redisConfig = {
  host: (dbConfigJson.redis && dbConfigJson.redis.host) || '127.0.0.1',
  port: (dbConfigJson.redis && dbConfigJson.redis.port) || 6379,
  password: (dbConfigJson.redis && dbConfigJson.redis.password) || '',
  family: 4, keepAlive: 10000, connectTimeout: 10000
};

let pool, redis;
async function initDatabase() {
  try {
    pool = mysql.createPool(dbConfig)
    fastify.decorate('mysql', pool)
    redis = new Redis(redisConfig);
    fastify.decorate('redis', redis);
    console.log('✅ 数据库与 Redis 初始化成功')
  } catch (error) {
    console.error('❌ 初始化失败:', error)
  }
}

// ==================== 路由注册 (模块化) ====================
fastify.register(require('./routes/auth'))
fastify.register(require('./routes/upload'))
fastify.register(require('./routes/departments'))
fastify.register(require('./routes/employees'))
fastify.register(require('./routes/employee-changes'))
fastify.register(require('./routes/permissions'))
fastify.register(require('./routes/quality-tags'))
fastify.register(require('./routes/customer-service'))
fastify.register(require('./routes/quality-inspection-import-new'))
fastify.register(require('./routes/user-management'))
fastify.register(require('./routes/reimbursement'))
fastify.register(require('./routes/chat'))
fastify.register(require('./routes/assets'))
fastify.register(require('./routes/inventory'))
fastify.register(require('./routes/approval-workflow'))
fastify.register(require('./routes/approval-groups'))
fastify.register(require('./routes/approvers'))
fastify.register(require('./routes/reimbursement-settings'))
fastify.register(require('./routes/system-logs'))
fastify.register(require('./routes/todo-center'))
fastify.register(require('./routes/dashboard'))
fastify.register(require('./routes/admin-dashboard'))
fastify.register(require('./routes/personnel-logic'))
fastify.register(require('./routes/notification-settings'))
fastify.register(require('./routes/notifications'))
fastify.register(require('./routes/memos'))
fastify.register(require('./routes/broadcasts'))
fastify.register(require('./routes/positions'))
fastify.register(require('./routes/attendance-approval'))
fastify.register(require('./routes/attendance-clock'))
fastify.register(require('./routes/attendance-export'))
fastify.register(require('./routes/attendance-stats'))
fastify.register(require('./routes/attendance'))
fastify.register(require('./routes/leave'))
fastify.register(require('./routes/overtime'))
fastify.register(require('./routes/makeup'))
fastify.register(require('./routes/schedule'))
fastify.register(require('./routes/schedules'))
fastify.register(require('./routes/schedule-excel'))
fastify.register(require('./routes/shifts'))
fastify.register(require('./routes/smart-schedule'))
fastify.register(require('./routes/vacation-types'))
fastify.register(require('./routes/vacation-balance'))
fastify.register(require('./routes/vacation-conversion'))
fastify.register(require('./routes/vacation-settings'))
fastify.register(require('./routes/vacation-stats'))
fastify.register(require('./routes/vacation-type-balances'))
fastify.register(require('./routes/conversion-rules'))
fastify.register(require('./routes/compensatory-leave'))
fastify.register(require('./routes/holidays'))
fastify.register(require('./routes/payslips'))
fastify.register(require('./routes/exams'))
fastify.register(require('./routes/exam-categories'))
fastify.register(require('./routes/assessment-plans'))
fastify.register(require('./routes/assessment-results'))
fastify.register(require('./routes/learning-center'))
fastify.register(require('./routes/learning-plans'))
fastify.register(require('./routes/learning-tasks'))
fastify.register(require('./routes/knowledge-reading'))
fastify.register(require('./routes/knowledge-stats'))
fastify.register(require('./routes/quality-inspection'))
fastify.register(require('./routes/quality-cases'))
fastify.register(require('./routes/case-categories'))
fastify.register(require('./routes/quality-case-interactions'))
fastify.register(require('./routes/employees-batch'))
fastify.register(require('./routes/statistics'))
fastify.register(require('./routes/export'))

// 系统基础接口
fastify.get('/api/health', async () => ({ status: 'ok', time: new Date() }))
fastify.get('/', async () => ({ message: 'LeiXi System Backend is running', version: '1.1.0' }))

// WebSocket 初始化
const { setupWebSocket } = require('./websocket')
const io = setupWebSocket(fastify.server, redis, () => pool)
fastify.decorate('io', io)

// --- 全局自动化审计日志钩子 ---
fastify.addHook('onResponse', async (request, reply) => {
  const auditConfig = reply.context.config.audit;
  if (!auditConfig || reply.statusCode >= 400) return; // 仅记录配置了审计且成功的操作

  try {
    const { recordLog } = require('./utils/logger');
    const { module, action } = auditConfig;
    
    // 动态解析 Action 描述 (支持从 params 或 body 取值)
    let finalAction = action;
    const data = { ...request.params, ...request.body };
    Object.keys(data).forEach(key => {
      finalAction = finalAction.replace(`:${key}`, data[key]);
    });

    // 获取用户信息
    const user = request.user || {}; // 假设通过了鉴权中间件

    await recordLog(fastify.mysql, {
      user_id: user.id || 0,
      username: user.username || 'system',
      real_name: user.real_name || '系统',
      module: module,
      action: finalAction,
      method: request.method,
      url: request.url,
      ip: request.ip,
      status: 1
    });
  } catch (e) {
    console.error('[Auto Audit Error]:', e);
  }
});

// 启动服务
const start = async () => {
  try {
    await initDatabase();
    await fastify.ready();
    fastify.listen({ port: process.env.PORT || 3001, host: '0.0.0.0' }, async (err, address) => {
      if (err) {
        console.error('❌ Fastify listen failed:', err);
        process.exit(1);
      }
      
      // 启动消息队列 Worker
      const MessageQueue = require('./utils/messageQueue');
      io.messageQueue = new MessageQueue(pool, redis);
      await io.messageQueue.initSequence();
      if (redis) setInterval(() => io.messageQueue.flush().catch(() => {}), 5000);

      console.log(`🚀 Server listening on ${address}`);
    });
  } catch (err) {
    console.error('❌ Server startup failed:', err);
    process.exit(1);
  }
};
start();