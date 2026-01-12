-- 029_add_deleted_status_to_enum.sql
-- 为 users 和 employees 表的 status 字段增加 'deleted' 选项以支持软删除

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 修改 employees 表的 status ENUM
ALTER TABLE `employees` 
MODIFY COLUMN `status` ENUM('active', 'inactive', 'resigned', 'deleted') NOT NULL DEFAULT 'active' COMMENT '状态';

-- 2. 修改 users 表的 status ENUM
-- 先检查 users 表的 status 定义
ALTER TABLE `users` 
MODIFY COLUMN `status` ENUM('active', 'inactive', 'pending', 'rejected', 'deleted') NOT NULL DEFAULT 'active' COMMENT '状态';

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Successfully added deleted status to ENUM columns' as result;
