-- 024_update_approver_types.sql
-- 修改审批人配置表，支持自定义审批人类型
-- 使用存储过程确保幂等性（可重复执行）

SET FOREIGN_KEY_CHECKS = 0;

DROP PROCEDURE IF EXISTS UpgradeApproverTypes;

DELIMITER $$

CREATE PROCEDURE UpgradeApproverTypes()
BEGIN
    -- 1. 修改 approvers 表
    -- 检查 approver_type 是否已经是 VARCHAR，如果不是则修改
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'approvers' 
        AND COLUMN_NAME = 'approver_type' 
        AND DATA_TYPE = 'varchar'
    ) THEN
        ALTER TABLE `approvers` 
        MODIFY COLUMN `approver_type` VARCHAR(50) NOT NULL COMMENT '审批人类型: Boss/Finance/自定义名称';
    END IF;

    -- 2. 修改 approval_workflow_nodes 表
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'approval_workflow_nodes' 
        AND COLUMN_NAME = 'approver_type' 
        AND DATA_TYPE = 'varchar'
    ) THEN
        ALTER TABLE `approval_workflow_nodes`
        MODIFY COLUMN `approver_type` VARCHAR(50) NOT NULL COMMENT '审批人类型';
    END IF;

    -- 3. 添加 custom_type_name 列
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'approval_workflow_nodes' 
        AND COLUMN_NAME = 'custom_type_name'
    ) THEN
        ALTER TABLE `approval_workflow_nodes`
        ADD COLUMN `custom_type_name` VARCHAR(50) NULL COMMENT '自定义审批人类型名称' AFTER `role_id`;
    END IF;

END $$

DELIMITER ;

CALL UpgradeApproverTypes();
DROP PROCEDURE UpgradeApproverTypes;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Successfully updated approver types schema' as result;