-- 032_create_asset_management.sql
-- 固定资产管理系统

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 资产分类表
CREATE TABLE IF NOT EXISTS asset_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(50) UNIQUE, -- e.g., 'PC', 'FURNITURE'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认分类
INSERT INTO asset_categories (name, code, description) VALUES 
('电脑设备', 'COMPUTER', '笔记本、台式机、显示器'),
('办公外设', 'PERIPHERAL', '键盘、鼠标、耳机、打印机'),
('办公家具', 'FURNITURE', '桌椅、柜子'),
('移动设备', 'MOBILE', '测试手机、平板');

-- 2. 资产主表
CREATE TABLE IF NOT EXISTS assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_no VARCHAR(50) UNIQUE NOT NULL, -- 资产编号 (e.g., AS-2024001)
    name VARCHAR(100) NOT NULL,
    category_id INT,
    model VARCHAR(100), -- 型号
    serial_number VARCHAR(100), -- 序列号 (S/N)
    
    status ENUM('idle', 'in_use', 'maintenance', 'lost', 'scrapped') DEFAULT 'idle',
    -- idle: 闲置/库存, in_use: 在用, maintenance: 维修中, lost: 丢失, scrapped: 报废
    
    purchase_date DATE,
    purchase_price DECIMAL(10, 2),
    warranty_expire_date DATE, -- 保修截止日期
    supplier VARCHAR(100),
    
    current_user_id INT DEFAULT NULL, -- 当前领用人 (冗余字段，方便查询)
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES asset_categories(id),
    FOREIGN KEY (current_user_id) REFERENCES users(id)
);

-- 3. 资产领用/归还记录表
CREATE TABLE IF NOT EXISTS asset_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    user_id INT NOT NULL,
    
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 领用时间
    returned_at TIMESTAMP NULL, -- 归还时间 (NULL表示尚未归还)
    
    expected_return_date DATE, -- 预计归还日期
    condition_on_assign TEXT, -- 领用时状况
    condition_on_return TEXT, -- 归还时状况
    
    assigned_by INT, -- 经办人
    
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id)
);

-- 4. 资产权限
INSERT INTO permissions (name, code, resource, action, module, description) VALUES
('查看资产', 'finance:asset:view', 'asset', 'view', 'finance', '查看固定资产列表'),
('管理资产', 'finance:asset:manage', 'asset', 'manage', 'finance', '新增、编辑、分配、报废资产');

-- 分配权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = '超级管理员' AND p.code IN ('finance:asset:view', 'finance:asset:manage');

SET FOREIGN_KEY_CHECKS = 1;
