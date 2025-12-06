const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
// Load .env exactly as run-migrations.js does
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'leixin_customer_service',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true // Important: The migration script uses this
};

async function debugUser() {
    console.log('--- Config ---');
    console.log('User:', dbConfig.user);

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Check current user
        const [rows] = await connection.query('SELECT USER(), CURRENT_USER()');
        console.log('Connected as:', rows[0]['USER()']);
        console.log('Authenticated as:', rows[0]['CURRENT_USER()']);

        // Check grants
        const [grants] = await connection.query('SHOW GRANTS');
        console.log('\n--- Grants ---');
        grants.forEach(g => console.log(Object.values(g)[0]));

        console.log('\n--- Test: View Repro ---');
        try {
            const sql = "/*!50001 DROP VIEW IF EXISTS `employee_work_duration`*/";
            console.log(`Executing: ${sql}`);
            await connection.query(sql);
            console.log('Success: View dropped (or command succeeded).');
        } catch (e) {
            console.error('FAIL: Error executing drop view statement.');
            console.error(e);
        }

    } catch (error) {
        console.error('Connection Failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

debugUser();
