-- Add is_pinned and sort_order to vacation_types table
-- Author: Antigravity
-- Date: 2025-12-28

ALTER TABLE `vacation_types` ADD COLUMN `is_pinned` TINYINT(1) DEFAULT 0 COMMENT '是否置顶';
ALTER TABLE `vacation_types` ADD COLUMN `sort_order` INT DEFAULT 999 COMMENT '排序号';

-- Update existing records to have a default sort_order
UPDATE `vacation_types` SET `sort_order` = id WHERE `sort_order` = 999;
