const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkEmployeeChangesColumns() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'leixi_customer_service',
    charset: 'utf8mb4'
  });

  try {
    console.log('🔍 检查 employee_changes 表的列...');

    // 查询表结构
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'employee_changes'
      AND TABLE_SCHEMA = ?
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'leixi_customer_service']);

    console.log('📋 employee_changes 表的列信息:');
    columns.forEach(col => {
      console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE} | Nullable: ${col.IS_NULLABLE} | Comment: ${col.COLUMN_COMMENT}`);
    });

    // 检查特定列是否存在
    const hasOldPosition = columns.some(col => col.COLUMN_NAME === 'old_position');
    const hasNewPosition = columns.some(col => col.COLUMN_NAME === 'new_position');
    const hasOldPositionId = columns.some(col => col.COLUMN_NAME === 'old_position_id');
    const hasNewPositionId = columns.some(col => col.COLUMN_NAME === 'new_position_id');

    console.log('\n🔍 特定列检查结果:');
    console.log(`  old_position 列存在: ${hasOldPosition}`);
    console.log(`  new_position 列存在: ${hasNewPosition}`);
    console.log(`  old_position_id 列存在: ${hasOldPositionId}`);
    console.log(`  new_position_id 列存在: ${hasNewPositionId}`);

    // 如果存在ID列，检查其中是否有NULL值
    if (hasOldPositionId || hasNewPositionId) {
      console.log('\n🔍 检查ID字段中的NULL值数量...');

      if (hasOldPositionId) {
        const [oldNullCount] = await pool.execute(`
          SELECT COUNT(*) as nullCount
          FROM employee_changes
          WHERE old_position_id IS NULL
        `);
        console.log(`  old_position_id 为 NULL 的记录数: ${oldNullCount[0].nullCount}`);
      }

      if (hasNewPositionId) {
        const [newNullCount] = await pool.execute(`
          SELECT COUNT(*) as nullCount
          FROM employee_changes
          WHERE new_position_id IS NULL
        `);
        console.log(`  new_position_id 为 NULL 的记录数: ${newNullCount[0].nullCount}`);
      }
    }

  } catch (error) {
    console.error('❌ 检查过程中出现错误:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkEmployeeChangesColumns().catch(console.error);
}

module.exports = checkEmployeeChangesColumns;
