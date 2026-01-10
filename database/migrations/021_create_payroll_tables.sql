-- 021_create_payroll_tables.sql
-- 创建工资条管理相关表

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. 工资条主表 (payslips)
-- ============================================================
DROP TABLE IF EXISTS `payslips`;
CREATE TABLE `payslips` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '工资条唯一标识ID',
  `payslip_no` VARCHAR(50) NOT NULL COMMENT '工资条编号，格式：PS-YYYYMM-序号',
  `employee_id` INT NOT NULL COMMENT '员工ID，关联employees表',
  `user_id` INT NOT NULL COMMENT '用户ID，关联users表',
  `salary_month` DATE NOT NULL COMMENT '工资所属月份，格式：YYYY-MM-01',
  `payment_date` DATE NULL COMMENT '发放日期',
  
  -- 考勤统计（从考勤系统获取）
  `attendance_days` DECIMAL(5,2) DEFAULT 0.00 COMMENT '出勤天数',
  `late_count` INT DEFAULT 0 COMMENT '迟到次数',
  `early_leave_count` INT DEFAULT 0 COMMENT '早退次数',
  `leave_days` DECIMAL(5,2) DEFAULT 0.00 COMMENT '请假天数',
  `overtime_hours` DECIMAL(6,2) DEFAULT 0.00 COMMENT '加班时长（小时）',
  `absent_days` DECIMAL(5,2) DEFAULT 0.00 COMMENT '缺勤天数',
  
  -- 工资明细
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
  `net_salary` DECIMAL(10,2) NOT NULL COMMENT '实发工资（自动计算）',
  
  -- 状态与备注
  `status` ENUM('draft', 'sent', 'viewed', 'confirmed') NOT NULL DEFAULT 'draft' COMMENT '状态：草稿、已发放、已查看、已确认',
  `remark` TEXT NULL COMMENT '备注信息',
  `custom_fields` JSON NULL COMMENT '自定义字段数据，存储额外的工资项目',
  
  -- 发放信息
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
  KEY `idx_status` (`status`),
  KEY `idx_issued_by` (`issued_by`),
  KEY `idx_issued_at` (`issued_at`),
  CONSTRAINT `fk_payslips_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payslips_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payslips_issued_by` FOREIGN KEY (`issued_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工资条表-存储员工工资条信息';

-- ============================================================
-- 2. 工资条模板配置表 (payslip_templates)
-- ============================================================
DROP TABLE IF EXISTS `payslip_templates`;
CREATE TABLE `payslip_templates` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '模板ID',
  `template_name` VARCHAR(100) NOT NULL COMMENT '模板名称',
  `template_code` VARCHAR(50) NOT NULL COMMENT '模板代码，唯一标识',
  `is_default` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否默认模板',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  
  -- 字段配置（JSON格式）
  `field_config` JSON NOT NULL COMMENT '字段配置，包含字段名、显示名、是否显示、排序等',
  
  -- 模板说明
  `description` TEXT NULL COMMENT '模板描述',
  
  `created_by` INT NULL COMMENT '创建人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_template_code` (`template_code`),
  KEY `idx_is_default` (`is_default`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `fk_payslip_templates_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工资条模板配置表';

-- ============================================================
-- 3. 工资条发放配置表 (payslip_distribution_settings)
-- ============================================================
DROP TABLE IF EXISTS `payslip_distribution_settings`;
CREATE TABLE `payslip_distribution_settings` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `setting_name` VARCHAR(100) NOT NULL COMMENT '配置名称',
  `frequency` ENUM('monthly', 'weekly', 'daily') NOT NULL DEFAULT 'monthly' COMMENT '发放频率',
  `distribution_day` INT NULL COMMENT '发放日（月中的第几天，1-31）',
  `distribution_weekday` INT NULL COMMENT '发放周几（1-7，周一到周日）',
  `distribution_time` TIME NULL COMMENT '发放时间',
  `auto_send` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否自动发放',
  
  -- 发放范围
  `target_departments` JSON NULL COMMENT '目标部门ID列表',
  `target_positions` JSON NULL COMMENT '目标职位列表',
  `target_employees` JSON NULL COMMENT '目标员工ID列表',
  
  -- 通知设置
  `notify_internal` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否发送站内信',
  `notify_sms` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否发送短信',
  `notify_email` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否发送邮件',
  
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_by` INT NULL COMMENT '创建人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `fk_distribution_settings_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工资条发放配置表';

-- ============================================================
-- 4. 二级密码表 (payslip_passwords)
-- ============================================================
DROP TABLE IF EXISTS `payslip_passwords`;
CREATE TABLE `payslip_passwords` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '二级密码哈希值',
  `is_default` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否为默认密码（首次需修改）',
  `last_changed_at` DATETIME NULL COMMENT '最后修改时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  CONSTRAINT `fk_payslip_passwords_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工资条二级密码表';

-- ============================================================
-- 5. 工资导入历史表 (payslip_import_history)
-- ============================================================
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
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_import_history_imported_by` FOREIGN KEY (`imported_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工资导入历史表';

-- ============================================================
-- 6. 插入默认模板
-- ============================================================
INSERT INTO `payslip_templates` (`template_name`, `template_code`, `is_default`, `is_active`, `field_config`, `description`) VALUES
('标准工资条模板', 'standard', 1, 1, 
JSON_OBJECT(
  'fields', JSON_ARRAY(
    JSON_OBJECT('field', 'basic_salary', 'label', '基本工资', 'visible', true, 'order', 1),
    JSON_OBJECT('field', 'position_salary', 'label', '岗位工资', 'visible', true, 'order', 2),
    JSON_OBJECT('field', 'performance_bonus', 'label', '绩效奖金', 'visible', true, 'order', 3),
    JSON_OBJECT('field', 'overtime_pay', 'label', '加班费', 'visible', true, 'order', 4),
    JSON_OBJECT('field', 'allowances', 'label', '各类补贴', 'visible', true, 'order', 5),
    JSON_OBJECT('field', 'deductions', 'label', '各类扣款', 'visible', true, 'order', 6),
    JSON_OBJECT('field', 'social_security', 'label', '社保扣款', 'visible', true, 'order', 7),
    JSON_OBJECT('field', 'housing_fund', 'label', '公积金扣款', 'visible', true, 'order', 8),
    JSON_OBJECT('field', 'tax', 'label', '个人所得税', 'visible', true, 'order', 9),
    JSON_OBJECT('field', 'other_deductions', 'label', '其他扣款', 'visible', true, 'order', 10),
    JSON_OBJECT('field', 'net_salary', 'label', '实发工资', 'visible', true, 'order', 11)
  )
), 
'系统默认的标准工资条模板，包含所有基本工资项目');

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Payroll tables created successfully' as result;
