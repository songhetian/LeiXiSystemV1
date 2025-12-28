const mysql = require('mysql2/promise');

async function checkAttachmentUrl() {
  try {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'leixi',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'leixin_customer_service_v1'
    };

    const connection = await mysql.createConnection(config);

    // 查找包含该文件名的文章
    const [articles] = await connection.query("SELECT id, title, attachments FROM knowledge_articles WHERE attachments LIKE '%1766830412086-thvrgo.pdf%' LIMIT 5");
    console.log('文章数据:');
    articles.forEach(a => {
      console.log(`ID: ${a.id}, 标题: ${a.title}`);
      console.log(`附件: ${a.attachments}`);
      console.log('---');
    });

    // 查找包含该文件名的分类
    const [categories] = await connection.query("SELECT id, name, attachments FROM knowledge_categories WHERE attachments LIKE '%1766830412086-thvrgo.pdf%' LIMIT 5");
    console.log('\n分类数据:');
    categories.forEach(c => {
      console.log(`ID: ${c.id}, 名称: ${c.name}`);
      console.log(`附件: ${c.attachments}`);
      console.log('---');
    });

    await connection.end();
  } catch (error) {
    console.error('查询失败:', error.message);
  }
}

checkAttachmentUrl();