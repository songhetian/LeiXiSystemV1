const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

async function debugChat() {
    const dbConfig = require('../config/db-config.json');
    const config = {
        host: dbConfig.database.host || 'localhost',
        user: dbConfig.database.user,
        password: dbConfig.database.password,
        database: dbConfig.database.database,
        port: dbConfig.database.port
    };

    const pool = mysql.createPool(config);

    try {
        console.log('--- 聊天系统诊断 ---');
        
        // 1. 检查群组表
        const [groups] = await pool.query('SELECT * FROM chat_groups');
        console.log(`📊 群组总数: ${groups.length}`);
        if (groups.length > 0) {
            console.log('最近3个群组:', groups.slice(0, 3).map(g => ({ id: g.id, name: g.name, dept: g.department_id })));
        }

        // 2. 检查超级管理员权限
        const [admins] = await pool.query(`
            SELECT u.id, u.real_name, r.name as role_name
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE r.name = '超级管理员'
        `);
        console.log(`🔑 超级管理员账号数: ${admins.length}`);
        if (admins.length > 0) {
            const adminId = admins[0].id;
            console.log(`测试第一个管理员 ID: ${adminId} (${admins[0].real_name})`);

            // 3. 模拟 SQL 查询逻辑
            const query = `
                SELECT DISTINCT g.id, g.name
                FROM chat_groups g
                LEFT JOIN chat_group_members gm ON g.id = gm.group_id AND gm.user_id = ?
                WHERE (gm.user_id IS NOT NULL OR 1=1)
            `;
            const [result] = await pool.query(query, [adminId]);
            console.log(`🔎 模拟查询返回群组数: ${result.length}`);
        }

        // 4. 检查部门关联情况
        const [depts] = await pool.query('SELECT id, name FROM departments');
        console.log(`🏢 部门总数: ${depts.length}`);

    } catch (err) {
        console.error('❌ 诊断失败:', err);
    } finally {
        await pool.end();
    }
}

debugChat();
