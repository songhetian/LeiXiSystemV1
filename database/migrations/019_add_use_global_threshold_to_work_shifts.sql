-- Migration 019: 为班次表添加使用全局阈值字段
-- 检查字段是否存在，避免重复添加
SET @column_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                      WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'work_shifts'
                      AND COLUMN_NAME = 'use_global_threshold');

SET @sql := IF(@column_exists = 0,
    "ALTER TABLE work_shifts ADD COLUMN use_global_threshold TINYINT(1) DEFAULT 0 COMMENT '是否使用全局阈值'",
    'SELECT ''Column already exists''');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
