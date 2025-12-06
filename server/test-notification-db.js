// 数据库通知表诊断脚本
// 运行方式: node test-notification-db.js

const mysql = require('mysql2/promise');
const path = require('path');

// 加载配置
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { loadConfig } = require('./utils/config-crypto');

const dbConfigPath = path.join(__dirname, '../config/db-config.json');
let dbConfigJson = {};
try {
  dbConfigJson = loadConfig(dbConfigPath);
  console.log('✅ 成功加载数据库配置文件');
} catch (error) {
  console.log('⚠️ 无法加载配置文件，使用环境变量');
}

const dbConfig = {
  host: (dbConfigJson.database && dbConfigJson.database.host) || process.env.DB_HOST || 'localhost',
  user: (dbConfigJson.database && dbConfigJson.database.user) || process.env.DB_USER || 'tian',
  password: (dbConfigJson.database && dbConfigJson.database.password) || process.env.DB_PASSWORD || 'root',
  database: (dbConfigJson.database && dbConfigJson.database.database) || process.env.DB_NAME || 'leixin_customer_service',
  port: (dbConfigJson.database && dbConfigJson.database.port) || process.env.DB_PORT || 3306,
};

console.log('\n=== 数据库配置信息 ===');
console.log('Host:', dbConfig.host);
console.log('Port:', dbConfig.port);
console.log('User:', dbConfig.user);
console.log('Database:', dbConfig.database);
console.log('========================\n');

async function diagnose() {
  let connection;

  try {
    // 1. 测试连接
    console.log('📡 正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功\n');

    // 2. 检查当前数据库
    const [currentDb] = await connection.query('SELECT DATABASE() as db');
    console.log('📍 当前使用的数据库:', currentDb[0].db);

    // 3. 检查notifications表是否存在
    console.log('\n🔍 检查 notifications 表...');
    const [tables] = await connection.query("SHOW TABLES LIKE 'notifications'");

    if (tables.length === 0) {
      console.log('❌ notifications 表不存在！');
      console.log('\n💡 建议：执行数据库迁移文件创建表');
      return;
    }

    console.log('✅ notifications 表存在');

    // 4. 查看表结构
    console.log('\n📋 notifications 表结构:');
    const [columns] = await connection.query('DESCRIBE notifications');
    console.table(columns);

    // 5. 检查表中的记录数
    const [count] = await connection.query('SELECT COUNT(*) as total FROM notifications');
    console.log('\n📊 notifications 表统计:');
    console.log('总记录数:', count[0].total);

    // 6. 查看最近的通知记录
    if (count[0].total > 0) {
      console.log('\n📝 最近5条通知记录:');
      const [recent] = await connection.query(
        'SELECT id, user_id, type, title, is_read, created_at FROM notifications ORDER BY created_at DESC LIMIT 5'
      );
      console.table(recent);
    } else {
      console.log('\n⚠️ 表中没有任何记录');
    }

    // 7. 测试插入通知
    console.log('\n🧪 测试插入通知...');
    const testUserId = 1; // 使用测试用户ID

    const [insertResult] = await connection.query(
      `INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [testUserId, 'test', '测试通知', '这是一条测试通知，用于验证数据库写入', null, 'test']
    );

    console.log('✅ 测试通知插入成功！');
    console.log('插入的通知ID:', insertResult.insertId);

    // 8. 验证插入的通知
    const [inserted] = await connection.query(
      'SELECT * FROM notifications WHERE id = ?',
      [insertResult.insertId]
    );

    console.log('\n✅ 验证插入的通知:');
    console.table(inserted);

    // 9. 删除测试通知
    await connection.query('DELETE FROM notifications WHERE id = ?', [insertResult.insertId]);
    console.log('\n🗑️ 已删除测试通知');

    // 10. 检查leave_records表的user_id
    console.log('\n🔍 检查 leave_records 表中的 user_id...');
    const [leaveRecords] = await connection.query(
      `SELECT id, employee_id, user_id, status, created_at
       FROM leave_records
       ORDER BY created_at DESC
       LIMIT 5`
    );

    if (leaveRecords.length > 0) {
      console.log('最近5条请假记录:');
      console.table(leaveRecords);

      const nullUserIds = leaveRecords.filter(r => !r.user_id);
      if (nullUserIds.length > 0) {
        console.log('\n⚠️ 警告：发现', nullUserIds.length, '条请假记录的 user_id 为 NULL！');
        console.log('这会导致无法创建通知！');
      }
    } else {
      console.log('⚠️ leave_records 表中没有记录');
    }

    console.log('\n✅ 诊断完成！');
    console.log('\n📝 总结:');
    console.log('- 数据库连接: ✅');
    console.log('- notifications表存在: ✅');
    console.log('- 可以写入通知: ✅');
    console.log('- 通知总数:', count[0].total);

  } catch (error) {
    console.error('\n❌ 诊断过程中出错:', error.message);
    console.error('错误详情:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

diagnose();
