// 应用审批备注字段迁移脚本
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'leixi_user',
  password: 'Leixi@2024',
  database: 'leixin_customer_service_v1',
  charset: 'utf8mb4'
};

async function applyMigration() {
  let connection;

  try {
    // 连接到数据库
    connection = await mysql.createConnection(dbConfig);

    // 读取迁移脚本
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '003_add_approval_note_to_users.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    console.log('正在应用迁移脚本...');
    console.log(migrationSql);

    // 执行迁移
    await connection.execute(migrationSql);

    console.log('✅ 迁移脚本应用成功！');
    console.log('已在 users 表中添加 approval_note 字段');

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  字段已存在，无需重复添加');
    } else {
      console.error('❌ 迁移脚本应用失败:', error.message);
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 执行迁移
applyMigration();
