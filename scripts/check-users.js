const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkUsers() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'leixin_customer_service',
      port: process.env.DB_PORT || 3306
    });
    
    const [rows] = await connection.execute('SELECT id, username, real_name FROM users ORDER BY id');
    console.log('Users:', rows);
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUsers();