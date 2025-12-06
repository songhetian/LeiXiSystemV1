// 备忘录表测试脚本
// 运行方式: node test-memo-db.js

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

async function testMemos() {
  let connection;

  try {
    console.log('📡 连接数据库:', dbConfig.database);
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 连接成功\n');

    // 检查memos表
    console.log('🔍 检查 memos 表...');
    const [memosTables] = await connection.query("SHOW TABLES LIKE 'memos'");
    if (memosTables.length === 0) {
      console.log('❌ memos 表不存在！');
      return;
    }
    console.log('✅ memos 表存在');

    // 检查memo_recipients表
    console.log('🔍 检查 memo_recipients 表...');
    const [recipientsTables] = await connection.query("SHOW TABLES LIKE 'memo_recipients'");
    if (recipientsTables.length === 0) {
      console.log('❌ memo_recipients 表不存在！');
      return;
    }
    console.log('✅ memo_recipients 表存在\n');

    // 查看表结构
    console.log('📋 memos 表结构:');
    const [memosColumns] = await connection.query('DESCRIBE memos');
    console.table(memosColumns);

    console.log('\n📋 memo_recipients 表结构:');
    const [recipientsColumns] = await connection.query('DESCRIBE memo_recipients');
    console.table(recipientsColumns);

    // 检查记录数
    const [memosCount] = await connection.query('SELECT COUNT(*) as total FROM memos WHERE deleted_at IS NULL');
    const [recipientsCount] = await connection.query('SELECT COUNT(*) as total FROM memo_recipients');

    console.log('\n📊 数据统计:');
    console.log('memos 表记录数:', memosCount[0].total);
    console.log('memo_recipients 表记录数:', recipientsCount[0].total);

    // 测试插入个人备忘录
    console.log('\n🧪 测试1: 创建个人备忘录');
    const [memoResult] = await connection.query(
      `INSERT INTO memos (user_id, title, content, type, priority, is_read)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [1, '测试备忘录', '这是一条测试备忘录', 'personal', 'normal', 0]
    );
    console.log('✅ 个人备忘录创建成功，ID:', memoResult.insertId);

    // 验证
    const [checkMemo] = await connection.query(
      'SELECT * FROM memos WHERE id = ?',
      [memoResult.insertId]
    );
    console.log('✅ 验证成功:', checkMemo[0].title);

    // 测试插入部门备忘录
    console.log('\n🧪 测试2: 创建部门备忘录');
    const [deptMemoResult] = await connection.query(
      `INSERT INTO memos (user_id, title, content, type, priority, target_department_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [1, '测试部门备忘录', '这是一条部门备忘录', 'department', 'high', 1]
    );
    console.log('✅ 部门备忘录创建成功，ID:', deptMemoResult.insertId);

    // 创建接收者记录
    const [recipientResult] = await connection.query(
      `INSERT INTO memo_recipients (memo_id, user_id, is_read)
       VALUES (?, ?, ?)`,
      [deptMemoResult.insertId, 2, 0]
    );
    console.log('✅ 接收者记录创建成功，ID:', recipientResult.insertId);

    // 验证
    const [checkRecipient] = await connection.query(
      'SELECT * FROM memo_recipients WHERE id = ?',
      [recipientResult.insertId]
    );
    console.log('✅ 验证成功，接收者ID:', checkRecipient[0].user_id);

    // 清理测试数据
    console.log('\n🗑️ 清理测试数据...');
    await connection.query('DELETE FROM memo_recipients WHERE memo_id IN (?, ?)',
      [memoResult.insertId, deptMemoResult.insertId]);
    await connection.query('DELETE FROM memos WHERE id IN (?, ?)',
      [memoResult.insertId, deptMemoResult.insertId]);
    console.log('✅ 清理完成');

    console.log('\n✅ 所有测试通过！备忘录系统数据库正常。');

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

testMemos();
