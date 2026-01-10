const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkZhangManager() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'leixi_customer_service',
    charset: 'utf8mb4'
  });

  try {
    // 查找张经理的员工信息
    const [result] = await pool.execute(`
      SELECT e.*, u.real_name, p.name as position_name
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN positions p ON e.position_id = p.id
      WHERE u.real_name LIKE '%张%'
    `);

    console.log('张姓员工的信息:', JSON.stringify(result, null, 2));

    // 查找所有职位为NULL的员工
    const [nullPositionEmployees] = await pool.execute(`
      SELECT e.*, u.real_name, u.username
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.position_id IS NULL
    `);

    console.log('所有职位ID为NULL的员工:', JSON.stringify(nullPositionEmployees, null, 2));

  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkZhangManager().catch(console.error);
}
