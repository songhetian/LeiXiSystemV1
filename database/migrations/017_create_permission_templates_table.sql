-- 017_create_permission_templates_table.sql
-- 创建权限模板表以支持权限管理功能

SET FOREIGN_KEY_CHECKS = 0;

-- 创建权限模板表
CREATE TABLE IF NOT EXISTS `permission_templates` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '权限模板唯一标识ID',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '模板名称',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '模板描述',
  `permission_ids` json DEFAULT NULL COMMENT '权限ID列表，JSON格式存储',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限模板表-用于存储权限组合模板';

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'permission_templates table created successfully' as result;
