const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function checkStructure() {
  // 加载数据库配置
  let dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'tian',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'leixin_customer_service',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+08:00'  // 设置为北京时间
  };

  // 尝试从加密配置文件加载
  try {
    const { loadConfig } = require('../server/utils/config-crypto');
    const isPackaged = __dirname.includes('app.asar');
    const dbConfigPath = isPackaged
      ? path.join(__dirname, '../../config/db-config.json')
      : path.join(__dirname, '../config/db-config.json');

    const dbConfigJson = loadConfig(dbConfigPath);
    if (dbConfigJson.database) {
      dbConfig = { ...dbConfig, ...dbConfigJson.database };
    }
  } catch (error) {
    console.log('未找到加密配置文件，使用环境变量配置');
  }

  let connection;
  try {
    console.log('连接到数据库...');
    connection = await mysql.createConnection(dbConfig);

    // 检查employees表结构
    console.log('\n=== 检查 employees 表结构 ===');
    const [employeesFields] = await connection.execute('DESCRIBE employees');
    employeesFields.forEach(field => {
      console.log(`${field.Field}: ${field.Type} ${field.Null} ${field.Key} ${field.Default} ${field.Extra}`);
    });

    console.log('\n=== 检查 employee_changes 表结构 ===');
    const [changesFields] = await connection.execute('DESCRIBE employee_changes');
    changesFields.forEach(field => {
      console.log(`${field.Field}: ${field.Type} ${field.Null} ${field.Key} ${field.Default} ${field.Extra}`);
    });

    // 检查外键约束
    console.log('\n=== 检查 employees 表外键 ===');
    const [empFks] = await connection.execute(`
      SELECT
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'employees'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [dbConfig.database]);
    console.log(empFks);

    console.log('\n=== 检查 employee_changes 表外键 ===');
    const [changesFks] = await connection.execute(`
      SELECT
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'employee_changes'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [dbConfig.database]);
    console.log(changesFks);

  } catch (error) {
    console.error('检查失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

checkStructure().catch(console.error);
