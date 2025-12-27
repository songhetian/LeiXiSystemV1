-- 添加身份证URL字段到users表
-- 执行此脚本: mysql -u your_user -p your_database < db/migrations/add_id_card_fields.sql

ALTER TABLE users
ADD COLUMN IF NOT EXISTS id_card_front_url VARCHAR(500) DEFAULT NULL COMMENT '身份证正面图片URL',
ADD COLUMN IF NOT EXISTS id_card_back_url VARCHAR(500) DEFAULT NULL COMMENT '身份证反面图片URL';

-- 验证字段已添加
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME IN ('id_card_front_url', 'id_card_back_url');
