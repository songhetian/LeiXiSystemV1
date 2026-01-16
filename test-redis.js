
const Redis = require('ioredis');
const path = require('path');
const fs = require('fs');

// 尝试加载配置
let dbConfigJson = {};
try {
  const dbConfigPath = path.join(__dirname, 'config/db-config.json');
  if (fs.existsSync(dbConfigPath)) {
    dbConfigJson = JSON.parse(fs.readFileSync(dbConfigPath, 'utf8'));
  }
} catch (e) {
  console.log('无法读取配置文件，使用默认值');
}

const redisConfig = {
  host: (dbConfigJson.redis && dbConfigJson.redis.host) || '127.0.0.1',
  port: (dbConfigJson.redis && dbConfigJson.redis.port) || 6379,
  password: (dbConfigJson.redis && dbConfigJson.redis.password) || '',
  db: (dbConfigJson.redis && dbConfigJson.redis.db) || 0
};

console.log('正在测试 Redis 连接:', redisConfig);

const redis = new Redis({
  ...redisConfig,
  connectTimeout: 2000,
  maxRetriesPerRequest: 1
});

redis.on('error', (err) => {
  console.error('❌ Redis 连接失败:', err.message);
  process.exit(1);
});

redis.on('connect', async () => {
  console.log('✅ Redis 已连接');
  try {
    const result = await redis.ping();
    console.log('🏓 PING 结果:', result);
    
    console.log('📡 正在发布测试消息到 system_notifications...');
    const payload = {
      category: 'broadcast',
      title: 'Redis 测试消息',
      content: '这是一条用于验证 Redis 通信的测试广播',
      type: 'info',
      created_at: new Date()
    };
    
    const count = await redis.publish('system_notifications', JSON.stringify(payload));
    console.log(`🚀 消息已发布，订阅者数量: ${count}`);
    
    if (count === 0) {
      console.warn('⚠️ 警告: 没有订阅者收到消息！请确保后端服务器正在运行且已订阅该频道。');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ 测试过程中出错:', err);
    process.exit(1);
  }
});
