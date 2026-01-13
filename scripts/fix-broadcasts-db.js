const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixBroadcastsColumn() {
    let dbConfig;
    try {
        dbConfig = require('../config/db-config.json');
    } catch (e) {
        dbConfig = { database: {} };
    }
    
    const config = {
        host: process.env.DB_HOST || dbConfig.database.host,
        user: process.env.DB_USER || dbConfig.database.user,
        password: process.env.DB_PASSWORD || dbConfig.database.password,
        database: process.env.DB_NAME || dbConfig.database.database,
        port: process.env.DB_PORT || dbConfig.database.port
    };

    const connection = await mysql.createConnection(config);

    try {
        console.log('🔗 Connected to database. Checking broadcasts table...');

        // Check if 'expire_at' exists
        const [columns] = await connection.query("SHOW COLUMNS FROM broadcasts LIKE 'expire_at'");
        
        if (columns.length > 0) {
            console.log('⚠️ Found column "expire_at", renaming to "expires_at"...');
            await connection.query('ALTER TABLE broadcasts CHANGE COLUMN expire_at expires_at DATETIME COMMENT "过期时间"');
            console.log('✅ Successfully renamed column to "expires_at"');
        } else {
            // Check if 'expires_at' already exists
            const [cols2] = await connection.query("SHOW COLUMNS FROM broadcasts LIKE 'expires_at'");
            if (cols2.length > 0) {
                console.log('ℹ️ Column "expires_at" already exists. No action needed.');
            } else {
                console.log('⚠️ Neither "expire_at" nor "expires_at" found. Creating "expires_at"...');
                await connection.query('ALTER TABLE broadcasts ADD COLUMN expires_at DATETIME COMMENT "过期时间" AFTER publish_at');
                console.log('✅ Successfully created column "expires_at"');
            }
        }

    } catch (err) {
        console.error('❌ Error applying fix:', err);
    } finally {
        await connection.end();
    }
}

fixBroadcastsColumn();
