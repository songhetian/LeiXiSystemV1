-- 048_logistics_device_system.sql
-- 后勤管理：设备管理系统重构

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 修改/创建设备表 (原 assets 表升级)
CREATE TABLE IF NOT EXISTS devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_no VARCHAR(50) UNIQUE NOT NULL, -- 设备编号
    model_id INT NOT NULL,                -- 关联设备库型号
    current_user_id INT DEFAULT NULL,     -- 使用者
    
    -- 业务状态
    device_status ENUM('idle', 'in_use', 'damaged', 'maintenance', 'scrapped') DEFAULT 'idle',
    -- 逻辑删除状态
    status VARCHAR(20) NOT NULL DEFAULT 'active', 
    
    purchase_date DATE,
    purchase_price DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (model_id) REFERENCES asset_models(id),
    FOREIGN KEY (current_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 2. 设备配置详情表 (具体到每一台机器的配件，支持升级/降级记录)
CREATE TABLE IF NOT EXISTS device_config_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,               -- 关联设备ID
    component_type_id INT NOT NULL,       -- 配件类型 (CPU/内存等)
    component_id INT NOT NULL,            -- 具体配件规格
    quantity INT DEFAULT 1,
    
    change_type ENUM('initial', 'upgrade', 'downgrade') DEFAULT 'initial',
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 逻辑删除
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    FOREIGN KEY (component_type_id) REFERENCES asset_component_types(id),
    FOREIGN KEY (component_id) REFERENCES asset_components(id)
) ENGINE=InnoDB;

-- 3. 数据迁移：从旧 assets 表迁移数据（如果 assets 表存在）
SET @s = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assets') > 0,
    "INSERT IGNORE INTO devices (id, asset_no, model_id, current_user_id, device_status, status, created_at) SELECT id, asset_no, model_id, current_user_id, status, 'active', created_at FROM assets",
    "SELECT 1"
));
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. 幂等处理基础表的 status 字段
SET @dbname = DATABASE();

-- 处理 asset_categories
SET @columnname = "status";
SET @tablename = "asset_categories";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "ALTER TABLE asset_categories MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'",
  "ALTER TABLE asset_categories ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'"
));
PREPARE stmt FROM @preparedStatement; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 处理 asset_component_types
SET @tablename = "asset_component_types";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "ALTER TABLE asset_component_types MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'",
  "ALTER TABLE asset_component_types ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'"
));
PREPARE stmt FROM @preparedStatement; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 处理 asset_components
SET @tablename = "asset_components";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "ALTER TABLE asset_components MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'",
  "ALTER TABLE asset_components ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'"
));
PREPARE stmt FROM @preparedStatement; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;