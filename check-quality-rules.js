/**
 * 质检规则检查脚本
 * 用于验证数据库中的质检规则配置
 */

const mysql = require('mysql2/promise');
const path = require('path');

// 加载数据库配置
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'leixin_customer_service',
  port: process.env.DB_PORT || 3306,
};

async function checkQualityRules() {
  let connection;

  try {
    console.log('🔍 连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功\n');

    // 检查质检规则表是否存在
    console.log('📋 检查 quality_rules 表...');
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'quality_rules'"
    );

    if (tables.length === 0) {
      console.log('❌ quality_rules 表不存在！');
      console.log('💡 请运行数据库迁移脚本创建表结构');
      return;
    }
    console.log('✅ quality_rules 表存在\n');

    // 查询所有质检规则
    console.log('📊 查询质检规则...');
    const [rules] = await connection.query(
      'SELECT id, name, category, score_weight, is_active FROM quality_rules ORDER BY id'
    );

    if (rules.length === 0) {
      console.log('⚠️  数据库中没有质检规则！');
      console.log('💡 建议运行: mysql -u root -p leixin_customer_service < database/fix-quality-rules.sql');
      return;
    }

    console.log(`✅ 找到 ${rules.length} 条质检规则：\n`);
    console.table(rules);

    // 检查活跃的规则
    const activeRules = rules.filter(r => r.is_active === 1);
    console.log(`\n📌 活跃规则数量: ${activeRules.length}`);

    if (activeRules.length === 0) {
      console.log('⚠️  没有活跃的质检规则！');
      console.log('💡 请确保至少有一个规则的 is_active = 1');
      return;
    }

    const activeRuleIds = activeRules.map(r => r.id).join(', ');
    console.log(`✅ 活跃规则ID: ${activeRuleIds}\n`);

    // 检查规则分类
    const categories = [...new Set(activeRules.map(r => r.category))];
    console.log('📂 规则分类:');
    categories.forEach(cat => {
      const count = activeRules.filter(r => r.category === cat).length;
      console.log(`   - ${cat}: ${count} 条规则`);
    });

    // 检查是否有质检评分记录
    console.log('\n📈 检查质检评分记录...');
    const [scores] = await connection.query(
      'SELECT COUNT(*) as count FROM quality_scores'
    );
    console.log(`   已有 ${scores[0].count} 条评分记录`);

    // 检查是否有使用了不存在的规则ID的评分
    const [invalidScores] = await connection.query(`
      SELECT DISTINCT qs.rule_id
      FROM quality_scores qs
      LEFT JOIN quality_rules qr ON qs.rule_id = qr.id
      WHERE qr.id IS NULL
    `);

    if (invalidScores.length > 0) {
      console.log('\n⚠️  发现使用了不存在的规则ID的评分记录：');
      invalidScores.forEach(s => {
        console.log(`   - 规则ID: ${s.rule_id}`);
      });
      console.log('💡 这些评分记录可能需要清理或修复');
    } else {
      console.log('✅ 所有评分记录的规则ID都有效');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ 检查完成！');
    console.log('='.repeat(60));
    console.log('\n💡 前端代码已修改为动态获取规则ID，无需担心ID不匹配的问题');
    console.log('💡 如需添加新规则，请在数据库中插入，前端会自动识别');

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    console.error('\n详细错误信息:');
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

// 运行检查
console.log('🚀 开始检查质检规则配置...\n');
checkQualityRules();
