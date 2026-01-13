const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrate() {
    const dbConfig = require('../config/db-config.json').database;
    const pool = mysql.createPool(dbConfig);

    try {
        console.log('🚀 开始高级资产架构迁移...');

        // 1. 创建基础表
        await pool.query(`CREATE TABLE IF NOT EXISTS asset_component_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            sort_order INT DEFAULT 0
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS asset_components (
            id INT AUTO_INCREMENT PRIMARY KEY,
            type_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            model VARCHAR(100),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (type_id) REFERENCES asset_component_types(id)
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS asset_models (
            id INT AUTO_INCREMENT PRIMARY KEY,
            category_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES asset_categories(id)
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS asset_model_templates (
            model_id INT NOT NULL,
            component_id INT NOT NULL,
            quantity INT DEFAULT 1,
            PRIMARY KEY (model_id, component_id),
            FOREIGN KEY (model_id) REFERENCES asset_models(id) ON DELETE CASCADE,
            FOREIGN KEY (component_id) REFERENCES asset_components(id)
        )`);

        // 2. 安全处理 assets 表字段
        const [cols] = await pool.query('SHOW COLUMNS FROM assets');
        const hasModelId = cols.some(c => c.Field === 'model_id');
        const hasSpecs = cols.some(c => c.Field === 'specs');

        if (!hasModelId) {
            await pool.query('ALTER TABLE assets ADD COLUMN model_id INT AFTER category_id');
            await pool.query('ALTER TABLE assets ADD FOREIGN KEY (model_id) REFERENCES asset_models(id)');
            console.log('✅ 已添加 model_id 到 assets 表');
        }

        if (hasSpecs) {
            // 先尝试迁移数据（如果需要），此处直接删除以支持新架构
            await pool.query('ALTER TABLE assets DROP COLUMN specs');
            console.log('🗑️ 已移除 assets 表旧的 specs 列');
        }

        // 3. 重新创建资产升级表（覆盖旧的简单版本）
        await pool.query('DROP TABLE IF EXISTS asset_upgrades');
        await pool.query(`CREATE TABLE asset_upgrades (
            id INT AUTO_INCREMENT PRIMARY KEY,
            asset_id INT NOT NULL,
            component_type_id INT NOT NULL,
            old_component_id INT,
            new_component_id INT NOT NULL,
            upgrade_type ENUM('initial', 'upgrade', 'repair', 'replace') DEFAULT 'upgrade',
            reason TEXT,
            cost DECIMAL(10, 2) DEFAULT 0.00,
            upgrade_date DATE,
            handled_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
            FOREIGN KEY (component_type_id) REFERENCES asset_component_types(id),
            FOREIGN KEY (old_component_id) REFERENCES asset_components(id),
            FOREIGN KEY (new_component_id) REFERENCES asset_components(id),
            FOREIGN KEY (handled_by) REFERENCES users(id)
        )`);

        // 4. 插入默认配件类型
        await pool.query('INSERT IGNORE INTO asset_component_types (id, name, sort_order) VALUES (1, "CPU", 1), (2, "内存", 2), (3, "硬盘", 3), (4, "显卡", 4), (5, "主板", 5)');

        console.log('✨ 高级资产架构迁移完成！');
    } catch (err) {
        console.error('❌ 迁移失败:', err);
    } finally {
        await pool.end();
    }
}

migrate();
