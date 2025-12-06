const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Mimic server/index.js config loading
const isPackaged = false; // We are in dev
const dbConfigPath = path.join(__dirname, '../config/db-config.json');

console.log('--- App Config Debug ---');
console.log('Config Path:', dbConfigPath);

let dbConfigJson = {};
try {
    if (fs.existsSync(dbConfigPath)) {
        const content = fs.readFileSync(dbConfigPath, 'utf8');
        console.log('Raw Config Content Length:', content.length);
        try {
            dbConfigJson = JSON.parse(content);
            // Simple decrypt check if we were using the real utility, but here just check structure
            if (dbConfigJson.encrypted) {
                console.log('WARNING: Config is encrypted! This debug script does not decrypt it.');
                console.log('If the app requires decryption, use server logic.');
            }
        } catch (e) {
            console.error('JSON Parse Error:', e.message);
        }
    } else {
        console.log('Config file NOT FOUND at path.');
    }
} catch (error) {
    console.error('Error reading config:', error);
}

const dbConfig = {
    host: (dbConfigJson.database && dbConfigJson.database.host) || process.env.DB_HOST || 'localhost',
    user: (dbConfigJson.database && dbConfigJson.database.user) || process.env.DB_USER || 'tian',
    // Do not log password, but use it
    password: (dbConfigJson.database && dbConfigJson.database.password) || process.env.DB_PASSWORD || 'root',
    database: (dbConfigJson.database && dbConfigJson.database.database) || process.env.DB_NAME || 'leixin_customer_service',
    port: (dbConfigJson.database && dbConfigJson.database.port) || process.env.DB_PORT || 3306,
};

console.log('\n--- Resolved DB Config ---');
console.log('Host:', dbConfig.host);
console.log('User:', dbConfig.user);
console.log('Database:', dbConfig.database);
console.log('Port:', dbConfig.port);

async function testConnection() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('\nSUCCESS: Connected to database!');
        const [rows] = await connection.query('SELECT 1 as val');
        console.log('Query Result:', rows);
        await connection.end();
    } catch (e) {
        console.error('\nFAILURE: Could not connect to database.');
        console.error('Error:', e.message);
        if (e.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Access Denied! Check username/password.');
        }
    }
}

testConnection();
