-- 025_create_reimbursement_settings.sql
-- 创建报销类型和费用类型配置表

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. 报销类型表 (如：差旅费、招待费、办公费)
-- ============================================================
CREATE TABLE IF NOT EXISTS `reimbursement_types` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL COMMENT '类型名称',
  `code` VARCHAR(50) NULL COMMENT '类型代码(可选)',
  `description` VARCHAR(255) NULL COMMENT '描述',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报销类型配置表';

-- 初始化默认报销类型
INSERT IGNORE INTO `reimbursement_types` (`name`, `code`, `sort_order`) VALUES
('差旅费', 'travel', 1),
('业务招待费', 'entertainment', 2),
('办公用品费', 'office', 3),
('团建费用', 'team_building', 4),
('培训费', 'training', 5),
('其他费用', 'other', 99);

-- ============================================================
-- 2. 费用类型表 (如：交通费、住宿费、餐饮费)
-- ============================================================
CREATE TABLE IF NOT EXISTS `expense_types` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL COMMENT '费用名称',
  `category_id` INT UNSIGNED NULL COMMENT '关联报销类型ID(可选)',
  `unit` VARCHAR(20) NULL COMMENT '单位(如: 天, 次)',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='费用类型明细配置表';

-- 初始化默认费用类型
INSERT IGNORE INTO `expense_types` (`name`, `sort_order`) VALUES
('火车/高铁票', 1),
('飞机票', 2),
('市内交通/打车', 3),
('住宿费', 4),
('餐饮费', 5),
('通讯费', 6),
('办公采购', 7),
('快递物流', 8);

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Reimbursement settings tables created successfully' as result;
