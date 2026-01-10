const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixEmployeeChangesNullPositions() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'leixi_customer_service',
    charset: 'utf8mb4'
  });

  try {
    console.log('🔧 开始修复员工变动记录中的NULL职位ID字段...');

    // 对于入职记录，使用员工当前的position_id作为new_position_id
    const [hireResult] = await pool.execute(`
      UPDATE employee_changes ec
      JOIN employees e ON ec.employee_id = e.id
      SET ec.new_position_id = e.position_id
      WHERE ec.change_type = 'hire'
      AND ec.new_position_id IS NULL
      AND e.position_id IS NOT NULL
    `);

    console.log(`✅ 修复了 ${hireResult.affectedRows} 条入职记录的 new_position_id`);

    // 对于离职记录，使用员工当前的position_id作为old_position_id（虽然员工已离职，但记录当时职位）
    const [resignResult] = await pool.execute(`
      UPDATE employee_changes ec
      JOIN employees e ON ec.employee_id = e.id
      SET ec.old_position_id = e.position_id
      WHERE (ec.change_type = 'resign' OR ec.change_type = 'terminate')
      AND ec.old_position_id IS NULL
      AND e.position_id IS NOT NULL
    `);

    console.log(`✅ 修复了 ${resignResult.affectedRows} 条离职记录的 old_position_id`);

    // 对于调动和晋升记录，尝试通过变动日期查找最接近的职位信息
    // 这个比较复杂，我们先处理简单的情况

    // 检查仍然有多少NULL值
    const [remainingResult] = await pool.execute(`
      SELECT COUNT(*) as remaining
      FROM employee_changes
      WHERE old_position_id IS NULL OR new_position_id IS NULL
    `);

    console.log(`📊 仍有 ${remainingResult[0].remaining} 条记录存在NULL职位ID`);

    if (remainingResult[0].remaining > 0) {
      // 显示这些记录的信息
      const [nullRecords] = await pool.execute(`
        SELECT ec.id, ec.employee_id, ec.change_type, ec.change_date,
               ec.old_position_id, ec.new_position_id,
               u.real_name as employee_name
        FROM employee_changes ec
        LEFT JOIN users u ON ec.user_id = u.id
        WHERE ec.old_position_id IS NULL OR ec.new_position_id IS NULL
        ORDER BY ec.change_date DESC
        LIMIT 20
      `);

      console.log('📋 仍有NULL值的记录:');
      nullRecords.forEach(record => {
        console.log(`  ID: ${record.id}, 员工: ${record.employee_name}, 类型: ${record.change_type}, 日期: ${record.change_date}, old_pos_id: ${record.old_position_id}, new_pos_id: ${record.new_position_id}`);
      });
    }

    console.log('✅ 员工变动记录职位ID修复完成！');
  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  fixEmployeeChangesNullPositions().catch(console.error);
}

module.exports = fixEmployeeChangesNullPositions;
