const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function checkColumns() {
  const configPath = path.join(__dirname, '../config/db-config.json');
  const dbConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const connection = await mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    port: dbConfig.port
  });

  try {
    const [columns] = await connection.query('SHOW COLUMNS FROM approval_workflow_nodes');
    console.log('Columns in approval_workflow_nodes:');
    columns.forEach(col => {
      console.log(`${col.Field}: ${col.Type}`);
    });

    const [workflows] = await connection.query('SELECT * FROM approval_workflows');
    console.log('\nNumber of workflows:', workflows.length);
    if (workflows.length > 0) {
      console.log('Sample workflow:', workflows[0]);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkColumns();
