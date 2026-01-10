const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function addTrigger() {
  // 加载数据库配置
  let dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'tian',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'leixin_customer_service',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+08:00'  // 设置为北京时间
  };

  // 尝试从加密配置文件加载
  try {
    const { loadConfig } = require('../server/utils/config-crypto');
    const isPackaged = __dirname.includes('app.asar');
    const dbConfigPath = isPackaged
      ? path.join(__dirname, '../../config/db-config.json')
      : path.join(__dirname, '../config/db-config.json');

    const dbConfigJson = loadConfig(dbConfigPath);
    if (dbConfigJson.database) {
      dbConfig = { ...dbConfig, ...dbConfigJson.database };
    }
  } catch (error) {
    console.log('未找到加密配置文件，使用环境变量配置');
  }

  let connection;
  try {
    console.log('连接到数据库...');
    connection = await mysql.createConnection(dbConfig);

    console.log('读取触发器SQL文件...');
    const sql = fs.readFileSync(path.join(__dirname, '../db/migrations/add_position_update_trigger.sql'), 'utf8');

    console.log('执行触发器创建...');
    await connection.execute(sql);

    console.log('✅ 触发器创建成功！');
    console.log('现在当positions表中的职位名称更新时，所有关联的员工记录都会自动更新');

  } catch (error) {
    console.error('❌ 触发器创建失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

if (require.main === module) {
  addTrigger().catch(console.error);
}

module.exports = addTrigger;
