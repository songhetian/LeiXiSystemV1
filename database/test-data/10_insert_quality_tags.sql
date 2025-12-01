-- 清空现有数据
DELETE FROM `quality_tags`;
DELETE FROM `quality_tag_categories`;

-- 插入标签分类数据
INSERT INTO `quality_tag_categories` (`name`, `description`, `sort_order`) VALUES
('服务态度', '关于客服服务态度的标签', 1),
('业务能力', '关于客服业务知识的标签', 2),
('沟通技巧', '关于客服沟通技巧的标签', 3),
('违规行为', '关于客服违规行为的标签', 4);

-- 获取分类ID
SET @cat_attitude_id = (SELECT id FROM `quality_tag_categories` WHERE `name` = '服务态度' LIMIT 1);
SET @cat_ability_id = (SELECT id FROM `quality_tag_categories` WHERE `name` = '业务能力' LIMIT 1);
SET @cat_communication_id = (SELECT id FROM `quality_tag_categories` WHERE `name` = '沟通技巧' LIMIT 1);
SET @cat_violation_id = (SELECT id FROM `quality_tag_categories` WHERE `name` = '违规行为' LIMIT 1);

-- 插入标签数据
INSERT INTO `quality_tags` (`name`, `category_id`, `color`, `description`, `tag_type`, `is_active`) VALUES
('态度恶劣', @cat_attitude_id, '#ff4d4f', '客服态度不好，语气生硬', 'quality', 1),
('热情周到', @cat_attitude_id, '#52c41a', '客服态度很好，积极主动', 'quality', 1),
('敷衍了事', @cat_attitude_id, '#faad14', '客服回复敷衍，不解决问题', 'quality', 1),
('业务不熟', @cat_ability_id, '#ff4d4f', '客服对业务知识不熟悉', 'quality', 1),
('解答准确', @cat_ability_id, '#52c41a', '客服解答问题准确无误', 'quality', 1),
('流程错误', @cat_ability_id, '#faad14', '客服操作流程有误', 'quality', 1),
('沟通顺畅', @cat_communication_id, '#52c41a', '沟通理解能力强，表达清晰', 'quality', 1),
('表达不清', @cat_communication_id, '#faad14', '表达含糊，客户难以理解', 'quality', 1),
('辱骂客户', @cat_violation_id, '#f5222d', '严重违规，辱骂客户', 'quality', 1),
('泄露隐私', @cat_violation_id, '#f5222d', '严重违规，泄露客户隐私', 'quality', 1);
