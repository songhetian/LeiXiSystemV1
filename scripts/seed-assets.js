const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

async function seedAssets() {
    const dbConfig = require('../config/db-config.json');
    const config = {
        host: dbConfig.database.host,
        user: dbConfig.database.user,
        password: dbConfig.database.password,
        database: dbConfig.database.database,
        port: dbConfig.database.port
    };

    const pool = mysql.createPool(config);

    try {
        console.log('正在注入资产测试数据...');

        const [users] = await pool.query('SELECT id FROM users WHERE status = "active" LIMIT 5');
        if (users.length === 0) throw new Error('没有找到活动用户');

        await pool.query('INSERT IGNORE INTO asset_categories (id, name, description) VALUES (1, "办公电脑", "笔记本、台式机"), (2, "外设配件", "显示器、键盘、鼠标")');

        await pool.query(`
            INSERT IGNORE INTO assets (asset_no, name, category_id, model, serial_number, status, purchase_date, purchase_price) 
            VALUES 
            ('AST001', 'MacBook Pro 14', 1, 'M3 Pro 16/512', 'SN2024001', 'in_use', '2024-01-10', 15999.00),
            ('AST002', 'ThinkPad T14', 1, 'i7/16G/512G', 'SN2024002', 'in_use', '2024-02-15', 8999.00),
            ('AST003', 'Dell 27显示器', 2, 'U2723QE', 'SN2024003', 'in_use', '2024-03-01', 3500.00),
            ('AST004', '罗技 MX Master 3S', 2, '无线鼠标', 'SN2024004', 'idle', '2024-03-05', 699.00)
        `);

        const [existingAssets] = await pool.query('SELECT id FROM assets WHERE asset_no IN ("AST001", "AST002", "AST003")');
        
        for (let i = 0; i < users.length && i < existingAssets.length; i++) {
            await pool.query(
                'INSERT IGNORE INTO asset_assignments (asset_id, user_id, assigned_at) VALUES (?, ?, NOW())',
                [existingAssets[i].id, users[i].id]
            );
            // 同时更新 assets 表中的 current_user_id
            await pool.query('UPDATE assets SET current_user_id = ? WHERE id = ?', [users[i].id, existingAssets[i].id]);
        }

        console.log('✅ 资产测试数据注入成功！');
    } catch (err) {
        console.error('❌ 注入失败:', err);
    } finally {
        await pool.end();
    }
}

seedAssets();