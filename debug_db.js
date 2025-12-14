const mysql = require('mysql2/promise');

async function checkShifts() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'leixin_customer_service',
      port: 3306
    });

    console.log('Connected to database.');

    // Inspect specific shifts that might be "Rest"
    const [rows] = await connection.query("SELECT id, name, HEX(name) as name_hex, work_hours FROM work_shifts WHERE name LIKE '%休%' OR name LIKE '%Rest%' OR name LIKE '%rest%' OR work_hours = 0");

    console.log('Found shifts:');
    console.table(rows);

    // Also check for any shift that might be relevant but missed
    const [all] = await connection.query("SELECT id, name, work_hours FROM work_shifts LIMIT 50");
    console.log('First 50 shifts:');
    console.table(all);

    await connection.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkShifts();
