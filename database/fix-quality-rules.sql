-- 质检规则修复脚本
-- 此脚本确保数据库中有可用的质检规则
--
-- 使用方法：
-- 1. 确保已经选择了正确的数据库
-- 2. 运行此脚本
--
-- 注意：请根据你的 .env 文件中的 DB_NAME 修改数据库名称
-- 默认数据库名：leixin_customer_service

-- USE leixin_customer_service;
-- 👆 取消注释并修改为你的数据库名称

-- 方案1: 如果你想保留现有的规则ID (4, 5, 6)，不做任何修改
-- 前端代码已经修改为动态获取规则ID，所以这个方案最安全

-- 方案2: 如果你想重置规则ID为 1, 2, 3（可选）
-- 警告：这会删除所有现有的质检评分数据！
-- 取消下面的注释来执行：

/*
-- 1. 删除所有质检评分（因为有外键约束）
DELETE FROM quality_scores;

-- 2. 删除所有质检规则
DELETE FROM quality_rules;

-- 3. 重置AUTO_INCREMENT
ALTER TABLE quality_rules AUTO_INCREMENT = 1;

-- 4. 插入新的规则（ID将从1开始）
INSERT INTO quality_rules (name, category, description, criteria, score_weight, is_active, created_by, created_at, updated_at) VALUES
('服务态度', 'attitude', '评估客服人员的服务态度和礼貌程度',
 JSON_OBJECT(
   'positive', JSON_ARRAY('礼貌用语', '积极响应', '耐心解答'),
   'negative', JSON_ARRAY('态度冷淡', '不耐烦', '语气生硬')
 ),
 30, 1, 1, NOW(), NOW()),

('专业能力', 'professional', '评估客服人员的专业知识和问题解决能力',
 JSON_OBJECT(
   'positive', JSON_ARRAY('准确解答', '专业术语', '快速定位问题'),
   'negative', JSON_ARRAY('答非所问', '知识欠缺', '无法解决问题')
 ),
 40, 1, 1, NOW(), NOW()),

('沟通技巧', 'communication', '评估客服人员的沟通表达能力',
 JSON_OBJECT(
   'positive', JSON_ARRAY('表达清晰', '逻辑清楚', '善于引导'),
   'negative', JSON_ARRAY('表达混乱', '词不达意', '理解偏差')
 ),
 30, 1, 1, NOW(), NOW());
*/

-- 方案3: 如果规则不存在，添加新规则（推荐）
-- 这个方案不会删除现有数据，只是确保有可用的规则

INSERT INTO quality_rules (name, category, description, criteria, score_weight, is_active, created_by, created_at, updated_at)
SELECT * FROM (
  SELECT
    '服务态度' as name,
    'attitude' as category,
    '评估客服人员的服务态度和礼貌程度' as description,
    JSON_OBJECT(
      'positive', JSON_ARRAY('礼貌用语', '积极响应', '耐心解答'),
      'negative', JSON_ARRAY('态度冷淡', '不耐烦', '语气生硬')
    ) as criteria,
    30 as score_weight,
    1 as is_active,
    1 as created_by,
    NOW() as created_at,
    NOW() as updated_at
) as tmp
WHERE NOT EXISTS (
  SELECT 1 FROM quality_rules WHERE category = 'attitude' AND is_active = 1
);

INSERT INTO quality_rules (name, category, description, criteria, score_weight, is_active, created_by, created_at, updated_at)
SELECT * FROM (
  SELECT
    '专业能力' as name,
    'professional' as category,
    '评估客服人员的专业知识和问题解决能力' as description,
    JSON_OBJECT(
      'positive', JSON_ARRAY('准确解答', '专业术语', '快速定位问题'),
      'negative', JSON_ARRAY('答非所问', '知识欠缺', '无法解决问题')
    ) as criteria,
    40 as score_weight,
    1 as is_active,
    1 as created_by,
    NOW() as created_at,
    NOW() as updated_at
) as tmp
WHERE NOT EXISTS (
  SELECT 1 FROM quality_rules WHERE category = 'professional' AND is_active = 1
);

INSERT INTO quality_rules (name, category, description, criteria, score_weight, is_active, created_by, created_at, updated_at)
SELECT * FROM (
  SELECT
    '沟通技巧' as name,
    'communication' as category,
    '评估客服人员的沟通表达能力' as description,
    JSON_OBJECT(
      'positive', JSON_ARRAY('表达清晰', '逻辑清楚', '善于引导'),
      'negative', JSON_ARRAY('表达混乱', '词不达意', '理解偏差')
    ) as criteria,
    30 as score_weight,
    1 as is_active,
    1 as created_by,
    NOW() as created_at,
    NOW() as updated_at
) as tmp
WHERE NOT EXISTS (
  SELECT 1 FROM quality_rules WHERE category = 'communication' AND is_active = 1
);

-- 验证结果
SELECT '=== 当前可用的质检规则 ===' as info;
SELECT id, name, category, score_weight, is_active
FROM quality_rules
WHERE is_active = 1
ORDER BY id;

SELECT '=== 可用规则ID列表 ===' as info;
SELECT GROUP_CONCAT(id ORDER BY id) as available_rule_ids
FROM quality_rules
WHERE is_active = 1;
