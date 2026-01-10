const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function removePositionField() {
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

    console.log('开始安全删除employees表中的position字段...');

    // 1. 检查position_id是否都有效
    console.log('检查position_id的有效性...');
    const [invalidPositions] = await connection.execute(`
      SELECT e.id, e.position, e.position_id
      FROM employees e
      LEFT JOIN positions p ON e.position_id = p.id
      WHERE e.position_id IS NOT NULL AND p.id IS NULL
    `);

    if (invalidPositions.length > 0) {
      console.log('发现无效的position_id，正在修复...');
      for (const emp of invalidPositions) {
        // 查找或创建对应的职位
        const [existingPos] = await connection.execute(
          'SELECT id FROM positions WHERE name = ?',
          [emp.position]
        );

        let positionId;
        if (existingPos.length > 0) {
          positionId = existingPos[0].id;
        } else {
          // 创建新职位
          const [result] = await connection.execute(
            'INSERT INTO positions (name, status, created_at, updated_at) VALUES (?, "active", NOW(), NOW())',
            [emp.position]
          );
          positionId = result.insertId;
        }

        // 更新员工记录
        await connection.execute(
          'UPDATE employees SET position_id = ? WHERE id = ?',
          [positionId, emp.id]
        );

        console.log(`修复员工 ${emp.id} 的职位关联`);
      }
    }

    // 2. 删除position字段
    console.log('删除employees表中的position字段...');
    await connection.execute('ALTER TABLE employees DROP COLUMN position');

    console.log('删除employee_changes表中的old_position和new_position字段...');
    await connection.execute('ALTER TABLE employee_changes DROP COLUMN old_position');
    await connection.execute('ALTER TABLE employee_changes DROP COLUMN new_position');

    console.log('✅ 成功删除冗余的position字段！');
    console.log('现在系统完全依赖position_id外键关联，更加高效简洁。');

  } catch (error) {
    console.error('❌ 删除position字段失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

if (require.main === module) {
  removePositionField().catch(console.error);
}

module.exports = removePositionField;
