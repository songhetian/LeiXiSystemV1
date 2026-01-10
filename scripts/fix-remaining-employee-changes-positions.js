const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixRemainingEmployeeChangesPositions() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'leixi_customer_service',
    charset: 'utf8mb4'
  });

  try {
    console.log('🔧 开始修复剩余的员工变动记录中的NULL职位ID字段...');

    // 首先处理离职记录中old_position_id为NULL的情况，尝试使用员工当前职位（如果还在职）或最后的职位
    // 通过查找该员工最近的职位信息来填充
    const [resignResult] = await pool.execute(`
      UPDATE employee_changes ec
      JOIN (
        SELECT
          ec2.employee_id,
          COALESCE(ec2.new_position_id, ec2.old_position_id, e.position_id) as latest_position_id
        FROM employee_changes ec2
        JOIN employees e ON ec2.employee_id = e.id
        WHERE ec2.change_date = (
          SELECT MAX(change_date)
          FROM employee_changes ec3
          WHERE ec3.employee_id = ec2.employee_id
          AND (ec3.new_position_id IS NOT NULL OR ec3.old_position_id IS NOT NULL)
        )
      ) latest_pos ON ec.employee_id = latest_pos.employee_id
      SET ec.old_position_id = latest_pos.latest_position_id
      WHERE ec.change_type IN ('resign', 'terminate')
      AND ec.old_position_id IS NULL
      AND latest_pos.latest_position_id IS NOT NULL
    `);

    console.log(`✅ 通过员工最近职位信息修复了 ${resignResult.affectedRows} 条离职记录的 old_position_id`);

    // 再次检查剩余的NULL值
    const [remainingResult] = await pool.execute(`
      SELECT COUNT(*) as remaining
      FROM employee_changes
      WHERE old_position_id IS NULL OR new_position_id IS NULL
    `);

    console.log(`📊 仍有 ${remainingResult[0].remaining} 条记录存在NULL职位ID`);

    if (remainingResult[0].remaining > 0) {
      // 获取剩余记录的详细信息
      const [nullRecords] = await pool.execute(`
        SELECT ec.id, ec.employee_id, ec.change_type, ec.change_date,
               ec.old_position_id, ec.new_position_id,
               u.real_name as employee_name, e.position_id as current_position_id
        FROM employee_changes ec
        LEFT JOIN users u ON ec.user_id = u.id
        LEFT JOIN employees e ON ec.employee_id = e.id
        WHERE ec.old_position_id IS NULL OR ec.new_position_id IS NULL
        ORDER BY ec.change_date DESC
        LIMIT 50
      `);

      console.log('📋 仍有NULL值的记录:');
      nullRecords.forEach(record => {
        console.log(`  ID: ${record.id}, 员工: ${record.employee_name}, 类型: ${record.change_type}, 日期: ${record.change_date}, old_pos_id: ${record.old_position_id}, new_pos_id: ${record.new_position_id}, 当前职位ID: ${record.current_position_id}`);
      });

      // 对于仍有NULL值的记录，我们可以考虑使用员工的当前职位ID作为填充（对于历史记录来说虽然不完全准确，但比空值好）
      const [finalUpdateResult] = await pool.execute(`
        UPDATE employee_changes ec
        JOIN employees e ON ec.employee_id = e.id
        SET
          ec.old_position_id = COALESCE(ec.old_position_id, e.position_id, ec.new_position_id),
          ec.new_position_id = COALESCE(ec.new_position_id, e.position_id, ec.old_position_id)
        WHERE (ec.old_position_id IS NULL OR ec.new_position_id IS NULL)
        AND e.position_id IS NOT NULL
      `);

      console.log(`✅ 使用员工当前职位ID修复了 ${finalUpdateResult.affectedRows} 条记录`);

      // 最后检查还有多少真正无法修复的记录
      const [finalRemainingResult] = await pool.execute(`
        SELECT COUNT(*) as remaining
        FROM employee_changes
        WHERE old_position_id IS NULL AND new_position_id IS NULL
      `);

      console.log(`📊 最终仍有 ${finalRemainingResult[0].remaining} 条记录无法修复（old_position_id 和 new_position_id 都为 NULL）`);

      if (finalRemainingResult[0].remaining > 0) {
        const [trulyNullRecords] = await pool.execute(`
          SELECT ec.id, ec.employee_id, ec.change_type, ec.change_date,
                 u.real_name as employee_name
          FROM employee_changes ec
          LEFT JOIN users u ON ec.user_id = u.id
          WHERE ec.old_position_id IS NULL AND ec.new_position_id IS NULL
          ORDER BY ec.change_date DESC
          LIMIT 20
        `);

        console.log('📋 真正无法修复的记录（可能需要手动处理）:');
        trulyNullRecords.forEach(record => {
          console.log(`  ID: ${record.id}, 员工: ${record.employee_name}, 类型: ${record.change_type}, 日期: ${record.change_date}`);
        });
      }
    }

    console.log('✅ 所有可修复的员工变动记录职位ID修复完成！');
  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  fixRemainingEmployeeChangesPositions().catch(console.error);
}

module.exports = fixRemainingEmployeeChangesPositions;
