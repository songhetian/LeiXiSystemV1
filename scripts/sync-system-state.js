const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function syncState() {
    const dbConfig = require('../config/db-config.json').database;
    const pool = mysql.createPool(dbConfig);

    try {
        console.log('🔄 正在同步系统终态...');

        // 1. 冗余字段增加
        const [assetsCols] = await pool.query('SHOW COLUMNS FROM assets');
        if (!assetsCols.some(c => c.Field === 'config_summary')) {
            await pool.query('ALTER TABLE assets ADD COLUMN config_summary TEXT AFTER model_id');
            console.log('✅ 已增加 config_summary');
        }

        // 2. 审批组表 (确保存在)
        await pool.query(`CREATE TABLE IF NOT EXISTS special_approval_groups (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS special_approval_group_members (
            group_id INT NOT NULL,
            member_type ENUM('role', 'user') NOT NULL,
            member_id INT NOT NULL, 
            PRIMARY KEY (group_id, member_type, member_id),
            FOREIGN KEY (group_id) REFERENCES special_approval_groups(id) ON DELETE CASCADE
        )`);

        // 3. 关联字段增加
        const [nodeCols] = await pool.query('SHOW COLUMNS FROM approval_workflow_nodes');
        if (!nodeCols.some(c => c.Field === 'special_group_id')) {
            await pool.query('ALTER TABLE approval_workflow_nodes ADD COLUMN special_group_id INT DEFAULT NULL AFTER role_id');
            console.log('✅ 已增加 special_group_id');
        }

        console.log('✨ 终态同步完成！');
    } catch (err) {
        console.error('❌ 同步失败:', err);
    } finally {
        await pool.end();
    }
}

syncState();
