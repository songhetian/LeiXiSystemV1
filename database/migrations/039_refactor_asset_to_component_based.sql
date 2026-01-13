-- 039_refactor_asset_to_component_based.sql
-- 资产管理逻辑重构：配件 -> 设备 -> 员工

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 配件库存表 (如：内存条、硬盘、显示器)
CREATE TABLE IF NOT EXISTS asset_components (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- 如：金士顿 16GB DDR4
    category ENUM('cpu', 'ram', 'disk', 'gpu', 'monitor', 'peripherals', 'other') NOT NULL,
    model VARCHAR(100), -- 详细型号
    sn VARCHAR(100) UNIQUE, -- 序列号
    status ENUM('available', 'in_use', 'malfunction', 'scrapped') DEFAULT 'available',
    purchase_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 设备与配件的关联表 (组装关系)
CREATE TABLE IF NOT EXISTS device_component_mapping (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL, -- 设备ID (指向 assets 表)
    component_id INT NOT NULL, -- 配件ID
    bound_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (component_id) REFERENCES asset_components(id) ON DELETE CASCADE
);

-- 3. 修改 assets 表以适配“设备”概念
-- 移除旧的 specs 字符串，改为关联关系，但保留快照
ALTER TABLE assets 
ADD COLUMN device_type ENUM('workstation', 'laptop', 'server', 'tablet', 'other') DEFAULT 'workstation' AFTER category_id;

SET FOREIGN_KEY_CHECKS = 1;
