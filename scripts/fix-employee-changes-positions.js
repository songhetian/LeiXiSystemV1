const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixEmployeeChangesPositions() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'leixi_customer_service',
    charset: 'utf8mb4'
  });

  try {
    console.log('🔧 开始修复员工变动记录中的职位ID字段...');

    // 更新old_position_id字段（对于NULL值）
    const [oldResult] = await pool.execute(`
      UPDATE employee_changes ec
      LEFT JOIN positions p ON CONVERT(ec.old_position USING utf8mb4) = CONVERT(p.name USING utf8mb4)
      SET ec.old_position_id = p.id
      WHERE ec.old_position_id IS NULL
      AND ec.old_position IS NOT NULL
      AND ec.old_position != ''
      AND p.id IS NOT NULL
    `);

    console.log(`✅ 修复了 ${oldResult.affectedRows} 条 old_position_id 记录`);

    // 更新new_position_id字段（对于NULL值）
    const [newResult] = await pool.execute(`
      UPDATE employee_changes ec
      LEFT JOIN positions p ON CONVERT(ec.new_position USING utf8mb4) = CONVERT(p.name USING utf8mb4)
      SET ec.new_position_id = p.id
      WHERE ec.new_position_id IS NULL
      AND ec.new_position IS NOT NULL
      AND ec.new_position != ''
      AND p.id IS NOT NULL
    `);

    console.log(`✅ 修复了 ${newResult.affectedRows} 条 new_position_id 记录`);

    // 检查还有多少记录没有正确关联
    const [remainingResult] = await pool.execute(`
      SELECT COUNT(*) as remaining
      FROM employee_changes
      WHERE (old_position_id IS NULL AND old_position IS NOT NULL AND old_position != '')
         OR (new_position_id IS NULL AND new_position IS NOT NULL AND new_position != '')
    `);

    console.log(`📊 仍有 ${remainingResult[0].remaining} 条记录需要手动检查`);

    if (remainingResult[0].remaining > 0) {
      // 查询这些记录以便检查
      const [unmatchedRecords] = await pool.execute(`
        SELECT id, old_position, new_position, old_position_id, new_position_id
        FROM employee_changes
        WHERE (old_position_id IS NULL AND old_position IS NOT NULL AND old_position != '')
           OR (new_position_id IS NULL AND new_position IS NOT NULL AND new_position != '')
        LIMIT 20
      `);

      console.log('📋 未匹配的记录示例:');
      unmatchedRecords.forEach(record => {
        console.log(`  ID: ${record.id}, Old Position: "${record.old_position}", New Position: "${record.new_position}"`);
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
  fixEmployeeChangesPositions().catch(console.error);
}

module.exports = fixEmployeeChangesPositions;
