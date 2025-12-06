const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'leixin_customer_service',
  port: process.env.DB_PORT || 3306,
};

async function checkColumns() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to the database.');

    // Check if approval_note column exists in users table
    const [usersColumns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'approval_note'",
      [process.env.DB_NAME || 'leixin_customer_service']
    );
    
    console.log('Users table approval_note column exists:', usersColumns.length > 0);
    
    // Check if deleted_at column exists in quality_cases table
    const [qualityCasesColumns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'quality_cases' AND COLUMN_NAME = 'deleted_at'",
      [process.env.DB_NAME || 'leixin_customer_service']
    );
    
    console.log('Quality_cases table deleted_at column exists:', qualityCasesColumns.length > 0);
    
    // Check if used_conversion_days column exists in leave_records table
    const [leaveRecordsColumns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'leave_records' AND COLUMN_NAME = 'used_conversion_days'",
      [process.env.DB_NAME || 'leixin_customer_service']
    );
    
    console.log('Leave_records table used_conversion_days column exists:', leaveRecordsColumns.length > 0);
    
    // Check if name, description, ratio columns exist in conversion_rules table
    const [conversionRulesColumns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'conversion_rules' AND COLUMN_NAME IN ('name', 'description', 'ratio')",
      [process.env.DB_NAME || 'leixin_customer_service']
    );
    
    console.log('Conversion_rules table columns:', conversionRulesColumns.map(row => row.COLUMN_NAME));
    
    // Check if source_type, target_type columns exist in conversion_rules table
    const [conversionRulesDropColumns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'conversion_rules' AND COLUMN_NAME IN ('source_type', 'target_type')",
      [process.env.DB_NAME || 'leixin_customer_service']
    );
    
    console.log('Conversion_rules table columns to drop:', conversionRulesDropColumns.map(row => row.COLUMN_NAME));

  } catch (error) {
    console.error('Error checking columns:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

checkColumns();