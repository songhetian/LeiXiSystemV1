-- =============================================
-- 雷曦系统数据库初始化脚本
-- 版本: 1.0.0
-- 生成时间: 2025-01-01
-- =============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+08:00';

-- =============================================
-- 第一部分：基础表（无外键依赖）
-- =============================================

-- 部门表
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '部门唯一标识ID',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '部门名称',
  `parent_id` int DEFAULT NULL COMMENT '父部门ID，支持多级部门',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '部门描述',
  `manager_id` int DEFAULT NULL COMMENT '部门经理用户ID',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active' COMMENT '部门状态',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序号',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_manager_id` (`manager_id`),
  KEY `idx_status` (`status`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部门表';

-- 用户表
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '用户唯一标识ID',
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户登录名',
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '密码哈希值',
  `real_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '真实姓名',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '邮箱地址',
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '手机号码',
  `avatar` text COLLATE utf8mb4_unicode_ci COMMENT '头像(Base64或URL)',
  `department_id` int DEFAULT NULL COMMENT '所属部门ID',
  `status` enum('active','inactive','pending','rejected','deleted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '用户状态',
  `approval_note` text COLLATE utf8mb4_unicode_ci COMMENT '审批备注',
  `is_department_manager` tinyint(1) DEFAULT '0' COMMENT '是否为部门主管',
  `last_login` datetime DEFAULT NULL COMMENT '最后登录时间',
  `id_card_front_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '身份证正面图片URL',
  `id_card_back_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '身份证反面图片URL',
  `session_token` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '会话token',
  `session_created_at` datetime DEFAULT NULL COMMENT '会话创建时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  UNIQUE KEY `uk_phone` (`phone`),
  KEY `idx_department_id` (`department_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_session_token` (`session_token`(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 角色表
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '角色唯一标识ID',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色名称',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '角色描述',
  `level` int NOT NULL DEFAULT '1' COMMENT '角色级别',
  `is_system` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否系统内置角色',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_level` (`level`),
  KEY `idx_is_system` (`is_system`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- 权限表
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '权限唯一标识ID',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '权限名称',
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '权限代码',
  `resource` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '资源名称',
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作类型',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '权限描述',
  `module` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '所属模块',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_resource` (`resource`),
  KEY `idx_action` (`action`),
  KEY `idx_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- 权限模板表
DROP TABLE IF EXISTS `permission_templates`;
CREATE TABLE `permission_templates` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '权限模板唯一标识ID',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '模板名称',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '模板描述',
  `permission_ids` json DEFAULT NULL COMMENT '权限ID列表，JSON格式存储',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限模板表';

-- 平台表
DROP TABLE IF EXISTS `platforms`;
CREATE TABLE `platforms` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '平台ID',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '平台名称',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='平台表';

-- 店铺表
DROP TABLE IF EXISTS `shops`;
CREATE TABLE `shops` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '店铺ID',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '店铺名称',
  `platform_id` int NOT NULL COMMENT '所属平台ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `platform_id` (`platform_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='店铺表';

-- 班次表
DROP TABLE IF EXISTS `shifts`;
CREATE TABLE `shifts` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '班次唯一标识ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '班次名称',
  `start_time` time NOT NULL COMMENT '班次开始时间',
  `end_time` time NOT NULL COMMENT '班次结束时间',
  `break_duration` int NOT NULL DEFAULT '0' COMMENT '休息时长，单位分钟',
  `color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '班次显示颜色',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '班次详细描述',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录最后更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班次表';

-- 工作班次表
DROP TABLE IF EXISTS `work_shifts`;
CREATE TABLE `work_shifts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '班次名称',
  `start_time` time NOT NULL COMMENT '上班时间',
  `end_time` time NOT NULL COMMENT '下班时间',
  `work_hours` decimal(3,1) NOT NULL COMMENT '工作时长',
  `rest_duration` int DEFAULT '60' COMMENT '休息时长（分钟）',
  `late_threshold` int DEFAULT NULL COMMENT '迟到阈值（分钟）',
  `early_threshold` int DEFAULT NULL COMMENT '早退阈值（分钟）',
  `use_global_threshold` tinyint(1) DEFAULT '0' COMMENT '是否使用全局阈值',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否启用',
  `department_id` int DEFAULT NULL COMMENT '部门ID',
  `description` varchar(500) DEFAULT NULL COMMENT '班次描述',
  `color` varchar(20) DEFAULT '#3B82F6',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_department` (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='班次表';

-- 假期类型表
DROP TABLE IF EXISTS `vacation_types`;
CREATE TABLE `vacation_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL COMMENT '类型代码',
  `name` varchar(100) NOT NULL COMMENT '类型名称',
  `base_days` decimal(5,2) DEFAULT '0.00' COMMENT '基准天数',
  `included_in_total` tinyint(1) DEFAULT '1' COMMENT '是否计入总额度',
  `description` text COMMENT '描述',
  `enabled` tinyint(1) DEFAULT '1' COMMENT '是否启用',
  `is_pinned` tinyint(1) DEFAULT '0' COMMENT '是否置顶',
  `sort_order` int DEFAULT '999' COMMENT '排序号',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_code` (`code`),
  KEY `idx_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='假期类型表';

-- 转换规则表
DROP TABLE IF EXISTS `conversion_rules`;
CREATE TABLE `conversion_rules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT '转换规则' COMMENT '规则名称',
  `source_type` varchar(50) DEFAULT NULL COMMENT '来源类型',
  `target_type` varchar(50) DEFAULT NULL COMMENT '目标类型',
  `conversion_rate` decimal(10,2) NOT NULL COMMENT '转换比例',
  `ratio` decimal(10,4) DEFAULT '0.1250' COMMENT '转换比例',
  `description` text COMMENT '规则描述',
  `enabled` tinyint(1) DEFAULT '1' COMMENT '是否启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_source_target` (`source_type`,`target_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='额度转换规则表';

-- 菜单分类表
DROP TABLE IF EXISTS `menu_categories`;
CREATE TABLE `menu_categories` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '菜单分类唯一标识ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类名称',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '分类详细描述',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序号',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录最后更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_sort_order` (`sort_order`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜单分类表';

-- 标签分类表
DROP TABLE IF EXISTS `tag_categories`;
CREATE TABLE `tag_categories` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '标签分类ID',
  `parent_id` int DEFAULT NULL COMMENT '父分类ID',
  `level` int NOT NULL DEFAULT '0' COMMENT '分类层级',
  `path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '分类路径',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类名称',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '分类描述',
  `color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '分类颜色',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序号',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_level` (`level`),
  KEY `idx_path` (`path`(255)),
  KEY `idx_sort_order` (`sort_order`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签分类表';

-- 质检标签分类表
DROP TABLE IF EXISTS `quality_tag_categories`;
CREATE TABLE `quality_tag_categories` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类名称',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '分类描述',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签分类表';

-- 会话表
DROP TABLE IF EXISTS `conversations`;
CREATE TABLE `conversations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `type` enum('single','group','room') NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `description` text,
  `creator_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_conv_type` (`type`),
  KEY `idx_conv_creator` (`creator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='会话表';

-- 知识库分类表
DROP TABLE IF EXISTS `knowledge_categories`;
CREATE TABLE `knowledge_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `owner_id` bigint unsigned DEFAULT NULL,
  `type` enum('common','personal') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'common',
  `is_public` tinyint NOT NULL DEFAULT '1',
  `is_hidden` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('draft','published','archived') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'published',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cat_owner` (`owner_id`),
  KEY `idx_cat_type` (`type`),
  KEY `idx_cat_public` (`is_public`),
  KEY `idx_cat_status` (`status`),
  KEY `idx_cat_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识库分类表';

-- 试卷分类表
DROP TABLE IF EXISTS `exam_categories`;
CREATE TABLE `exam_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '分类名称',
  `description` text COMMENT '分类描述',
  `parent_id` int DEFAULT NULL COMMENT '父级分类ID',
  `status` enum('active','inactive','deleted') NOT NULL DEFAULT 'active' COMMENT '状态',
  `order_num` int NOT NULL DEFAULT '1' COMMENT '排序号',
  `path` varchar(1024) NOT NULL DEFAULT '/' COMMENT '路径',
  `level` int NOT NULL DEFAULT '1' COMMENT '层级',
  `weight` decimal(8,2) NOT NULL DEFAULT '0.00' COMMENT '权重',
  `created_by` int DEFAULT NULL COMMENT '创建人ID',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  `deleted_by` int DEFAULT NULL COMMENT '删除操作用户ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_deleted_at` (`deleted_at`),
  KEY `idx_status` (`status`),
  KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='试卷分类表';

-- 考勤规则表
DROP TABLE IF EXISTS `attendance_rules`;
CREATE TABLE `attendance_rules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rule_name` varchar(100) NOT NULL COMMENT '规则名称',
  `rule_type` varchar(50) NOT NULL COMMENT '规则类型',
  `rule_value` json DEFAULT NULL COMMENT '规则值',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否启用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rule_type` (`rule_type`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='考勤规则表';

-- 考勤设置表
DROP TABLE IF EXISTS `attendance_settings`;
CREATE TABLE `attendance_settings` (
  `id` int NOT NULL,
  `enable_location_check` tinyint(1) NOT NULL DEFAULT '0',
  `allowed_distance` int NOT NULL DEFAULT '500',
  `allowed_locations` text,
  `enable_time_check` tinyint(1) NOT NULL DEFAULT '1',
  `early_clock_in_minutes` int NOT NULL DEFAULT '60',
  `late_clock_out_minutes` int NOT NULL DEFAULT '120',
  `late_minutes` int NOT NULL DEFAULT '30',
  `early_leave_minutes` int NOT NULL DEFAULT '30',
  `absent_hours` int NOT NULL DEFAULT '4',
  `max_annual_leave_days` int NOT NULL DEFAULT '10',
  `max_sick_leave_days` int NOT NULL DEFAULT '15',
  `require_proof_for_sick_leave` tinyint(1) NOT NULL DEFAULT '1',
  `require_approval_for_overtime` tinyint(1) NOT NULL DEFAULT '1',
  `min_overtime_hours` decimal(4,1) NOT NULL DEFAULT '1.0',
  `max_overtime_hours_per_day` int NOT NULL DEFAULT '4',
  `allow_makeup` tinyint(1) NOT NULL DEFAULT '1',
  `makeup_deadline_days` int NOT NULL DEFAULT '3',
  `require_approval_for_makeup` tinyint(1) NOT NULL DEFAULT '1',
  `notify_on_late` tinyint(1) NOT NULL DEFAULT '1',
  `notify_on_early_leave` tinyint(1) NOT NULL DEFAULT '1',
  `notify_on_absent` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='考勤设置表';

-- 假期设置表
DROP TABLE IF EXISTS `vacation_settings`;
CREATE TABLE `vacation_settings` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `setting_key` varchar(100) NOT NULL COMMENT '配置键',
  `setting_value` text COMMENT '配置值',
  `description` varchar(255) DEFAULT NULL COMMENT '配置说明',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `idx_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='假期系统配置';

-- 节假日配置表
DROP TABLE IF EXISTS `holidays`;
CREATE TABLE `holidays` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL COMMENT '假期名称',
  `days` int NOT NULL COMMENT '天数',
  `month` int NOT NULL COMMENT '所属月份',
  `year` int NOT NULL COMMENT '年份',
  `vacation_type_id` int DEFAULT NULL COMMENT '关联的假期类型ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_year_month` (`year`,`month`),
  KEY `idx_vacation_type` (`vacation_type_id`),
  CONSTRAINT `holidays_chk_1` CHECK ((`days` >= 1 AND `days` <= 31)),
  CONSTRAINT `holidays_chk_2` CHECK ((`month` >= 1 AND `month` <= 12))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='节假日配置表';

-- 通知设置表
DROP TABLE IF EXISTS `notification_settings`;
CREATE TABLE `notification_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_type` varchar(50) NOT NULL COMMENT '事件类型',
  `target_roles` json DEFAULT NULL COMMENT '接收通知的角色列表',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_event_type` (`event_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知设置表';

-- 迁移历史表
DROP TABLE IF EXISTS `migrations_history`;
CREATE TABLE `migrations_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `migration_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `migration_name` (`migration_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='迁移历史表';

-- =============================================
-- 第二部分：有外键依赖的表
-- =============================================

-- 添加部门外键
ALTER TABLE `departments`
  ADD CONSTRAINT `fk_departments_manager_id` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_departments_parent_id` FOREIGN KEY (`parent_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

-- 添加用户外键
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_department_id` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

-- 添加店铺外键
ALTER TABLE `shops`
  ADD CONSTRAINT `fk_shops_platform` FOREIGN KEY (`platform_id`) REFERENCES `platforms` (`id`) ON DELETE CASCADE;

-- 添加标签分类外键
ALTER TABLE `tag_categories`
  ADD CONSTRAINT `fk_tag_categories_parent_id` FOREIGN KEY (`parent_id`) REFERENCES `tag_categories` (`id`) ON DELETE CASCADE;

-- 添加会话外键
ALTER TABLE `conversations`
  ADD CONSTRAINT `fk_conversations_creator` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 职位表
DROP TABLE IF EXISTS `positions`;
CREATE TABLE `positions` (
  `i
