-- 049_fix_asset_request_relation.sql
-- 修复申请审批表与新设备表的关联

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 确保 asset_requests 存在逻辑删除状态
SET @dbname = DATABASE();
SET @tablename = "asset_requests";
SET @columnname = "status_logic"; -- 使用 status_logic 避免与业务 status (pending/approved) 冲突
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "SELECT 1",
  "ALTER TABLE asset_requests ADD COLUMN status_logic VARCHAR(20) NOT NULL DEFAULT 'active'"
));
PREPARE stmt FROM @preparedStatement; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. 修正外键约束 (指向 devices 表)
ALTER TABLE asset_requests DROP FOREIGN KEY IF EXISTS asset_requests_ibfk_1;
-- 重新建立关联 (注意：如果 devices 表 ID 继承自原 assets，数据是无缝的)
ALTER TABLE asset_requests ADD CONSTRAINT fk_request_device FOREIGN KEY (asset_id) REFERENCES devices(id) ON DELETE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;
