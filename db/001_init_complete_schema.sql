-- 完整初始化数据库结构和基础数据
-- 包含所有必要的表结构、基础数据和权限设置

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. 创建所有表结构
-- ============================================================

-- 部门表
CREATE TABLE IF NOT EXISTS `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '部门名称',
  `parent_id` int DEFAULT NULL COMMENT '上级部门ID',
  `description` text COMMENT '部门描述',
  `manager_id` int DEFAULT NULL COMMENT '部门经理用户ID',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active' COMMENT '状态',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_status` (`status`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部门表';

-- 角色表
CREATE TABLE IF NOT EXISTS `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '角色名称',
  `description` text COMMENT '角色描述',
  `level` int NOT NULL DEFAULT '1' COMMENT '角色级别，数值越大权限越高',
  `is_system` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否为系统内置角色',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_level` (`level`),
  KEY `idx_is_system` (`is_system`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password_hash` varchar(255) NOT NULL COMMENT '密码哈希值',
  `real_name` varchar(50) NOT NULL COMMENT '真实姓名',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `avatar` text COMMENT '头像URL',
  `department_id` int DEFAULT NULL COMMENT '所属部门ID',
  `status` enum('active','inactive','pending','rejected') NOT NULL DEFAULT 'pending' COMMENT '用户状态',
  `approval_note` text COMMENT '审批备注',
  `last_login` datetime DEFAULT NULL COMMENT '最后登录时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `session_token` varchar(500) DEFAULT NULL COMMENT '会话令牌',
  `session_created_at` datetime DEFAULT NULL COMMENT '会话创建时间',
  `is_department_manager` tinyint(1) DEFAULT '0' COMMENT '是否为部门主管',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  UNIQUE KEY `uk_phone` (`phone`),
  KEY `idx_department_id` (`department_id`),
  KEY `idx_status` (`status`),
  KEY `idx_session_token` (`session_token`(255)),
  CONSTRAINT `fk_users_department_id` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 用户角色关联表
CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `role_id` int NOT NULL COMMENT '角色ID',
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间',
  `assigned_by` int DEFAULT NULL COMMENT '分配人用户ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`,`role_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role_id` (`role_id`),
  CONSTRAINT `fk_user_roles_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- 角色部门权限表
CREATE TABLE IF NOT EXISTS `role_departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL COMMENT '角色ID',
  `department_id` int NOT NULL COMMENT '部门ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_department` (`role_id`,`department_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_department_id` (`department_id`),
  CONSTRAINT `fk_role_departments_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_departments_department_id` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色部门权限表';

-- 用户部门权限表
CREATE TABLE IF NOT EXISTS `user_departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `department_id` int NOT NULL COMMENT '部门ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_department` (`user_id`,`department_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_department_id` (`department_id`),
  CONSTRAINT `fk_user_departments_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_departments_department_id` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户部门权限表';

-- 权限表
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '权限名称',
  `code` varchar(100) NOT NULL COMMENT '权限代码',
  `resource` varchar(50) NOT NULL COMMENT '资源类型',
  `action` varchar(50) NOT NULL COMMENT '操作类型',
  `module` varchar(50) NOT NULL COMMENT '模块名称',
  `description` text COMMENT '权限描述',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_module` (`module`),
  KEY `idx_resource` (`resource`),
  KEY `idx_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL COMMENT '角色ID',
  `permission_id` int NOT NULL COMMENT '权限ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`,`permission_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_permission_id` (`permission_id`),
  CONSTRAINT `fk_role_permissions_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permissions_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- 员工表
CREATE TABLE IF NOT EXISTS `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '关联用户ID',
  `employee_no` varchar(20) NOT NULL COMMENT '员工编号',
  `position` varchar(100) DEFAULT NULL COMMENT '职位',
  `hire_date` date NOT NULL COMMENT '入职日期',
  `rating` int NOT NULL DEFAULT '3' COMMENT '评级（1-5星）',
  `status` enum('active','inactive','probation','terminated') NOT NULL DEFAULT 'active' COMMENT '员工状态',
  `emergency_contact` varchar(50) DEFAULT NULL COMMENT '紧急联系人',
  `emergency_phone` varchar(20) DEFAULT NULL COMMENT '紧急联系电话',
  `address` varchar(200) DEFAULT NULL COMMENT '住址',
  `education` varchar(50) DEFAULT NULL COMMENT '学历',
  `skills` text COMMENT '技能',
  `remark` text COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  UNIQUE KEY `uk_employee_no` (`employee_no`),
  KEY `idx_status` (`status`),
  KEY `idx_rating` (`rating`),
  CONSTRAINT `fk_employees_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工表';

-- 备忘录表
CREATE TABLE IF NOT EXISTS `memos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL COMMENT '标题',
  `content` text NOT NULL COMMENT '内容',
  `creator_id` int NOT NULL COMMENT '创建者用户ID',
  `type` enum('personal','department') NOT NULL DEFAULT 'personal' COMMENT '备忘录类型',
  `priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal' COMMENT '优先级',
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'published' COMMENT '状态',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_creator_id` (`creator_id`),
  KEY `idx_type` (`type`),
  KEY `idx_priority` (`priority`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_memos_creator_id` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='备忘录表';

-- 备忘录接收者表
CREATE TABLE IF NOT EXISTS `memo_recipients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `memo_id` int NOT NULL COMMENT '备忘录ID',
  `user_id` int NOT NULL COMMENT '接收者用户ID',
  `is_read` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已读',
  `read_at` datetime DEFAULT NULL COMMENT '阅读时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_memo_user` (`memo_id`,`user_id`),
  KEY `idx_memo_id` (`memo_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_read` (`is_read`),
  CONSTRAINT `fk_memo_recipients_memo_id` FOREIGN KEY (`memo_id`) REFERENCES `memos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_memo_recipients_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='备忘录接收者表';

-- 通知设置表
CREATE TABLE IF NOT EXISTS `notification_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_type` varchar(50) NOT NULL COMMENT '事件类型',
  `target_roles` json NOT NULL COMMENT '目标角色列表',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_event_type` (`event_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知设置表';

-- 通知表
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL COMMENT '通知标题',
  `content` text NOT NULL COMMENT '通知内容',
  `type` varchar(50) NOT NULL COMMENT '通知类型',
  `sender_id` int DEFAULT NULL COMMENT '发送者用户ID',
  `related_id` int DEFAULT NULL COMMENT '关联ID（如备忘录ID、审批ID等）',
  `related_type` varchar(50) DEFAULT NULL COMMENT '关联类型',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_type` (`type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

-- 通知接收者表
CREATE TABLE IF NOT EXISTS `notification_recipients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `notification_id` int NOT NULL COMMENT '通知ID',
  `user_id` int NOT NULL COMMENT '接收者用户ID',
  `is_read` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已读',
  `read_at` datetime DEFAULT NULL COMMENT '阅读时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_notification_user` (`notification_id`,`user_id`),
  KEY `idx_notification_id` (`notification_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_read` (`is_read`),
  CONSTRAINT `fk_notification_recipients_notification_id` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notification_recipients_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知接收者表';

-- ============================================================
-- 2. 插入基础数据
-- ============================================================

-- 插入默认部门
INSERT IGNORE INTO `departments` (`name`, `description`, `status`, `sort_order`) VALUES
('管理部', '公司管理层部门，负责公司整体运营和战略规划', 'active', 1),
('客服部', '客户服务部门，负责处理客户咨询和售后服务', 'active', 2),
('技术部', '技术研发部门，负责系统开发和技术支持', 'active', 3),
('质检部', '质量检查部门，负责客服质量监控和评估', 'active', 4),
('运营部', '运营管理部门，负责业务运营和数据分析', 'active', 5);

-- 插入默认角色
INSERT IGNORE INTO `roles` (`name`, `description`, `level`, `is_system`) VALUES
('超级管理员', '系统最高权限角色，拥有所有功能的访问和管理权限', 100, 1),
('部门经理', '部门管理角色，负责部门日常管理和人员调配', 80, 0),
('客服专员', '客户服务角色，负责处理客户咨询和问题解决', 50, 0),
('质检员', '质量检查角色，负责客服质量评估和监督', 60, 0),
('运营专员', '运营管理角色，负责业务运营和数据分析', 50, 0),
('普通员工', '普通员工权限', 3, 0);

-- 插入默认管理员用户 (密码: admin123)
INSERT IGNORE INTO `users` (`username`, `password_hash`, `real_name`, `email`, `status`, `is_department_manager`, `department_id`) 
SELECT 'admin', '$2b$10$kjCCNMqQEWZ13vV76MXKK.OktCVrxp0OFePS8fZmTx4MMVH4v16aW', '系统管理员', 'admin@example.com', 'active', 1, d.id
FROM departments d 
WHERE d.name = '管理部';

-- 为管理员用户分配超级管理员角色
INSERT IGNORE INTO `user_roles` (`user_id`, `role_id`) 
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.username = 'admin' AND r.name = '超级管理员';

-- 为普通员工角色分配默认可查看部门
INSERT IGNORE INTO `role_departments` (`role_id`, `department_id`) 
SELECT r.id, d.id 
FROM roles r, departments d 
WHERE r.name = '普通员工' AND d.name IN ('管理部', '客服部');

-- ============================================================
-- 3. 初始化权限数据
-- ============================================================

-- 插入所有系统权限
INSERT IGNORE INTO permissions (name, code, resource, action, module, description) VALUES
-- 系统管理 (System)
('查看角色', 'system:role:view', 'role', 'view', 'system', '查看角色列表'),
('管理角色', 'system:role:manage', 'role', 'manage', 'system', '新增、编辑、删除角色及配置权限'),
('查看日志', 'system:log:view', 'log', 'view', 'system', '查看系统操作日志'),

-- 员工管理 (User)
('查看员工', 'user:employee:view', 'employee', 'view', 'user', '查看员工列表及详情'),
('管理员工', 'user:employee:manage', 'employee', 'manage', 'user', '新增、编辑、删除员工'),
('员工审核', 'user:audit:manage', 'audit', 'manage', 'user', '审核新注册员工'),
('重置密码', 'user:security:reset_password', 'security', 'reset_password', 'user', '重置员工密码'),
('部门备忘', 'user:memo:manage', 'memo', 'manage', 'user', '管理部门备忘录'),

-- 组织架构 (Organization)
('查看部门', 'org:department:view', 'department', 'view', 'organization', '查看部门架构'),
('管理部门', 'org:department:manage', 'department', 'manage', 'organization', '新增、编辑、删除部门'),
('查看职位', 'org:position:view', 'position', 'view', 'organization', '查看职位列表'),
('管理职位', 'org:position:manage', 'position', 'manage', 'organization', '新增、编辑、删除职位'),

-- 信息系统 (Messaging)
('查看广播', 'messaging:broadcast:view', 'broadcast', 'view', 'messaging', '查看系统广播'),
('发布广播', 'messaging:broadcast:manage', 'broadcast', 'manage', 'messaging', '发布、管理系统广播'),
('通知设置', 'messaging:config:manage', 'config', 'manage', 'messaging', '配置系统通知规则'),

-- 考勤管理 (Attendance)
('查看考勤', 'attendance:record:view', 'record', 'view', 'attendance', '查看考勤记录'),
('考勤统计', 'attendance:report:view', 'report', 'view', 'attendance', '查看考勤统计报表'),
('考勤设置', 'attendance:config:manage', 'config', 'manage', 'attendance', '修改考勤规则、班次、排班'),
('考勤审批', 'attendance:approval:manage', 'approval', 'manage', 'attendance', '审批请假、加班、补卡申请'),
('排班管理', 'attendance:schedule:manage', 'schedule', 'manage', 'attendance', '管理员工排班'),

-- 假期管理 (Vacation)
('查看假期', 'vacation:record:view', 'record', 'view', 'vacation', '查看假期余额及记录'),
('假期配置', 'vacation:config:manage', 'config', 'manage', 'vacation', '配置假期规则及额度'),
('假期审批', 'vacation:approval:manage', 'approval', 'manage', 'vacation', '审批调休申请'),

-- 质检管理 (Quality)
('查看质检', 'quality:session:view', 'session', 'view', 'quality', '查看质检会话及记录'),
('质检评分', 'quality:score:manage', 'score', 'manage', 'quality', '进行质检评分'),
('质检配置', 'quality:config:manage', 'config', 'manage', 'quality', '配置质检规则、标签、平台店铺'),
('案例管理', 'quality:case:manage', 'case', 'manage', 'quality', '管理质检案例库'),

-- 知识库 (Knowledge)
('查看知识库', 'knowledge:article:view', 'article', 'view', 'knowledge', '查看公共知识库'),
('管理知识库', 'knowledge:article:manage', 'article', 'manage', 'knowledge', '发布、编辑、删除知识库文章'),

-- 考核系统 (Assessment)
('查看考核', 'assessment:plan:view', 'plan', 'view', 'assessment', '查看考核计划及试卷'),
('管理考核', 'assessment:plan:manage', 'plan', 'manage', 'assessment', '创建试卷、发布考核计划'),
('查看成绩', 'assessment:result:view', 'result', 'view', 'assessment', '查看所有员工考试成绩');

-- 为【超级管理员】分配所有权限
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = '超级管理员';

-- 为【普通员工】分配基础权限
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'user:employee:view',
    'org:department:view',
    'org:position:view',
    'messaging:broadcast:view',
    'attendance:record:view',
    'vacation:record:view',
    'knowledge:article:view',
    'assessment:plan:view'
)
WHERE r.name = '普通员工';

-- ============================================================
-- 4. 初始化通知设置
-- ============================================================

-- 插入默认通知设置
INSERT IGNORE INTO `notification_settings` (`event_type`, `target_roles`) VALUES
('memo_create', '["部门经理", "普通员工"]'),
('memo_update', '["部门经理", "普通员工"]'),
('leave_apply', '["部门经理"]'),
('leave_approve', '["申请人"]'),
('leave_reject', '["申请人"]'),
('attendance_exception', '["部门经理"]');

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Database schema and initial data initialized successfully' as result;