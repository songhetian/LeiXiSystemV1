-- 041_add_model_component_template.sql
-- 存储设备型号的标准配件构成模板

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS asset_model_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model_id INT NOT NULL,
    component_category ENUM('cpu', 'ram', 'disk', 'gpu', 'monitor', 'peripherals', 'other') NOT NULL,
    default_component_name VARCHAR(100), -- 推荐的配件名称/规格
    quantity INT DEFAULT 1, -- 该配件在设备中的数量
    
    FOREIGN KEY (model_id) REFERENCES asset_models(id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;
