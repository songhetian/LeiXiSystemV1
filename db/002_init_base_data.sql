-- 初始化基础数据
-- 创建默认部门、角色和管理员用户

-- 插入默认部门
INSERT INTO `departments` (`name`, `description`, `status`, `sort_order`) VALUES
('管理部', '公司管理层部门，负责公司整体运营和战略规划', 'active', 1),
('客服部', '客户服务部门，负责处理客户咨询和售后服务', 'active', 2),
('技术部', '技术研发部门，负责系统开发和技术支持', 'active', 3),
('质检部', '质量检查部门，负责客服质量监控和评估', 'active', 4),
('运营部', '运营管理部门，负责业务运营和数据分析', 'active', 5)
ON DUPLICATE KEY UPDATE `name` = `name`;

-- 插入默认角色
INSERT INTO `roles` (`name`, `description`, `level`, `is_system`) VALUES
('超级管理员', '系统最高权限角色，拥有所有功能的访问和管理权限', 100, 1),
('部门经理', '部门管理角色，负责部门日常管理和人员调配', 80, 0),
('客服专员', '客户服务角色，负责处理客户咨询和问题解决', 50, 0),
('质检员', '质量检查角色，负责客服质量评估和监督', 60, 0),
('运营专员', '运营管理角色，负责业务运营和数据分析', 50, 0),
('普通员工', '普通员工权限', 3, 0)
ON DUPLICATE KEY UPDATE `name` = `name`;

-- 插入默认管理员用户 (密码: admin123)
INSERT INTO `users` (`username`, `password_hash`, `real_name`, `email`, `status`, `is_department_manager`) VALUES
('admin', '$2b$10$kjCCNMqQEWZ13vV76MXKK.OktCVrxp0OFePS8fZmTx4MMVH4v16aW', '系统管理员', 'admin@example.com', 'active', 1)
ON DUPLICATE KEY UPDATE `username` = `username`;

-- 为管理员用户分配超级管理员角色
INSERT INTO `user_roles` (`user_id`, `role_id`)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'admin' AND r.name = '超级管理员'
ON DUPLICATE KEY UPDATE `user_id` = `user_id`;

-- 为普通员工角色分配默认可查看部门
INSERT INTO `role_departments` (`role_id`, `department_id`)
SELECT r.id, d.id
FROM roles r, departments d
WHERE r.name = '普通员工' AND d.name IN ('管理部', '客服部')
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;
