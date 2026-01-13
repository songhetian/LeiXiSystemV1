-- 043_add_asset_forms_and_fix_logic.sql
SET FOREIGN_KEY_CHECKS = 0;

-- 1. 设备形态表 (笔记本, 台式机, 服务器等)
CREATE TABLE IF NOT EXISTS asset_device_forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入初始形态
INSERT IGNORE INTO asset_device_forms (name, icon) VALUES 
('笔记本电脑', 'laptop'),
('台式工作站', 'monitor'),
('机架式服务器', 'server'),
('平板电脑', 'tablet'),
('办公外设', 'keyboard');

-- 2. 修正 asset_models 表关联
ALTER TABLE asset_models 
DROP COLUMN device_type,
ADD COLUMN form_id INT AFTER category_id,
ADD CONSTRAINT fk_model_form FOREIGN KEY (form_id) REFERENCES asset_device_forms(id);

SET FOREIGN_KEY_CHECKS = 1;
