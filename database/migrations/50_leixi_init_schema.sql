-- =====================================================
-- LeiXi System (雷犀客服管理系统) - Database Initialization
-- Version: 1.0.0
-- MySQL Version: 8.0+
-- Charset: utf8mb4
-- =====================================================

-- Pre-initialization settings
SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT;
SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS;
SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION;
SET @OLD_TIME_ZONE=@@TIME_ZONE;
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS;
SET @OLD_SQL_MODE=@@SQL_MODE;
SET @OLD_SQL_NOTES=@@SQL_NOTES;

SET NAMES utf8mb4;
SET TIME_ZONE='+08:00';
SET UNIQUE_CHECKS=0;
SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
SET SQL_NOTES=0;

-- =====================================================
-- PHASE 1: Core System Tables (No Foreign Key Dependencies)
-- =====================================================

-- Migration history tracking
DROP TABLE IF EXISTS `migrations_history`;
CREATE TABLE `migrations_history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `migration_name` VARCHAR(255) NOT NULL,
  `applied_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_migration_name` (`migration_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据库迁移历史';

-- Platforms table
DROP TABLE IF EXISTS `platforms`;
CREATE TABLE `platforms` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '平台ID',
  `name` VARCHAR(255) NOT NULL COMMENT '平台名称',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='平台表';

-- Departments table
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '部门唯一标识ID',
  `name` VARCHAR(50) NOT NULL COMMENT '部门名称',
  `parent_id` INT DEFAULT NULL COMMENT '父部门ID',
  `description` TEXT COMMENT '部门描述',
  `manager_id` INT DEFAULT NULL COMMENT '部门经理用户ID',
  `status` ENUM('active','inactive') NOT NULL DEFAULT 'active' COMMENT '部门状态',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序号',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_status` (`status`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部门表';

-- Roles table
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '角色唯一标识ID',
  `name` VARCHAR(50) NOT NULL COMMENT '角色名称',
  `description` TEXT COMMENT '角色描述',
  `level` INT NOT NULL DEFAULT 1 COMMENT '角色级别',
  `is_system` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否系统内置角色',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_level` (`level`),
  KEY `idx_is_system` (`is_system`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- Permissions table
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '权限唯一标识ID',
  `name` VARCHAR(50) NOT NULL COMMENT '权限名称',
  `code` VARCHAR(50) NOT NULL COMMENT '权限代码',
  `resource` VARCHAR(50) NOT NULL COMMENT '资源名称',
  `action` VARCHAR(50) NOT NULL COMMENT '操作类型',
  `description` TEXT COMMENT '权限描述',
  `module` VARCHAR(50) NOT NULL COMMENT '所属模块',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_resource` (`resource`),
  KEY `idx_action` (`action`),
  KEY `idx_module` (`module`),
  KEY `idx_resource_action` (`resource`,`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- Vacation types table
DROP TABLE IF EXISTS `vacation_types`;
CREATE TABLE `vacation_types` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL COMMENT '类型代码',
  `name` VARCHAR(100) NOT NULL COMMENT '类型名称',
  `base_days` DECIMAL(5,2) DEFAULT 0.00 COMMENT '基准天数',
  `included_in_total` TINYINT(1) DEFAULT 1 COMMENT '是否计入总额度',
  `description` TEXT COMMENT '描述',
  `enabled` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='假期类型表';

-- Shifts table
DROP TABLE IF EXISTS `shifts`;
CREATE TABLE `shifts` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '班次唯一标识ID',
  `name` VARCHAR(50) NOT NULL COMMENT '班次名称',
  `start_time` TIME NOT NULL COMMENT '班次开始时间',
  `end_time` TIME NOT NULL COMMENT '班次结束时间',
  `break_duration` INT NOT NULL DEFAULT 0 COMMENT '休息时长(分钟)',
  `color` VARCHAR(7) DEFAULT NULL COMMENT '班次显示颜色',
  `description` TEXT COMMENT '班次详细描述',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班次表';

-- Work shifts table (alternative)
DROP TABLE IF EXISTS `work_shifts`;
CREATE TABLE `work_shifts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL COMMENT '班次名称',
  `start_time` TIME NOT NULL COMMENT '上班时间',
  `end_time` TIME NOT NULL COMMENT '下班时间',
  `work_hours` DECIMAL(3,1) NOT NULL COMMENT '工作时长',
  `rest_duration` INT DEFAULT 60 COMMENT '休息时长（分钟）',
  `late_threshold` INT DEFAULT NULL COMMENT '迟到阈值（分钟）',
  `early_threshold` INT DEFAULT NULL COMMENT '早退阈值（分钟）',
  `use_global_threshold` TINYINT(1) DEFAULT 0 COMMENT '是否使用全局阈值',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  `department_id` INT DEFAULT NULL COMMENT '部门ID',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '班次描述',
  `color` VARCHAR(20) DEFAULT '#3B82F6',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_department` (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='班次表';

-- Menu categories table
DROP TABLE IF EXISTS `menu_categories`;
CREATE TABLE `menu_categories` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '菜单分类唯一标识ID',
  `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
  `description` TEXT COMMENT '分类详细描述',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序号',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_sort_order` (`sort_order`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜单分类表';

-- Tag categories table
DROP TABLE IF EXISTS `tag_categories`;
CREATE TABLE `tag_categories` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '标签分类ID',
  `parent_id` INT DEFAULT NULL COMMENT '父分类ID',
  `level` INT NOT NULL DEFAULT 0 COMMENT '分类层级',
  `path` VARCHAR(500) DEFAULT NULL COMMENT '分类路径',
  `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
  `description` TEXT COMMENT '分类描述',
  `color` VARCHAR(7) DEFAULT NULL COMMENT '分类颜色',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序号',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_level` (`level`),
  KEY `idx_path` (`path`(255)),
  KEY `idx_sort_order` (`sort_order`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签分类表';

-- Add self-reference FK for tag_categories
ALTER TABLE `tag_categories` ADD CONSTRAINT `fk_tag_categories_parent_id` FOREIGN KEY (`parent_id`) REFERENCES `tag_categories`(`id`) ON DELETE CASCADE;

-- Quality tag categories table
DROP TABLE IF EXISTS `quality_tag_categories`;
CREATE TABLE `quality_tag_categories` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '分类描述',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签分类表';

-- Exam categories table
DROP TABLE IF EXISTS `exam_categories`;
CREATE TABLE `exam_categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '分类名称',
  `description` TEXT COMMENT '分类描述',
  `parent_id` INT DEFAULT NULL COMMENT '父级分类ID',
  `order_num` INT NOT NULL DEFAULT 1 COMMENT '排序号',
  `path` VARCHAR(1024) NOT NULL DEFAULT '/' COMMENT '路径',
  `level` INT NOT NULL DEFAULT 1 COMMENT '层级',
  `weight` DECIMAL(8,2) NOT NULL DEFAULT 0.00 COMMENT '权重',
  `status` ENUM('active','inactive','deleted') NOT NULL DEFAULT 'active' COMMENT '状态',
  `created_by` INT DEFAULT NULL COMMENT '创建人ID',
  `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
  `deleted_by` INT DEFAULT NULL COMMENT '删除操作用户ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_deleted_at` (`deleted_at`),
  KEY `idx_status` (`status`),
  KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='试卷分类表';

-- Knowledge categories table
DROP TABLE IF EXISTS `knowledge_categories`;
CREATE TABLE `knowledge_categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `icon` VARCHAR(50) DEFAULT NULL,
  `owner_id` BIGINT UNSIGNED DEFAULT NULL,
  `type` ENUM('common','personal') NOT NULL DEFAULT 'common',
  `is_public` TINYINT NOT NULL DEFAULT 1,
  `is_hidden` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('draft','published','archived') NOT NULL DEFAULT 'published',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  `deleted_by` BIGINT UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cat_owner` (`owner_id`),
  KEY `idx_cat_type` (`type`),
  KEY `idx_cat_public` (`is_public`),
  KEY `idx_cat_status` (`status`),
  KEY `idx_cat_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识库分类表';

-- Case categories table
DROP TABLE IF EXISTS `case_categories`;
CREATE TABLE `case_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE COMMENT '分类名称',
  `description` TEXT COMMENT '分类描述',
  `parent_id` INT DEFAULT NULL COMMENT '父分类ID',
  `sort_order` INT DEFAULT 0 COMMENT '排序权重',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_parent` (`parent_id`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `fk_case_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `case_categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='案例分类表';

-- Asset categories table
DROP TABLE IF EXISTS `asset_categories`;
CREATE TABLE `asset_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `code` VARCHAR(50) UNIQUE,
  `description` TEXT,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资产分类表';

-- Asset device forms table (设备形态: 笔记本, 台式机, 服务器等)
DROP TABLE IF EXISTS `asset_device_forms`;
CREATE TABLE `asset_device_forms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `icon` VARCHAR(50),
  `status` VARCHAR(20) DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备形态表';

-- Asset models table (设备型号)
DROP TABLE IF EXISTS `asset_models`;
CREATE TABLE `asset_models` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT,
  `form_id` INT COMMENT '设备形态ID',
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_category_id` (`category_id`),
  KEY `idx_form_id` (`form_id`),
  CONSTRAINT `fk_asset_models_category` FOREIGN KEY (`category_id`) REFERENCES `asset_categories`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_asset_models_form` FOREIGN KEY (`form_id`) REFERENCES `asset_device_forms`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备型号表';

-- Asset component types table (配件类型)
DROP TABLE IF EXISTS `asset_component_types`;
CREATE TABLE `asset_component_types` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `sort_order` INT DEFAULT 0,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配件类型表';

-- Asset components table (配件规格)
DROP TABLE IF EXISTS `asset_components`;
CREATE TABLE `asset_components` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type_id` INT NOT NULL COMMENT '配件类型ID',
  `name` VARCHAR(100) NOT NULL,
  `model` VARCHAR(100),
  `sn` VARCHAR(100) UNIQUE COMMENT '序列号',
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_type_id` (`type_id`),
  CONSTRAINT `fk_asset_components_type` FOREIGN KEY (`type_id`) REFERENCES `asset_component_types`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配件规格表';

-- Attendance rules table
DROP TABLE IF EXISTS `attendance_rules`;
CREATE TABLE `attendance_rules` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `rule_name` VARCHAR(100) NOT NULL COMMENT '规则名称',
  `rule_type` VARCHAR(50) NOT NULL COMMENT '规则类型',
  `rule_value` JSON DEFAULT NULL COMMENT '规则值',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rule_type` (`rule_type`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='考勤规则表';

-- Attendance settings table
DROP TABLE IF EXISTS `attendance_settings`;
CREATE TABLE `attendance_settings` (
  `id` INT NOT NULL,
  `enable_location_check` TINYINT(1) NOT NULL DEFAULT 0,
  `allowed_distance` INT NOT NULL DEFAULT 500,
  `allowed_locations` TEXT,
  `enable_time_check` TINYINT(1) NOT NULL DEFAULT 1,
  `early_clock_in_minutes` INT NOT NULL DEFAULT 60,
  `late_clock_out_minutes` INT NOT NULL DEFAULT 120,
  `late_minutes` INT NOT NULL DEFAULT 30,
  `early_leave_minutes` INT NOT NULL DEFAULT 30,
  `absent_hours` INT NOT NULL DEFAULT 4,
  `max_annual_leave_days` INT NOT NULL DEFAULT 10,
  `max_sick_leave_days` INT NOT NULL DEFAULT 15,
  `require_proof_for_sick_leave` TINYINT(1) NOT NULL DEFAULT 1,
  `require_approval_for_overtime` TINYINT(1) NOT NULL DEFAULT 1,
  `min_overtime_hours` DECIMAL(4,1) NOT NULL DEFAULT 1.0,
  `max_overtime_hours_per_day` INT NOT NULL DEFAULT 4,
  `allow_makeup` TINYINT(1) NOT NULL DEFAULT 1,
  `makeup_deadline_days` INT NOT NULL DEFAULT 3,
  `require_approval_for_makeup` TINYINT(1) NOT NULL DEFAULT 1,
  `notify_on_late` TINYINT(1) NOT NULL DEFAULT 1,
  `notify_on_early_leave` TINYINT(1) NOT NULL DEFAULT 1,
  `notify_on_absent` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='考勤设置表';

-- Conversion rules table
DROP TABLE IF EXISTS `conversion_rules`;
CREATE TABLE `conversion_rules` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `source_type` VARCHAR(50) NOT NULL COMMENT '来源类型',
  `target_type` VARCHAR(50) NOT NULL COMMENT '目标类型',
  `conversion_rate` DECIMAL(10,2) NOT NULL COMMENT '转换比例',
  `enabled` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_source_target` (`source_type`,`target_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='额度转换规则表';

-- Vacation settings table
DROP TABLE IF EXISTS `vacation_settings`;
CREATE TABLE `vacation_settings` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `setting_key` VARCHAR(100) NOT NULL COMMENT '配置键',
  `setting_value` TEXT COMMENT '配置值',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '配置说明',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_setting_key` (`setting_key`),
  KEY `idx_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='假期系统配置';

-- Holidays table
DROP TABLE IF EXISTS `holidays`;
CREATE TABLE `holidays` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(20) NOT NULL COMMENT '假期名称',
  `days` INT NOT NULL COMMENT '天数',
  `month` INT NOT NULL COMMENT '所属月份',
  `year` INT NOT NULL COMMENT '年份',
  `vacation_type_id` INT DEFAULT NULL COMMENT '关联的假期类型ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_year_month` (`year`,`month`),
  KEY `idx_vacation_type` (`vacation_type_id`),
  CONSTRAINT `holidays_chk_days` CHECK ((`days` >= 1) AND (`days` <= 31)),
  CONSTRAINT `holidays_chk_month` CHECK ((`month` >= 1) AND (`month` <= 12))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='节假日配置表';

-- Permission templates table
DROP TABLE IF EXISTS `permission_templates`;
CREATE TABLE `permission_templates` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '模板名称',
  `description` TEXT COMMENT '模板描述',
  `permissions` JSON NOT NULL COMMENT '权限ID数组',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  `created_by` INT DEFAULT NULL COMMENT '创建人ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限模板表';

-- =====================================================
-- PHASE 2: User-related Tables
-- =====================================================

-- Users table
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '用户唯一标识ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户登录名',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希值',
  `real_name` VARCHAR(50) NOT NULL COMMENT '真实姓名',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱地址',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号码',
  `avatar` TEXT COMMENT '头像(Base64或URL)',
  `id_card_front_url` VARCHAR(500) DEFAULT NULL COMMENT '身份证正面图片URL',
  `id_card_back_url` VARCHAR(500) DEFAULT NULL COMMENT '身份证反面图片URL',
  `is_department_manager` TINYINT(1) DEFAULT 0 COMMENT '是否是部门经理',
  `department_id` INT DEFAULT NULL COMMENT '所属部门ID',
  `status` ENUM('active','inactive','pending','rejected') NOT NULL DEFAULT 'pending' COMMENT '用户状态',
  `approval_note` TEXT COMMENT '审批备注',
  `last_login` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `session_token` VARCHAR(500) DEFAULT NULL COMMENT '会话token',
  `session_created_at` DATETIME DEFAULT NULL COMMENT '会话创建时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  UNIQUE KEY `uk_phone` (`phone`),
  KEY `idx_department_id` (`department_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_dept_status` (`department_id`,`status`),
  KEY `idx_session_token` (`session_token`(255)),
  CONSTRAINT `fk_users_department_id` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- Now add FK for departments.manager_id
ALTER TABLE `departments` ADD CONSTRAINT `fk_departments_manager_id` FOREIGN KEY (`manager_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;
ALTER TABLE `departments` ADD CONSTRAINT `fk_departments_parent_id` FOREIGN KEY (`parent_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL;

-- Shops table
DROP TABLE IF EXISTS `shops`;
CREATE TABLE `shops` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '店铺ID',
  `name` VARCHAR(255) NOT NULL COMMENT '店铺名称',
  `platform_id` INT NOT NULL COMMENT '所属平台ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_platform_id` (`platform_id`),
  CONSTRAINT `fk_shops_platform` FOREIGN KEY (`platform_id`) REFERENCES `platforms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='店铺表';

-- Positions table
DROP TABLE IF EXISTS `positions`;
CREATE TABLE `positions` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '职位ID',
  `name` VARCHAR(100) NOT NULL COMMENT '职位名称',
  `department_id` INT NOT NULL COMMENT '所属部门ID',
  `description` TEXT COMMENT '职位描述',
  `requirements` TEXT COMMENT '任职要求',
  `responsibilities` TEXT COMMENT '工作职责',
  `salary_min` DECIMAL(10,2) DEFAULT NULL COMMENT '最低薪资',
  `salary_max` DECIMAL(10,2) DEFAULT NULL COMMENT '最高薪资',
  `level` ENUM('junior','middle','senior','expert') DEFAULT 'junior' COMMENT '职位级别',
  `status` ENUM('active','inactive') DEFAULT 'active' COMMENT '状态',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序号',
  `created_by` INT DEFAULT NULL COMMENT '创建人ID',
  `updated_by` INT DEFAULT NULL COMMENT '更新人ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_position_dept` (`name`,`department_id`),
  KEY `idx_department_id` (`department_id`),
  KEY `idx_status` (`status`),
  KEY `idx_level` (`level`),
  KEY `idx_name` (`name`),
  KEY `idx_sort_order` (`sort_order`),
  CONSTRAINT `fk_positions_department` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_positions_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_positions_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='职位表';

-- Employees table
DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '员工记录ID',
  `user_id` INT NOT NULL COMMENT '关联用户ID',
  `employee_no` VARCHAR(20) NOT NULL COMMENT '员工工号',
  `position_id` INT DEFAULT NULL COMMENT '职位ID',
  `hire_date` DATE NOT NULL COMMENT '入职日期',
  `salary` DECIMAL(10,2) DEFAULT NULL COMMENT '基本薪资',
  `status` ENUM('active','inactive','resigned') NOT NULL DEFAULT 'active' COMMENT '员工状态',
  `emergency_contact` VARCHAR(50) DEFAULT NULL COMMENT '紧急联系人',
  `emergency_phone` VARCHAR(20) DEFAULT NULL COMMENT '紧急联系电话',
  `address` VARCHAR(200) DEFAULT NULL COMMENT '家庭住址',
  `education` VARCHAR(20) DEFAULT NULL COMMENT '学历',
  `skills` TEXT COMMENT '技能特长',
  `remark` TEXT COMMENT '备注',
  `rating` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '员工星级评定',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  UNIQUE KEY `uk_employee_no` (`employee_no`),
  KEY `idx_position_id` (`position_id`),
  KEY `idx_hire_date` (`hire_date`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_employees_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_employees_position` FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工信息表';

-- Role permissions table
DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '关联记录ID',
  `role_id` INT NOT NULL COMMENT '角色ID',
  `permission_id` INT NOT NULL COMMENT '权限ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`,`permission_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_permission_id` (`permission_id`),
  CONSTRAINT `fk_role_permissions_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permissions_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- User roles table
DROP TABLE IF EXISTS `user_roles`;
CREATE TABLE `user_roles` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '关联记录ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `role_id` INT NOT NULL COMMENT '角色ID',
  `assigned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间',
  `assigned_by` INT DEFAULT NULL COMMENT '分配人ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`,`role_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_assigned_by` (`assigned_by`),
  CONSTRAINT `fk_user_roles_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_user_roles_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- Role departments table
DROP TABLE IF EXISTS `role_departments`;
CREATE TABLE `role_departments` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '关联记录ID',
  `role_id` INT NOT NULL COMMENT '角色ID',
  `department_id` INT NOT NULL COMMENT '部门ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_department` (`role_id`,`department_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_department_id` (`department_id`),
  CONSTRAINT `fk_role_departments_department` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_departments_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色部门关联表';

-- User departments table
DROP TABLE IF EXISTS `user_departments`;
CREATE TABLE `user_departments` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '关联记录ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `department_id` INT NOT NULL COMMENT '部门ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_department` (`user_id`,`department_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_department_id` (`department_id`),
  CONSTRAINT `fk_user_departments_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_departments_department` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户部门关联表';

-- User settings table
DROP TABLE IF EXISTS `user_settings`;
CREATE TABLE `user_settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `message_notification` TINYINT(1) NOT NULL DEFAULT 1,
  `sound_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `do_not_disturb_start` TIME DEFAULT NULL,
  `do_not_disturb_end` TIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  CONSTRAINT `fk_user_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户设置表';

-- User notification settings table
DROP TABLE IF EXISTS `user_notification_settings`;
CREATE TABLE `user_notification_settings` (
  `user_id` INT NOT NULL,
  `receive_system` TINYINT(1) DEFAULT 1,
  `receive_department` TINYINT(1) DEFAULT 1,
  `sound_on` TINYINT(1) DEFAULT 1,
  `dnd_start` VARCHAR(5) DEFAULT NULL,
  `dnd_end` VARCHAR(5) DEFAULT NULL,
  `toast_duration` INT DEFAULT 5000,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_user_notification_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户通知设置表';

-- =====================================================
-- PHASE 2.5: Extended Feature Tables (from migrations 021-050)
-- =====================================================

-- Vacation conversions table
DROP TABLE IF EXISTS `vacation_conversions`;
CREATE TABLE `vacation_conversions` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '转换记录ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `employee_id` INT NOT NULL COMMENT '员工ID',
  `source_type` VARCHAR(50) DEFAULT 'overtime' COMMENT '来源类型：overtime-加班',
  `source_hours` DECIMAL(10,2) DEFAULT NULL COMMENT '来源小时数',
  `converted_days` DECIMAL(10,2) NOT NULL COMMENT '转换获得的天数',
  `remaining_days` DECIMAL(10,2) NOT NULL COMMENT '剩余可用天数',
  `conversion_ratio` DECIMAL(10,4) DEFAULT NULL COMMENT '转换比例',
  `conversion_rule_id` INT DEFAULT NULL COMMENT '使用的转换规则ID',
  `notes` TEXT COMMENT '备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='假期转换记录表';

-- Conversion usage records table
DROP TABLE IF EXISTS `conversion_usage_records`;
CREATE TABLE `conversion_usage_records` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '使用记录ID',
  `conversion_id` INT NOT NULL COMMENT '转换记录ID',
  `leave_record_id` INT NOT NULL COMMENT '请假记录ID',
  `used_days` DECIMAL(10,2) NOT NULL COMMENT '使用天数',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_conversion` (`conversion_id`),
  KEY `idx_leave_record` (`leave_record_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='假期转换使用记录表';

-- Memos table
DROP TABLE IF EXISTS `memos`;
CREATE TABLE `memos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT '创建者用户ID',
  `title` VARCHAR(200) NOT NULL COMMENT '备忘录标题',
  `content` TEXT NOT NULL COMMENT '备忘录内容',
  `type` ENUM('personal', 'department') DEFAULT 'personal' COMMENT '类型',
  `priority` ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal' COMMENT '优先级',
  `is_read` TINYINT(1) DEFAULT 0 COMMENT '是否已读',
  `target_department_id` INT DEFAULT NULL COMMENT '目标部门ID',
  `target_user_id` INT DEFAULT NULL COMMENT '目标用户ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_target_department` (`target_department_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='备忘录表';

-- Memo recipients table
DROP TABLE IF EXISTS `memo_recipients`;
CREATE TABLE `memo_recipients` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `memo_id` INT NOT NULL COMMENT '备忘录ID',
  `user_id` INT NOT NULL COMMENT '接收者用户ID',
  `is_read` TINYINT(1) DEFAULT 0 COMMENT '是否已读',
  `read_at` DATETIME DEFAULT NULL COMMENT '阅读时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_memo_user` (`memo_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_read` (`is_read`),
  CONSTRAINT `fk_memo_recipients_memo` FOREIGN KEY (`memo_id`) REFERENCES `memos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='备忘录接收人表';

-- Broadcasts table
DROP TABLE IF EXISTS `broadcasts`;
CREATE TABLE `broadcasts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(200) NOT NULL COMMENT '广播标题',
  `content` TEXT NOT NULL COMMENT '广播内容',
  `type` ENUM('info', 'warning', 'success', 'error', 'announcement') DEFAULT 'info' COMMENT '广播类型',
  `priority` ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal' COMMENT '优先级',
  `target_type` ENUM('all', 'department', 'role', 'individual') NOT NULL COMMENT '目标类型',
  `target_departments` JSON COMMENT '目标部门ID列表',
  `target_roles` JSON COMMENT '目标角色列表',
  `target_users` JSON COMMENT '目标用户ID列表',
  `creator_id` INT NOT NULL COMMENT '创建者ID',
  `status` ENUM('draft', 'published', 'archived') DEFAULT 'draft' COMMENT '状态',
  `publish_at` DATETIME COMMENT '发布时间',
  `expires_at` DATETIME COMMENT '过期时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_creator` (`creator_id`),
  KEY `idx_status` (`status`),
  KEY `idx_publish_at` (`publish_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='广播通知表';

-- Broadcast recipients table
DROP TABLE IF EXISTS `broadcast_recipients`;
CREATE TABLE `broadcast_recipients` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `broadcast_id` INT NOT NULL COMMENT '广播ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `is_read` TINYINT(1) DEFAULT 0 COMMENT '是否已读',
  `read_at` DATETIME DEFAULT NULL COMMENT '阅读时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_broadcast_user` (`broadcast_id`, `user_id`),
  KEY `idx_broadcast` (`broadcast_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_read` (`is_read`),
  CONSTRAINT `fk_broadcast_recipients_broadcast` FOREIGN KEY (`broadcast_id`) REFERENCES `broadcasts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='广播接收人表';

-- Notification settings table
DROP TABLE IF EXISTS `notification_settings`;
CREATE TABLE `notification_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `event_type` VARCHAR(50) NOT NULL COMMENT '事件类型',
  `target_roles` JSON DEFAULT NULL COMMENT '接收通知的角色列表',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_event_type` (`event_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知设置表';

-- Payslips table
DROP TABLE IF EXISTS `payslips`;
CREATE TABLE `payslips` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '工资条唯一标识ID',
  `payslip_no` VARCHAR(50) NOT NULL COMMENT '工资条编号',
  `employee_id` INT NOT NULL COMMENT '员工ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `salary_month` DATE NOT NULL COMMENT '工资所属月份',
  `payment_date` DATE NULL COMMENT '发放日期',
  `attendance_days` DECIMAL(5,2) DEFAULT 0.00 COMMENT '出勤天数',
  `late_count` INT DEFAULT 0 COMMENT '迟到次数',
  `early_leave_count` INT DEFAULT 0 COMMENT '早退次数',
  `leave_days` DECIMAL(5,2) DEFAULT 0.00 COMMENT '请假天数',
  `overtime_hours` DECIMAL(6,2) DEFAULT 0.00 COMMENT '加班时长',
  `absent_days` DECIMAL(5,2) DEFAULT 0.00 COMMENT '缺勤天数',
  `basic_salary` DECIMAL(10,2) DEFAULT 0.00 COMMENT '基本工资',
  `position_salary` DECIMAL(10,2) DEFAULT 0.00 COMMENT '岗位工资',
  `performance_bonus` DECIMAL(10,2) DEFAULT 0.00 COMMENT '绩效奖金',
  `overtime_pay` DECIMAL(10,2) DEFAULT 0.00 COMMENT '加班费',
  `allowances` DECIMAL(10,2) DEFAULT 0.00 COMMENT '各类补贴',
  `deductions` DECIMAL(10,2) DEFAULT 0.00 COMMENT '各类扣款',
  `social_security` DECIMAL(10,2) DEFAULT 0.00 COMMENT '社保扣款',
  `housing_fund` DECIMAL(10,2) DEFAULT 0.00 COMMENT '公积金扣款',
  `tax` DECIMAL(10,2) DEFAULT 0.00 COMMENT '个人所得税',
  `other_deductions` DECIMAL(10,2) DEFAULT 0.00 COMMENT '其他扣款',
  `net_salary` DECIMAL(10,2) NOT NULL COMMENT '实发工资',
  `status` ENUM('draft', 'sent', 'viewed', 'confirmed') NOT NULL DEFAULT 'draft' COMMENT '状态',
  `remark` TEXT NULL COMMENT '备注信息',
  `custom_fields` JSON NULL COMMENT '自定义字段数据',
  `issued_by` INT NULL COMMENT '发放人ID',
  `issued_at` DATETIME NULL COMMENT '发放时间',
  `viewed_at` DATETIME NULL COMMENT '首次查看时间',
  `confirmed_at` DATETIME NULL COMMENT '确认时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payslip_no` (`payslip_no`),
  UNIQUE KEY `uk_employee_month` (`employee_id`, `salary_month`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_salary_month` (`salary_month`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工资条表';

-- Payslip templates table
DROP TABLE IF EXISTS `payslip_templates`;
CREATE TABLE `payslip_templates` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '模板ID',
  `template_name` VARCHAR(100) NOT NULL COMMENT '模板名称',
  `template_code` VARCHAR(50) NOT NULL COMMENT '模板代码',
  `is_default` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否默认模板',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `field_config` JSON NOT NULL COMMENT '字段配置',
  `description` TEXT NULL COMMENT '模板描述',
  `created_by` INT NULL COMMENT '创建人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_template_code` (`template_code`),
  KEY `idx_is_default` (`is_default`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工资条模板配置表';

-- Payslip distribution settings table
DROP TABLE IF EXISTS `payslip_distribution_settings`;
CREATE TABLE `payslip_distribution_settings` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `setting_name` VARCHAR(100) NOT NULL COMMENT '配置名称',
  `frequency` ENUM('monthly', 'weekly', 'daily') NOT NULL DEFAULT 'monthly' COMMENT '发放频率',
  `distribution_day` INT NULL COMMENT '发放日',
  `distribution_weekday` INT NULL COMMENT '发放周几',
  `distribution_time` TIME NULL COMMENT '发放时间',
  `auto_send` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否自动发放',
  `target_departments` JSON NULL COMMENT '目标部门ID列表',
  `target_positions` JSON NULL COMMENT '目标职位列表',
  `target_employees` JSON NULL COMMENT '目标员工ID列表',
  `notify_internal` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否发送站内信',
  `notify_sms` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否发送短信',
  `notify_email` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否发送邮件',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_by` INT NULL COMMENT '创建人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工资条发放配置表';

-- Payslip passwords table
DROP TABLE IF EXISTS `payslip_passwords`;
CREATE TABLE `payslip_passwords` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '二级密码哈希值',
  `is_default` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否为默认密码',
  `last_changed_at` DATETIME NULL COMMENT '最后修改时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工资条二级密码表';

-- Payslip import history table
DROP TABLE IF EXISTS `payslip_import_history`;
CREATE TABLE `payslip_import_history` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '导入记录ID',
  `file_name` VARCHAR(255) NOT NULL COMMENT '导入文件名',
  `salary_month` DATE NOT NULL COMMENT '工资所属月份',
  `total_count` INT NOT NULL DEFAULT 0 COMMENT '总记录数',
  `success_count` INT NOT NULL DEFAULT 0 COMMENT '成功导入数',
  `failed_count` INT NOT NULL DEFAULT 0 COMMENT '失败数',
  `error_details` JSON NULL COMMENT '错误详情',
  `import_data` JSON NULL COMMENT '导入的原始数据',
  `status` ENUM('processing', 'completed', 'failed') NOT NULL DEFAULT 'processing' COMMENT '导入状态',
  `imported_by` INT NOT NULL COMMENT '导入人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '导入时间',
  PRIMARY KEY (`id`),
  KEY `idx_salary_month` (`salary_month`),
  KEY `idx_imported_by` (`imported_by`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工资导入历史表';

-- Reimbursements table
DROP TABLE IF EXISTS `reimbursements`;
CREATE TABLE `reimbursements` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '报销单ID',
  `reimbursement_no` VARCHAR(32) NOT NULL COMMENT '报销单号',
  `user_id` INT NOT NULL COMMENT '申请人用户ID',
  `employee_id` INT NOT NULL COMMENT '申请人员工ID',
  `department_id` INT COMMENT '申请人部门ID',
  `title` VARCHAR(200) NOT NULL COMMENT '报销标题',
  `type` ENUM('travel','office','entertainment','training','other') NOT NULL DEFAULT 'other' COMMENT '报销类型',
  `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '报销总金额',
  `status` ENUM('draft','pending','approving','approved','rejected','cancelled') NOT NULL DEFAULT 'draft' COMMENT '状态',
  `current_node_id` INT COMMENT '当前审批节点ID',
  `workflow_id` INT COMMENT '使用的审批流程ID',
  `remark` TEXT COMMENT '备注说明',
  `submitted_at` DATETIME COMMENT '提交时间',
  `completed_at` DATETIME COMMENT '审批完成时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_reimbursement_no` (`reimbursement_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_employee_id` (`employee_id`),
  KEY `idx_department_id` (`department_id`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报销申请主表';

-- Reimbursement items table
DROP TABLE IF EXISTS `reimbursement_items`;
CREATE TABLE `reimbursement_items` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '明细ID',
  `reimbursement_id` INT NOT NULL COMMENT '报销单ID',
  `item_type` VARCHAR(50) NOT NULL COMMENT '费用类型',
  `amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '金额',
  `expense_date` DATE COMMENT '费用发生日期',
  `description` TEXT COMMENT '费用说明',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_reimbursement_id` (`reimbursement_id`),
  KEY `idx_item_type` (`item_type`),
  CONSTRAINT `fk_reimbursement_items_reimbursement` FOREIGN KEY (`reimbursement_id`) REFERENCES `reimbursements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报销明细表';

-- Reimbursement attachments table
DROP TABLE IF EXISTS `reimbursement_attachments`;
CREATE TABLE `reimbursement_attachments` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '附件ID',
  `reimbursement_id` INT NOT NULL COMMENT '报销单ID',
  `item_id` INT COMMENT '关联明细ID',
  `file_name` VARCHAR(255) NOT NULL COMMENT '原始文件名',
  `file_type` VARCHAR(50) COMMENT '文件MIME类型',
  `file_size` INT COMMENT '文件大小',
  `file_url` VARCHAR(500) NOT NULL COMMENT '文件存储路径',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_reimbursement_id` (`reimbursement_id`),
  KEY `idx_item_id` (`item_id`),
  CONSTRAINT `fk_reimbursement_attachments_reimbursement` FOREIGN KEY (`reimbursement_id`) REFERENCES `reimbursements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报销附件表';

-- Approval workflows table
DROP TABLE IF EXISTS `approval_workflows`;
CREATE TABLE `approval_workflows` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '流程ID',
  `name` VARCHAR(100) NOT NULL COMMENT '流程名称',
  `type` VARCHAR(50) NOT NULL DEFAULT 'reimbursement' COMMENT '适用业务类型',
  `description` TEXT COMMENT '流程描述',
  `is_default` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否默认流程',
  `conditions` JSON COMMENT '触发条件',
  `status` ENUM('active','inactive') NOT NULL DEFAULT 'active' COMMENT '状态',
  `created_by` INT COMMENT '创建人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_is_default` (`is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审批流程配置表';

-- Approval workflow nodes table
DROP TABLE IF EXISTS `approval_workflow_nodes`;
CREATE TABLE `approval_workflow_nodes` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '节点ID',
  `workflow_id` INT NOT NULL COMMENT '所属流程ID',
  `node_order` INT NOT NULL DEFAULT 1 COMMENT '节点顺序',
  `node_name` VARCHAR(100) NOT NULL COMMENT '节点名称',
  `approver_type` ENUM('user','role','department_manager','boss','finance','initiator','custom') NOT NULL COMMENT '审批人类型',
  `approver_id` INT COMMENT '具体审批人用户ID',
  `role_id` INT COMMENT '角色ID',
  `custom_type_name` VARCHAR(100) COMMENT '自定义类型名称',
  `approval_mode` ENUM('serial','parallel') NOT NULL DEFAULT 'serial' COMMENT '审批模式',
  `can_skip` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否可跳过',
  `skip_conditions` JSON COMMENT '跳过条件',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_workflow_order` (`workflow_id`, `node_order`),
  CONSTRAINT `fk_workflow_nodes_workflow` FOREIGN KEY (`workflow_id`) REFERENCES `approval_workflows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审批流程节点表';

-- Approval records table
DROP TABLE IF EXISTS `approval_records`;
CREATE TABLE `approval_records` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `reimbursement_id` INT NOT NULL COMMENT '报销单ID',
  `node_id` INT NOT NULL COMMENT '审批节点ID',
  `node_order` INT NOT NULL COMMENT '节点顺序',
  `approver_id` INT NOT NULL COMMENT '审批人ID',
  `action` ENUM('approve','reject','return','delegate') NOT NULL COMMENT '操作',
  `opinion` TEXT COMMENT '审批意见',
  `delegate_to_id` INT COMMENT '转交给',
  `approved_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '审批时间',
  PRIMARY KEY (`id`),
  KEY `idx_reimbursement_id` (`reimbursement_id`),
  KEY `idx_node_id` (`node_id`),
  KEY `idx_approver_id` (`approver_id`),
  CONSTRAINT `fk_approval_records_reimbursement` FOREIGN KEY (`reimbursement_id`) REFERENCES `reimbursements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审批记录表';

-- Approvers table
DROP TABLE IF EXISTS `approvers`;
CREATE TABLE `approvers` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `user_id` INT NOT NULL COMMENT '审批人用户ID',
  `approver_type` ENUM('boss','finance','custom') NOT NULL COMMENT '审批人类型',
  `custom_type_name` VARCHAR(100) COMMENT '自定义类型名称',
  `department_scope` JSON COMMENT '负责部门范围',
  `amount_limit` DECIMAL(12,2) COMMENT '审批金额上限',
  `business_types` JSON COMMENT '可审批的业务类型',
  `delegate_user_id` INT COMMENT '代理审批人ID',
  `delegate_start_date` DATE COMMENT '代理开始日期',
  `delegate_end_date` DATE COMMENT '代理结束日期',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_type` (`user_id`, `approver_type`),
  KEY `idx_approver_type` (`approver_type`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审批人配置表';

-- Role workflows table
DROP TABLE IF EXISTS `role_workflows`;
CREATE TABLE `role_workflows` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `role_id` INT NOT NULL COMMENT '角色ID',
  `workflow_id` INT NOT NULL COMMENT '审批流程ID',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_workflow` (`role_id`, `workflow_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_workflow_id` (`workflow_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色审批流程配置表';

-- Operation logs table
DROP TABLE IF EXISTS `operation_logs`;
CREATE TABLE `operation_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL COMMENT '执行用户ID',
  `username` VARCHAR(50) NULL COMMENT '执行用户名',
  `real_name` VARCHAR(50) NULL COMMENT '执行用户真实姓名',
  `module` VARCHAR(50) NOT NULL COMMENT '所属模块',
  `action` VARCHAR(100) NOT NULL COMMENT '动作/描述',
  `method` VARCHAR(10) NULL COMMENT '请求方法',
  `url` VARCHAR(255) NULL COMMENT '请求路径',
  `params` JSON NULL COMMENT '请求参数',
  `ip` VARCHAR(45) NULL COMMENT '操作IP地址',
  `user_agent` VARCHAR(255) NULL COMMENT '浏览器标识',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态(1:成功, 0:失败)',
  `error_msg` TEXT NULL COMMENT '错误信息',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_module` (`module`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统操作日志表';

-- Chat groups table
DROP TABLE IF EXISTS `chat_groups`;
CREATE TABLE `chat_groups` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `owner_id` INT NOT NULL COMMENT '创建者',
  `type` ENUM('group', 'p2p') DEFAULT 'group',
  `department_id` INT UNIQUE DEFAULT NULL COMMENT '所属部门ID',
  `avatar` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_owner_id` (`owner_id`),
  KEY `idx_department_id` (`department_id`),
  CONSTRAINT `fk_chat_groups_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天群组表';

-- Chat group members table
DROP TABLE IF EXISTS `chat_group_members`;
CREATE TABLE `chat_group_members` (
  `group_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `role` ENUM('admin', 'member') DEFAULT 'member',
  `last_read_message_id` INT DEFAULT 0 COMMENT '最后阅读消息ID',
  `is_muted` TINYINT(1) DEFAULT 0 COMMENT '是否禁言',
  PRIMARY KEY (`group_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_chat_group_members_group` FOREIGN KEY (`group_id`) REFERENCES `chat_groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_group_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群组成员表';

-- Chat messages table
DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sender_id` INT NOT NULL,
  `group_id` INT DEFAULT NULL,
  `receiver_id` INT DEFAULT NULL,
  `content` TEXT,
  `msg_type` ENUM('text', 'image', 'file', 'system') DEFAULT 'text',
  `file_url` VARCHAR(255),
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_sender` (`sender_id`),
  KEY `idx_chat_receiver` (`receiver_id`),
  KEY `idx_chat_group` (`group_id`),
  KEY `idx_chat_time` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天消息表';

-- Assets table
DROP TABLE IF EXISTS `assets`;
CREATE TABLE `assets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `asset_no` VARCHAR(50) UNIQUE NOT NULL COMMENT '资产编号',
  `name` VARCHAR(100) NOT NULL,
  `category_id` INT,
  `model_id` INT COMMENT '设备型号ID',
  `model` VARCHAR(100) COMMENT '型号',
  `serial_number` VARCHAR(100) COMMENT '序列号',
  `status` ENUM('idle', 'in_use', 'maintenance', 'lost', 'scrapped') DEFAULT 'idle',
  `purchase_date` DATE,
  `purchase_price` DECIMAL(10, 2),
  `warranty_expire_date` DATE COMMENT '保修截止日期',
  `supplier` VARCHAR(100),
  `current_user_id` INT DEFAULT NULL COMMENT '当前领用人',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_model_id` (`model_id`),
  KEY `idx_current_user_id` (`current_user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资产主表';

-- Asset assignments table
DROP TABLE IF EXISTS `asset_assignments`;
CREATE TABLE `asset_assignments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `asset_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '领用时间',
  `returned_at` TIMESTAMP NULL COMMENT '归还时间',
  `expected_return_date` DATE COMMENT '预计归还日期',
  `condition_on_assign` TEXT COMMENT '领用时状况',
  `condition_on_return` TEXT COMMENT '归还时状况',
  `assigned_by` INT COMMENT '经办人',
  PRIMARY KEY (`id`),
  KEY `idx_asset_id` (`asset_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_assigned_by` (`assigned_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资产领用归还记录表';

-- Device component mapping table
DROP TABLE IF EXISTS `device_component_mapping`;
CREATE TABLE `device_component_mapping` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `asset_id` INT NOT NULL COMMENT '设备ID',
  `component_id` INT NOT NULL COMMENT '配件ID',
  `bound_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_asset_id` (`asset_id`),
  KEY `idx_component_id` (`component_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备配件映射表';

-- Asset model templates table
DROP TABLE IF EXISTS `asset_model_templates`;
CREATE TABLE `asset_model_templates` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `model_id` INT NOT NULL,
  `component_id` INT NOT NULL,
  `quantity` INT DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_model_component` (`model_id`, `component_id`),
  KEY `idx_model_id` (`model_id`),
  KEY `idx_component_id` (`component_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='型号配件模板表';

-- Asset upgrades table
DROP TABLE IF EXISTS `asset_upgrades`;
CREATE TABLE `asset_upgrades` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `asset_id` INT NOT NULL,
  `component_type_id` INT,
  `old_component_id` INT,
  `new_component_id` INT,
  `change_type` ENUM('upgrade', 'repair', 'replacement', 'initial') DEFAULT 'upgrade',
  `description` VARCHAR(255),
  `reason` TEXT,
  `old_specs` JSON,
  `new_specs` JSON,
  `cost` DECIMAL(10, 2) DEFAULT 0.00,
  `upgrade_date` DATE,
  `handled_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_asset_id` (`asset_id`),
  KEY `idx_handled_by` (`handled_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资产升级记录表';

-- Asset requests table
DROP TABLE IF EXISTS `asset_requests`;
CREATE TABLE `asset_requests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `asset_id` INT NOT NULL,
  `user_id` INT NOT NULL COMMENT '申请人',
  `type` ENUM('upgrade', 'repair') NOT NULL COMMENT '升级或报修',
  `description` TEXT NOT NULL COMMENT '申请描述',
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `status_logic` VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '逻辑删除状态',
  `admin_notes` TEXT COMMENT '管理员回复',
  `handled_by` INT COMMENT '处理人',
  `handled_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_asset_id` (`asset_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资产申请表';

-- Devices table
DROP TABLE IF EXISTS `devices`;
CREATE TABLE `devices` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `asset_no` VARCHAR(50) UNIQUE NOT NULL COMMENT '设备编号',
  `model_id` INT NOT NULL COMMENT '关联设备库型号',
  `current_user_id` INT DEFAULT NULL COMMENT '使用者',
  `device_status` ENUM('idle', 'in_use', 'damaged', 'maintenance', 'scrapped') DEFAULT 'idle',
  `status` VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '逻辑删除状态',
  `purchase_date` DATE,
  `purchase_price` DECIMAL(10, 2),
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_model_id` (`model_id`),
  KEY `idx_current_user_id` (`current_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备表';

-- Device config details table
DROP TABLE IF EXISTS `device_config_details`;
CREATE TABLE `device_config_details` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `device_id` INT NOT NULL COMMENT '关联设备ID',
  `component_type_id` INT NOT NULL COMMENT '配件类型',
  `component_id` INT NOT NULL COMMENT '具体配件规格',
  `quantity` INT DEFAULT 1,
  `change_type` ENUM('initial', 'upgrade', 'downgrade') DEFAULT 'initial',
  `status` VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '逻辑删除',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_device_id` (`device_id`),
  KEY `idx_component_type_id` (`component_type_id`),
  KEY `idx_component_id` (`component_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备配置详情表';

-- Inventory items table
DROP TABLE IF EXISTS `inventory_items`;
CREATE TABLE `inventory_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `category` VARCHAR(50) COMMENT '分类',
  `unit` VARCHAR(20) DEFAULT '个' COMMENT '单位',
  `current_stock` INT DEFAULT 0 COMMENT '当前库存',
  `min_stock_alert` INT DEFAULT 10 COMMENT '最低库存预警',
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存物品定义表';

-- Procurement records table
DROP TABLE IF EXISTS `procurement_records`;
CREATE TABLE `procurement_records` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `item_id` INT NOT NULL,
  `quantity` INT NOT NULL COMMENT '采购数量',
  `price_per_unit` DECIMAL(10, 2) COMMENT '单价',
  `total_price` DECIMAL(10, 2) COMMENT '总价',
  `supplier` VARCHAR(100) COMMENT '供应商',
  `purchase_date` DATE COMMENT '采购日期',
  `batch_no` VARCHAR(50) COMMENT '批次号',
  `purchaser_id` INT COMMENT '采购人',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_item_id` (`item_id`),
  KEY `idx_purchaser_id` (`purchaser_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='采购记录表';

-- Inventory usage table
DROP TABLE IF EXISTS `inventory_usage`;
CREATE TABLE `inventory_usage` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `item_id` INT NOT NULL,
  `quantity` INT NOT NULL COMMENT '消耗数量',
  `user_id` INT COMMENT '领用人',
  `usage_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `purpose` VARCHAR(255) COMMENT '用途',
  PRIMARY KEY (`id`),
  KEY `idx_item_id` (`item_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存领用消耗记录表';

-- Inventory audits table
DROP TABLE IF EXISTS `inventory_audits`;
CREATE TABLE `inventory_audits` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `item_id` INT NOT NULL,
  `expected_stock` INT NOT NULL COMMENT '账面库存',
  `actual_stock` INT NOT NULL COMMENT '实际库存',
  `discrepancy` INT GENERATED ALWAYS AS (`actual_stock` - `expected_stock`) STORED COMMENT '差异',
  `result_status` ENUM('matched', 'missing', 'surplus') DEFAULT 'matched',
  `auditor_id` INT COMMENT '盘点人',
  `audit_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `notes` TEXT COMMENT '异常说明',
  PRIMARY KEY (`id`),
  KEY `idx_item_id` (`item_id`),
  KEY `idx_auditor_id` (`auditor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存盘点表';

-- CRM customers table
DROP TABLE IF EXISTS `crm_customers`;
CREATE TABLE `crm_customers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) UNIQUE COMMENT '客户电话',
  `email` VARCHAR(100),
  `company` VARCHAR(100),
  `level` ENUM('normal', 'vip', 'black') DEFAULT 'normal',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT COMMENT '录入人',
  PRIMARY KEY (`id`),
  KEY `idx_phone` (`phone`),
  KEY `idx_level` (`level`),
  KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CRM客户表';

-- Tickets table
DROP TABLE IF EXISTS `tickets`;
CREATE TABLE `tickets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ticket_no` VARCHAR(50) UNIQUE NOT NULL COMMENT '工单号',
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `customer_id` INT NOT NULL,
  `status` ENUM('open', 'pending', 'resolved', 'closed') DEFAULT 'open',
  `priority` ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  `category` VARCHAR(50) COMMENT '分类',
  `creator_id` INT NOT NULL COMMENT '创建人',
  `assignee_id` INT COMMENT '当前处理人',
  `assignee_dept_id` INT COMMENT '指派部门',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `resolved_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_creator_id` (`creator_id`),
  KEY `idx_assignee_id` (`assignee_id`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单表';

-- Ticket logs table
DROP TABLE IF EXISTS `ticket_logs`;
CREATE TABLE `ticket_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ticket_id` INT NOT NULL,
  `operator_id` INT NOT NULL,
  `action` VARCHAR(50) COMMENT '操作类型',
  `content` TEXT COMMENT '备注或回复内容',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ticket_id` (`ticket_id`),
  KEY `idx_operator_id` (`operator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单流转记录表';

-- Special approval groups table
DROP TABLE IF EXISTS `special_approval_groups`;
CREATE TABLE `special_approval_groups` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '审批组名称',
  `type` VARCHAR(50) NOT NULL COMMENT '审批类型',
  `description` TEXT COMMENT '描述',
  `members` JSON COMMENT '成员用户ID列表',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_by` INT COMMENT '创建人',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='特殊审批组表';

-- =====================================================
-- PHASE 3: Business Tables
-- =====================================================

-- Tags table
DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '标签ID',
  `parent_id` INT DEFAULT NULL COMMENT '父标签ID',
  `level` INT NOT NULL DEFAULT 0 COMMENT '标签层级',
  `path` VARCHAR(500) DEFAULT NULL COMMENT '标签路径',
  `name` VARCHAR(50) NOT NULL COMMENT '标签名称',
  `tag_type` ENUM('quality','case','general') NOT NULL DEFAULT 'general' COMMENT '标签类型',
  `category_id` INT DEFAULT NULL COMMENT '所属分类ID',
  `color` VARCHAR(7) DEFAULT NULL COMMENT '标签颜色',
  `description` TEXT COMMENT '标签描述',
  `usage_count` INT NOT NULL DEFAULT 0 COMMENT '使用次数',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_level` (`level`),
  KEY `idx_path` (`path`(255)),
  KEY `idx_name` (`name`),
  KEY `idx_tag_type` (`tag_type`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_usage_count` (`usage_count`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `fk_tags_category_id` FOREIGN KEY (`category_id`) REFERENCES `tag_categories`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tags_parent_id` FOREIGN KEY (`parent_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表';

-- Quality tags table
DROP TABLE IF EXISTS `quality_tags`;
CREATE TABLE `quality_tags` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '标签ID',
  `name` VARCHAR(50) NOT NULL COMMENT '标签名称',
  `category_id` INT DEFAULT NULL COMMENT '分类ID',
  `color` VARCHAR(20) DEFAULT '#1890ff' COMMENT '标签颜色',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '标签描述',
  `tag_type` ENUM('quality','business','other') NOT NULL DEFAULT 'quality' COMMENT '标签类型',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name_category` (`name`,`category_id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_tag_type` (`tag_type`),
  CONSTRAINT `fk_quality_tags_category_id` FOREIGN KEY (`category_id`) REFERENCES `quality_tag_categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质检标签表';

-- External agents table
DROP TABLE IF EXISTS `external_agents`;
CREATE TABLE `external_agents` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '外部客服ID',
  `name` VARCHAR(100) NOT NULL COMMENT '客服姓名',
  `platform_id` INT NOT NULL COMMENT '所属平台ID',
  `shop_id` INT NOT NULL COMMENT '所属店铺ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name_platform_shop` (`name`,`platform_id`,`shop_id`),
  KEY `idx_platform_id` (`platform_id`),
  KEY `idx_shop_id` (`shop_id`),
  CONSTRAINT `fk_external_agents_platform` FOREIGN KEY (`platform_id`) REFERENCES `platforms`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_external_agents_shop` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='外部客服表';

-- Customers table
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '客户ID',
  `customer_id` VARCHAR(50) NOT NULL COMMENT '客户ID（外部系统）',
  `name` VARCHAR(100) DEFAULT NULL COMMENT '客户姓名',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '电子邮箱',
  `platform_id` INT DEFAULT NULL COMMENT '所属平台ID',
  `shop_id` INT DEFAULT NULL COMMENT '所属店铺ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_customer_platform_shop` (`customer_id`,`platform_id`,`shop_id`),
  KEY `idx_name` (`name`),
  KEY `idx_phone` (`phone`),
  KEY `idx_platform_shop` (`platform_id`,`shop_id`),
  CONSTRAINT `fk_customers_platform` FOREIGN KEY (`platform_id`) REFERENCES `platforms`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_customers_shop` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户表';

-- Exams table
DROP TABLE IF EXISTS `exams`;
CREATE TABLE `exams` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '试卷唯一标识ID',
  `title` VARCHAR(200) NOT NULL COMMENT '试卷标题',
  `description` TEXT COMMENT '试卷详细描述',
  `category` VARCHAR(50) DEFAULT NULL COMMENT '试卷分类',
  `category_id` INT DEFAULT NULL,
  `difficulty` ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium' COMMENT '难度等级',
  `duration` INT NOT NULL COMMENT '考试时长(分钟)',
  `total_score` DECIMAL(5,2) NOT NULL COMMENT '试卷总分',
  `pass_score` DECIMAL(5,2) NOT NULL COMMENT '及格分数',
  `question_count` INT NOT NULL DEFAULT 0 COMMENT '题目总数',
  `status` ENUM('draft','published','archived') NOT NULL DEFAULT 'draft' COMMENT '试卷状态',
  `questions` LONGTEXT COMMENT '题目JSON',
  `created_by` INT DEFAULT NULL COMMENT '创建人用户ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_title` (`title`),
  KEY `idx_category` (`category`),
  KEY `idx_difficulty` (`difficulty`),
  KEY `idx_status` (`status`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_exams_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='试卷表';

-- Questions table
DROP TABLE IF EXISTS `questions`;
CREATE TABLE `questions` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '题目唯一标识ID',
  `exam_id` INT NOT NULL COMMENT '所属试卷ID',
  `type` ENUM('single_choice','multiple_choice','true_false','fill_blank','essay') NOT NULL COMMENT '题型',
  `content` TEXT NOT NULL COMMENT '题目内容',
  `options` JSON DEFAULT NULL COMMENT '选项内容',
  `correct_answer` TEXT NOT NULL COMMENT '正确答案',
  `score` DECIMAL(5,2) NOT NULL COMMENT '题目分值',
  `explanation` TEXT COMMENT '答案解析',
  `order_num` INT NOT NULL DEFAULT 0 COMMENT '题目排序号',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_exam_id` (`exam_id`),
  KEY `idx_type` (`type`),
  KEY `idx_order_num` (`order_num`),
  CONSTRAINT `fk_questions_exam_id` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='题目表';

-- Assessment plans table
DROP TABLE IF EXISTS `assessment_plans`;
CREATE TABLE `assessment_plans` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '考核计划唯一标识ID',
  `title` VARCHAR(200) NOT NULL COMMENT '计划标题',
  `description` TEXT COMMENT '计划详细描述',
  `exam_id` INT NOT NULL COMMENT '关联的试卷ID',
  `target_users` JSON DEFAULT NULL COMMENT '目标用户列表',
  `target_departments` JSON DEFAULT NULL COMMENT '目标部门ID列表',
  `start_time` DATETIME NOT NULL COMMENT '考核开始时间',
  `end_time` DATETIME NOT NULL COMMENT '考核结束时间',
  `max_attempts` INT NOT NULL DEFAULT 1 COMMENT '最大尝试次数',
  `status` ENUM('draft','published','ongoing','completed','cancelled') NOT NULL DEFAULT 'draft' COMMENT '计划状态',
  `is_deleted` TINYINT(1) DEFAULT 0,
  `created_by` INT DEFAULT NULL COMMENT '创建人用户ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_exam_id` (`exam_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_assessment_plans_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_assessment_plans_exam_id` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考核计划表';

-- Assessment results table
DROP TABLE IF EXISTS `assessment_results`;
CREATE TABLE `assessment_results` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '考核结果唯一标识ID',
  `plan_id` INT NOT NULL COMMENT '考核计划ID',
  `exam_id` INT NOT NULL COMMENT '试卷ID',
  `user_id` INT NOT NULL COMMENT '考试用户ID',
  `attempt_number` INT NOT NULL DEFAULT 1 COMMENT '尝试次数',
  `start_time` DATETIME NOT NULL COMMENT '考试开始时间',
  `submit_time` DATETIME DEFAULT NULL COMMENT '提交时间',
  `duration` INT DEFAULT NULL COMMENT '实际用时(秒)',
  `score` DECIMAL(5,2) DEFAULT NULL COMMENT '考试得分',
  `is_passed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否通过',
  `status` ENUM('in_progress','submitted','graded','expired') NOT NULL DEFAULT 'in_progress' COMMENT '考试状态',
  `answers` JSON DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_plan_id` (`plan_id`),
  KEY `idx_exam_id` (`exam_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_assessment_results_exam_id` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assessment_results_plan_id` FOREIGN KEY (`plan_id`) REFERENCES `assessment_plans`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assessment_results_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考核结果表';

-- Answer records table
DROP TABLE IF EXISTS `answer_records`;
CREATE TABLE `answer_records` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '答题记录唯一标识ID',
  `result_id` INT NOT NULL COMMENT '考核结果ID',
  `question_id` VARCHAR(255) NOT NULL COMMENT '题目ID',
  `user_answer` TEXT COMMENT '用户答案',
  `is_correct` TINYINT(1) DEFAULT NULL COMMENT '是否正确',
  `score` DECIMAL(5,2) DEFAULT NULL COMMENT '该题得分',
  `time_spent` INT DEFAULT NULL COMMENT '答题用时(秒)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_result_question` (`result_id`,`question_id`),
  KEY `idx_result_id` (`result_id`),
  CONSTRAINT `fk_answer_records_result_id` FOREIGN KEY (`result_id`) REFERENCES `assessment_results`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='答题记录表';

-- Quality rules table
DROP TABLE IF EXISTS `quality_rules`;
CREATE TABLE `quality_rules` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '质检规则ID',
  `name` VARCHAR(100) NOT NULL COMMENT '规则名称',
  `category` VARCHAR(50) NOT NULL COMMENT '规则分类',
  `description` TEXT COMMENT '规则描述',
  `criteria` JSON NOT NULL COMMENT '评判标准',
  `score_weight` DECIMAL(5,2) NOT NULL COMMENT '分数权重',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_by` INT DEFAULT NULL COMMENT '创建人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_category` (`category`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `fk_quality_rules_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质检规则表';

-- Quality sessions table
DROP TABLE IF EXISTS `quality_sessions`;
CREATE TABLE `quality_sessions` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '质检会话ID',
  `session_no` VARCHAR(50) NOT NULL COMMENT '会话编号',
  `agent_id` INT DEFAULT NULL COMMENT '客服人员ID',
  `external_agent_id` INT DEFAULT NULL COMMENT '外部客服ID',
  `agent_name` VARCHAR(100) DEFAULT NULL COMMENT '客服姓名',
  `customer_id` VARCHAR(50) DEFAULT NULL COMMENT '客户ID',
  `customer_name` VARCHAR(100) DEFAULT NULL COMMENT '客户姓名',
  `channel` ENUM('chat','phone','email','video') NOT NULL DEFAULT 'chat' COMMENT '沟通渠道',
  `start_time` DATETIME NOT NULL COMMENT '会话开始时间',
  `end_time` DATETIME NOT NULL COMMENT '会话结束时间',
  `duration` INT NOT NULL COMMENT '会话时长(秒)',
  `message_count` INT NOT NULL DEFAULT 0 COMMENT '消息总数',
  `status` ENUM('pending','in_review','completed','disputed') NOT NULL DEFAULT 'pending' COMMENT '质检状态',
  `inspector_id` INT DEFAULT NULL COMMENT '质检员ID',
  `score` DECIMAL(5,2) DEFAULT NULL COMMENT '质检总分',
  `grade` VARCHAR(20) DEFAULT NULL COMMENT '质检等级',
  `comment` TEXT COMMENT '质检评语',
  `reviewed_at` DATETIME DEFAULT NULL COMMENT '质检完成时间',
  `platform_id` INT DEFAULT NULL COMMENT '平台ID',
  `shop_id` INT DEFAULT NULL COMMENT '店铺ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_session_no` (`session_no`),
  KEY `idx_agent_id` (`agent_id`),
  KEY `idx_external_agent_id` (`external_agent_id`),
  KEY `idx_status` (`status`),
  KEY `idx_platform_id` (`platform_id`),
  KEY `idx_shop_id` (`shop_id`),
  CONSTRAINT `fk_quality_sessions_agent_id` FOREIGN KEY (`agent_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_quality_sessions_external_agent_id` FOREIGN KEY (`external_agent_id`) REFERENCES `external_agents`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_quality_sessions_inspector_id` FOREIGN KEY (`inspector_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_quality_sessions_platform_id` FOREIGN KEY (`platform_id`) REFERENCES `platforms`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_quality_sessions_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质检会话表';

-- Session messages table
DROP TABLE IF EXISTS `session_messages`;
CREATE TABLE `session_messages` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `session_id` INT NOT NULL COMMENT '所属会话ID',
  `sender_type` ENUM('agent','customer','system') NOT NULL COMMENT '发送者类型',
  `sender_id` VARCHAR(50) NOT NULL COMMENT '发送者ID',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `content_type` ENUM('text','image','file','audio','video') NOT NULL DEFAULT 'text' COMMENT '内容类型',
  `timestamp` DATETIME NOT NULL COMMENT '消息时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_sender_type` (`sender_type`),
  KEY `idx_timestamp` (`timestamp`),
  CONSTRAINT `fk_session_messages_session_id` FOREIGN KEY (`session_id`) REFERENCES `quality_sessions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话消息表';

-- Quality scores table
DROP TABLE IF EXISTS `quality_scores`;
CREATE TABLE `quality_scores` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '评分记录ID',
  `session_id` INT NOT NULL COMMENT '会话ID',
  `rule_id` INT NOT NULL COMMENT '规则ID',
  `score` DECIMAL(5,2) NOT NULL COMMENT '得分',
  `max_score` DECIMAL(5,2) DEFAULT NULL COMMENT '满分',
  `comment` TEXT COMMENT '评分说明',
  `created_by` INT DEFAULT NULL COMMENT '评分人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_session_rule` (`session_id`,`rule_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_rule_id` (`rule_id`),
  CONSTRAINT `fk_quality_scores_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_quality_scores_rule_id` FOREIGN KEY (`rule_id`) REFERENCES `quality_rules`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_quality_scores_session_id` FOREIGN KEY (`session_id`) REFERENCES `quality_sessions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质检评分表';

-- Quality cases table
DROP TABLE IF EXISTS `quality_cases`;
CREATE TABLE `quality_cases` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(200) NOT NULL,
  `category` VARCHAR(50) DEFAULT NULL,
  `description` TEXT,
  `problem` TEXT NOT NULL,
  `solution` TEXT NOT NULL,
  `case_type` ENUM('excellent','good','poor','warning') NOT NULL DEFAULT 'excellent',
  `difficulty` ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
  `priority` ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `status` ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  `session_id` INT DEFAULT NULL,
  `view_count` INT NOT NULL DEFAULT 0,
  `like_count` INT NOT NULL DEFAULT 0,
  `collect_count` INT NOT NULL DEFAULT 0,
  `comment_count` INT NOT NULL DEFAULT 0,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `is_recommended` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME DEFAULT NULL,
  `created_by` INT DEFAULT NULL,
  `updated_by` INT DEFAULT NULL,
  `published_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_case_type` (`case_type`),
  KEY `idx_status` (`status`),
  KEY `idx_deleted_at` (`deleted_at`),
  FULLTEXT KEY `ft_case_search` (`title`,`description`,`problem`,`solution`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质检案例表';

-- Cases table
DROP TABLE IF EXISTS `cases`;
CREATE TABLE `cases` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '案例唯一标识ID',
  `title` VARCHAR(200) NOT NULL COMMENT '案例标题',
  `category` VARCHAR(50) DEFAULT NULL COMMENT '案例分类',
  `description` TEXT NOT NULL COMMENT '案例详细描述',
  `problem` TEXT NOT NULL COMMENT '问题描述',
  `solution` TEXT NOT NULL COMMENT '解决方案',
  `difficulty` ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium' COMMENT '难度等级',
  `priority` ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium' COMMENT '优先级',
  `status` ENUM('draft','published','archived') NOT NULL DEFAULT 'draft' COMMENT '状态',
  `view_count` INT NOT NULL DEFAULT 0 COMMENT '浏览次数',
  `like_count` INT NOT NULL DEFAULT 0 COMMENT '点赞次数',
  `created_by` INT DEFAULT NULL COMMENT '创建人用户ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_status` (`status`),
  KEY `idx_created_by` (`created_by`),
  FULLTEXT KEY `ft_content_search` (`title`,`description`,`problem`,`solution`),
  CONSTRAINT `fk_cases_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='案例表';

-- Case tags table
DROP TABLE IF EXISTS `case_tags`;
CREATE TABLE `case_tags` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '关联记录唯一标识ID',
  `case_id` INT NOT NULL COMMENT '案例ID',
  `tag_id` INT NOT NULL COMMENT '标签ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_case_tag` (`case_id`,`tag_id`),
  KEY `idx_case_id` (`case_id`),
  KEY `idx_tag_id` (`tag_id`),
  CONSTRAINT `fk_case_tags_case_id` FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_case_tags_tag_id` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='案例标签关联表';

-- Knowledge articles table
DROP TABLE IF EXISTS `knowledge_articles`;
CREATE TABLE `knowledge_articles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(300) NOT NULL,
  `summary` VARCHAR(1000) DEFAULT NULL,
  `content` MEDIUMTEXT,
  `attachments` MEDIUMTEXT,
  `category_id` BIGINT UNSIGNED DEFAULT NULL,
  `owner_id` BIGINT UNSIGNED DEFAULT NULL,
  `original_article_id` BIGINT UNSIGNED DEFAULT NULL,
  `type` ENUM('common','personal') NOT NULL DEFAULT 'common',
  `is_public` TINYINT NOT NULL DEFAULT 1,
  `status` ENUM('draft','published','archived','deleted') NOT NULL DEFAULT 'published',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `view_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `like_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `notes` TEXT,
  `icon` VARCHAR(50) DEFAULT NULL,
  `created_by` BIGINT UNSIGNED DEFAULT NULL,
  `updated_by` BIGINT UNSIGNED DEFAULT NULL,
  `deleted_by` BIGINT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_art_category` (`category_id`),
  KEY `idx_art_owner` (`owner_id`),
  KEY `idx_art_type` (`type`),
  KEY `idx_art_status` (`status`),
  KEY `idx_art_deleted` (`is_deleted`),
  CONSTRAINT `fk_art_category` FOREIGN KEY (`category_id`) REFERENCES `knowledge_categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识库文章表';

-- =====================================================
-- PHASE 4: Attendance & Leave Tables
-- =====================================================

-- Attendance records table
DROP TABLE IF EXISTS `attendance_records`;
CREATE TABLE `attendance_records` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '考勤记录唯一标识ID',
  `user_id` INT NOT NULL COMMENT '员工用户ID',
  `employee_id` INT NOT NULL COMMENT '员工ID',
  `attendance_date` DATE NOT NULL COMMENT '考勤日期',
  `record_date` DATE NOT NULL COMMENT '记录日期',
  `check_in_time` DATETIME DEFAULT NULL COMMENT '签到时间',
  `check_out_time` DATETIME DEFAULT NULL COMMENT '签退时间',
  `clock_in_time` DATETIME DEFAULT NULL COMMENT '打卡上班时间',
  `clock_out_time` DATETIME DEFAULT NULL COMMENT '打卡下班时间',
  `clock_in_location` VARCHAR(255) DEFAULT NULL,
  `clock_out_location` VARCHAR(255) DEFAULT NULL,
  `work_hours` DECIMAL(5,2) DEFAULT NULL COMMENT '实际工作时长',
  `overtime_hours` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '加班时长',
  `is_overtime` TINYINT(1) DEFAULT 0 COMMENT '是否加班',
  `status` ENUM('normal','late','early_leave','absent','overtime') NOT NULL DEFAULT 'normal' COMMENT '考勤状态',
  `note` TEXT COMMENT '考勤备注',
  `remark` VARCHAR(500) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_date` (`user_id`,`attendance_date`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_attendance_date` (`attendance_date`),
  KEY `idx_status` (`status`),
  KEY `idx_employee_date` (`employee_id`,`record_date`),
  CONSTRAINT `fk_attendance_records_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考勤记录表';

-- Leave records table
DROP TABLE IF EXISTS `leave_records`;
CREATE TABLE `leave_records` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '请假记录唯一标识ID',
  `user_id` INT NOT NULL COMMENT '请假员工用户ID',
  `employee_id` INT NOT NULL COMMENT '员工ID',
  `leave_type` ENUM('sick','annual','personal','maternity','other') NOT NULL COMMENT '请假类型',
  `start_date` DATE NOT NULL COMMENT '请假开始日期',
  `end_date` DATE NOT NULL COMMENT '请假结束日期',
  `days` DECIMAL(5,2) NOT NULL COMMENT '请假天数',
  `reason` TEXT NOT NULL COMMENT '请假原因',
  `status` ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending' COMMENT '审批状态',
  `approver_id` INT DEFAULT NULL COMMENT '审批人ID',
  `approved_at` DATETIME DEFAULT NULL COMMENT '审批时间',
  `approval_note` VARCHAR(500) DEFAULT NULL,
  `attachments` JSON DEFAULT NULL,
  `use_converted_leave` TINYINT(1) DEFAULT 0 COMMENT '是否使用转换假期',
  `used_conversion_days` DECIMAL(10,2) DEFAULT 0 COMMENT '使用的转换假期天数',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_leave_type` (`leave_type`),
  KEY `idx_status` (`status`),
  KEY `idx_employee` (`employee_id`),
  CONSTRAINT `fk_leave_records_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_leave_records_approved_by` FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='请假记录表';

-- Vacation balances table
DROP TABLE IF EXISTS `vacation_balances`;
CREATE TABLE `vacation_balances` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `employee_id` INT NOT NULL COMMENT '员工ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `year` INT NOT NULL COMMENT '年度',
  `annual_leave_total` DECIMAL(5,2) DEFAULT 5.00 COMMENT '年假总额度',
  `annual_leave_used` DECIMAL(5,2) DEFAULT 0.00 COMMENT '年假已用',
  `sick_leave_total` DECIMAL(5,2) DEFAULT 10.00 COMMENT '病假总额度',
  `sick_leave_used` DECIMAL(5,2) DEFAULT 0.00 COMMENT '病假已用',
  `compensatory_leave_total` DECIMAL(5,2) DEFAULT 0.00 COMMENT '调休总额度',
  `compensatory_leave_used` DECIMAL(5,2) DEFAULT 0.00 COMMENT '调休已用',
  `overtime_leave_total` DECIMAL(5,1) DEFAULT 0.0,
  `overtime_leave_used` DECIMAL(5,1) DEFAULT 0.0,
  `overtime_hours_total` DECIMAL(6,2) DEFAULT 0.00 COMMENT '加班总时长',
  `overtime_hours_converted` DECIMAL(6,2) DEFAULT 0.00 COMMENT '已转调休的加班时长',
  `total_days` DECIMAL(5,2) DEFAULT 0.00 COMMENT '总假期天数',
  `expiry_date` DATE DEFAULT NULL,
  `last_updated` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_employee_year` (`employee_id`,`year`),
  KEY `idx_user_year` (`user_id`,`year`),
  KEY `idx_year` (`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='假期余额表';

-- Overtime records table
DROP TABLE IF EXISTS `overtime_records`;
CREATE TABLE `overtime_records` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `employee_id` INT NOT NULL COMMENT '员工ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `overtime_date` DATE NOT NULL COMMENT '加班日期',
  `start_time` DATETIME NOT NULL COMMENT '开始时间',
  `end_time` DATETIME NOT NULL COMMENT '结束时间',
  `hours` DECIMAL(4,2) NOT NULL COMMENT '加班时长',
  `reason` VARCHAR(500) DEFAULT NULL COMMENT '加班原因',
  `status` ENUM('pending','approved','rejected') DEFAULT 'pending' COMMENT '状态',
  `approver_id` INT DEFAULT NULL COMMENT '审批人ID',
  `approved_at` DATETIME DEFAULT NULL COMMENT '审批时间',
  `approval_note` VARCHAR(500) DEFAULT NULL COMMENT '审批备注',
  `is_compensated` TINYINT(1) DEFAULT 0 COMMENT '是否已调休',
  `compensated_at` DATETIME DEFAULT NULL COMMENT '调休时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee` (`employee_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_overtime_date` (`overtime_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='加班记录表';

-- Schedules table
DROP TABLE IF EXISTS `schedules`;
CREATE TABLE `schedules` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '排班记录唯一标识ID',
  `user_id` INT NOT NULL COMMENT '员工用户ID',
  `shift_id` INT NOT NULL COMMENT '班次ID',
  `schedule_date` DATE NOT NULL COMMENT '排班日期',
  `status` ENUM('normal','leave','holiday','overtime') NOT NULL DEFAULT 'normal' COMMENT '排班状态',
  `note` TEXT COMMENT '排班备注',
  `created_by` INT DEFAULT NULL COMMENT '排班创建人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_date` (`user_id`,`schedule_date`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_shift_id` (`shift_id`),
  KEY `idx_schedule_date` (`schedule_date`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_schedules_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedules_shift_id` FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedules_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='排班表';

-- Shift schedules table
DROP TABLE IF EXISTS `shift_schedules`;
CREATE TABLE `shift_schedules` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `employee_id` INT NOT NULL COMMENT '员工ID',
  `shift_id` INT DEFAULT NULL COMMENT '班次ID',
  `schedule_date` DATE NOT NULL COMMENT '排班日期',
  `is_rest_day` TINYINT(1) DEFAULT 0 COMMENT '是否休息日',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_employee_date` (`employee_id`,`schedule_date`),
  KEY `idx_employee` (`employee_id`),
  KEY `idx_shift` (`shift_id`),
  KEY `idx_schedule_date` (`schedule_date`),
  CONSTRAINT `fk_shift_schedules_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shift_schedules_shift` FOREIGN KEY (`shift_id`) REFERENCES `work_shifts`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='排班表';

-- =====================================================
-- PHASE 5: Chat & Messaging Tables
-- =====================================================

-- Conversations table
DROP TABLE IF EXISTS `conversations`;
CREATE TABLE `conversations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` ENUM('single','group','room') NOT NULL,
  `name` VARCHAR(255) DEFAULT NULL,
  `avatar` VARCHAR(255) DEFAULT NULL,
  `description` TEXT,
  `creator_id` INT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_conv_type` (`type`),
  KEY `idx_conv_creator` (`creator_id`),
  CONSTRAINT `fk_conversations_creator` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='会话表';

-- Conversation members table
DROP TABLE IF EXISTS `conversation_members`;
CREATE TABLE `conversation_members` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` BIGINT UNSIGNED NOT NULL,
  `user_id` INT NOT NULL,
  `role` ENUM('member','admin','owner') NOT NULL DEFAULT 'member',
  `is_pinned` TINYINT(1) NOT NULL DEFAULT 0,
  `is_muted` TINYINT(1) NOT NULL DEFAULT 0,
  `unread_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `last_read_message_id` BIGINT UNSIGNED DEFAULT NULL,
  `joined_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `left_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conv_member` (`conversation_id`,`user_id`),
  KEY `idx_conv_member_conv` (`conversation_id`),
  KEY `idx_conv_member_user` (`user_id`),
  CONSTRAINT `fk_conv_members_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_conv_members_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='会话成员表';

-- Messages table
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` BIGINT UNSIGNED NOT NULL,
  `sender_id` INT NOT NULL,
  `recipient_id` INT DEFAULT NULL,
  `content` TEXT NOT NULL,
  `message_type` VARCHAR(50) NOT NULL,
  `file_url` VARCHAR(255) DEFAULT NULL,
  `file_name` VARCHAR(255) DEFAULT NULL,
  `file_size` INT DEFAULT NULL,
  `reply_to_message_id` BIGINT UNSIGNED DEFAULT NULL,
  `is_recalled` TINYINT(1) DEFAULT 0,
  `recalled_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_sender_id` (`sender_id`),
  CONSTRAINT `fk_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';

-- Notifications table
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `type` VARCHAR(50) NOT NULL COMMENT '通知类型',
  `title` VARCHAR(200) NOT NULL COMMENT '通知标题',
  `content` TEXT COMMENT '通知内容',
  `related_id` INT DEFAULT NULL COMMENT '关联记录ID',
  `related_type` VARCHAR(50) DEFAULT NULL COMMENT '关联对象类型',
  `is_read` TINYINT(1) DEFAULT 0 COMMENT '是否已读',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_related` (`related_type`,`related_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='消息通知表';

-- =====================================================
-- PHASE 6: Seed Data
-- =====================================================

-- Insert default platforms
INSERT INTO `platforms` (`name`) VALUES
('淘宝'), ('京东'), ('拼多多')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Insert default department
INSERT INTO `departments` (`name`, `description`, `status`, `sort_order`) VALUES
('管理部', '系统管理部门，负责系统管理和维护', 'active', 1)
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- Insert default roles
INSERT INTO `roles` (`name`, `description`, `level`, `is_system`) VALUES
('超级管理员', '系统最高权限角色，拥有所有功能的访问和管理权限', 100, 1),
('普通员工', '系统默认基础角色，拥有基本查看权限', 1, 1)
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- Insert permissions
INSERT INTO `permissions` (`name`, `code`, `resource`, `action`, `module`, `description`) VALUES
-- 系统管理
('查看角色', 'system:role:view', 'role', 'view', 'system', '查看角色列表'),
('管理角色', 'system:role:manage', 'role', 'manage', 'system', '新增、编辑、删除角色及配置权限'),
('查看日志', 'system:log:view', 'log', 'view', 'system', '查看系统操作日志'),
-- 员工管理
('查看员工', 'user:employee:view', 'employee', 'view', 'user', '查看员工列表及详情'),
('管理员工', 'user:employee:manage', 'employee', 'manage', 'user', '新增、编辑、删除员工'),
('员工审核', 'user:audit:manage', 'audit', 'manage', 'user', '审核新注册员工'),
('重置密码', 'user:security:reset_password', 'security', 'reset_password', 'user', '重置员工密码'),
('部门备忘', 'user:memo:manage', 'memo', 'manage', 'user', '管理部门备忘录'),
-- 组织架构
('查看部门', 'org:department:view', 'department', 'view', 'organization', '查看部门架构'),
('管理部门', 'org:department:manage', 'department', 'manage', 'organization', '新增、编辑、删除部门'),
('查看职位', 'org:position:view', 'position', 'view', 'organization', '查看职位列表'),
('管理职位', 'org:position:manage', 'position', 'manage', 'organization', '新增、编辑、删除职位'),
-- 信息系统
('查看广播', 'messaging:broadcast:view', 'broadcast', 'view', 'messaging', '查看系统广播'),
('发布广播', 'messaging:broadcast:manage', 'broadcast', 'manage', 'messaging', '发布、管理系统广播'),
('通知设置', 'messaging:config:manage', 'config', 'manage', 'messaging', '配置系统通知规则'),
-- 考勤管理
('查看考勤', 'attendance:record:view', 'record', 'view', 'attendance', '查看考勤记录'),
('考勤统计', 'attendance:report:view', 'report', 'view', 'attendance', '查看考勤统计报表'),
('考勤设置', 'attendance:config:manage', 'config', 'manage', 'attendance', '修改考勤规则、班次、排班'),
('考勤审批', 'attendance:approval:manage', 'approval', 'manage', 'attendance', '审批请假、加班、补卡申请'),
('排班管理', 'attendance:schedule:manage', 'schedule', 'manage', 'attendance', '管理员工排班'),
-- 假期管理
('查看假期', 'vacation:record:view', 'record', 'view', 'vacation', '查看假期余额及记录'),
('假期配置', 'vacation:config:manage', 'config', 'manage', 'vacation', '配置假期规则及额度'),
('假期审批', 'vacation:approval:manage', 'approval', 'manage', 'vacation', '审批调休申请'),
-- 质检管理
('查看质检', 'quality:session:view', 'session', 'view', 'quality', '查看质检会话及记录'),
('质检评分', 'quality:score:manage', 'score', 'manage', 'quality', '进行质检评分'),
('质检配置', 'quality:config:manage', 'config', 'manage', 'quality', '配置质检规则、标签、平台店铺'),
('案例管理', 'quality:case:manage', 'case', 'manage', 'quality', '管理质检案例库'),
-- 知识库
('查看知识库', 'knowledge:article:view', 'article', 'view', 'knowledge', '查看公共知识库'),
('管理知识库', 'knowledge:article:manage', 'article', 'manage', 'knowledge', '发布、编辑、删除知识库文章'),
-- 考核系统
('查看考核', 'assessment:plan:view', 'plan', 'view', 'assessment', '查看考核计划及试卷'),
('管理考核', 'assessment:plan:manage', 'plan', 'manage', 'assessment', '创建试卷、发布考核计划'),
('查看成绩', 'assessment:result:view', 'result', 'view', 'assessment', '查看所有员工考试成绩'),
-- 资产管理
('查看资产', 'finance:asset:view', 'asset', 'view', 'finance', '查看固定资产列表'),
('管理资产', 'finance:asset:manage', 'asset', 'manage', 'finance', '新增、编辑、分配、报废资产'),
-- 聊天系统
('使用聊天', 'chat:message:send', 'message', 'send', 'chat', '发送聊天消息'),
('管理聊天', 'chat:room:manage', 'room', 'manage', 'chat', '管理聊天室和群组')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- Insert case categories
INSERT INTO `case_categories` (`name`, `description`, `sort_order`) VALUES
('投诉处理', '客户投诉相关案例', 1),
('业务咨询', '业务咨询相关案例', 2),
('售后服务', '售后服务相关案例', 3),
('VIP服务', 'VIP客户服务案例', 4),
('危机处理', '危机处理相关案例', 5)
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- Insert asset categories
INSERT INTO `asset_categories` (`name`, `code`, `description`) VALUES
('电脑设备', 'COMPUTER', '笔记本、台式机、显示器'),
('办公外设', 'PERIPHERAL', '键盘、鼠标、耳机、打印机'),
('办公家具', 'FURNITURE', '桌椅、柜子'),
('移动设备', 'MOBILE', '测试手机、平板')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- Seed asset device forms
INSERT INTO `asset_device_forms` (`name`, `icon`) VALUES
('笔记本电脑', 'laptop'),
('台式工作站', 'monitor'),
('机架式服务器', 'server'),
('平板电脑', 'tablet'),
('办公外设', 'keyboard')
ON DUPLICATE KEY UPDATE `icon` = VALUES(`icon`);

-- Seed asset component types
INSERT INTO `asset_component_types` (`name`, `sort_order`, `status`) VALUES
('CPU', 1, 'active'),
('内存', 2, 'active'),
('硬盘', 3, 'active'),
('显卡', 4, 'active'),
('显示器', 5, 'active'),
('外设', 6, 'active'),
('其他', 99, 'active')
ON DUPLICATE KEY UPDATE `sort_order` = VALUES(`sort_order`);

-- Insert default vacation types
INSERT INTO `vacation_types` (`code`, `name`, `base_days`, `included_in_total`, `description`, `enabled`) VALUES
('annual', '年假', 5.00, 1, '年度带薪休假', 1),
('sick', '病假', 10.00, 1, '因病休假', 1),
('personal', '事假', 0.00, 0, '个人事务假期', 1),
('maternity', '产假', 0.00, 0, '生育假期', 1),
('compensatory', '调休', 0.00, 1, '加班调休假期', 1)
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- Insert default work shifts
INSERT INTO `work_shifts` (`name`, `start_time`, `end_time`, `work_hours`, `rest_duration`, `is_active`, `color`) VALUES
('早班', '08:00:00', '17:00:00', 8.0, 60, 1, '#3B82F6'),
('中班', '12:00:00', '21:00:00', 8.0, 60, 1, '#10B981'),
('晚班', '16:00:00', '01:00:00', 8.0, 60, 1, '#8B5CF6')
ON DUPLICATE KEY UPDATE `work_hours` = VALUES(`work_hours`);

-- Assign all permissions to super admin role
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r, `permissions` p
WHERE r.name = '超级管理员'
ON DUPLICATE KEY UPDATE `role_id` = VALUES(`role_id`);

-- Assign basic permissions to regular employee role
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r
JOIN `permissions` p ON p.code IN (
    'user:employee:view',
    'org:department:view',
    'org:position:view',
    'messaging:broadcast:view',
    'attendance:record:view',
    'vacation:record:view',
    'knowledge:article:view',
    'assessment:plan:view',
    'chat:message:send'
)
WHERE r.name = '普通员工'
ON DUPLICATE KEY UPDATE `role_id` = VALUES(`role_id`);

-- Create admin user
-- Password: admin123 (bcrypt hash)
INSERT INTO `users` (`username`, `password_hash`, `real_name`, `email`, `phone`, `department_id`, `status`)
SELECT 'admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '系统管理员', 'admin@leixi.com', '13800138000', d.id, 'active'
FROM `departments` d WHERE d.name = '管理部'
ON DUPLICATE KEY UPDATE `real_name` = VALUES(`real_name`);

-- Assign admin role to admin user
INSERT INTO `user_roles` (`user_id`, `role_id`, `assigned_at`)
SELECT u.id, r.id, NOW()
FROM `users` u, `roles` r
WHERE u.username = 'admin' AND r.name = '超级管理员'
ON DUPLICATE KEY UPDATE `assigned_at` = NOW();

-- Create admin employee record
INSERT INTO `employees` (`user_id`, `employee_no`, `hire_date`, `status`)
SELECT u.id, 'ADMIN001', CURDATE(), 'active'
FROM `users` u WHERE u.username = 'admin'
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

-- Create system management position
INSERT INTO `positions` (`name`, `department_id`, `description`, `level`, `status`, `sort_order`)
SELECT '系统管理员', d.id, '系统最高管理职位，负责系统维护和管理', 'expert', 'active', 1
FROM `departments` d WHERE d.name = '管理部'
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- Insert migration history record
INSERT INTO `migrations_history` (`migration_name`) VALUES
('001_full_install'),
('004_add_exam_categories'),
('017_create_permission_templates_table'),
('018_seed_permissions'),
('021_create_payroll_tables'),
('022_create_reimbursement_tables'),
('023_create_role_workflows_table'),
('028_create_operation_logs_table'),
('030_create_chat_system'),
('032_create_asset_management'),
('034_inventory_system'),
('035_ticket_crm_system'),
('041_create_special_approval_groups'),
('043_add_asset_forms_and_fix_logic'),
('048_logistics_device_system'),
('050_add_missing_tables'),
('leixi_init_schema_v1.0.0')
ON DUPLICATE KEY UPDATE `applied_at` = CURRENT_TIMESTAMP;

-- =====================================================
-- PHASE 7: Restore Settings & Finalize
-- =====================================================

SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
SET SQL_MODE=@OLD_SQL_MODE;
SET TIME_ZONE=@OLD_TIME_ZONE;
SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT;
SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS;
SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION;
SET SQL_NOTES=@OLD_SQL_NOTES;

-- =====================================================
-- Initialization Complete
-- =====================================================
-- Default Admin Account:
--   Username: admin
--   Password: admin123
-- =====================================================

SELECT 'LeiXi System database initialization completed successfully!' AS Status;
SELECT 'Default admin account: admin / admin123' AS Info;
