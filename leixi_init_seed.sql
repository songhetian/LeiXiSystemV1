SET FOREIGN_KEY_CHECKS=0;

-- Source: 01_insert_departments.sql
-- ==========================================
-- 部门测试数据插入脚本
-- ==========================================

-- 清理已存在的测试数据
DELETE FROM `departments` WHERE `name` IN ('管理部', '客服部', '技术部', '质检部', '运营部');

-- 插入部门数据
INSERT INTO `departments` (`name`, `parent_id`, `description`, `status`, `sort_order`, `created_at`) VALUES
('管理部', NULL, '公司管理层部门，负责公司整体运营和战略规划', 'active', 1, NOW()),
('客服部', NULL, '客户服务部门，负责处理客户咨询和售后服务', 'active', 2, NOW()),
('技术部', NULL, '技术研发部门，负责系统开发和技术支持', 'active', 3, NOW()),
('质检部', NULL, '质量检查部门，负责客服质量监控和评估', 'active', 4, NOW()),
('运营部', NULL, '运营管理部门，负责业务运营和数据分析', 'active', 5, NOW());

-- 输出确认信息
SELECT '部门数据插入完成' AS 'Status';
SELECT * FROM `departments` ORDER BY `sort_order`;


-- Source: 02_insert_roles.sql
-- ==========================================
-- 角色测试数据插入脚本
-- ==========================================

-- 清理已存在的测试数据
DELETE FROM `roles` WHERE `name` IN ('超级管理员', '部门经理', '客服专员', '质检员', '技术人员');

-- 插入角色数据
INSERT INTO `roles` (`name`, `description`, `level`, `is_system`, `created_at`) VALUES
('超级管理员', '系统最高权限角色，拥有所有功能的访问和管理权限', 100, 1, NOW()),
('部门经理', '部门管理角色，负责部门日常管理和人员调配', 80, 0, NOW()),
('客服专员', '客户服务角色，负责处理客户咨询和问题解决', 50, 0, NOW()),
('质检员', '质量检查角色，负责客服质量评估和监督', 60, 0, NOW()),
('技术人员', '技术支持角色，负责系统维护和技术问题处理', 70, 0, NOW());

-- 输出确认信息
SELECT '角色数据插入完成' AS 'Status';
SELECT * FROM `roles` ORDER BY `level` DESC;


-- Source: 04_insert_positions.sql
-- ==========================================
-- 职位测试数据插入脚本
-- ==========================================

-- 获取部门ID
SET @dept_admin_id = (SELECT id FROM `departments` WHERE `name` = '管理部' LIMIT 1);
SET @dept_service_id = (SELECT id FROM `departments` WHERE `name` = '客服部' LIMIT 1);
SET @dept_tech_id = (SELECT id FROM `departments` WHERE `name` = '技术部' LIMIT 1);
SET @dept_qa_id = (SELECT id FROM `departments` WHERE `name` = '质检部' LIMIT 1);
SET @dept_ops_id = (SELECT id FROM `departments` WHERE `name` = '运营部' LIMIT 1);

-- 清理已存在的测试数据
DELETE FROM `positions` WHERE `department_id` IN (@dept_admin_id, @dept_service_id, @dept_tech_id, @dept_qa_id, @dept_ops_id);

-- 插入职位数据
INSERT INTO `positions` (`name`, `department_id`, `description`, `requirements`, `responsibilities`, `salary_min`, `salary_max`, `level`, `status`, `sort_order`) VALUES
-- 管理部职位
('总经理', @dept_admin_id, '公司最高管理职位', '10年以上管理经验，本科及以上学历', '负责公司整体战略规划和运营管理', 30000.00, 50000.00, 'expert', 'active', 1),
('行政主管', @dept_admin_id, '行政管理职位', '5年以上行政管理经验', '负责公司行政事务管理', 8000.00, 12000.00, 'middle', 'active', 2),

-- 客服部职位
('客服部经理', @dept_service_id, '客服部门管理职位', '5年以上客服管理经验', '负责客服团队管理和业务指导', 12000.00, 18000.00, 'senior', 'active', 1),
('高级客服专员', @dept_service_id, '高级客服职位', '3年以上客服经验，优秀的沟通能力', '处理复杂客户问题，指导初级客服', 6000.00, 9000.00, 'middle', 'active', 2),
('客服专员', @dept_service_id, '基础客服职位', '良好的沟通能力和服务意识', '处理客户咨询和售后服务', 4000.00, 6000.00, 'junior', 'active', 3),

-- 技术部职位
('技术总监', @dept_tech_id, '技术部门最高管理职位', '8年以上技术管理经验', '负责技术团队管理和技术架构设计', 25000.00, 40000.00, 'expert', 'active', 1),
('高级工程师', @dept_tech_id, '高级技术职位', '5年以上开发经验', '负责核心系统开发和技术攻关', 15000.00, 25000.00, 'senior', 'active', 2),
('系统工程师', @dept_tech_id, '中级技术职位', '2年以上开发经验', '负责系统功能开发和维护', 8000.00, 15000.00, 'middle', 'active', 3),

-- 质检部职位
('质检主管', @dept_qa_id, '质检部门管理职位', '3年以上质检经验', '负责质检团队管理和质检标准制定', 10000.00, 15000.00, 'senior', 'active', 1),
('质检专员', @dept_qa_id, '质检职位', '良好的分析能力和责任心', '负责客服质量检查和评估', 5000.00, 8000.00, 'middle', 'active', 2),

-- 运营部职位
('运营经理', @dept_ops_id, '运营部门管理职位', '5年以上运营经验', '负责业务运营和数据分析', 12000.00, 20000.00, 'senior', 'active', 1),
('数据分析师', @dept_ops_id, '数据分析职位', '熟练掌握数据分析工具', '负责业务数据分析和报表制作', 7000.00, 12000.00, 'middle', 'active', 2);

-- 输出确认信息
SELECT '职位数据插入完成' AS 'Status';
SELECT p.name AS position_name, d.name AS department_name, p.level, p.salary_min, p.salary_max
FROM `positions` p
LEFT JOIN `departments` d ON p.department_id = d.id
ORDER BY d.sort_order, p.sort_order;


-- Source: 05_insert_platforms_shops.sql
-- ==========================================
-- 平台和店铺测试数据插入脚本
-- ==========================================

-- 清理已存在的测试数据
DELETE FROM `shops` WHERE `platform_id` IN (SELECT id FROM `platforms` WHERE `name` IN ('京东', '淘宝', '拼多多'));
DELETE FROM `platforms` WHERE `name` IN ('京东', '淘宝', '拼多多');

-- 插入平台数据
INSERT INTO `platforms` (`name`, `created_at`) VALUES
('京东', NOW()),
('淘宝', NOW()),
('拼多多', NOW());

-- 获取平台ID
SET @platform_jd_id = (SELECT id FROM `platforms` WHERE `name` = '京东' LIMIT 1);
SET @platform_tb_id = (SELECT id FROM `platforms` WHERE `name` = '淘宝' LIMIT 1);
SET @platform_pdd_id = (SELECT id FROM `platforms` WHERE `name` = '拼多多' LIMIT 1);

-- 插入店铺数据
INSERT INTO `shops` (`name`, `platform_id`, `created_at`) VALUES
-- 京东店铺
('京东旗舰店', @platform_jd_id, NOW()),
('京东专营店', @platform_jd_id, NOW()),
('京东自营店', @platform_jd_id, NOW()),

-- 淘宝店铺
('淘宝旗舰店', @platform_tb_id, NOW()),
('淘宝专营店', @platform_tb_id, NOW()),

-- 拼多多店铺
('拼多多旗舰店', @platform_pdd_id, NOW()),
('拼多多专营店', @platform_pdd_id, NOW());

-- 输出确认信息
SELECT '平台和店铺数据插入完成' AS 'Status';
SELECT p.name AS platform_name, s.name AS shop_name
FROM `shops` s
LEFT JOIN `platforms` p ON s.platform_id = p.id
ORDER BY p.id, s.id;


-- Source: 05_insert_users.sql
-- ==========================================
-- 用户测试数据插入脚本
-- ==========================================

SET FOREIGN_KEY_CHECKS = 0;

-- 清理已存在的测试数据
DELETE FROM `user_roles` WHERE `user_id` IN (SELECT id FROM `users` WHERE `username` IN ('admin', 'manager1', 'service1', 'service2', 'service3', 'qa1', 'qa2', 'tech1'));
DELETE FROM `employees` WHERE `user_id` IN (SELECT id FROM `users` WHERE `username` IN ('admin', 'manager1', 'service1', 'service2', 'service3', 'qa1', 'qa2', 'tech1'));
DELETE FROM `users` WHERE `username` IN ('admin', 'manager1', 'service1', 'service2', 'service3', 'qa1', 'qa2', 'tech1');

-- 插入用户数据
-- 密码都是: 123456
INSERT INTO `users` (`username`, `password_hash`, `real_name`, `email`, `phone`, `department_id`, `status`, `created_at`) VALUES
('admin', '$2b$10$Gg7I/ImQq/BdLJpaHHVTC.ASi5QcoQg9JymoZJqfaT/O2O.Jz1tQG', '系统管理员', 'admin@leixi.com', '13800000000', (SELECT id FROM departments WHERE name='管理部' LIMIT 1), 'active', NOW()),
('manager1', '$2b$10$Gg7I/ImQq/BdLJpaHHVTC.ASi5QcoQg9JymoZJqfaT/O2O.Jz1tQG', '张经理', 'manager1@leixi.com', '13800000001', (SELECT id FROM departments WHERE name='客服部' LIMIT 1), 'active', NOW()),
('service1', '$2b$10$Gg7I/ImQq/BdLJpaHHVTC.ASi5QcoQg9JymoZJqfaT/O2O.Jz1tQG', '李客服', 'service1@leixi.com', '13800000002', (SELECT id FROM departments WHERE name='客服部' LIMIT 1), 'active', NOW()),
('service2', '$2b$10$Gg7I/ImQq/BdLJpaHHVTC.ASi5QcoQg9JymoZJqfaT/O2O.Jz1tQG', '王客服', 'service2@leixi.com', '13800000003', (SELECT id FROM departments WHERE name='客服部' LIMIT 1), 'active', NOW()),
('service3', '$2b$10$Gg7I/ImQq/BdLJpaHHVTC.ASi5QcoQg9JymoZJqfaT/O2O.Jz1tQG', '赵客服', 'service3@leixi.com', '13800000004', (SELECT id FROM departments WHERE name='客服部' LIMIT 1), 'active', NOW()),
('qa1', '$2b$10$Gg7I/ImQq/BdLJpaHHVTC.ASi5QcoQg9JymoZJqfaT/O2O.Jz1tQG', '刘质检', 'qa1@leixi.com', '13800000005', (SELECT id FROM departments WHERE name='质检部' LIMIT 1), 'active', NOW()),
('qa2', '$2b$10$Gg7I/ImQq/BdLJpaHHVTC.ASi5QcoQg9JymoZJqfaT/O2O.Jz1tQG', '陈质检', 'qa2@leixi.com', '13800000006', (SELECT id FROM departments WHERE name='质检部' LIMIT 1), 'active', NOW()),
('tech1', '$2b$10$Gg7I/ImQq/BdLJpaHHVTC.ASi5QcoQg9JymoZJqfaT/O2O.Jz1tQG', '周工程师', 'tech1@leixi.com', '13800000007', (SELECT id FROM departments WHERE name='技术部' LIMIT 1), 'active', NOW());

-- 插入角色关联
INSERT INTO `user_roles` (`user_id`, `role_id`, `assigned_at`)
SELECT u.id, r.id, NOW() FROM users u, roles r WHERE u.username='admin' AND r.name='超级管理员';
INSERT INTO `user_roles` (`user_id`, `role_id`, `assigned_at`)
SELECT u.id, r.id, NOW() FROM users u, roles r WHERE u.username='manager1' AND r.name='部门经理';
INSERT INTO `user_roles` (`user_id`, `role_id`, `assigned_at`)
SELECT u.id, r.id, NOW() FROM users u, roles r WHERE u.username LIKE 'service%' AND r.name='客服专员';
INSERT INTO `user_roles` (`user_id`, `role_id`, `assigned_at`)
SELECT u.id, r.id, NOW() FROM users u, roles r WHERE u.username LIKE 'qa%' AND r.name='质检员';
INSERT INTO `user_roles` (`user_id`, `role_id`, `assigned_at`)
SELECT u.id, r.id, NOW() FROM users u, roles r WHERE u.username='tech1' AND r.name='技术人员';

-- 插入员工信息 (使用 position_id)
INSERT INTO `employees` (`user_id`, `employee_no`, `position_id`, `hire_date`, `status`, `created_at`)
SELECT id, 'EMP001', (SELECT id FROM positions WHERE name='总经理' LIMIT 1), '2024-01-01', 'active', NOW() FROM users WHERE username='admin';

INSERT INTO `employees` (`user_id`, `employee_no`, `position_id`, `hire_date`, `status`, `created_at`)
SELECT id, 'EMP002', (SELECT id FROM positions WHERE name='客服部经理' LIMIT 1), '2024-01-15', 'active', NOW() FROM users WHERE username='manager1';

INSERT INTO `employees` (`user_id`, `employee_no`, `position_id`, `hire_date`, `status`, `created_at`)
SELECT id, 'EMP003', (SELECT id FROM positions WHERE name='高级客服专员' LIMIT 1), '2024-02-01', 'active', NOW() FROM users WHERE username='service1';

INSERT INTO `employees` (`user_id`, `employee_no`, `position_id`, `hire_date`, `status`, `created_at`)
SELECT id, 'EMP004', (SELECT id FROM positions WHERE name='客服专员' LIMIT 1), '2024-03-01', 'active', NOW() FROM users WHERE username='service2';

INSERT INTO `employees` (`user_id`, `employee_no`, `position_id`, `hire_date`, `status`, `created_at`)
SELECT id, 'EMP005', (SELECT id FROM positions WHERE name='客服专员' LIMIT 1), '2024-03-15', 'active', NOW() FROM users WHERE username='service3';

INSERT INTO `employees` (`user_id`, `employee_no`, `position_id`, `hire_date`, `status`, `created_at`)
SELECT id, 'EMP006', (SELECT id FROM positions WHERE name='质检专员' LIMIT 1), '2024-02-15', 'active', NOW() FROM users WHERE username='qa1';

INSERT INTO `employees` (`user_id`, `employee_no`, `position_id`, `hire_date`, `status`, `created_at`)
SELECT id, 'EMP007', (SELECT id FROM positions WHERE name='质检专员' LIMIT 1), '2024-04-01', 'active', NOW() FROM users WHERE username='qa2';

INSERT INTO `employees` (`user_id`, `employee_no`, `position_id`, `hire_date`, `status`, `created_at`)
SELECT id, 'EMP008', (SELECT id FROM positions WHERE name='系统工程师' LIMIT 1), '2024-01-20', 'active', NOW() FROM users WHERE username='tech1';

SET FOREIGN_KEY_CHECKS = 1;

-- 输出确认信息
SELECT '用户及员工数据插入完成' AS 'Status';

-- Source: 06_insert_tag_categories.sql
-- ==========================================
-- 质检标签分类测试数据插入脚本
-- ==========================================

-- 清理已存在的测试数据
DELETE FROM `tag_categories` WHERE `name` IN ('服务质量', '沟通技巧', '问题类型', '客户满意度', '专业能力');

-- 插入标签分类数据（一级分类）
INSERT INTO `tag_categories` (`parent_id`, `level`, `path`, `name`, `description`, `color`, `sort_order`, `is_active`) VALUES
(NULL, 0, '1', '服务质量', '评估客服的服务质量相关标签', '#FF6B6B', 1, 1),
(NULL, 0, '2', '沟通技巧', '评估客服的沟通能力相关标签', '#4ECDC4', 2, 1),
(NULL, 0, '3', '问题类型', '客户问题分类相关标签', '#45B7D1', 3, 1),
(NULL, 0, '4', '客户满意度', '客户满意度评价相关标签', '#96CEB4', 4, 1),
(NULL, 0, '5', '专业能力', '客服专业能力评估相关标签', '#FFEAA7', 5, 1);

-- 获取一级分类ID
SET @cat_service_id = (SELECT id FROM `tag_categories` WHERE `name` = '服务质量' LIMIT 1);
SET @cat_comm_id = (SELECT id FROM `tag_categories` WHERE `name` = '沟通技巧' LIMIT 1);
SET @cat_problem_id = (SELECT id FROM `tag_categories` WHERE `name` = '问题类型' LIMIT 1);
SET @cat_satisfaction_id = (SELECT id FROM `tag_categories` WHERE `name` = '客户满意度' LIMIT 1);
SET @cat_skill_id = (SELECT id FROM `tag_categories` WHERE `name` = '专业能力' LIMIT 1);

-- 插入二级分类
INSERT INTO `tag_categories` (`parent_id`, `level`, `path`, `name`, `description`, `color`, `sort_order`, `is_active`) VALUES
-- 服务质量子分类
(@cat_service_id, 1, CONCAT('1/', @cat_service_id + 1), '服务态度', '客服服务态度评估', '#FF6B6B', 1, 1),
(@cat_service_id, 1, CONCAT('1/', @cat_service_id + 2), '响应速度', '客服响应速度评估', '#FF8787', 2, 1),
(@cat_service_id, 1, CONCAT('1/', @cat_service_id + 3), '服务规范', '服务流程规范性评估', '#FFA3A3', 3, 1),

-- 沟通技巧子分类
(@cat_comm_id, 1, CONCAT('2/', @cat_comm_id + 1), '表达能力', '语言表达清晰度评估', '#4ECDC4', 1, 1),
(@cat_comm_id, 1, CONCAT('2/', @cat_comm_id + 2), '倾听能力', '理解客户需求能力评估', '#6FD9D1', 2, 1),

-- 问题类型子分类
(@cat_problem_id, 1, CONCAT('3/', @cat_problem_id + 1), '产品咨询', '产品相关问题', '#45B7D1', 1, 1),
(@cat_problem_id, 1, CONCAT('3/', @cat_problem_id + 2), '售后服务', '售后相关问题', '#67C5DE', 2, 1),
(@cat_problem_id, 1, CONCAT('3/', @cat_problem_id + 3), '投诉建议', '客户投诉和建议', '#89D3EB', 3, 1);

-- 输出确认信息
SELECT '标签分类数据插入完成' AS 'Status';
SELECT
  CASE
    WHEN level = 0 THEN name
    ELSE CONCAT('  └─ ', name)
  END AS category_tree,
  color,
  description
FROM `tag_categories`
ORDER BY path;


-- Source: 07_insert_tags.sql
-- ==========================================
-- 质检标签测试数据插入脚本
-- ==========================================

-- 获取分类ID
SET @cat_service_id = (SELECT id FROM `tag_categories` WHERE `name` = '服务质量' AND level = 0 LIMIT 1);
SET @cat_comm_id = (SELECT id FROM `tag_categories` WHERE `name` = '沟通技巧' AND level = 0 LIMIT 1);
SET @cat_problem_id = (SELECT id FROM `tag_categories` WHERE `name` = '问题类型' AND level = 0 LIMIT 1);
SET @cat_satisfaction_id = (SELECT id FROM `tag_categories` WHERE `name` = '客户满意度' AND level = 0 LIMIT 1);
SET @cat_skill_id = (SELECT id FROM `tag_categories` WHERE `name` = '专业能力' AND level = 0 LIMIT 1);

-- 清理已存在的测试数据
DELETE FROM `tags` WHERE `category_id` IN (@cat_service_id, @cat_comm_id, @cat_problem_id, @cat_satisfaction_id, @cat_skill_id);

-- 插入质检类型标签
INSERT INTO `tags` (`parent_id`, `level`, `path`, `name`, `tag_type`, `category_id`, `color`, `description`, `is_active`) VALUES
-- 服务质量标签
(NULL, 0, '1', '态度热情', 'quality', @cat_service_id, '#FF6B6B', '客服态度热情友好', 1),
(NULL, 0, '2', '态度冷淡', 'quality', @cat_service_id, '#FF4757', '客服态度冷淡', 1),
(NULL, 0, '3', '响应及时', 'quality', @cat_service_id, '#5F27CD', '客服响应速度快', 1),
(NULL, 0, '4', '响应缓慢', 'quality', @cat_service_id, '#341F97', '客服响应速度慢', 1),
(NULL, 0, '5', '流程规范', 'quality', @cat_service_id, '#00D2D3', '服务流程规范', 1),

-- 沟通技巧标签
(NULL, 0, '6', '表达清晰', 'quality', @cat_comm_id, '#4ECDC4', '语言表达清晰明了', 1),
(NULL, 0, '7', '表达模糊', 'quality', @cat_comm_id, '#1ABC9C', '语言表达不够清晰', 1),
(NULL, 0, '8', '善于倾听', 'quality', @cat_comm_id, '#48C9B0', '能够理解客户需求', 1),
(NULL, 0, '9', '沟通顺畅', 'quality', @cat_comm_id, '#16A085', '沟通过程顺畅', 1),

-- 问题类型标签
(NULL, 0, '10', '产品咨询', 'quality', @cat_problem_id, '#45B7D1', '客户咨询产品信息', 1),
(NULL, 0, '11', '订单查询', 'quality', @cat_problem_id, '#3498DB', '客户查询订单状态', 1),
(NULL, 0, '12', '退换货', 'quality', @cat_problem_id, '#2980B9', '客户申请退换货', 1),
(NULL, 0, '13', '投诉', 'quality', @cat_problem_id, '#E74C3C', '客户投诉问题', 1),
(NULL, 0, '14', '建议', 'quality', @cat_problem_id, '#C0392B', '客户提出建议', 1),

-- 客户满意度标签
(NULL, 0, '15', '非常满意', 'quality', @cat_satisfaction_id, '#96CEB4', '客户非常满意', 1),
(NULL, 0, '16', '满意', 'quality', @cat_satisfaction_id, '#88D8B0', '客户满意', 1),
(NULL, 0, '17', '一般', 'quality', @cat_satisfaction_id, '#FFEAA7', '客户感觉一般', 1),
(NULL, 0, '18', '不满意', 'quality', @cat_satisfaction_id, '#FDCB6E', '客户不满意', 1),

-- 专业能力标签
(NULL, 0, '19', '专业知识扎实', 'quality', @cat_skill_id, '#FFEAA7', '客服专业知识扎实', 1),
(NULL, 0, '20', '问题解决能力强', 'quality', @cat_skill_id, '#FDD835', '能快速解决问题', 1),
(NULL, 0, '21', '需要培训', 'quality', @cat_skill_id, '#F9CA24', '专业能力需要提升', 1);

-- 输出确认信息
SELECT '标签数据插入完成' AS 'Status';
SELECT t.name AS tag_name, t.tag_type, c.name AS category_name, t.color, t.description
FROM `tags` t
LEFT JOIN `tag_categories` c ON t.category_id = c.id
ORDER BY t.category_id, t.id;


-- Source: 08_insert_quality_sessions.sql
-- ==========================================
-- 质检会话测试数据插入脚本
-- ==========================================

-- 获取相关ID
SET @platform_jd_id = (SELECT id FROM `platforms` WHERE `name` = '京东' LIMIT 1);
SET @platform_tb_id = (SELECT id FROM `platforms` WHERE `name` = '淘宝' LIMIT 1);
SET @shop_jd1_id = (SELECT id FROM `shops` WHERE `name` = '京东旗舰店' LIMIT 1);
SET @shop_jd2_id = (SELECT id FROM `shops` WHERE `name` = '京东专营店' LIMIT 1);
SET @shop_tb1_id = (SELECT id FROM `shops` WHERE `name` = '淘宝旗舰店' LIMIT 1);

SET @agent1_id = (SELECT id FROM `users` WHERE `username` = 'service1' LIMIT 1);
SET @agent2_id = (SELECT id FROM `users` WHERE `username` = 'service2' LIMIT 1);
SET @agent3_id = (SELECT id FROM `users` WHERE `username` = 'service3' LIMIT 1);
SET @qa1_id = (SELECT id FROM `users` WHERE `username` = 'qa1' LIMIT 1);

-- 清理已存在的测试数据
DELETE FROM `quality_sessions` WHERE `session_no` LIKE 'QS2025%';

-- 插入质检规则（如果不存在）
INSERT INTO `quality_rules` (`name`, `category`, `description`, `criteria`, `score_weight`, `is_active`)
SELECT '服务态度', '服务质量', '评估客服人员的服务态度', '{"excellent": "态度热情，耐心细致", "good": "态度良好，较为耐心", "average": "态度一般，有待改进", "poor": "态度恶劣，需要培训"}', 30.00, 1
WHERE NOT EXISTS (SELECT 1 FROM `quality_rules` WHERE `name` = '服务态度');

INSERT INTO `quality_rules` (`name`, `category`, `description`, `criteria`, `score_weight`, `is_active`)
SELECT '问题解决能力', '专业技能', '评估客服人员解决问题的能力', '{"excellent": "快速准确解决问题", "good": "能够解决问题", "average": "解决问题较慢", "poor": "无法解决问题"}', 40.00, 1
WHERE NOT EXISTS (SELECT 1 FROM `quality_rules` WHERE `name` = '问题解决能力');

INSERT INTO `quality_rules` (`name`, `category`, `description`, `criteria`, `score_weight`, `is_active`)
SELECT '沟通技巧', '沟通能力', '评估客服人员的沟通表达能力', '{"excellent": "表达清晰，逻辑性强", "good": "表达清楚，易于理解", "average": "表达一般，偶有不清", "poor": "表达混乱，难以理解"}', 30.00, 1
WHERE NOT EXISTS (SELECT 1 FROM `quality_rules` WHERE `name` = '沟通技巧');

-- 获取规则ID
SET @rule1_id = (SELECT id FROM `quality_rules` WHERE `name` = '服务态度' LIMIT 1);
SET @rule2_id = (SELECT id FROM `quality_rules` WHERE `name` = '问题解决能力' LIMIT 1);
SET @rule3_id = (SELECT id FROM `quality_rules` WHERE `name` = '沟通技巧' LIMIT 1);

-- 插入质检会话数据
INSERT INTO `quality_sessions`
(`session_no`, `agent_id`, `customer_id`, `customer_name`, `channel`, `start_time`, `end_time`, `duration`, `message_count`, `status`, `inspector_id`, `score`, `grade`, `comment`, `reviewed_at`, `platform_id`, `shop_id`)
VALUES
-- 已完成的质检会话
('QS20251130001', @agent1_id, 'CUST001', '张三', 'chat', '2025-11-30 10:00:00', '2025-11-30 10:15:00', 900, 10, 'completed', @qa1_id, 93.00, 'S', '服务态度优秀，问题解决及时', NOW(), @platform_jd_id, @shop_jd1_id),
('QS20251130002', @agent1_id, 'CUST002', '李四', 'phone', '2025-11-30 11:00:00', '2025-11-30 11:20:00', 1200, 15, 'completed', @qa1_id, 84.00, 'B', '服务良好，沟通顺畅', NOW(), @platform_jd_id, @shop_jd2_id),
('QS20251130003', @agent2_id, 'CUST003', '王五', 'chat', '2025-11-30 14:00:00', '2025-11-30 14:10:00', 600, 8, 'completed', @qa1_id, 100.00, 'S', '完美的服务体验', NOW(), @platform_jd_id, @shop_jd1_id),
('QS20251130004', @agent2_id, 'CUST004', '赵六', 'email', '2025-11-30 15:00:00', '2025-11-30 15:30:00', 1800, 6, 'completed', @qa1_id, 78.00, 'C', '邮件回复及时，内容详细', NOW(), @platform_tb_id, @shop_tb1_id),
('QS20251130005', @agent3_id, 'CUST005', '孙七', 'chat', '2025-11-30 16:00:00', '2025-11-30 16:25:00', 1500, 12, 'completed', @qa1_id, 89.00, 'A', '服务专业，态度友好', NOW(), @platform_jd_id, @shop_jd2_id),

-- 待质检的会话
('QS20251201001', @agent1_id, 'CUST006', '周八', 'phone', '2025-12-01 09:30:00', '2025-12-01 10:00:00', 1800, 20, 'pending', NULL, NULL, NULL, NULL, NULL, @platform_jd_id, @shop_jd1_id),
('QS20251201002', @agent3_id, 'CUST007', '吴九', 'chat', '2025-12-01 11:00:00', '2025-12-01 11:15:00', 900, 9, 'pending', NULL, NULL, NULL, NULL, NULL, @platform_tb_id, @shop_tb1_id),

-- 质检中的会话
('QS20251201003', @agent2_id, 'CUST008', '郑十', 'video', '2025-12-01 13:00:00', '2025-12-01 13:45:00', 2700, 18, 'in_review', @qa1_id, NULL, NULL, NULL, NULL, @platform_jd_id, @shop_jd1_id),
('QS20251201004', @agent1_id, 'CUST009', '钱十一', 'chat', '2025-12-01 15:00:00', '2025-12-01 15:20:00', 1200, 11, 'in_review', @qa1_id, NULL, NULL, NULL, NULL, @platform_jd_id, @shop_jd2_id),
('QS20251201005', @agent3_id, 'CUST010', '陈十二', 'phone', '2025-12-01 16:30:00', '2025-12-01 17:00:00', 1800, 16, 'in_review', @qa1_id, NULL, NULL, NULL, NULL, @platform_tb_id, @shop_tb1_id);

-- 获取已完成会话的ID
SET @session1_id = (SELECT id FROM `quality_sessions` WHERE `session_no` = 'QS20251130001' LIMIT 1);
SET @session2_id = (SELECT id FROM `quality_sessions` WHERE `session_no` = 'QS20251130002' LIMIT 1);
SET @session3_id = (SELECT id FROM `quality_sessions` WHERE `session_no` = 'QS20251130003' LIMIT 1);
SET @session4_id = (SELECT id FROM `quality_sessions` WHERE `session_no` = 'QS20251130004' LIMIT 1);
SET @session5_id = (SELECT id FROM `quality_sessions` WHERE `session_no` = 'QS20251130005' LIMIT 1);

-- 插入质检评分数据
-- 会话1的评分
INSERT INTO `quality_scores` (`session_id`, `rule_id`, `score`, `max_score`, `comment`) VALUES
(@session1_id, @rule1_id, 28.00, 30.00, '服务态度良好，耐心回答客户问题'),
(@session1_id, @rule2_id, 38.00, 40.00, '问题解决能力较强，能快速定位问题'),
(@session1_id, @rule3_id, 27.00, 30.00, '沟通表达清晰，逻辑性较好');

-- 会话2的评分
INSERT INTO `quality_scores` (`session_id`, `rule_id`, `score`, `max_score`, `comment`) VALUES
(@session2_id, @rule1_id, 25.00, 30.00, '服务态度较好，但稍显急躁'),
(@session2_id, @rule2_id, 35.00, 40.00, '问题解决能力良好'),
(@session2_id, @rule3_id, 24.00, 30.00, '沟通表达基本清楚');

-- 会话3的评分
INSERT INTO `quality_scores` (`session_id`, `rule_id`, `score`, `max_score`, `comment`) VALUES
(@session3_id, @rule1_id, 30.00, 30.00, '服务态度热情，非常耐心'),
(@session3_id, @rule2_id, 40.00, 40.00, '问题解决能力优秀，快速准确'),
(@session3_id, @rule3_id, 30.00, 30.00, '沟通表达非常清晰');

-- 会话4的评分
INSERT INTO `quality_scores` (`session_id`, `rule_id`, `score`, `max_score`, `comment`) VALUES
(@session4_id, @rule1_id, 24.00, 30.00, '邮件回复态度良好'),
(@session4_id, @rule2_id, 32.00, 40.00, '问题解答详细'),
(@session4_id, @rule3_id, 22.00, 30.00, '文字表达清晰');

-- 会话5的评分
INSERT INTO `quality_scores` (`session_id`, `rule_id`, `score`, `max_score`, `comment`) VALUES
(@session5_id, @rule1_id, 27.00, 30.00, '服务态度友好'),
(@session5_id, @rule2_id, 36.00, 40.00, '专业能力强'),
(@session5_id, @rule3_id, 26.00, 30.00, '沟通顺畅');

-- 输出确认信息
SELECT '质检会话数据插入完成' AS 'Status';
SELECT
  qs.session_no,
  u.real_name AS agent_name,
  qs.customer_name,
  qs.channel,
  qs.status,
  qs.score,
  qs.grade,
  p.name AS platform,
  s.name AS shop
FROM `quality_sessions` qs
LEFT JOIN `users` u ON qs.agent_id = u.id
LEFT JOIN `platforms` p ON qs.platform_id = p.id
LEFT JOIN `shops` s ON qs.shop_id = s.id
WHERE qs.session_no LIKE 'QS2025%'
ORDER BY qs.session_no;


-- Source: 09_insert_session_messages.sql
-- ==========================================
-- 质检聊天消息测试数据插入脚本
-- ==========================================

-- 获取会话ID
SET @session1_id = (SELECT id FROM `quality_sessions` WHERE `session_no` = 'QS20251130001' LIMIT 1);
SET @session2_id = (SELECT id FROM `quality_sessions` WHERE `session_no` = 'QS20251130002' LIMIT 1);
SET @session3_id = (SELECT id FROM `quality_sessions` WHERE `session_no` = 'QS20251130003' LIMIT 1);
SET @session4_id = (SELECT id FROM `quality_sessions` WHERE `session_no` = 'QS20251130004' LIMIT 1);
SET @session5_id = (SELECT id FROM `quality_sessions` WHERE `session_no` = 'QS20251130005' LIMIT 1);

-- 获取客服ID
SET @agent1_id = (SELECT id FROM `users` WHERE `username` = 'service1' LIMIT 1);
SET @agent2_id = (SELECT id FROM `users` WHERE `username` = 'service2' LIMIT 1);
SET @agent3_id = (SELECT id FROM `users` WHERE `username` = 'service3' LIMIT 1);

-- 清理已存在的测试数据
DELETE FROM `session_messages` WHERE `session_id` IN (@session1_id, @session2_id, @session3_id, @session4_id, @session5_id);

-- 为会话1插入聊天消息（订单查询场景）
INSERT INTO `session_messages` (`session_id`, `sender_type`, `sender_id`, `content`, `content_type`, `timestamp`) VALUES
(@session1_id, 'customer', 'CUST001', '你好，我想咨询一下订单问题', 'text', '2025-11-30 10:00:00'),
(@session1_id, 'agent', @agent1_id, '您好！很高兴为您服务，请问有什么可以帮助您的？', 'text', '2025-11-30 10:00:15'),
(@session1_id, 'customer', 'CUST001', '我的订单已经3天了还没发货', 'text', '2025-11-30 10:00:45'),
(@session1_id, 'agent', @agent1_id, '非常抱歉给您带来不便，请提供一下您的订单号，我帮您查询一下', 'text', '2025-11-30 10:01:00'),
(@session1_id, 'customer', 'CUST001', 'JD2025113000001', 'text', '2025-11-30 10:01:20'),
(@session1_id, 'agent', @agent1_id, '好的，请稍等，我帮您查询...', 'text', '2025-11-30 10:01:30'),
(@session1_id, 'agent', @agent1_id, '您好，我已经帮您查询到了，您的订单因为仓库备货延迟，预计明天就会发货', 'text', '2025-11-30 10:02:00'),
(@session1_id, 'customer', 'CUST001', '好的，谢谢', 'text', '2025-11-30 10:02:15'),
(@session1_id, 'agent', @agent1_id, '不客气，还有其他问题吗？', 'text', '2025-11-30 10:02:30'),
(@session1_id, 'customer', 'CUST001', '没有了', 'text', '2025-11-30 10:02:45');

-- 为会话2插入聊天消息（退货场景）
INSERT INTO `session_messages` (`session_id`, `sender_type`, `sender_id`, `content`, `content_type`, `timestamp`) VALUES
(@session2_id, 'customer', 'CUST002', '我要退货', 'text', '2025-11-30 11:00:00'),
(@session2_id, 'agent', @agent1_id, '您好，请问是什么原因需要退货呢？', 'text', '2025-11-30 11:00:20'),
(@session2_id, 'customer', 'CUST002', '商品质量有问题', 'text', '2025-11-30 11:00:40'),
(@session2_id, 'agent', @agent1_id, '非常抱歉，能详细说明一下是什么质量问题吗？', 'text', '2025-11-30 11:01:00'),
(@session2_id, 'customer', 'CUST002', '包装破损，商品有划痕', 'text', '2025-11-30 11:01:30'),
(@session2_id, 'agent', @agent1_id, '真的很抱歉给您带来这样的体验，我们会为您处理退货', 'text', '2025-11-30 11:02:00'),
(@session2_id, 'customer', 'CUST002', '什么时候能退款？', 'text', '2025-11-30 11:02:30'),
(@session2_id, 'agent', @agent1_id, '您申请退货后，我们会安排上门取件，收到货后3-5个工作日退款', 'text', '2025-11-30 11:03:00'),
(@session2_id, 'customer', 'CUST002', '好的', 'text', '2025-11-30 11:03:20'),
(@session2_id, 'agent', @agent1_id, '感谢您的理解，如有其他问题随时联系我们', 'text', '2025-11-30 11:03:40'),
(@session2_id, 'customer', 'CUST002', '嗯', 'text', '2025-11-30 11:04:00'),
(@session2_id, 'agent', @agent1_id, '祝您生活愉快！', 'text', '2025-11-30 11:04:15'),
(@session2_id, 'customer', 'CUST002', '再见', 'text', '2025-11-30 11:04:30'),
(@session2_id, 'agent', @agent1_id, '再见！', 'text', '2025-11-30 11:04:45'),
(@session2_id, 'system', 'SYSTEM', '会话已结束', 'text', '2025-11-30 11:05:00');

-- 为会话3插入聊天消息（优惠活动咨询场景）
INSERT INTO `session_messages` (`session_id`, `sender_type`, `sender_id`, `content`, `content_type`, `timestamp`) VALUES
(@session3_id, 'customer', 'CUST003', '请问这款产品有什么优惠活动吗？', 'text', '2025-11-30 14:00:00'),
(@session3_id, 'agent', @agent2_id, '您好！目前这款产品正在参加满减活动，满300减50', 'text', '2025-11-30 14:00:15'),
(@session3_id, 'customer', 'CUST003', '可以叠加优惠券吗？', 'text', '2025-11-30 14:00:35'),
(@session3_id, 'agent', @agent2_id, '可以的，优惠券和满减活动可以叠加使用', 'text', '2025-11-30 14:00:50'),
(@session3_id, 'customer', 'CUST003', '太好了，那我现在下单', 'text', '2025-11-30 14:01:10'),
(@session3_id, 'agent', @agent2_id, '好的，祝您购物愉快！如有任何问题随时联系我们', 'text', '2025-11-30 14:01:25'),
(@session3_id, 'customer', 'CUST003', '谢谢', 'text', '2025-11-30 14:01:40'),
(@session3_id, 'agent', @agent2_id, '不客气！', 'text', '2025-11-30 14:01:50');

-- 为会话4插入聊天消息（邮件咨询场景）
INSERT INTO `session_messages` (`session_id`, `sender_type`, `sender_id`, `content`, `content_type`, `timestamp`) VALUES
(@session4_id, 'customer', 'CUST004', '您好，我想了解一下贵公司的售后服务政策', 'text', '2025-11-30 15:00:00'),
(@session4_id, 'agent', @agent2_id, '您好！感谢您的咨询。我们的售后服务政策如下：\n1. 7天无理由退换货\n2. 15天质量问题免费换货\n3. 1年保修服务\n4. 终身技术支持', 'text', '2025-11-30 15:05:00'),
(@session4_id, 'customer', 'CUST004', '如果超过7天发现质量问题怎么办？', 'text', '2025-11-30 15:10:00'),
(@session4_id, 'agent', @agent2_id, '如果在15天内发现质量问题，我们提供免费换货服务。超过15天但在1年保修期内，我们会提供免费维修服务。', 'text', '2025-11-30 15:15:00'),
(@session4_id, 'customer', 'CUST004', '明白了，谢谢您的详细解答', 'text', '2025-11-30 15:20:00'),
(@session4_id, 'agent', @agent2_id, '不客气！如有其他问题，欢迎随时联系我们。祝您生活愉快！', 'text', '2025-11-30 15:25:00');

-- 为会话5插入聊天消息（产品使用咨询场景）
INSERT INTO `session_messages` (`session_id`, `sender_type`, `sender_id`, `content`, `content_type`, `timestamp`) VALUES
(@session5_id, 'customer', 'CUST005', '这个产品怎么使用？', 'text', '2025-11-30 16:00:00'),
(@session5_id, 'agent', @agent3_id, '您好！请问您具体想了解哪方面的使用方法？', 'text', '2025-11-30 16:00:20'),
(@session5_id, 'customer', 'CUST005', '如何开机', 'text', '2025-11-30 16:00:40'),
(@session5_id, 'agent', @agent3_id, '长按电源键3秒即可开机，首次使用需要充电2小时', 'text', '2025-11-30 16:01:00'),
(@session5_id, 'customer', 'CUST005', '充电用什么充电器？', 'text', '2025-11-30 16:01:30'),
(@session5_id, 'agent', @agent3_id, '包装盒内有配套的充电器，使用Type-C接口', 'text', '2025-11-30 16:02:00'),
(@session5_id, 'customer', 'CUST005', '可以用其他充电器吗？', 'text', '2025-11-30 16:02:30'),
(@session5_id, 'agent', @agent3_id, '可以的，只要是5V/2A的Type-C充电器都可以使用', 'text', '2025-11-30 16:03:00'),
(@session5_id, 'customer', 'CUST005', '明白了，谢谢', 'text', '2025-11-30 16:03:20'),
(@session5_id, 'agent', @agent3_id, '不客气，如有其他问题随时联系我们。祝您使用愉快！', 'text', '2025-11-30 16:03:40'),
(@session5_id, 'customer', 'CUST005', '好的', 'text', '2025-11-30 16:04:00'),
(@session5_id, 'system', 'SYSTEM', '会话已结束', 'text', '2025-11-30 16:04:15');

-- 输出确认信息
SELECT '聊天消息数据插入完成' AS 'Status';
SELECT
  qs.session_no,
  COUNT(sm.id) AS message_count,
  MIN(sm.timestamp) AS first_message,
  MAX(sm.timestamp) AS last_message
FROM `quality_sessions` qs
LEFT JOIN `session_messages` sm ON qs.id = sm.session_id
WHERE qs.session_no LIKE 'QS2025%'
GROUP BY qs.session_no
ORDER BY qs.session_no;


-- Source: 10_insert_quality_rules.sql
-- 插入质检规则测试数据
-- 这个脚本会插入默认的质检规则


-- 获取一个有效的用户ID
SET @admin_user_id = (SELECT id FROM users WHERE username = 'admin' LIMIT 1);

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
 30, 1, @admin_user_id, NOW(), NOW()),

(2, '专业能力', 'professional', '评估客服人员的专业知识和问题解决能力',
 JSON_OBJECT(
   'positive', JSON_ARRAY('准确解答', '专业术语', '快速定位问题'),
   'negative', JSON_ARRAY('答非所问', '知识欠缺', '无法解决问题')
 ),
 40, 1, @admin_user_id, NOW(), NOW()),

(3, '沟通技巧', 'communication', '评估客服人员的沟通表达能力',
 JSON_OBJECT(
   'positive', JSON_ARRAY('表达清晰', '逻辑清楚', '善于引导'),
   'negative', JSON_ARRAY('表达混乱', '词不达意', '理解偏差')
 ),
 30, 1, @admin_user_id, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  description = VALUES(description),
  criteria = VALUES(criteria),
  score_weight = VALUES(score_weight),
  is_active = VALUES(is_active),
  created_by = VALUES(created_by),
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


-- Source: 10_insert_quality_tags.sql
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


-- Source: 11_insert_quality_cases.sql
-- 插入质检案例测试数据

-- 清理旧数据
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE quality_case_likes;
TRUNCATE TABLE quality_case_favorites;
TRUNCATE TABLE quality_cases;
SET FOREIGN_KEY_CHECKS = 1; 

-- 获取相关ID
SET @session1_id = (SELECT id FROM `quality_sessions` WHERE `session_no` = 'QS20251130001' LIMIT 1);
SET @user_manager1_id = (SELECT id FROM `users` WHERE `username` = 'manager1' LIMIT 1);
SET @user_service1_id = (SELECT id FROM `users` WHERE `username` = 'service1' LIMIT 1);
SET @user_service2_id = (SELECT id FROM `users` WHERE `username` = 'service2' LIMIT 1);
SET @user_service3_id = (SELECT id FROM `users` WHERE `username` = 'service3' LIMIT 1);

-- 插入案例数据
INSERT INTO quality_cases (session_id, title, description, category, difficulty, problem, solution, view_count, like_count, collect_count, status, created_by, created_at, case_type, priority)
VALUES
(@session1_id, '如何优雅地处理客户投诉', '这是一个关于处理客户情绪激动的投诉案例，展示了共情和解决方案的重要性。', '投诉处理', 'medium', '客户因物流延误非常生气，要求立刻退款并赔偿。', CONCAT('1. 首先安抚客户情绪，表示理解；', CHAR(10), '2. 查询物流状态，发现是天气原因导致；', CHAR(10), '3. 向客户解释原因，并主动申请了一张优惠券作为补偿；', CHAR(10), '4. 承诺持续跟进物流状态。'), 125, 12, 5, 'published', @user_manager1_id, DATE_SUB(NOW(), INTERVAL 5 DAY), 'excellent', 'medium'),

(@session1_id, '产品功能咨询的标准话术', '针对新上线产品的复杂功能咨询，如何用通俗易懂的语言向客户解释。', '业务咨询', 'easy', '客户询问新推出的"智能排班"功能具体如何使用，以及与旧版的区别。', '使用了类比的方法，将智能排班比作"自动导航"，只需要输入目的地（排班规则），系统自动规划路线（生成班次）。同时列举了3个核心优势点。', 89, 8, 3, 'published', @user_manager1_id, DATE_SUB(NOW(), INTERVAL 3 DAY), 'excellent', 'medium'),

(@session1_id, '处理退换货纠纷的教科书式案例', '在不符合退换货条件的情况下，如何婉拒客户并提供替代方案。', '售后服务', 'hard', '客户购买商品已超过7天无理由退换期，且已拆封使用，但坚持要求退货。', CONCAT('1. 温和坚定地表明公司规定；', CHAR(10), '2. 详细解释为什么不能退货（影响二次销售）；', CHAR(10), '3. 提出替代方案：提供维修服务或以旧换新折扣；', CHAR(10), '4. 最终客户接受了维修方案。'), 210, 35, 15, 'published', @user_service1_id, DATE_SUB(NOW(), INTERVAL 10 DAY), 'excellent', 'high'),

(@session1_id, 'VIP客户的个性化服务接待', '识别VIP客户身份，并提供超出预期的个性化服务体验。', 'VIP服务', 'medium', '系统提示进线客户为高等级VIP，且在其生日月。', CONCAT('1. 开场白直接送上生日祝福；', CHAR(10), '2. 全程优先处理其需求；', CHAR(10), '3. 结束时赠送VIP专属生日礼包；', CHAR(10), '4. 客户表示非常惊喜，给出了满分好评。'), 156, 22, 8, 'published', @user_manager1_id, DATE_SUB(NOW(), INTERVAL 1 DAY), 'excellent', 'medium'),

(@session1_id, '突发系统故障时的安抚话术', '在系统崩溃导致无法下单时，如何批量安抚焦虑的客户。', '危机处理', 'hard', '双十一大促期间，系统突然卡顿，大量客户无法付款，进线咨询量激增。', CONCAT('1. 统一口径，承认问题并致歉；', CHAR(10), '2. 告知技术部门正在紧急修复，预计恢复时间；', CHAR(10), '3. 建议客户稍后尝试，并承诺优惠依然有效；', CHAR(10), '4. 引导客户先加购物车。'), 340, 56, 20, 'published', @user_service1_id, DATE_SUB(NOW(), INTERVAL 20 DAY), 'excellent', 'urgent');

-- 获取案例ID
SET @case1_id = (SELECT id FROM `quality_cases` WHERE `title` = '如何优雅地处理客户投诉' LIMIT 1);
SET @case2_id = (SELECT id FROM `quality_cases` WHERE `title` = '产品功能咨询的标准话术' LIMIT 1);
SET @case3_id = (SELECT id FROM `quality_cases` WHERE `title` = '处理退换货纠纷的教科书式案例' LIMIT 1);

-- 插入案例收藏数据
INSERT INTO quality_case_favorites (case_id, user_id, created_at)
VALUES
(@case1_id, @user_manager1_id, NOW()),
(@case3_id, @user_manager1_id, NOW()),
(@case2_id, @user_service1_id, NOW());

-- 插入案例点赞数据
INSERT INTO quality_case_likes (case_id, user_id, created_at)
VALUES
(@case1_id, @user_manager1_id, NOW()),
(@case1_id, @user_service1_id, NOW()),
(@case2_id, @user_manager1_id, NOW()),
(@case3_id, @user_manager1_id, NOW()),
(@case3_id, @user_service1_id, NOW()),
(@case3_id, @user_service2_id, NOW());


-- Source: 12_insert_memos.sql
-- 插入备忘录测试数据
-- 依赖：users表、departments表

-- 1. 个人备忘录
INSERT INTO `memos` (`user_id`, `title`, `content`, `type`, `priority`, `is_read`, `created_at`) VALUES
(1, '今日工作计划', '## 今日任务\n\n1. 完成项目文档\n2. 代码审查\n3. 团队会议', 'personal', 'high', 0, '2024-12-06 09:00:00'),
(2, '学习笔记', '## React Hooks\n\n- useState\n- useEffect\n- useContext', 'personal', 'normal', 1, '2024-12-05 14:30:00'),
(3, '重要提醒', '明天下午3点客户会议，准备演示材料', 'personal', 'urgent', 0, '2024-12-06 10:00:00');

-- 2. 部门备忘录（发送给技术部）
INSERT INTO `memos` (`user_id`, `title`, `content`, `type`, `priority`, `target_department_id`, `created_at`) VALUES
(1, '技术部周会通知', '## 周会安排\n\n**时间**：本周五下午2点\n**地点**：会议室A\n**议题**：\n1. 项目进度汇报\n2. 技术难点讨论', 'department', 'high', 1, '2024-12-06 08:00:00'),
(1, '代码规范更新', '请大家注意新的代码规范已发布，详见文档中心', 'department', 'normal', 1, '2024-12-05 16:00:00');

-- 获取刚插入的部门备忘录ID
SET @memo_id_1 = (SELECT id FROM memos WHERE title = '技术部周会通知' LIMIT 1);
SET @memo_id_2 = (SELECT id FROM memos WHERE title = '代码规范更新' LIMIT 1);

-- 3. 部门备忘录接收记录
INSERT INTO `memo_recipients` (`memo_id`, `user_id`, `is_read`, `read_at`) VALUES
(@memo_id_1, 2, 1, '2024-12-06 09:00:00'),
(@memo_id_1, 3, 0, NULL),
(@memo_id_2, 2, 1, '2024-12-05 17:00:00'),
(@memo_id_2, 3, 0, NULL);


-- Source: 13_insert_broadcasts.sql
-- 插入系统广播测试数据
-- 依赖：users表、departments表

-- 获取有效的用户ID
SET @admin_user_id = (SELECT id FROM users WHERE username = 'admin' LIMIT 1);
SET @manager_user_id = (SELECT id FROM users WHERE username = 'manager1' LIMIT 1);
SET @service_user_id = (SELECT id FROM users WHERE username = 'service1' LIMIT 1);

-- 1. 全体广播
INSERT INTO `broadcasts` (`title`, `content`, `type`, `priority`, `target_type`, `creator_id`, `created_at`) VALUES
('系统维护通知', '系统将于今晚22:00-23:00进行例行维护，期间可能无法访问，请提前保存工作。', 'warning', 'high', 'all', @admin_user_id, '2024-12-06 10:00:00'),
('新功能上线', '实时通知系统已上线！现在您可以即时收到各类通知，无需刷新页面。', 'success', 'normal', 'all', @admin_user_id, '2024-12-05 15:00:00');

-- 2. 部门广播（技术部）
INSERT INTO `broadcasts` (`title`, `content`, `type`, `priority`, `target_type`, `target_departments`, `creator_id`, `created_at`) VALUES
('技术分享会', '本周四下午3点，技术分享会：《WebSocket实战》，欢迎参加！', 'info', 'normal', 'department', '[1]', @admin_user_id, '2024-12-06 09:00:00');

-- 3. 角色广播（管理员）
INSERT INTO `broadcasts` (`title`, `content`, `type`, `priority`, `target_type`, `target_roles`, `creator_id`, `created_at`) VALUES
('管理员培训通知', '新版管理后台培训将于下周一上午10点举行，请所有管理员准时参加。', 'announcement', 'high', 'role', '["超级管理员", "部门管理员"]', @admin_user_id, '2024-12-06 11:00:00');

-- 4. 个人广播
INSERT INTO `broadcasts` (`title`, `content`, `type`, `priority`, `target_type`, `target_users`, `creator_id`, `created_at`) VALUES
('个人提醒', '您的年度考核报告需要在本周五前提交，请及时完成。', 'warning', 'urgent', 'individual', CONCAT('[', @manager_user_id, ',', @service_user_id, ']'), @admin_user_id, '2024-12-06 12:00:00');

-- 5. 广播接收记录
SET @b1 = (SELECT id FROM broadcasts WHERE title = '系统维护通知' LIMIT 1);
SET @b2 = (SELECT id FROM broadcasts WHERE title = '新功能上线' LIMIT 1);
SET @b3 = (SELECT id FROM broadcasts WHERE title = '技术分享会' LIMIT 1);
SET @b4 = (SELECT id FROM broadcasts WHERE title = '管理员培训通知' LIMIT 1);
SET @b5 = (SELECT id FROM broadcasts WHERE title = '个人提醒' LIMIT 1);

INSERT INTO `broadcast_recipients` (`broadcast_id`, `user_id`, `is_read`, `read_at`) VALUES
(@b1, @admin_user_id, 1, '2024-12-06 10:05:00'),
(@b1, @manager_user_id, 1, '2024-12-06 10:10:00'),
(@b1, @service_user_id, 0, NULL),
(@b2, @admin_user_id, 1, '2024-12-05 15:30:00'),
(@b2, @manager_user_id, 1, '2024-12-05 16:00:00'),
(@b2, @service_user_id, 1, '2024-12-05 17:00:00'),
(@b3, @manager_user_id, 1, '2024-12-06 09:30:00'),
(@b3, @service_user_id, 0, NULL),
(@b4, @admin_user_id, 1, '2024-12-06 11:15:00'),
(@b5, @manager_user_id, 0, NULL),
(@b5, @service_user_id, 0, NULL);


-- Source: 14_assign_admin_permissions.sql
-- ==========================================
-- 为 admin（超级管理员）分配所有权限
-- 在执行 npm run db:seed 时执行
-- ==========================================

-- 获取超级管理员角色ID
SET @role_admin_id = (SELECT id FROM `roles` WHERE `name` = '超级管理员' LIMIT 1);

-- 如果不存在超级管理员角色，输出提示
SELECT '未找到超级管理员角色，跳过权限分配' AS 'Status' WHERE @role_admin_id IS NULL;

-- 为超级管理员分配当前系统中已存在的所有权限（去重）
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT @role_admin_id, p.id FROM `permissions` p WHERE @role_admin_id IS NOT NULL;

-- 输出分配结果（仅在角色存在时输出）
SELECT CONCAT('已为超级管理员分配权限数量: ', (SELECT COUNT(*) FROM `role_permissions` WHERE `role_id` = @role_admin_id)) AS 'Status' WHERE @role_admin_id IS NOT NULL;

-- 将 admin 用户绑定到超级管理员角色（如果尚未绑定）
SET @user_admin_id = (SELECT id FROM `users` WHERE `username` = 'admin' LIMIT 1);

INSERT IGNORE INTO `user_roles` (`user_id`, `role_id`, `assigned_at`)
SELECT @user_admin_id, @role_admin_id, NOW()
WHERE @user_admin_id IS NOT NULL AND @role_admin_id IS NOT NULL;

SELECT 'admin角色绑定检查完成' AS 'Status';


-- Source: 16_insert_approval_workflows.sql
-- ==========================================
-- 审批流程测试数据插入脚本
-- ==========================================

-- 清理已存在的测试数据
DELETE FROM `approval_workflow_nodes` WHERE workflow_id IN (
  SELECT id FROM `approval_workflows` WHERE type = 'reimbursement' AND name LIKE '测试%'
);
DELETE FROM `approval_workflows` WHERE type = 'reimbursement' AND name LIKE '测试%';

-- 插入测试审批流程
INSERT INTO `approval_workflows` (
  `name`, `description`, `type`, `is_default`, `status`, `conditions`, `created_by`, `created_at`
) VALUES
('标准报销审批流程', '适用于普通员工的日常报销审批', 'reimbursement', 1, 'active', NULL, 1, NOW()),
('大额报销审批流程', '适用于金额超过5000元的报销申请', 'reimbursement', 0, 'active', '{"amount_greater_than": 5000}', 1, NOW()),
('紧急报销审批流程', '适用于紧急情况下的快速报销', 'reimbursement', 0, 'active', NULL, 1, NOW());

-- 获取刚插入的流程ID
SET @workflow_standard = LAST_INSERT_ID() - 2;
SET @workflow_large = LAST_INSERT_ID() - 1;
SET @workflow_urgent = LAST_INSERT_ID();

-- 为标准报销流程添加审批节点
INSERT INTO `approval_workflow_nodes` (
  `workflow_id`, `node_name`, `node_order`, `approver_type`, `role_id`, `approver_id`, 
  `custom_type_name`, `approval_mode`, `can_skip`, `created_at`
) VALUES
(@workflow_standard, '部门主管审批', 1, 'department_manager', NULL, NULL, NULL, 'serial', 0, NOW()),
(@workflow_standard, '财务审核', 2, 'custom_group', NULL, NULL, 'finance', 'serial', 0, NOW()),
(@workflow_standard, '老板审批', 3, 'custom_group', NULL, NULL, 'boss', 'serial', 0, NOW());

-- 为大额报销流程添加审批节点
INSERT INTO `approval_workflow_nodes` (
  `workflow_id`, `node_name`, `node_order`, `approver_type`, `role_id`, `approver_id`, 
  `custom_type_name`, `approval_mode`, `can_skip`, `created_at`
) VALUES
(@workflow_large, '部门主管审批', 1, 'department_manager', NULL, NULL, NULL, 'serial', 0, NOW()),
(@workflow_large, '财务总监审批', 2, 'custom_group', NULL, NULL, 'finance', 'serial', 0, NOW()),
(@workflow_large, 'CEO审批', 3, 'custom_group', NULL, NULL, 'ceo', 'serial', 0, NOW());

-- 为紧急报销流程添加审批节点
INSERT INTO `approval_workflow_nodes` (
  `workflow_id`, `node_name`, `node_order`, `approver_type`, `role_id`, `approver_id`, 
  `custom_type_name`, `approval_mode`, `can_skip`, `created_at`
) VALUES
(@workflow_urgent, '财务快速审批', 1, 'custom_group', NULL, NULL, 'finance', 'serial', 0, NOW()),
(@workflow_urgent, '老板确认', 2, 'custom_group', NULL, NULL, 'boss', 'serial', 0, NOW());

-- 输出确认信息
SELECT '审批流程测试数据插入完成' AS 'Status';

-- 显示插入的流程信息
SELECT 
  w.id,
  w.name,
  w.description,
  w.type,
  w.is_default,
  w.status,
  (SELECT COUNT(*) FROM approval_workflow_nodes WHERE workflow_id = w.id) as node_count
FROM `approval_workflows` w
WHERE w.type = 'reimbursement' AND w.name LIKE '测试%'
ORDER BY w.id;

-- Source: 16_insert_reimbursement_workflows.sql
-- 16_insert_reimbursement_workflows.sql
-- 初始化默认审批流程数据

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- 1. 清理旧数据（仅清理报销类型的流程）
-- =============================================================================
DELETE FROM approval_workflow_nodes WHERE workflow_id IN (SELECT id FROM approval_workflows WHERE type = 'reimbursement');
DELETE FROM approval_workflows WHERE type = 'reimbursement';

-- =============================================================================
-- 2. 插入审批流程
-- =============================================================================

-- 默认流程：普通员工使用
INSERT INTO `approval_workflows` (`name`, `type`, `description`, `is_default`, `conditions`, `status`) VALUES
('标准报销审批流程', 'reimbursement', '适用于普通员工的标准报销审批流程', 1, NULL, 'active');
SET @wf1_id = LAST_INSERT_ID();

-- 部门主管专用流程
INSERT INTO `approval_workflows` (`name`, `type`, `description`, `is_default`, `conditions`, `status`) VALUES
('管理层报销流程', 'reimbursement', '适用于部门主管的报销流程，跳过部门主管审批', 0, '{"is_department_manager": true}', 'active');
SET @wf2_id = LAST_INSERT_ID();

-- 大额报销流程
INSERT INTO `approval_workflows` (`name`, `type`, `description`, `is_default`, `conditions`, `status`) VALUES
('大额报销审批流程', 'reimbursement', '适用于金额超过5000元的报销申请', 0, '{"amount_greater_than": 5000}', 'active');
SET @wf3_id = LAST_INSERT_ID();

-- =============================================================================
-- 3. 标准流程节点: 部门主管 → 财务 → 申请人确认
-- =============================================================================
INSERT INTO `approval_workflow_nodes` (`workflow_id`, `node_order`, `node_name`, `approver_type`, `custom_type_name`, `approval_mode`) VALUES
(@wf1_id, 1, '部门主管审批', 'custom_group', '部门主管', 'serial'),
(@wf1_id, 2, '财务审核', 'custom_group', '财务', 'serial'),
(@wf1_id, 3, '申请人确认', 'initiator', NULL, 'serial');

-- =============================================================================
-- 4. 管理层流程节点: 老板 → 财务 → 申请人确认
-- =============================================================================
INSERT INTO `approval_workflow_nodes` (`workflow_id`, `node_order`, `node_name`, `approver_type`, `custom_type_name`, `approval_mode`) VALUES
(@wf2_id, 1, '老板审批', 'custom_group', '老板', 'serial'),
(@wf2_id, 2, '财务审核', 'custom_group', '财务', 'serial'),
(@wf2_id, 3, '申请人确认', 'initiator', NULL, 'serial');

-- =============================================================================
-- 5. 大额流程节点: 部门主管 → 老板 → 财务 → 申请人确认
-- =============================================================================
INSERT INTO `approval_workflow_nodes` (`workflow_id`, `node_order`, `node_name`, `approver_type`, `custom_type_name`, `approval_mode`) VALUES
(@wf3_id, 1, '部门主管审批', 'custom_group', '部门主管', 'serial'),
(@wf3_id, 2, '老板审批', 'custom_group', '老板', 'serial'),
(@wf3_id, 3, '财务审核', 'custom_group', '财务', 'serial'),
(@wf3_id, 4, '申请人确认', 'initiator', NULL, 'serial');

SET FOREIGN_KEY_CHECKS = 1;

SELECT '报销审批流程初始化数据插入成功' as result;


-- Source: 99_real_asset_data.sql

-- ==========================================
-- 真实资产测试数据 (Generated)
-- ==========================================

-- 1. 确保资产分类存在
INSERT IGNORE INTO asset_categories (name, code, description, status) VALUES 
('笔记本电脑', 'LAPTOP', '高性能办公笔记本', 'active'),
('台式工作站', 'DESKTOP', '固定办公与设计工作站', 'active'),
('显示器', 'MONITOR', '高清显示器', 'active'),
('移动设备', 'MOBILE', '手机与平板测试机', 'active'),
('外设配件', 'PERIPHERAL', '键盘鼠标等', 'active');

-- 2. 插入设备形态 (以防万一 043 没跑或者数据被清)
INSERT IGNORE INTO asset_device_forms (name, icon) VALUES 
('Laptop', 'laptop'),
('Desktop', 'desktop'),
('Monitor', 'monitor'),
('Mobile', 'mobile');

-- 3. 插入设备型号
-- 笔记本
INSERT INTO asset_models (category_id, form_id, name, description, status) 
SELECT id, (SELECT id FROM asset_device_forms WHERE name='Laptop'), 'MacBook Pro 14 M3 Pro', 'Apple M3 Pro 芯片, 18GB 内存, 512GB SSD, 深空灰', 'active'
FROM asset_categories WHERE code='LAPTOP';

INSERT INTO asset_models (category_id, form_id, name, description, status) 
SELECT id, (SELECT id FROM asset_device_forms WHERE name='Laptop'), 'ThinkPad X1 Carbon Gen 11', 'i7-1360P, 32GB, 1TB, 4K OLED', 'active'
FROM asset_categories WHERE code='LAPTOP';

-- 显示器
INSERT INTO asset_models (category_id, form_id, name, description, status) 
SELECT id, (SELECT id FROM asset_device_forms WHERE name='Monitor'), 'Dell U2723QE', '27英寸 4K IPS Black, Type-C Hub', 'active'
FROM asset_categories WHERE code='MONITOR';

-- 4. 插入具体设备实例
-- 分配给 admin (id=1) 和 manager1 (id=2)
INSERT INTO devices (asset_no, model_id, current_user_id, device_status, status, purchase_date, purchase_price, notes)
SELECT 'ZC-20240101-001', id, 1, 'in_use', 'active', '2024-01-01', 16999.00, '管理员主力机'
FROM asset_models WHERE name='MacBook Pro 14 M3 Pro';

INSERT INTO devices (asset_no, model_id, current_user_id, device_status, status, purchase_date, purchase_price, notes)
SELECT 'ZC-20240101-002', id, 1, 'in_use', 'active', '2024-01-01', 3999.00, '管理员外接显示器'
FROM asset_models WHERE name='Dell U2723QE';

INSERT INTO devices (asset_no, model_id, current_user_id, device_status, status, purchase_date, purchase_price, notes)
SELECT 'ZC-20240215-001', id, 2, 'in_use', 'active', '2024-02-15', 14999.00, '经理办公机'
FROM asset_models WHERE name='ThinkPad X1 Carbon Gen 11';

-- 闲置设备
INSERT INTO devices (asset_no, model_id, current_user_id, device_status, status, purchase_date, purchase_price, notes)
SELECT 'ZC-20240301-005', id, NULL, 'idle', 'active', '2024-03-01', 3999.00, '备用显示器'
FROM asset_models WHERE name='Dell U2723QE';

-- 5. 插入资产组件类型
INSERT IGNORE INTO asset_component_types (name, sort_order) VALUES
('CPU', 1), ('RAM', 2), ('Hard Disk', 3);

-- 6. 插入组件规格
INSERT INTO asset_components (type_id, name, model, notes)
SELECT id, 'Apple M3 Pro', 'M3 Pro 11-core', '集成在主板'
FROM asset_component_types WHERE name='CPU';

INSERT INTO asset_components (type_id, name, model, notes)
SELECT id, '18GB Unified Memory', 'LPDDR5X', '板载内存'
FROM asset_component_types WHERE name='RAM';

-- 7. 关联组件到设备 (示例: 为管理员的MacBook添加配置)
INSERT INTO device_config_details (device_id, component_type_id, component_id, quantity, change_type, status)
SELECT 
    (SELECT id FROM devices WHERE asset_no='ZC-20240101-001'),
    (SELECT id FROM asset_component_types WHERE name='CPU'),
    (SELECT id FROM asset_components WHERE name='Apple M3 Pro'),
    1, 'initial', 'active';

SELECT 'Real asset test data inserted successfully' AS 'Status';


SET FOREIGN_KEY_CHECKS=1;
