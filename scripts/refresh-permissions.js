const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../server/utils/config-crypto');

async function refreshPermissions() {
  try {
    // 加载配置
    const isPackaged = __dirname.includes('app.asar');
    const dbConfigPath = path.join(__dirname, '../config/db-config.json');
    console.log('Loading config from:', dbConfigPath);
    const dbConfigJson = loadConfig(dbConfigPath);

    const pool = mysql.createPool({
      host: dbConfigJson.database.host,
      user: dbConfigJson.database.user,
      password: dbConfigJson.database.password,
      database: dbConfigJson.database.database,
      port: dbConfigJson.database.port,
      multipleStatements: true
    });

    console.log('Connected to database.');

    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, '../database/migrations/018_seed_permissions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // 执行 SQL
    console.log('Executing 018_seed_permissions.sql...');
    await pool.query(sql);
    console.log('Permissions refreshed successfully.');

    await pool.end();
  } catch (error) {
    console.error('Failed to refresh permissions:', error);
    process.exit(1);
  }
}

refreshPermissions();
