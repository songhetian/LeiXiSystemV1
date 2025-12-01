-- 插入质检规则测试数据
-- 这个脚本会插入默认的质检规则

USE leixin_customer_service;

-- 清理现有的质检规则数据（如果需要重置）
-- DELETE FROM quality_rules WHERE id IN (1, 2, 3, 4, 5, 6);

-- 插入质检规则
-- 注意：如果数据库中已有规则，这些ID可能会自动递增
INSERT INTO quality_rules (id, name, category, description, criteria, score_weight, is_active, created_by, created_at, updated_at) VALUES
(1, '服务态度', 'attitude', '评估客服人员的服务态度和礼貌程度',
 JSON_OBJECT(
   'positive', JSON_ARRAY('礼貌用语', '积极响应', '耐心解答'),
   'negative', JSON_ARRAY('态度冷淡', '不耐烦', '语气生硬')
 ),
 30, 1, 1, NOW(), NOW()),

(2, '专业能力', 'professional', '评估客服人员的专业知识和问题解决能力',
 JSON_OBJECT(
   'positive', JSON_ARRAY('准确解答', '专业术语', '快速定位问题'),
   'negative', JSON_ARRAY('答非所问', '知识欠缺', '无法解决问题')
 ),
 40, 1, 1, NOW(), NOW()),

(3, '沟通技巧', 'communication', '评估客服人员的沟通表达能力',
 JSON_OBJECT(
   'positive', JSON_ARRAY('表达清晰', '逻辑清楚', '善于引导'),
   'negative', JSON_ARRAY('表达混乱', '词不达意', '理解偏差')
 ),
 30, 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  description = VALUES(description),
  criteria = VALUES(criteria),
  score_weight = VALUES(score_weight),
  is_active = VALUES(is_active),
  updated_at = NOW();

-- 如果上面的插入因为AUTO_INCREMENT导致ID不是1,2,3，可以使用下面的方式
-- 先删除所有规则，然后重置AUTO_INCREMENT
-- DELETE FROM quality_rules;
-- ALTER TABLE quality_rules AUTO_INCREMENT = 1;
-- 然后再执行上面的INSERT语句

-- 验证插入结果
SELECT id, name, category, score_weight, is_active FROM quality_rules ORDER BY id;

-- 显示当前可用的规则ID
SELECT GROUP_CONCAT(id ORDER BY id) as available_rule_ids FROM quality_rules WHERE is_active = 1;
