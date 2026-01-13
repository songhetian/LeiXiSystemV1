const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs');

async function migrateChat() {
    const dbConfig = require('../config/db-config.json');
    
    // Override with ENV if present
    const config = {
        host: process.env.DB_HOST || dbConfig.database.host,
        user: process.env.DB_USER || dbConfig.database.user,
        password: process.env.DB_PASSWORD || dbConfig.database.password,
        database: process.env.DB_NAME || dbConfig.database.database,
        port: process.env.DB_PORT || dbConfig.database.port
    };

    const pool = mysql.createPool(config);

    try {
        console.log('🔄 开始聊天系统重构迁移...');

        // 1. 获取所有部门
        const [departments] = await pool.query('SELECT * FROM departments');
        console.log(`📋 找到 ${departments.length} 个部门`);

        // 1.5 获取一个有效的群主 (系统管理员或第一个用户)
        const [adminUsers] = await pool.query('SELECT id FROM users ORDER BY id ASC LIMIT 1');
        const defaultOwnerId = adminUsers.length > 0 ? adminUsers[0].id : null;

        if (!defaultOwnerId) {
            throw new Error('No users found in database to assign as group owner');
        }

        // 2. 遍历部门，创建或关联群组
        for (const dept of departments) {
            // 检查该部门是否已有群组
            const [existingGroups] = await pool.query('SELECT * FROM chat_groups WHERE department_id = ?', [dept.id]);
            
            let groupId;

            if (existingGroups.length > 0) {
                groupId = existingGroups[0].id;
                console.log(`✅ 部门 [${dept.name}] 已有群组 (ID: ${groupId})`);
            } else {
                // 检查是否有一个同名的普通群组，如果有则关联，否则新建
                // 注意：这里为了安全，直接新建专属部门群组，避免混淆
                const [result] = await pool.query(
                    'INSERT INTO chat_groups (name, owner_id, type, department_id) VALUES (?, ?, ?, ?)',
                    [dept.name, defaultOwnerId, 'group', dept.id]
                );
                groupId = result.insertId;
                console.log(`🆕 为部门 [${dept.name}] 创建新群组 (ID: ${groupId})`);
            }

            // 3. 同步该部门的员工到群组
            const [users] = await pool.query('SELECT id FROM users WHERE department_id = ? AND status != "deleted"', [dept.id]);
            
            if (users.length > 0) {
                const values = users.map(u => [groupId, u.id, 'member']);
                // 使用 IGNORE 忽略已存在的记录
                await pool.query(
                    'INSERT IGNORE INTO chat_group_members (group_id, user_id, role) VALUES ?',
                    [values]
                );
                console.log(`   Detailed: 已将 ${users.length} 名员工同步到群组 ${groupId}`);
            }
        }

        // 4. 可选：清理旧的非部门群组或 P2P 消息？
        // 根据需求 "聊天功能仅支持群组对话，每个部门自动对应一个群组"，
        // 我们可能需要软删除其他群组，这里暂时只做"确保部门群组存在"。
        // 前端会过滤只显示 department_id IS NOT NULL 的群组。

        console.log('✅ 聊天系统迁移完成！');

    } catch (err) {
        console.error('❌ 迁移失败:', err);
    } finally {
        await pool.end();
    }
}

migrateChat();
