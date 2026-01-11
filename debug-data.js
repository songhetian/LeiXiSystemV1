const mysql = require('mysql2/promise');
const path = require('path');
const { loadConfig } = require('./server/utils/config-crypto');

async function checkData() {
  try {
    const dbConfigPath = path.join(__dirname, 'config/db-config.json');
    let dbConfigJson = loadConfig(dbConfigPath);

    const dbConfig = {
      host: dbConfigJson.database.host,
      user: dbConfigJson.database.user,
      password: dbConfigJson.database.password,
      database: dbConfigJson.database.database,
      port: dbConfigJson.database.port,
    };

    const connection = await mysql.createConnection(dbConfig);
    
    console.log('--- Users Table ---');
    const [users] = await connection.query('SELECT id, username, real_name FROM users LIMIT 20');
    console.table(users);

    console.log('\n--- Employees Table ---');
    const [employees] = await connection.query('SELECT id, user_id, employee_no FROM employees LIMIT 20');
    console.table(employees);

    console.log('\n--- Orphan Employees (No User) ---');
    const [orphans] = await connection.query('SELECT e.id, e.user_id FROM employees e LEFT JOIN users u ON e.user_id = u.id WHERE u.id IS NULL');
    console.table(orphans);

    await connection.end();
  } catch (error) {
    console.error('Check failed:', error);
  }
}

checkData();
