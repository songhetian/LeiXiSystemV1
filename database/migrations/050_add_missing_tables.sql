-- 050_add_missing_tables.sql
-- 补全所有缺失的数据表
-- 生成时间: 2024
-- 说明: 此迁移脚本将创建之前迁移中定义但数据库中缺失的所有表

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- ============================================================
-- 来自 001_full_install.sql 的缺失表
-- ============================================================

-- 假期转换记录表
CREATE TABLE IF NOT EXISTS `vacation_conversions` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '转换记录ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `employee_id` INT NOT NULL COMMENT '员工ID',
  `source_type` VARCHAR(50) DEFAULT 'overtime' COMMENT '来源类型：overtime-加班',
  `source_hours` DECIMAL(10,2) DEFAULT NULL COMMENT '来源小时数（如加班时长）',
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

-- 假期转换使用记录表
CREATE TABLE IF NOT EXISTS `conversion_usage_records` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '使用记录ID',
  `conversion_id` INT NOT NULL COMMENT '转换记录ID',
  `leave_record_id` INT NOT NULL COMMENT '请假记录ID',
  `used_days` DECIMAL(10,2) NOT NULL COMMENT '使用天数',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_conversion` (`conversion_id`),
  KEY `idx_leave_record` (`leave_record_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='假期转换使用记录表';

-- 备忘录表
CREATE TABLE IF NOT EXISTS `memos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT '创建者用户ID',
  `title` VARCHAR(200) NOT NULL COMMENT '备忘录标题',
  `content` TEXT NOT NULL COMMENT '备忘录内容（Markdown格式）',
  `type` ENUM('personal', 'department') DEFAULT 'personal' COMMENT '类型：personal=个人备忘录, department=部门备忘录',
  `priority` ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal' COMMENT '优先级',
  `is_read` TINYINT(1) DEFAULT 0 COMMENT '是否已读（仅个人备忘录使用）',
  `target_department_id` INT DEFAULT NULL COMMENT '目标部门ID（部门备忘录使用）',
  `target_user_id` INT DEFAULT NULL COMMENT '目标用户ID（部门备忘录指定用户时使用）',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_target_department` (`target_department_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='备忘录表';

-- 备忘录接收人表
CREATE TABLE IF NOT EXISTS `memo_recipients` (
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

-- 广播通知表
CREATE TABLE IF NOT EXISTS `broadcasts` (
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
  `expire_at` DATETIME COMMENT '过期时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_creator` (`creator_id`),
  KEY `idx_status` (`status`),
  KEY `idx_publish_at` (`publish_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='广播通知表';

-- 广播接收人表
CREATE TABLE IF NOT EXISTS `broadcast_recipients` (
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

-- 通知设置表
CREATE TABLE IF NOT EXISTS `notification_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `event_type` VARCHAR(50) NOT NULL COMMENT '事件类型',
  `target_roles` JSON DEFAULT NULL COMMENT '接收通知的角色列表',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_event_type` (`event_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知设置表';

-- ============================================================
-- 来自 021_create_payroll_tables.sql 工资条系统
-- ============================================================

-- 工资条主表
CREATE TABLE IF NOT EXISTS `payslips` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '工资条唯一标识ID',
  `payslip_no` VARCHAR(50) NOT NULL COMMENT '工资条编号，格式：PS-YYYYMM-序号',
  `employee_id` INT NOT NULL COMMENT '员工ID，关联employees表',
  `user_id` INT NOT NULL COMMENT '用户ID，关联users表',
  `salary_month` DATE NOT NULL COMMENT '工资所属月份，格式：YYYY-MM-01',
  `payment_date` DATE NULL COMMENT '发放日期',
  `attendance_days` DECIMAL(5,2) DEFAULT 0.00 COMMENT '出勤天数',
  `late_count` INT DEFAULT 0 COMMENT '迟到次数',
  `early_leave_count` INT DEFAULT 0 COMMENT '早退次数',
  `leave_days` DECIMAL(5,2) DEFAULT 0.00 COMMENT '请假天数',
  `overtime_hours` DECIMAL(6,2) DEFAULT 0.00 COMMENT '加班时长（小时）',
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
  `net_salary` DECIMAL(10,2) NOT NULL COMMENT '实发工资（自动计算）',
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

-- 工资条模板配置表
CREATE TABLE IF NOT EXISTS `payslip_templates` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '模板ID',
  `template_name` VARCHAR(100) NOT NULL COMMENT '模板名称',
  `template_code` VARCHAR(50) NOT NULL COMMENT '模板代码，唯一标识',
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

-- 工资条发放配置表
CREATE TABLE IF NOT EXISTS `payslip_distribution_settings` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `setting_name` VARCHAR(100) NOT NULL COMMENT '配置名称',
  `frequency` ENUM('monthly', 'weekly', 'daily') NOT NULL DEFAULT 'monthly' COMMENT '发放频率',
  `distribution_day` INT NULL COMMENT '发放日（月中的第几天，1-31）',
  `distribution_weekday` INT NULL COMMENT '发放周几（1-7）',
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

-- 二级密码表
CREATE TABLE IF NOT EXISTS `payslip_passwords` (
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

-- 工资导入历史表
CREATE TABLE IF NOT EXISTS `payslip_import_history` (
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

-- ============================================================
-- 来自 022_create_reimbursement_tables.sql 报销审批系统
-- ============================================================

-- 报销申请主表
CREATE TABLE IF NOT EXISTS `reimbursements` (
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

-- 报销明细表
CREATE TABLE IF NOT EXISTS `reimbursement_items` (
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
  CONSTRAINT `fk_items_reimbursement` FOREIGN KEY (`reimbursement_id`) REFERENCES `reimbursements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报销明细表';

-- 报销附件表
CREATE TABLE IF NOT EXISTS `reimbursement_attachments` (
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
  CONSTRAINT `fk_attachments_reimbursement` FOREIGN KEY (`reimbursement_id`) REFERENCES `reimbursements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报销附件表';

-- 审批流程配置表
CREATE TABLE IF NOT EXISTS `approval_workflows` (
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

-- 审批流程节点表
CREATE TABLE IF NOT EXISTS `approval_workflow_nodes` (
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
  CONSTRAINT `fk_nodes_workflow` FOREIGN KEY (`workflow_id`) REFERENCES `approval_workflows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审批流程节点表';

-- 审批记录表
CREATE TABLE IF NOT EXISTS `approval_records` (
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
  CONSTRAINT `fk_records_reimbursement` FOREIGN KEY (`reimbursement_id`) REFERENCES `reimbursements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审批记录表';

-- 审批人配置表
CREATE TABLE IF NOT EXISTS `approvers` (
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

-- ============================================================
-- 来自 023_create_role_workflows_table.sql 角色审批流程
-- ============================================================

-- 角色审批流程映射表
CREATE TABLE IF NOT EXISTS `role_workflows` (
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

-- ============================================================
-- 来自 028_create_operation_logs_table.sql 操作日志
-- ============================================================

-- 系统操作日志表
CREATE TABLE IF NOT EXISTS `operation_logs` (
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

-- ============================================================
-- 来自 030_create_chat_system.sql 聊天系统
-- ============================================================

-- 聊天群组表
CREATE TABLE IF NOT EXISTS `chat_groups` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `owner_id` INT NOT NULL COMMENT '创建者',
  `type` ENUM('group', 'p2p') DEFAULT 'group',
  `avatar` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_owner_id` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天群组表';

-- 群组成员表
CREATE TABLE IF NOT EXISTS `chat_group_members` (
  `group_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `role` ENUM('admin', 'member') DEFAULT 'member',
  PRIMARY KEY (`group_id`, `user_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群组成员表';

-- 聊天消息表
CREATE TABLE IF NOT EXISTS `chat_messages` (
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

-- ============================================================
-- 来自 032-042 资产管理系统
-- ============================================================

-- 资产主表
CREATE TABLE IF NOT EXISTS `assets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `asset_no` VARCHAR(50) UNIQUE NOT NULL COMMENT '资产编号',
  `name` VARCHAR(100) NOT NULL,
  `category_id` INT,
  `model_id` INT COMMENT '设备型号ID',
  `device_type` ENUM('workstation', 'laptop', 'server', 'tablet', 'other') DEFAULT 'workstation',
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

-- 资产领用/归还记录表
CREATE TABLE IF NOT EXISTS `asset_assignments` (
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

-- 配件类型表
CREATE TABLE IF NOT EXISTS `asset_component_types` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `sort_order` INT DEFAULT 0,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配件类型表';

-- 配件表
CREATE TABLE IF NOT EXISTS `asset_components` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `type_id` INT NOT NULL COMMENT '配件类型ID',
  `name` VARCHAR(100) NOT NULL,
  `model` VARCHAR(100),
  `sn` VARCHAR(100) UNIQUE COMMENT '序列号',
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_type_id` (`type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配件表';

-- 设备与配件映射表
CREATE TABLE IF NOT EXISTS `device_component_mapping` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `asset_id` INT NOT NULL COMMENT '设备ID',
  `component_id` INT NOT NULL COMMENT '配件ID',
  `bound_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_asset_id` (`asset_id`),
  KEY `idx_component_id` (`component_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备配件映射表';

-- 设备型号表
CREATE TABLE IF NOT EXISTS `asset_models` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `category_id` INT,
  `name` VARCHAR(100) NOT NULL,
  `device_type` ENUM('workstation', 'laptop', 'server', 'tablet', 'other') DEFAULT 'laptop',
  `description` TEXT,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备型号表';

-- 型号配件模板表
CREATE TABLE IF NOT EXISTS `asset_model_templates` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `model_id` INT NOT NULL,
  `component_id` INT NOT NULL,
  `quantity` INT DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_model_component` (`model_id`, `component_id`),
  KEY `idx_model_id` (`model_id`),
  KEY `idx_component_id` (`component_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='型号配件模板表';

-- 资产升级记录表
CREATE TABLE IF NOT EXISTS `asset_upgrades` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `asset_id` INT NOT NULL,
  `component_type_id` INT,
  `old_component_id` INT,
  `new_component_id` INT,
  `change_type` ENUM('upgrade', 'repair', 'replacement', 'initial') DEFAULT 'upgrade',
  `upgrade_type` ENUM('initial', 'upgrade', 'repair', 'replace') DEFAULT 'upgrade',
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

-- 资产申请表
CREATE TABLE IF NOT EXISTS `asset_requests` (
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

-- 设备表 (048迁移)
CREATE TABLE IF NOT EXISTS `devices` (
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

-- 设备配置详情表
CREATE TABLE IF NOT EXISTS `device_config_details` (
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

-- ============================================================
-- 来自 034_inventory_system.sql 库存系统
-- ============================================================

-- 库存物品定义表
CREATE TABLE IF NOT EXISTS `inventory_items` (
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

-- 采购记录表
CREATE TABLE IF NOT EXISTS `procurement_records` (
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

-- 领用/消耗记录表
CREATE TABLE IF NOT EXISTS `inventory_usage` (
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

-- 库存盘点表
CREATE TABLE IF NOT EXISTS `inventory_audits` (
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

-- ============================================================
-- 来自 035_ticket_crm_system.sql CRM与工单系统
-- ============================================================

-- CRM客户表
CREATE TABLE IF NOT EXISTS `crm_customers` (
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

-- 工单表
CREATE TABLE IF NOT EXISTS `tickets` (
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

-- 工单流转记录表
CREATE TABLE IF NOT EXISTS `ticket_logs` (
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

-- ============================================================
-- 来自 041_create_special_approval_groups.sql 特殊审批组
-- ============================================================

-- 特殊审批组表
CREATE TABLE IF NOT EXISTS `special_approval_groups` (
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

-- ============================================================
-- 插入默认配件类型
-- ============================================================

INSERT IGNORE INTO `asset_component_types` (`name`, `sort_order`) VALUES
('CPU', 1),
('内存', 2),
('硬盘', 3),
('显卡', 4),
('显示器', 5),
('外设', 6),
('其他', 99);

-- ============================================================
-- 插入默认工资条模板
-- ============================================================

INSERT IGNORE INTO `payslip_templates` (`template_name`, `template_code`, `is_default`, `is_active`, `field_config`, `description`) VALUES
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
'系统默认的标准工资条模板');

SET FOREIGN_KEY_CHECKS = 1;

-- 记录迁移
INSERT IGNORE INTO `migrations_history` (`migration_name`) VALUES ('050_add_missing_tables');

SELECT '成功创建所有缺失的数据表!' as result;
