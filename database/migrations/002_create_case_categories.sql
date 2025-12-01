-- 创建案例分类表
CREATE TABLE IF NOT EXISTS case_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE COMMENT '分类名称',
  description TEXT COMMENT '分类描述',
  parent_id INT DEFAULT NULL COMMENT '父分类ID（支持多级分类）',
  sort_order INT DEFAULT 0 COMMENT '排序权重',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES case_categories(id) ON DELETE SET NULL,
  INDEX idx_parent (parent_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='案例分类表';

-- 插入初始分类数据
INSERT INTO case_categories (name, description, sort_order) VALUES
('投诉处理', '客户投诉相关案例', 1),
('业务咨询', '业务咨询相关案例', 2),
('售后服务', '售后服务相关案例', 3),
('VIP服务', 'VIP客户服务案例', 4),
('危机处理', '危机处理相关案例', 5)
ON DUPLICATE KEY UPDATE description = VALUES(description), sort_order = VALUES(sort_order);
