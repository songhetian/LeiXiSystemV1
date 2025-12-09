const mysql = require('mysql2');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'tian',
  password: 'root',
  database: 'leixin_customer_service_v1'
};

// 创建连接
const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
  if (err) {
    console.error('数据库连接失败:', err);
    return;
  }
  console.log('数据库连接成功');

  // 查询departments表中的数据
  connection.query('SELECT * FROM departments', (err, results) => {
    if (err) {
      console.error('查询departments数据失败:', err);
    } else {
      console.log('departments表数据:');
      console.table(results);
    }

    connection.end();
  });
});
