-- 043_asset_search_and_group_cleanup.sql

-- 1. 为资产表增加搜索冗余字段
SET @dbname = DATABASE();
SET @tablename = "assets";
SET @columnname = "config_summary";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "SELECT 1",
  "ALTER TABLE assets ADD COLUMN config_summary TEXT AFTER model_id"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
