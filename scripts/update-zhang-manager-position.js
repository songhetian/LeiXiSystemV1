const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateZhangManagerPosition() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'leixi_customer_service',
    charset: 'utf8mb4'
  });

  try {
    // 为张经理设置职位ID为客服部经理(17)
    const [result] = await pool.execute('UPDATE employees SET position_id = ? WHERE user_id = ?', [17, 12]);
    console.log('更新张经理职位结果:', result);

    // 更新与张经理相关的变动记录
    const [updateChangesResult] = await pool.execute('UPDATE employee_changes SET new_position_id = ? WHERE user_id = ? AND new_position_id IS NULL', [17, 12]);
    console.log('更新变动记录(new_position_id)结果:', updateChangesResult);

    const [updateOldChangesResult] = await pool.execute('UPDATE employee_changes SET old_position_id = ? WHERE user_id = ? AND old_position_id IS NULL', [17, 12]);
    console.log('更新变动记录(old_position_id)结果:', updateOldChangesResult);

    console.log('✅ 张经理的职位信息已更新！');
  } catch (error) {
    console.error('更新失败:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  updateZhangManagerPosition().catch(console.error);
}
