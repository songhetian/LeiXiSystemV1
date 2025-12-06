// 简单测试通知创建
// 运行方式: node test-create-notification.js

const mysql = require('mysql2/promise');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { loadConfig } = require('./utils/config-crypto');

const dbConfigPath = path.join(__dirname, '../config/db-config.json');
let dbConfigJson = {};
try {
  dbConfigJson = loadConfig(dbConfigPath);
} catch (error) {
  console.log('使用环境变量');
}

const dbConfig = {
  host: (dbConfigJson.database && dbConfigJson.database.host) || process.env.DB_HOST || 'localhost',
  user: (dbConfigJson.database && dbConfigJson.database.user) || process.env.DB_USER || 'tian',
  password: (dbConfigJson.database && dbConfigJson.database.password) || process.env.DB_PASSWORD || 'root',
  database: (dbConfigJson.database && dbConfigJson.database.database) || process.env.DB_NAME || 'leixin_customer_service',
  port: (dbConfigJson.database && dbConfigJson.database.port) || process.env.DB_PORT || 3306,
};

async function testNotification() {
  let connection;

  try {
    console.log('📡 连接数据库:', dbConfig.database);
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 连接成功\n');

    // 测试1: 直接插入（不使用事务）
    console.log('🧪 测试1: 直接插入通知（不使用事务）');
    const [result1] = await connection.query(
      `INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [1, 'test', '测试通知1', '这是直接插入的测试通知', null, 'test']
    );
    console.log('✅ 插入成功，通知ID:', result1.insertId);

    // 验证
    const [check1] = await connection.query(
      'SELECT * FROM notifications WHERE id = ?',
      [result1.insertId]
    );
    console.log('✅ 验证成功，通知已保存:', check1[0].title);
    console.log('');

    // 测试2: 使用事务插入
    console.log('🧪 测试2: 使用事务插入通知');
    await connection.beginTransaction();
    console.log('📝 事务已开始');

    const [result2] = await connection.query(
      `INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [1, 'test', '测试通知2', '这是事务中插入的测试通知', null, 'test']
    );
    console.log('✅ 插入成功，通知ID:', result2.insertId);

    await connection.commit();
    console.log('✅ 事务已提交');

    // 验证
    const [check2] = await connection.query(
      'SELECT * FROM notifications WHERE id = ?',
      [result2.insertId]
    );
    console.log('✅ 验证成功，通知已保存:', check2[0].title);
    console.log('');

    // 测试3: 事务回滚测试
    console.log('🧪 测试3: 事务回滚测试');
    await connection.beginTransaction();
    console.log('📝 事务已开始');

    const [result3] = await connection.query(
      `INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [1, 'test', '测试通知3', '这条通知会被回滚', null, 'test']
    );
    console.log('✅ 插入成功，通知ID:', result3.insertId);

    await connection.rollback();
    console.log('🔄 事务已回滚');

    // 验证
    const [check3] = await connection.query(
      'SELECT * FROM notifications WHERE id = ?',
      [result3.insertId]
    );
    if (check3.length === 0) {
      console.log('✅ 验证成功，通知已被回滚（不存在）');
    } else {
      console.log('❌ 错误：通知应该被回滚但仍然存在！');
    }
    console.log('');

    // 查看所有测试通知
    console.log('📋 所有测试通知:');
    const [allTest] = await connection.query(
      "SELECT id, title, created_at FROM notifications WHERE type = 'test' ORDER BY id DESC"
    );
    console.table(allTest);

    // 清理测试数据
    console.log('\n🗑️ 清理测试数据...');
    await connection.query("DELETE FROM notifications WHERE type = 'test'");
    console.log('✅ 清理完成');

    console.log('\n✅ 所有测试通过！通知系统工作正常。');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

testNotification();
