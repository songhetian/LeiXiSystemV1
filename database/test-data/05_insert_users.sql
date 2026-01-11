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