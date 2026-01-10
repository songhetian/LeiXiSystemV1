const mysql = require('mysql2/promise');
require('dotenv').config();

async function simpleFixEmployeeChangesPositions() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'leixi_customer_service',
    charset: 'utf8mb4'
  });

  try {
    console.log('🔧 开始修复员工变动记录中的NULL职位ID字段...');

    // 首先获取所有有NULL值的记录
    const [nullRecords] = await pool.execute(`
      SELECT ec.*, u.real_name as employee_name, e.position_id as current_position_id
      FROM employee_changes ec
      LEFT JOIN users u ON ec.user_id = u.id
      LEFT JOIN employees e ON ec.employee_id = e.id
      WHERE ec.old_position_id IS NULL OR ec.new_position_id IS NULL
    `);

    console.log(`📊 找到 ${nullRecords.length} 条含有NULL职位ID的记录`);

    let fixedCount = 0;

    // 逐条处理这些记录
    for (const record of nullRecords) {
      let updateFields = [];
      let updateValues = [];

      // 如果 old_position_id 是 NULL，且有当前职位ID，使用当前职位ID
      if (record.old_position_id === null && record.current_position_id !== null) {
        updateFields.push('old_position_id = ?');
        updateValues.push(record.current_position_id);
      }

      // 如果 new_position_id 是 NULL，且有当前职位ID，使用当前职位ID
      if (record.new_position_id === null && record.current_position_id !== null) {
        updateFields.push('new_position_id = ?');
        updateValues.push(record.current_position_id);
      }

      // 如果 change_type 是 'hire'，入职时通常只有 new_position_id
      if (record.change_type === 'hire' && record.new_position_id === null && record.current_position_id !== null) {
        updateFields.push('new_position_id = ?');
        updateValues.push(record.current_position_id);
      }

      // 如果 change_type 是 'resign' 或 'terminate'，离职时通常只有 old_position_id
      if ((record.change_type === 'resign' || record.change_type === 'terminate') &&
          record.old_position_id === null && record.current_position_id !== null) {
        updateFields.push('old_position_id = ?');
        updateValues.push(record.current_position_id);
      }

      // 如果有需要更新的字段，执行更新
      if (updateFields.length > 0) {
        updateValues.push(record.id); // WHERE 子句的值
        const updateQuery = `UPDATE employee_changes SET ${updateFields.join(', ')} WHERE id = ?`;
        await pool.execute(updateQuery, updateValues);
        fixedCount++;
      }
    }

    console.log(`✅ 修复了 ${fixedCount} 条记录`);

    // 检查是否还有剩余的NULL值
    const [remainingResult] = await pool.execute(`
      SELECT COUNT(*) as remaining
      FROM employee_changes
      WHERE old_position_id IS NULL OR new_position_id IS NULL
    `);

    console.log(`📊 仍有 ${remainingResult[0].remaining} 条记录存在NULL职位ID`);

    if (remainingResult[0].remaining > 0) {
      // 获取剩余记录的详细信息
      const [stillNullRecords] = await pool.execute(`
        SELECT ec.id, ec.employee_id, ec.change_type, ec.change_date,
               ec.old_position_id, ec.new_position_id,
               u.real_name as employee_name, e.position_id as current_position_id
        FROM employee_changes ec
        LEFT JOIN users u ON ec.user_id = u.id
        LEFT JOIN employees e ON ec.employee_id = e.id
        WHERE ec.old_position_id IS NULL OR ec.new_position_id IS NULL
        ORDER BY ec.change_date DESC
        LIMIT 20
      `);

      console.log('📋 仍有NULL值的记录:');
      stillNullRecords.forEach(record => {
        console.log(`  ID: ${record.id}, 员工: ${record.employee_name}, 类型: ${record.change_type}, old_pos_id: ${record.old_position_id}, new_pos_id: ${record.new_position_id}`);
      });
    }

    console.log('✅ 修复完成！');
  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  simpleFixEmployeeChangesPositions().catch(console.error);
}

module.exports = simpleFixEmployeeChangesPositions;
