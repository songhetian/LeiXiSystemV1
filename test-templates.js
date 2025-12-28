const mysql = require('mysql2/promise');

async function testTemplates() {
  try {
    // 从环境变量或配置文件读取数据库配置
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'leixi',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'leixin_customer_service_v1'
    };

    const connection = await mysql.createConnection(config);

    // 检查表是否存在
    const [tables] = await connection.query("SHOW TABLES LIKE 'permission_templates'");
    console.log('表是否存在:', tables.length > 0 ? '是' : '否');

    if (tables.length > 0) {
      // 查询所有模板
      const [rows] = await connection.query('SELECT * FROM permission_templates');
      console.log('模板数量:', rows.length);
      console.log('模板数据:', JSON.stringify(rows, null, 2));

      // 查看表结构
      const [columns] = await connection.query('DESCRIBE permission_templates');
      console.log('\n表结构:');
      columns.forEach(col => console.log(`  ${col.Field} - ${col.Type}`));
    }

    await connection.end();
  } catch (error) {
    console.error('数据库查询失败:', error.message);
  }
}

testTemplates();