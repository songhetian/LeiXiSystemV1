/**
 * 质检规则修复脚本（Node.js版本）
 * 此脚本会从 .env 文件读取数据库配置，并确保数据库中有可用的质检规则
 */

const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// 加载数据库配置
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// 引入配置加密工具
const { loadConfig } = require('../server/utils/config-crypto');

// 加载数据库配置
const isPackaged = __dirname.includes('app.asar');
const dbConfigPath = isPackaged
  ? path.join(__dirname, '../../config/db-config.json')
  : path.join(__dirname, '../config/db-config.json');

let dbConfigJson = {};
try {
  dbConfigJson = loadConfig(dbConfigPath);
} catch (error) {
  console.warn('⚠️  无法加载数据库配置文件，将使用环境变量');
}

const dbConfig = {
  host: (dbConfigJson.database && dbConfigJson.database.host) || process.env.DB_HOST || 'localhost',
  user: (dbConfigJson.database && dbConfigJson.database.user) || process.env.DB_USER || 'root',
  password: (dbConfigJson.database && dbConfigJson.database.password) || process.env.DB_PASSWORD || 'root',
  database: (dbConfigJson.database && dbConfigJson.database.database) || process.env.DB_NAME || 'leixin_customer_service',
  port: (dbConfigJson.database && dbConfigJson.database.port) || process.env.DB_PORT || 3306,
};

// 质检规则数据
const qualityRules = [
  {
    name: '服务态度',
    category: 'attitude',
    description: '评估客服人员的服务态度和礼貌程度',
    criteria: {
      positive: ['礼貌用语', '积极响应', '耐心解答'],
      negative: ['态度冷淡', '不耐烦', '语气生硬']
    },
    score_weight: 30
  },
  {
    name: '专业能力',
    category: 'professional',
    description: '评估客服人员的专业知识和问题解决能力',
    criteria: {
      positive: ['准确解答', '专业术语', '快速定位问题'],
      negative: ['答非所问', '知识欠缺', '无法解决问题']
    },
    score_weight: 40
  },
  {
    name: '沟通技巧',
    category: 'communication',
    description: '评估客服人员的沟通表达能力',
    criteria: {
      positive: ['表达清晰', '逻辑清楚', '善于引导'],
      negative: ['表达混乱', '词不达意', '理解偏差']
    },
    score_weight: 30
  }
];

async function fixQualityRules() {
  let connection;

  try {
    console.log('🔍 连接数据库...');
    console.log(`   数据库: ${dbConfig.database}`);
    console.log(`   主机: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`   用户: ${dbConfig.user}\n`);

    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功\n');

    // 检查质检规则表是否存在
    console.log('📋 检查 quality_rules 表...');
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'quality_rules'"
    );

    if (tables.length === 0) {
      console.log('❌ quality_rules 表不存在！');
      console.log('💡 请先运行数据库迁移脚本创建表结构');
      return;
    }
    console.log('✅ quality_rules 表存在\n');

    // 查询现有规则
    console.log('📊 检查现有规则...');
    const [existingRules] = await connection.query(
      'SELECT id, name, category, is_active FROM quality_rules'
    );

    console.log(`   现有规则数量: ${existingRules.length}`);
    if (existingRules.length > 0) {
      console.table(existingRules);
    }

    // 检查每个分类是否存在活跃规则
    let addedCount = 0;
    let skippedCount = 0;

    console.log('\n🔧 开始修复规则...\n');

    for (const rule of qualityRules) {
      // 检查该分类是否已存在活跃规则
      const [existing] = await connection.query(
        'SELECT id FROM quality_rules WHERE category = ? AND is_active = 1',
        [rule.category]
      );

      if (existing.length > 0) {
        console.log(`⏭️  跳过 "${rule.name}" (分类 ${rule.category} 已存在活跃规则)`);
        skippedCount++;
        continue;
      }

      // 插入新规则
      try {
        const [result] = await connection.query(
          `INSERT INTO quality_rules
           (name, category, description, criteria, score_weight, is_active, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 1, 1, NOW(), NOW())`,
          [
            rule.name,
            rule.category,
            rule.description,
            JSON.stringify(rule.criteria),
            rule.score_weight
          ]
        );

        console.log(`✅ 添加规则 "${rule.name}" (ID: ${result.insertId})`);
        addedCount++;
      } catch (error) {
        console.error(`❌ 添加规则 "${rule.name}" 失败:`, error.message);
      }
    }

    // 显示最终结果
    console.log('\n' + '='.repeat(60));
    console.log('📊 修复结果统计');
    console.log('='.repeat(60));
    console.log(`✅ 新增规则: ${addedCount}`);
    console.log(`⏭️  跳过规则: ${skippedCount}`);
    console.log(`📝 总规则数: ${qualityRules.length}`);

    // 查询最终的规则列表
    console.log('\n📋 当前所有活跃规则：\n');
    const [finalRules] = await connection.query(
      'SELECT id, name, category, score_weight, is_active FROM quality_rules WHERE is_active = 1 ORDER BY id'
    );
    console.table(finalRules);

    const activeRuleIds = finalRules.map(r => r.id).join(', ');
    console.log(`\n✨ 可用规则ID: ${activeRuleIds}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ 修复完成！');
    console.log('='.repeat(60));
    console.log('\n💡 提示：');
    console.log('   - 前端代码已修改为动态获取规则ID');
    console.log('   - 无需担心规则ID不匹配的问题');
    console.log('   - 可以随时添加新规则，前端会自动识别\n');

  } catch (error) {
    console.error('\n❌ 修复失败:', error.message);
    console.error('\n详细错误信息:');
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭\n');
    }
  }
}

// 运行修复
console.log('🚀 开始修复质检规则...\n');
fixQualityRules();
