-- 040_refactor_device_to_model_based.sql
-- 资产管理逻辑升级：设备型号(Model) -> 资产实例(Instance) -> 员工(User)

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 设备型号表 (作为模板)
CREATE TABLE IF NOT EXISTS asset_models (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- 如：Dell Latitude 5430
    category_id INT,
    device_type ENUM('workstation', 'laptop', 'server', 'tablet', 'other') DEFAULT 'laptop',
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES asset_categories(id)
);

-- 2. 修改 assets 表，使其关联型号
ALTER TABLE assets 
ADD COLUMN model_id INT AFTER category_id,
ADD CONSTRAINT fk_assets_model FOREIGN KEY (model_id) REFERENCES asset_models(id);

-- 3. 插入测试数据
-- 配件
INSERT IGNORE INTO asset_components (name, category, model, sn, status) VALUES 
('金士顿 16GB DDR4', 'ram', 'KVR32N22S8/16', 'SN-RAM-001', 'available'),
('三星 980 PRO 1TB', 'disk', 'MZ-V8P1T0BW', 'SN-SSD-992', 'available'),
('Intel i7-12700K', 'cpu', 'i7-12700K', 'SN-CPU-887', 'in_use'),
('戴尔 27寸 4K显示器', 'monitor', 'U2723QE', 'SN-MON-112', 'available');

-- 设备型号
INSERT IGNORE INTO asset_models (name, category_id, device_type, description) VALUES 
('高性能开发工作站', 1, 'workstation', '配置了 i7/32G/1T 的标准开发机'),
('便携商务本', 1, 'laptop', 'MacBook Pro 14寸'),
('测试安卓机', 4, 'tablet', '小米平板 6');

-- 基于型号生成具体资产实例 (已分配给用户 ID 1)
INSERT IGNORE INTO assets (asset_no, name, model_id, status, current_user_id) VALUES 
('BX-2024-001', '张三的开发机', 1, 'in_use', 1),
('BX-2024-002', '李四的开发机', 1, 'in_use', 2),
('BX-2024-003', '闲置备用机', 1, 'idle', NULL);

SET FOREIGN_KEY_CHECKS = 1;
