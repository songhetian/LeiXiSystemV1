-- 047_standardize_asset_model_status.sql
-- 确保 asset_models 表拥有正确的 status 字段定义及默认值

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 如果字段不存在则添加，如果存在则修改定义
SET @dbname = DATABASE();
SET @tablename = "asset_models";
SET @columnname = "status";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "ALTER TABLE asset_models MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'",
  "ALTER TABLE asset_models ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active' AFTER description"
));
PREPARE stmt FROM @preparedStatement; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. 修复可能存在的脏数据
UPDATE asset_models SET status = 'active' WHERE status IS NULL OR status = '';

SET FOREIGN_KEY_CHECKS = 1;
