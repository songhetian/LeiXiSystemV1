const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'tian',
  password: 'root',
  database: 'leixin_customer_service',
  port: 3306
};

async function checkSchema() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('--- Table Description ---');
    const [desc] = await connection.query('DESCRIBE answer_records');
    console.log(JSON.stringify(desc, null, 2));

    console.log('\n--- Indexes ---');
    const [indexes] = await connection.query('SHOW INDEX FROM answer_records');
    console.log(JSON.stringify(indexes, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkSchema();
