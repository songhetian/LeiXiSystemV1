const mysql = require('mysql2/promise');
const path = require('path');
const { loadConfig } = require('./server/utils/config-crypto');

async function checkRoles() {
  try {
    // 加载数据库配置
    const isPackaged = __dirname.includes('app.asar');
    const dbConfigPath = path.join(__dirname, 'config/db-config.json');
    console.log('尝试加载数据库配置:', dbConfigPath);

    let dbConfigJson = loadConfig(dbConfigPath);

    const dbConfig = {
      host: dbConfigJson.database.host,
      user: dbConfigJson.database.user,
      password: dbConfigJson.database.password,
      database: dbConfigJson.database.database,
      port: dbConfigJson.database.port,
    };

    const connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.query('SELECT id, name, level FROM roles ORDER BY level DESC');
    
    console.log('Roles found:', rows.length);
    console.table(rows);
    
    await connection.end();
  } catch (error) {
    console.error('Check failed:', error);
  }
}

checkRoles();
