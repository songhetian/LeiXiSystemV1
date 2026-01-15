-- LeiXi System (雷犀客服管理系统) 
-- 完整初始化部署脚本 (审计版)
-- 生成日期: 2026-01-13

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. 核心权限与安全模块 (Core Auth & Permissions)
-- ============================================================

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE COMMENT '登录账号',
  `password_hash` varchar(255) NOT NULL COMMENT '密码哈希',
  `real_name` varchar(50) NOT NULL COMMENT '真实姓名',
  `email` varchar(100) DEFAULT NULL UNIQUE,
  `phone` varchar(20) DEFAULT NULL UNIQUE,
  `avatar` text COMMENT '头像URL',
  `department_id` int DEFAULT NULL,
  `status` enum('active','inactive','pending','resigned','deleted') DEFAULT 'pending' COMMENT '状态',
  `is_department_manager` tinyint(1) DEFAULT '0' COMMENT '是否为部门主管',
  `session_token` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 角色表
CREATE TABLE IF NOT EXISTS `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL UNIQUE,
  `description` varchar(200) DEFAULT NULL,
  `level` int DEFAULT '1' COMMENT '权限等级',
  `is_system` tinyint(1) DEFAULT '0' COMMENT '是否为系统内置',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 权限项表
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '权限名称',
  `code` varchar(100) NOT NULL UNIQUE COMMENT '权限唯一标识',
  `resource` varchar(50) DEFAULT NULL COMMENT '资源',
  `action` varchar(50) DEFAULT NULL COMMENT '动作',
  `module` varchar(50) DEFAULT NULL COMMENT '模块',
  `description` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户角色关联表
CREATE TABLE IF NOT EXISTS `user_roles` (
  `user_id` int NOT NULL,
  `role_id` int NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2. 组织架构模块 (Organization)
-- ============================================================

-- 部门表
CREATE TABLE IF NOT EXISTS `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL UNIQUE,
  `description` varchar(200) DEFAULT NULL,
  `status` enum('active','inactive','deleted') DEFAULT 'active',
  `sort_order` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 职位表
CREATE TABLE IF NOT EXISTS `positions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL UNIQUE,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 员工档案表
CREATE TABLE IF NOT EXISTS `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL UNIQUE,
  `employee_no` varchar(20) NOT NULL UNIQUE COMMENT '工号',
  `position_id` int DEFAULT NULL,
  `hire_date` date NOT NULL,
  `rating` tinyint(1) DEFAULT '3' COMMENT '星级',
  `status` enum('active','inactive','resigned','deleted') DEFAULT 'active',
  `emergency_contact` varchar(50) DEFAULT NULL,
  `emergency_phone` varchar(20) DEFAULT NULL,
  `address` varchar(200) DEFAULT NULL,
  `education` varchar(20) DEFAULT NULL,
  `remark` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 3. 即时通讯模块 (IM & Chat)
-- ============================================================

-- 群组表
CREATE TABLE IF NOT EXISTS `chat_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `owner_id` int DEFAULT NULL,
  `avatar` text,
  `type` enum('group','department') DEFAULT 'group',
  `department_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 群成员表
CREATE TABLE IF NOT EXISTS `chat_group_members` (
  `group_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` enum('admin','member') DEFAULT 'member',
  `is_muted` tinyint(1) DEFAULT '0',
  `last_read_message_id` int DEFAULT '0',
  `joined_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`group_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 消息记录表
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sender_id` int NOT NULL,
  `group_id` int NOT NULL,
  `content` text NOT NULL,
  `msg_type` enum('text','image','file','system') DEFAULT 'text',
  `file_url` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_group_id` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 4. 资产管理模块 (Asset Management)
-- ============================================================

-- 设备表
CREATE TABLE IF NOT EXISTS `devices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asset_no` varchar(50) NOT NULL UNIQUE COMMENT '资产编号',
  `model_id` int NOT NULL COMMENT '型号ID',
  `current_user_id` int DEFAULT NULL COMMENT '当前使用者',
  `device_status` enum('idle','in_use','repairing','scrapped') DEFAULT 'idle' COMMENT '使用状态',
  `status` enum('active','deleted') DEFAULT 'active' COMMENT '档案状态',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 5. 初始化种子数据 (Seed Data)
-- ============================================================

-- 插入默认部门
INSERT IGNORE INTO `departments` (`id`, `name`, `description`) VALUES 
(1, '管理部', '公司核心管理团队'),
(2, '技术部', '研发与运维'),
(3, '客服部', '客户服务中心');

-- 插入系统内置角色
INSERT IGNORE INTO `roles` (`id`, `name`, `description`, `level`, `is_system`) VALUES
(1, '超级管理员', '拥有系统所有权限', 100, 1),
(2, '普通员工', '默认基础权限', 1, 1);

-- 插入初始化管理员账号 (密码: 123456)
-- 注意：这里假设 password_hash 已经生成好
INSERT IGNORE INTO `users` (`id`, `username`, `password_hash`, `real_name`, `department_id`, `status`) VALUES
(1, 'admin', '$2b$12$KIXxLQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNqYq', '系统管理员', 1, 'active');

INSERT IGNORE INTO `user_roles` (`user_id`, `role_id`) VALUES (1, 1);

-- 插入核心权限 (仅展示部分，部署时会包含全量权限)
INSERT IGNORE INTO `permissions` (`name`, `code`, `module`) VALUES
('管理角色', 'system:role:manage', 'system'),
('管理员工', 'user:employee:manage', 'user'),
('管理部门', 'org:department:manage', 'organization'),
('管理群组', 'messaging:chat:manage', 'messaging'),
('资产管理', 'finance:asset:manage', 'finance');

-- 为超级管理员绑定所有权限 (逻辑操作)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

SET FOREIGN_KEY_CHECKS = 1;