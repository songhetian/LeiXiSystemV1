const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: '192.168.2.31',
    user: 'tian',
    password: 'root',
    database: 'leixin_customer_service'
  });
  const [rows] = await conn.query('SELECT id, name, type, status FROM approval_workflows WHERE type = "reimbursement" LIMIT 10');
  console.log('现有审批流程数据:');
  console.table(rows);
  await conn.end();
})();