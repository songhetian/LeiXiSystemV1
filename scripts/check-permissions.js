const mysql = require('mysql2');
require('dotenv').config();

// 数据库配置
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'leixin_customer_service',
  port: process.env.DB_PORT || 3306
};

console.log('DB Config:', config);

// 创建连接
const connection = mysql.createConnection(config);

connection.connect((err) => {
  if (err) {
    console.error('连接失败:', err);
    return;
  }

  console.log('连接成功!');

  // 查询权限列表
  connection.query('SELECT code, module, name, description FROM permissions ORDER BY module, code', (error, results) => {
    if (error) {
      console.error('查询失败:', error);
      connection.end();
      return;
    }

    console.log('权限列表:');
    const modules = {};

    results.forEach(row => {
      if (!modules[row.module]) {
        modules[row.module] = [];
      }
      modules[row.module].push({
        code: row.code,
        name: row.name,
        description: row.description
      });
    });

    // 按模块显示
    Object.keys(modules).forEach(module => {
      console.log(`\n${module} 模块 (${modules[module].length} 个权限):`);
      modules[module].forEach(perm => {
        console.log(`  - ${perm.code}: ${perm.name} (${perm.description})`);
      });
    });

    console.log(`\n总计: ${results.length} 个权限`);
    console.log(`模块数: ${Object.keys(modules).length} 个`);

    // 检查缺失的模块
    const expectedModules = ['user', 'organization', 'messaging', 'attendance', 'vacation', 'quality', 'knowledge', 'assessment', 'system'];
    const missingModules = expectedModules.filter(module => !modules[module]);

    console.log('\n=== 模块完整性检查 ===');
    console.log('期望的模块:', expectedModules);
    console.log('数据库中存在的模块:', Object.keys(modules));
    console.log('缺失的模块:', missingModules);

    connection.end();
  });
});
