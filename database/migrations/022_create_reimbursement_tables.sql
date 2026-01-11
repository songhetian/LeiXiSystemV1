-- 022_create_reimbursement_tables.sql
-- 报销审批系统数据表

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- 1. 报销申请主表
-- =============================================================================
DROP TABLE IF EXISTS `reimbursements`;
CREATE TABLE `reimbursements` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '报销单ID',
  `reimbursement_no` VARCHAR(32) NOT NULL COMMENT '报销单号(自动生成)',
  `user_id` INT NOT NULL COMMENT '申请人用户ID',
  `employee_id` INT NOT NULL COMMENT '申请人员工ID',
  `department_id` INT COMMENT '申请人部门ID',
  `title` VARCHAR(200) NOT NULL COMMENT '报销标题',
  `type` ENUM('travel','office','entertainment','training','other') NOT NULL DEFAULT 'other' COMMENT '报销类型:差旅/办公/招待/培训/其他',
  `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '报销总金额',
  `status` ENUM('draft','pending','approving','approved','rejected','cancelled') NOT NULL DEFAULT 'draft'
    COMMENT '状态:草稿/待审批/审批中/已通过/已驳回/已撤销',
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
  KEY `idx_type` (`type`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_reimbursements_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reimbursements_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reimbursements_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报销申请主表';

-- =============================================================================
-- 2. 报销明细表
-- =============================================================================
DROP TABLE IF EXISTS `reimbursement_items`;
CREATE TABLE `reimbursement_items` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '明细ID',
  `reimbursement_id` INT NOT NULL COMMENT '报销单ID',
  `item_type` VARCHAR(50) NOT NULL COMMENT '费用类型(交通/住宿/餐饮/通讯/办公用品等)',
  `amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '金额',
  `expense_date` DATE COMMENT '费用发生日期',
  `description` TEXT COMMENT '费用说明',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_reimbursement_id` (`reimbursement_id`),
  KEY `idx_item_type` (`item_type`),
  CONSTRAINT `fk_items_reimbursement` FOREIGN KEY (`reimbursement_id`) REFERENCES `reimbursements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报销明细表';

-- =============================================================================
-- 3. 报销附件表(发票/凭证)
-- =============================================================================
DROP TABLE IF EXISTS `reimbursement_attachments`;
CREATE TABLE `reimbursement_attachments` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '附件ID',
  `reimbursement_id` INT NOT NULL COMMENT '报销单ID',
  `item_id` INT COMMENT '关联明细ID(可选)',
  `file_name` VARCHAR(255) NOT NULL COMMENT '原始文件名',
  `file_type` VARCHAR(50) COMMENT '文件MIME类型',
  `file_size` INT COMMENT '文件大小(bytes)',
  `file_url` VARCHAR(500) NOT NULL COMMENT '文件存储路径',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_reimbursement_id` (`reimbursement_id`),
  KEY `idx_item_id` (`item_id`),
  CONSTRAINT `fk_attachments_reimbursement` FOREIGN KEY (`reimbursement_id`) REFERENCES `reimbursements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attachments_item` FOREIGN KEY (`item_id`) REFERENCES `reimbursement_items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报销附件表';

-- =============================================================================
-- 4. 审批流程配置表
-- =============================================================================
DROP TABLE IF EXISTS `approval_workflows`;
CREATE TABLE `approval_workflows` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '流程ID',
  `name` VARCHAR(100) NOT NULL COMMENT '流程名称',
  `type` VARCHAR(50) NOT NULL DEFAULT 'reimbursement' COMMENT '适用业务类型',
  `description` TEXT COMMENT '流程描述',
  `is_default` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否默认流程',
  `conditions` JSON COMMENT '触发条件(金额范围、部门、报销类型等)',
  `status` ENUM('active','inactive') NOT NULL DEFAULT 'active' COMMENT '状态',
  `created_by` INT COMMENT '创建人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_is_default` (`is_default`),
  CONSTRAINT `fk_workflows_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审批流程配置表';

-- =============================================================================
-- 5. 审批流程节点表
-- 每个节点可配置为具体某个人(user)或某个角色(role)
-- =============================================================================
DROP TABLE IF EXISTS `approval_workflow_nodes`;
CREATE TABLE `approval_workflow_nodes` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '节点ID',
  `workflow_id` INT NOT NULL COMMENT '所属流程ID',
  `node_order` INT NOT NULL DEFAULT 1 COMMENT '节点顺序(从1开始)',
  `node_name` VARCHAR(100) NOT NULL COMMENT '节点名称(如:部门主管审批)',

  -- 审批人类型：支持具体用户或角色
  `approver_type` ENUM('user','role','department_manager','boss','finance','initiator') NOT NULL
    COMMENT 'user-具体用户, role-某个角色, department_manager-部门主管, boss-老板, finance-财务, initiator-发起人',

  -- 当 approver_type='user' 时，指定具体审批人
  `approver_id` INT COMMENT '具体审批人用户ID(type=user时)',

  -- 当 approver_type='role' 时，指定角色
  `role_id` INT COMMENT '角色ID(type=role时)',

  `approval_mode` ENUM('serial','parallel') NOT NULL DEFAULT 'serial'
    COMMENT 'serial-串行(逐个审批), parallel-并行(多人同时,任一通过)',

  `can_skip` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否可跳过',
  `skip_conditions` JSON COMMENT '跳过条件(如:{"amount_less_than":1000})',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_workflow_order` (`workflow_id`, `node_order`),
  CONSTRAINT `fk_nodes_workflow` FOREIGN KEY (`workflow_id`) REFERENCES `approval_workflows` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_nodes_approver` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_nodes_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审批流程节点表';

-- =============================================================================
-- 6. 审批记录表
-- =============================================================================
DROP TABLE IF EXISTS `approval_records`;
CREATE TABLE `approval_records` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `reimbursement_id` INT NOT NULL COMMENT '报销单ID',
  `node_id` INT NOT NULL COMMENT '审批节点ID',
  `node_order` INT NOT NULL COMMENT '节点顺序(冗余存储)',
  `approver_id` INT NOT NULL COMMENT '审批人ID',
  `action` ENUM('approve','reject','return','delegate') NOT NULL
    COMMENT 'approve-通过, reject-驳回, return-退回修改, delegate-转交',
  `opinion` TEXT COMMENT '审批意见',
  `delegate_to_id` INT COMMENT '转交给(当action=delegate时)',
  `approved_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '审批时间',
  PRIMARY KEY (`id`),
  KEY `idx_reimbursement_id` (`reimbursement_id`),
  KEY `idx_node_id` (`node_id`),
  KEY `idx_approver_id` (`approver_id`),
  KEY `idx_approved_at` (`approved_at`),
  CONSTRAINT `fk_records_reimbursement` FOREIGN KEY (`reimbursement_id`) REFERENCES `reimbursements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_records_approver` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审批记录表';

-- =============================================================================
-- 7. 审批人配置表(老板/财务/自定义审批人)
-- =============================================================================
DROP TABLE IF EXISTS `approvers`;
CREATE TABLE `approvers` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `user_id` INT NOT NULL COMMENT '审批人用户ID',
  `approver_type` ENUM('boss','finance','custom') NOT NULL COMMENT '审批人类型:老板/财务/自定义',
  `department_scope` JSON COMMENT '负责部门范围(部门ID数组,空表示全部)',
  `amount_limit` DECIMAL(12,2) COMMENT '审批金额上限(空表示无限制)',
  `business_types` JSON COMMENT '可审批的业务类型(空表示全部)',
  `delegate_user_id` INT COMMENT '代理审批人ID',
  `delegate_start_date` DATE COMMENT '代理开始日期',
  `delegate_end_date` DATE COMMENT '代理结束日期',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_type` (`user_id`, `approver_type`),
  KEY `idx_approver_type` (`approver_type`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `fk_approvers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_approvers_delegate` FOREIGN KEY (`delegate_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审批人配置表';

SET FOREIGN_KEY_CHECKS = 1;

SELECT '报销审批系统数据表创建成功' as result;
