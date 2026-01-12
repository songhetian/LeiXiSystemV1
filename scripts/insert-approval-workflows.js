/**
 * 插入审批流程测试数据
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: '192.168.2.31',
  user: 'tian',
  password: 'root',
  database: 'leixin_customer_service',
  charset: 'utf8mb4'
};

async function insertApprovalWorkflows() {
  let connection;
  
  try {
    // 创建数据库连接
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ 数据库连接成功');

    // 读取SQL文件
    const sqlFilePath = path.join(__dirname, '../database/test-data/16_insert_approval_workflows.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    
    // 分割SQL语句
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`\n找到 ${statements.length} 条SQL语句`);

    // 执行SQL语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.toLowerCase().includes('select')) {
        // 查询语句
        const [results] = await connection.query(statement);
        console.log(`\n查询结果 (${i + 1}/${statements.length}):`);
        console.table(results);
      } else {
        // 执行语句
        const [result] = await connection.query(statement);
        console.log(`✓ 执行成功 (${i + 1}/${statements.length}): ${result.affectedRows || result.insertId || 'OK'} 行受影响`);
      }
    }

    console.log('\n✓ 审批流程测试数据插入完成！');

  } catch (error) {
    console.error('✗ 执行失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ 数据库连接已关闭');
    }
  }
}

// 执行脚本
insertApprovalWorkflows();