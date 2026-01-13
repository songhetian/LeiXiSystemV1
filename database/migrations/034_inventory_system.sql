-- 034_inventory_system.sql
-- 库存与采购管理系统

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 库存物品定义表 (SKU)
CREATE TABLE IF NOT EXISTS inventory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- 自定义分类 (e.g., 办公用品, IT耗材)
    unit VARCHAR(20) DEFAULT '个', -- 单位 (个, 箱, 包)
    
    current_stock INT DEFAULT 0, -- 当前库存 (冗余字段，用于快速查询，以事务计算为准)
    min_stock_alert INT DEFAULT 10, -- 最低库存预警
    
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. 采购记录表 (入库)
CREATE TABLE IF NOT EXISTS procurement_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    
    quantity INT NOT NULL, -- 采购数量
    price_per_unit DECIMAL(10, 2), -- 单价
    total_price DECIMAL(10, 2), -- 总价
    
    supplier VARCHAR(100), -- 供应商
    purchase_date DATE, -- 采购日期
    
    batch_no VARCHAR(50), -- 批次号/订单号
    
    purchaser_id INT, -- 采购人
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    FOREIGN KEY (purchaser_id) REFERENCES users(id)
);

-- 3. 领用/消耗记录表 (出库)
CREATE TABLE IF NOT EXISTS inventory_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    
    quantity INT NOT NULL, -- 消耗数量
    user_id INT, -- 领用人
    usage_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    purpose VARCHAR(255), -- 用途
    
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 4. 库存盘点/审计表 (核对)
CREATE TABLE IF NOT EXISTS inventory_audits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    
    expected_stock INT NOT NULL, -- 账面库存 (盘点时系统的库存)
    actual_stock INT NOT NULL, -- 实际库存 (人工清点)
    
    discrepancy INT GENERATED ALWAYS AS (actual_stock - expected_stock) STORED, -- 差异 (负数代表丢失/少货)
    
    result_status ENUM('matched', 'missing', 'surplus') DEFAULT 'matched', -- 匹配, 丢失, 盈余
    
    auditor_id INT, -- 盘点人
    audit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT, -- 异常说明
    
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    FOREIGN KEY (auditor_id) REFERENCES users(id)
);

-- 5. 添加权限
INSERT INTO permissions (name, code, resource, action, module, description) VALUES
('采购管理', 'finance:procurement:manage', 'inventory', 'procure', 'finance', '创建采购单、录入物品'),
('库存盘点', 'finance:inventory:audit', 'inventory', 'audit', 'finance', '进行库存盘点和修正');

-- 分配给超级管理员
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = '超级管理员' AND p.code IN ('finance:procurement:manage', 'finance:inventory:audit');

SET FOREIGN_KEY_CHECKS = 1;
