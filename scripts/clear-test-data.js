const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function clearTestData() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'leixin_customer_service',
      port: process.env.DB_PORT || 3306
    });
    
    console.log('Connected to database');
    
    // 清理测试数据
    const tables = [
      'broadcast_recipients',
      'broadcasts',
      'memo_recipients',
      'memos',
      'quality_case_likes',
      'quality_case_favorites',
      'quality_cases',
      'quality_scores',
      'quality_rules',
      'session_messages',
      'quality_sessions',
      'employees',
      'user_roles',
      'users',
      'roles',
      'departments'
    ];
    
    for (const table of tables) {
      try {
        await connection.execute(`DELETE FROM ${table}`);
        console.log(`Cleared table: ${table}`);
      } catch (error) {
        console.log(`Could not clear table ${table}: ${error.message}`);
      }
    }
    
    // 重置自增ID
    for (const table of tables) {
      try {
        await connection.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
        console.log(`Reset auto increment for table: ${table}`);
      } catch (error) {
        console.log(`Could not reset auto increment for table ${table}: ${error.message}`);
      }
    }
    
    await connection.end();
    console.log('Disconnected from database');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

clearTestData();