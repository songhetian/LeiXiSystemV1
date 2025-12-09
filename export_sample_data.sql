-- 导出客服管理系统样本数据
-- 数据库: leixin_customer_service_v1

-- 清除现有数据（如果需要）
-- SET FOREIGN_KEY_CHECKS = 0;
-- TRUNCATE TABLE user_departments;
-- TRUNCATE TABLE role_departments;
-- TRUNCATE TABLE user_roles;
-- TRUNCATE TABLE users;
-- TRUNCATE TABLE departments;
-- TRUNCATE TABLE roles;
-- SET FOREIGN_KEY_CHECKS = 1;

-- 插入部门数据
INSERT INTO `departments` (`id`, `name`, `parent_id`, `description`, `manager_id`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES
(53, '管理部', NULL, '公司管理层部门，负责公司整体运营和战略规划', NULL, 'active', 1, '2025-12-07 17:38:29', '2025-12-07 17:38:29'),
(54, '客服部', NULL, '客户服务部门，负责处理客户咨询和售后服务', NULL, 'active', 2, '2025-12-07 17:38:29', '2025-12-07 17:38:29'),
(55, '技术部', NULL, '技术研发部门，负责系统开发和技术支持', NULL, 'active', 3, '2025-12-07 17:38:29', '2025-12-07 17:38:29'),
(56, '质检部', NULL, '质量检查部门，负责客服质量监控和评估', NULL, 'active', 4, '2025-12-07 17:38:29', '2025-12-07 17:38:29'),
(57, '运营部', NULL, '运营管理部门，负责业务运营和数据分析', NULL, 'active', 5, '2025-12-07 17:38:29', '2025-12-07 17:38:29');

-- 插入角色数据
INSERT INTO `roles` (`id`, `name`, `description`, `level`, `is_system`, `created_at`, `updated_at`) VALUES
(13, '普通员工', '普通员工权限', 3, 0, '2025-12-07 15:52:25', '2025-12-07 15:52:25'),
(55, '超级管理员', '系统最高权限角色，拥有所有功能的访问和管理权限', 100, 1, '2025-12-07 17:38:29', '2025-12-07 17:38:29'),
(56, '部门经理', '部门管理角色，负责部门日常管理和人员调配', 80, 0, '2025-12-07 17:38:29', '2025-12-07 17:38:29'),
(57, '客服专员', '客户服务角色，负责处理客户咨询和问题解决', 50, 0, '2025-12-07 17:38:29', '2025-12-07 17:38:29'),
(58, '质检员', '质量检查角色，负责客服质量评估和监督', 60, 0, '2025-12-07 17:38:29', '2025-12-07 17:38:29'),
(59, '运营专员', '运营管理角色，负责业务运营和数据分析', 50, 0, '2025-12-07 17:38:29', '2025-12-07 17:38:29');

-- 插入用户数据（示例用户）
INSERT INTO `users` (`id`, `username`, `password_hash`, `real_name`, `email`, `phone`, `avatar`, `department_id`, `status`, `approval_note`, `last_login`, `created_at`, `updated_at`, `session_token`, `session_created_at`, `is_department_manager`) VALUES
(93, 'admin', '$2b$10$kjCCNMqQEWZ13vV76MXKK.OktCVrxp0OFePS8fZmTx4MMVH4v16aW', '系统管理员', 'admin@example.com', '13800138000', NULL, 53, 'active', NULL, NULL, '2025-12-07 17:38:29', '2025-12-07 17:38:29', NULL, NULL, 1);

-- 插入用户角色关联数据
INSERT INTO `user_roles` (`id`, `user_id`, `role_id`, `assigned_at`, `assigned_by`) VALUES
(87, 93, 55, '2025-12-07 17:38:29', NULL);

-- 插入角色部门关联数据
INSERT INTO `role_departments` (`id`, `role_id`, `department_id`, `created_at`) VALUES
(46, 13, 53, '2025-12-08 15:56:06'),
(47, 13, 54, '2025-12-08 15:56:06'),
(48, 59, 53, '2025-12-08 15:56:06'),
(49, 59, 54, '2025-12-08 15:56:06');

-- 插入用户部门关联数据
INSERT INTO `user_departments` (`id`, `user_id`, `department_id`, `created_at`) VALUES
(22, 93, 53, '2025-12-09 14:36:27'),
(23, 93, 54, '2025-12-09 14:36:27'),
(24, 93, 55, '2025-12-09 14:36:27');
