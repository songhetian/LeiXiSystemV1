-- ========================================
-- 试卷分类初始化脚本
-- 创建时间：2025-12-10
-- ========================================

-- 检查表是否存在，如果不存在则创建
CREATE TABLE IF NOT EXISTS `exam_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '分类名称',
  `description` text COMMENT '分类描述',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  `deleted_by` int DEFAULT NULL COMMENT '删除操作用户ID',
  `status` enum('active','inactive','deleted') NOT NULL DEFAULT 'active' COMMENT '状态',
  `order_num` int NOT NULL DEFAULT '1' COMMENT '排序号',
  `path` varchar(1024) NOT NULL DEFAULT '/' COMMENT '路径',
  `level` int NOT NULL DEFAULT '1' COMMENT '层级',
  `weight` decimal(8,2) NOT NULL DEFAULT '0.00' COMMENT '权重',
  `created_by` int DEFAULT NULL COMMENT '创建人ID',
  `parent_id` int DEFAULT NULL COMMENT '父级分类ID',
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_deleted_at` (`deleted_at`),
  KEY `idx_status` (`status`),
  KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='试卷分类表';

-- 插入初始试卷分类数据
INSERT INTO exam_categories (name, description, order_num, status, created_by) VALUES
('入职培训', '新员工入职培训相关试卷', 1, 'active', 1),
('岗位技能', '各岗位专业技能培训试卷', 2, 'active', 1),
('安全教育', '安全生产和职业健康培训试卷', 3, 'active', 1),
('法律法规', '相关法律法规知识测试试卷', 4, 'active', 1),
('综合素质', '员工综合素质提升测试试卷', 5, 'active', 1),
('年度考核', '年度绩效考核相关试卷', 6, 'active', 1),
('专项培训', '特定主题专项培训试卷', 7, 'active', 1)
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  order_num = VALUES(order_num),
  updated_at = CURRENT_TIMESTAMP;

-- 更新exams表，确保category_id字段存在
SET @column_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                      WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'exams'
                      AND COLUMN_NAME = 'category_id');

SET @sql := IF(@column_exists = 0,
  "ALTER TABLE exams ADD COLUMN category_id int DEFAULT NULL COMMENT '试卷分类ID'",
  'SELECT ''Column already exists''');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 为exams表添加外键约束
SET @fk_exists := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                  WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'exams'
                  AND REFERENCED_TABLE_NAME = 'exam_categories');

SET @sql := IF(@fk_exists = 0,
  "ALTER TABLE exams ADD CONSTRAINT fk_exams_category_id FOREIGN KEY (category_id) REFERENCES exam_categories(id) ON DELETE SET NULL",
  'SELECT ''Foreign key already exists''');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 输出确认信息
SELECT '试卷分类初始化完成' AS 'Status';
SELECT CONCAT('成功插入 ', ROW_COUNT(), ' 条试卷分类数据') AS 'Result';
