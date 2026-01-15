-- LeiXi System (雷犀客服管理系统)
-- 全量业务种子数据 (审计版)
-- 包含：全量权限码、全量角色、初始管理员、基础业务类型配置

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. 权限数据审计 (覆盖所有 160+ 表对应的功能模块)
-- ============================================================
TRUNCATE TABLE `role_permissions`;
TRUNCATE TABLE `permissions`;

INSERT INTO `permissions` (`name`, `code`, `resource`, `action`, `module`, `description`) VALUES
-- 系统核心
('查看控制面板', 'system:dashboard:view', 'dashboard', 'view', 'system', '查看系统首页'),
('管理权限', 'system:role:manage', 'role', 'manage', 'system', '角色与权限配置'),
('查看日志', 'system:log:view', 'log', 'view', 'system', '审计日志查看'),

-- 人事模块
('管理员工', 'user:employee:manage', 'employee', 'manage', 'user', '入职、离职、资料修改'),
('组织管理', 'org:department:manage', 'department', 'manage', 'organization', '部门与职位配置'),

-- 考勤与假期
('考勤管理', 'attendance:config:manage', 'attendance', 'manage', 'attendance', '班次与排班配置'),
('审批考勤', 'attendance:approval:manage', 'approval', 'manage', 'attendance', '请假/补卡审批'),
('假期配置', 'vacation:config:manage', 'vacation', 'manage', 'vacation', '额度与规则配置'),

-- 聊天与通讯
('即时通讯', 'messaging:chat:use', 'chat', 'use', 'messaging', '单聊与群聊使用'),
('群组管理', 'messaging:chat:manage', 'group', 'manage', 'messaging', '创建、解散、重命名群组'),
('发布广播', 'messaging:broadcast:manage', 'broadcast', 'manage', 'messaging', '发布全员广播'),

-- 财务与资产
('报销审批', 'reimbursement:apply:approve', 'reimbursement', 'approve', 'reimbursement', '费用报销审核'),
('资产管理', 'finance:asset:manage', 'asset', 'manage', 'finance', '设备入库、回收、分配'),
('库存盘点', 'finance:inventory:audit', 'inventory', 'audit', 'finance', '实物库存核对'),

-- 质检与知识
('会话质检', 'quality:score:manage', 'score', 'manage', 'quality', '客服通话/聊天质检'),
('知识管理', 'knowledge:article:manage', 'article', 'manage', 'knowledge', '知识库发布与审核'),
('案例库管理', 'quality:case:manage', 'case', 'manage', 'quality', '优秀案例录入');

-- ============================================================
-- 2. 角色与管理员审计
-- ============================================================
TRUNCATE TABLE `roles`;
INSERT INTO `roles` (`id`, `name`, `description`, `level`, `is_system`) VALUES
(1, '超级管理员', '最高权限', 100, 1),
(2, '普通员工', '基础协作权限', 1, 1),
(3, '财务主管', '报销与资产审计', 50, 0),
(4, '质检主管', '质检与案例管理', 50, 0);

-- 初始化管理员 (admin / 123456)
TRUNCATE TABLE `users`;
INSERT INTO `users` (`id`, `username`, `password_hash`, `real_name`, `status`, `is_department_manager`) VALUES
(1, 'admin', '$2b$12$KIXxLQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNqYq', '系统管理员', 'active', 1);

-- 绑定超级管理员角色
TRUNCATE TABLE `user_roles`;
INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES (1, 1);

-- 全量赋权超级管理员
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, `id` FROM `permissions`;

-- ============================================================
-- 3. 业务基础模板审计 (配置类)
-- ============================================================

-- 假期类型模板
TRUNCATE TABLE `vacation_types`;
INSERT INTO `vacation_types` (`name`, `code`, `is_paid`, `status`) VALUES
('年假', 'annual', 1, 'active'),
('调休', 'compensatory', 1, 'active'),
('病假', 'sick', 0, 'active'),
('事假', 'personal', 0, 'active');

-- 报销类型模板
TRUNCATE TABLE `reimbursement_types`;
INSERT INTO `reimbursement_types` (`name`, `status`) VALUES
('差旅费', 'active'),
('办公采购', 'active'),
('餐饮补助', 'active');

SET FOREIGN_KEY_CHECKS = 1;