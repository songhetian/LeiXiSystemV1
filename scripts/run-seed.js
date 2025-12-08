const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { loadConfig } = require('../server/utils/config-crypto');

const dbConfigPath = path.join(__dirname, '../config/db-config.json');
let fileConfig = {};

if (fs.existsSync(dbConfigPath)) {
    try {
        // 使用 loadConfig 自动处理明文或加密配置
        const loadedConfig = loadConfig(dbConfigPath);
        if (loadedConfig.database) {
            fileConfig = loadedConfig.database;
            console.log('配置来源: config/db-config.json (已加载)');
        }
    } catch (e) {
        console.warn('读取 db-config.json 失败，回退到 .env 配置', e.message);
    }
} else {
    console.log('配置来源: .env 文件');
}

const dbConfig = {
    host: process.env.DB_HOST || fileConfig.host || 'localhost',
    user: process.env.DB_USER || fileConfig.user || 'root',
    password: process.env.DB_PASSWORD || fileConfig.password || 'root',
    database: process.env.DB_NAME || fileConfig.database,
    port: process.env.DB_PORT || fileConfig.port || 3306,
    multipleStatements: true
};

if (!dbConfig.database) {
    console.error('DB_NAME 未配置，请在 .env 设置为 leixin_customer_service_v1');
    process.exit(1);
}

async function runSeed() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log(`✓ 已连接到数据库: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}\n`);

        const seedDir = path.join(__dirname, '../database/test-data');
        const seedFiles = fs.readdirSync(seedDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        console.log(`找到 ${seedFiles.length} 个种子数据文件\n`);

        for (const file of seedFiles) {
            console.log(`执行: ${file}`);
            const sql = fs.readFileSync(path.join(seedDir, file), 'utf8');

            try {
                // 分割并执行 SQL 语句
                const statements = sql
                    .split(';')
                    .map(stmt => stmt.trim())
                    .filter(stmt => stmt.length > 0);

                for (const statement of statements) {
                    if (statement) {
                        await connection.query(statement);
                    }
                }

                console.log(`✓ ${file} 执行完成`);
            } catch (err) {
                console.warn(`⚠️ 跳过 ${file}: ${err.message}`);
                // 继续执行后续种子文件
            }
        }

        console.log('\n✓ 所有种子数据已成功导入');

    } catch (error) {
        console.error('❌ 错误:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runSeed();
