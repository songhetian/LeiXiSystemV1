const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function runMigration() {
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

    console.log('读取迁移SQL文件...');
    const sqlContent = fs.readFileSync(path.join(__dirname, '../db/migrations/add_position_id_fields_final.sql'), 'utf8');

    // 将SQL内容分割成独立的语句执行
    const statements = sqlContent.split(';').filter(stmt => stmt.trim() !== '').map(stmt => stmt.trim());

    console.log('执行数据库迁移...');

    for (const statement of statements) {
      if (statement) {
        console.log(`执行: ${statement.substring(0, 60)}...`);
        await connection.execute(statement);
      }
    }

    console.log('✅ 数据库迁移成功完成！');
    console.log('迁移内容：');
    console.log('1. 在employees表中添加了position_id字段并建立外键关联');
    console.log('2. 在employee_changes表中添加了old_position_id和new_position_id字段并建立外键关联');
    console.log('3. 更新现有数据，将position字符串值关联到positions表');

  } catch (error) {
    console.error('❌ 数据库迁移失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = runMigration;
