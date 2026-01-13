-- 042_advanced_asset_structure.sql
-- 重构资产架构为配件模型化

-- 1. 配件类型
CREATE TABLE IF NOT EXISTS asset_component_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    sort_order INT DEFAULT 0
);

-- 2. 配件型号
CREATE TABLE IF NOT EXISTS asset_components (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (type_id) REFERENCES asset_component_types(id)
);

-- 3. 设备型号
CREATE TABLE IF NOT EXISTS asset_models (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES asset_categories(id)
);

-- 4. 型号配件模板
CREATE TABLE IF NOT EXISTS asset_model_templates (
    model_id INT NOT NULL,
    component_id INT NOT NULL,
    quantity INT DEFAULT 1,
    PRIMARY KEY (model_id, component_id),
    FOREIGN KEY (model_id) REFERENCES asset_models(id) ON DELETE CASCADE,
    FOREIGN KEY (component_id) REFERENCES asset_components(id)
);

-- 5. 修改资产表字段 (安全模式)
SET @dbname = DATABASE();
SET @tablename = "assets";

-- 添加 model_id
SET @columnname = "model_id";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "SELECT 1",
  "ALTER TABLE assets ADD COLUMN model_id INT AFTER category_id"
));
PREPARE stmt FROM @preparedStatement; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 移除 specs (安全模式)
SET @columnname = "specs";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "ALTER TABLE assets DROP COLUMN specs",
  "SELECT 1"
));
PREPARE stmt FROM @preparedStatement; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 6. 资产配件升级历史
CREATE TABLE IF NOT EXISTS asset_upgrades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    component_type_id INT NOT NULL,
    old_component_id INT,
    new_component_id INT NOT NULL,
    upgrade_type ENUM('initial', 'upgrade', 'repair', 'replace') DEFAULT 'upgrade',
    reason TEXT,
    cost DECIMAL(10, 2) DEFAULT 0.00,
    upgrade_date DATE,
    handled_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (component_type_id) REFERENCES asset_component_types(id),
    FOREIGN KEY (old_component_id) REFERENCES asset_components(id),
    FOREIGN KEY (new_component_id) REFERENCES asset_components(id),
    FOREIGN KEY (handled_by) REFERENCES users(id)
);
