-- 020_add_id_card_fields_to_users.sql
-- 为用户表添加身份证图片字段

SET FOREIGN_KEY_CHECKS = 0;

-- 检查字段是否存在，如果不存在则添加
SET @col_exists_front = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'id_card_front_url'
);

SET @col_exists_back = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'id_card_back_url'
);

-- 添加身份证正面图片URL字段
SET @sql = IF(@col_exists_front = 0,
  "ALTER TABLE users ADD COLUMN id_card_front_url VARCHAR(500) DEFAULT NULL COMMENT '身份证正面图片URL'",
  "SELECT 'Column id_card_front_url already exists'");

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加身份证反面图片URL字段
SET @sql = IF(@col_exists_back = 0,
  "ALTER TABLE users ADD COLUMN id_card_back_url VARCHAR(500) DEFAULT NULL COMMENT '身份证反面图片URL'",
  "SELECT 'Column id_card_back_url already exists'");

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'ID card fields added to users table successfully' as result;
