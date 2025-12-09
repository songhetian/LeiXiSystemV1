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

  // 检查role_departments表
  connection.query('DESCRIBE role_departments', (err, results) => {
    if (err) {
      console.error('role_departments表不存在或查询失败:', err);
    } else {
      console.log('role_departments表结构:');
      console.table(results);
    }

    // 检查departments表
    connection.query('DESCRIBE departments', (err, results) => {
      if (err) {
        console.error('departments表不存在或查询失败:', err);
      } else {
        console.log('departments表结构:');
        console.table(results);
      }

      // 检查roles表
      connection.query('DESCRIBE roles', (err, results) => {
        if (err) {
          console.error('roles表不存在或查询失败:', err);
        } else {
          console.log('roles表结构:');
          console.table(results);
        }

        // 查询role_departments表中的数据
        connection.query('SELECT * FROM role_departments LIMIT 10', (err, results) => {
          if (err) {
            console.error('查询role_departments数据失败:', err);
          } else {
            console.log('role_departments表数据:');
            console.table(results);
          }

          // 查询roles表中的数据
          connection.query('SELECT * FROM roles LIMIT 10', (err, results) => {
            if (err) {
              console.error('查询roles数据失败:', err);
            } else {
              console.log('roles表数据:');
              console.table(results);
            }

            connection.end();
          });
        });
      });
    });
  });
});
