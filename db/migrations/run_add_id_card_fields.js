/**
 * 数据库迁移脚本：添加身份证URL字段到users表
 * 运行方式: node db/migrations/run_add_id_card_fields.js
 */

const mysql = require('mysql2/promise');
const { loadConfig } = require('../../server/utils/config-crypto');
const path = require('path');

async function runMigration() {
  let connection;

  try {
    console.log('🔧 开始数据库迁移：添加身份证URL字段...\n');

    // 读取数据库配置（自动解密）
    const configPath = path.join(__dirname, '../../config/db-config.json');
    const config = loadConfig(configPath);
    const dbConfig = config.mysql; // 数据库配置在 mysql 对象中

    console.log(`📊 连接数据库: ${dbConfig.database}@${dbConfig.host}`);

    // 创建数据库连接
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      port: dbConfig.port || 3306
    });

    console.log('✅ 数据库连接成功\n');

    // 检查字段是否已存在
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME IN ('id_card_front_url', 'id_card_back_url')
    `, [dbConfig.database]);

    const existingColumns = columns.map(col => col.COLUMN_NAME);

    if (existingColumns.includes('id_card_front_url') && existingColumns.includes('id_card_back_url')) {
      console.log('ℹ️  字段已存在，无需添加');
      return;
    }

    // 添加字段
    console.log('📝 添加字段到 users 表...');

    if (!existingColumns.includes('id_card_front_url')) {
      await connection.query(`
        ALTER TABLE users
        ADD COLUMN id_card_front_url VARCHAR(500) DEFAULT NULL COMMENT '身份证正面图片URL'
      `);
      console.log('  ✓ 添加字段: id_card_front_url');
    }

    if (!existingColumns.includes('id_card_back_url')) {
      await connection.query(`
        ALTER TABLE users
        ADD COLUMN id_card_back_url VARCHAR(500) DEFAULT NULL COMMENT '身份证反面图片URL'
      `);
      console.log('  ✓ 添加字段: id_card_back_url');
    }

    // 验证字段已添加
    const [verifyColumns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME IN ('id_card_front_url', 'id_card_back_url')
    `, [dbConfig.database]);

    console.log('\n✅ 迁移完成！已添加字段:');
    verifyColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}): ${col.COLUMN_COMMENT}`);
    });

  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n📊 数据库连接已关闭');
    }
  }
}

// 运行迁移
runMigration().catch(console.error);
