const mysql = require('mysql2/promise');

async function checkKnowledgeTypes() {
  try {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'leixi',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'leixin_customer_service_v1'
    };

    const connection = await mysql.createConnection(config);

    // 检查分类数据
    console.log('=== 分类数据 ===');
    const [categories] = await connection.query('SELECT id, name, type, is_public, owner_id, is_deleted FROM knowledge_categories LIMIT 10');
    categories.forEach(c => {
      console.log(`ID: ${c.id}, 名称: ${c.name}, 类型: ${c.type}, is_public: ${c.is_public}, owner_id: ${c.owner_id}, is_deleted: ${c.is_deleted}`);
    });

    // 检查文档数据
    console.log('\n=== 文档数据 ===');
    const [articles] = await connection.query('SELECT id, title, type, is_public, owner_id, is_deleted FROM knowledge_articles LIMIT 10');
    articles.forEach(a => {
      console.log(`ID: ${a.id}, 标题: ${a.title}, 类型: ${a.type}, is_public: ${a.is_public}, owner_id: ${a.owner_id}, is_deleted: ${a.is_deleted}`);
    });

    // 统计个人类型的数据
    console.log('\n=== 统计信息 ===');
    const [catCount] = await connection.query("SELECT COUNT(*) as count FROM knowledge_categories WHERE (type IN ('personal', 'private') OR is_public = 0) AND is_deleted = 0");
    console.log(`个人分类数量: ${catCount[0].count}`);

    const [artCount] = await connection.query("SELECT COUNT(*) as count FROM knowledge_articles WHERE (type IN ('personal', 'private') OR is_public = 0) AND is_deleted = 0");
    console.log(`个人文档数量: ${artCount[0].count}`);

    await connection.end();
  } catch (error) {
    console.error('查询失败:', error.message);
  }
}

checkKnowledgeTypes();