const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAvailablePositions() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'leixi_customer_service',
    charset: 'utf8mb4'
  });

  try {
    const [positions] = await pool.execute('SELECT id, name FROM positions WHERE status = "active" ORDER BY id');
    console.log('可用职位:', JSON.stringify(positions, null, 2));

    // 检查张经理的职位记录是否在positions表中存在
    const [zhangPosCheck] = await pool.execute("SELECT id, name FROM positions WHERE name LIKE '%经理%'");
    console.log('含"经理"的职位:', JSON.stringify(zhangPosCheck, null, 2));

  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkAvailablePositions().catch(console.error);
}
