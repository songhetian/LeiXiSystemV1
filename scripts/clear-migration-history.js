const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'leixin_customer_service',
  port: process.env.DB_PORT || 3306
};

async function clearMigrationHistory() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to the database.');

    // 清空迁移历史表
    await connection.query('DELETE FROM migrations_history');
    console.log('✅ Migration history cleared successfully.');

    // 显示结果
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM migrations_history');
    console.log(`Current migration history count: ${rows[0].count}`);

  } catch (error) {
    console.error('❌ Error clearing migration history:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

clearMigrationHistory();
