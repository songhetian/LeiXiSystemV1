-- 027_add_custom_type_name_to_approvers.sql
-- 在 approvers 表中添加 custom_type_name 列

SET FOREIGN_KEY_CHECKS = 0;

-- 尝试添加列（如果已存在会报警告或错误，但我们可以通过简单语句执行）
ALTER TABLE `approvers` ADD COLUMN `custom_type_name` VARCHAR(50) NULL COMMENT '自定义审批人类型名称' AFTER `approver_type`;

-- 数据迁移
UPDATE `approvers` SET `custom_type_name` = `approver_type` WHERE `custom_type_name` IS NULL;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Successfully added custom_type_name to approvers table' as result;