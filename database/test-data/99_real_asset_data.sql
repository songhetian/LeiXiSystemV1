-- ==========================================
-- 真实资产测试数据 (Fixed Version - Using form_id)
-- ==========================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 确保资产分类存在
INSERT IGNORE INTO asset_categories (name, code, description, status) VALUES
('笔记本电脑', 'LAPTOP', '高性能办公笔记本', 'active'),
('台式工作站', 'DESKTOP', '固定办公与设计工作站', 'active'),
('显示器', 'MONITOR', '高清显示器', 'active'),
('移动设备', 'MOBILE', '手机与平板测试机', 'active'),
('外设配件', 'PERIPHERAL', '键盘鼠标等', 'active');

-- 2. 确保设备形态存在 (来自 043 迁移)
INSERT IGNORE INTO asset_device_forms (name, icon) VALUES
('笔记本电脑', 'laptop'),
('台式工作站', 'monitor'),
('机架式服务器', 'server'),
('平板电脑', 'tablet'),
('办公外设', 'keyboard');

-- 3. 插入设备型号 (使用 form_id 关联 asset_device_forms)
-- 笔记本
INSERT INTO asset_models (category_id, form_id, name, description, status)
SELECT
    (SELECT id FROM asset_categories WHERE code='LAPTOP'),
    (SELECT id FROM asset_device_forms WHERE name='笔记本电脑'),
    'MacBook Pro 14 M3 Pro',
    'Apple M3 Pro 芯片, 18GB 内存, 512GB SSD, 深空灰',
    'active'
ON DUPLICATE KEY UPDATE description=VALUES(description);

INSERT INTO asset_models (category_id, form_id, name, description, status)
SELECT
    (SELECT id FROM asset_categories WHERE code='LAPTOP'),
    (SELECT id FROM asset_device_forms WHERE name='笔记本电脑'),
    'ThinkPad X1 Carbon Gen 11',
    'i7-1360P, 32GB, 1TB, 4K OLED',
    'active'
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- 显示器 (使用办公外设形态)
INSERT INTO asset_models (category_id, form_id, name, description, status)
SELECT
    (SELECT id FROM asset_categories WHERE code='MONITOR'),
    (SELECT id FROM asset_device_forms WHERE name='办公外设'),
    'Dell U2723QE',
    '27英寸 4K IPS Black, Type-C Hub',
    'active'
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- 台式工作站
INSERT INTO asset_models (category_id, form_id, name, description, status)
SELECT
    (SELECT id FROM asset_categories WHERE code='DESKTOP'),
    (SELECT id FROM asset_device_forms WHERE name='台式工作站'),
    '高性能开发工作站',
    'i9-13900K, 64GB DDR5, 2TB NVMe SSD',
    'active'
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- 平板电脑
INSERT INTO asset_models (category_id, form_id, name, description, status)
SELECT
    (SELECT id FROM asset_categories WHERE code='MOBILE'),
    (SELECT id FROM asset_device_forms WHERE name='平板电脑'),
    'iPad Pro 12.9 M2',
    'M2 芯片, 256GB, WiFi + Cellular',
    'active'
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- 4. 插入具体设备实例
-- 分配给 admin (id=1) 和 manager1 (id=2)
INSERT IGNORE INTO devices (asset_no, model_id, current_user_id, device_status, status, purchase_date, purchase_price, notes)
SELECT 'ZC-20240101-001', id, 1, 'in_use', 'active', '2024-01-01', 16999.00, '管理员主力机'
FROM asset_models WHERE name='MacBook Pro 14 M3 Pro' LIMIT 1;

INSERT IGNORE INTO devices (asset_no, model_id, current_user_id, device_status, status, purchase_date, purchase_price, notes)
SELECT 'ZC-20240101-002', id, 1, 'in_use', 'active', '2024-01-01', 3999.00, '管理员外接显示器'
FROM asset_models WHERE name='Dell U2723QE' LIMIT 1;

INSERT IGNORE INTO devices (asset_no, model_id, current_user_id, device_status, status, purchase_date, purchase_price, notes)
SELECT 'ZC-20240215-001', id, 2, 'in_use', 'active', '2024-02-15', 14999.00, '经理办公机'
FROM asset_models WHERE name='ThinkPad X1 Carbon Gen 11' LIMIT 1;

-- 闲置设备
INSERT IGNORE INTO devices (asset_no, model_id, current_user_id, device_status, status, purchase_date, purchase_price, notes)
SELECT 'ZC-20240301-005', id, NULL, 'idle', 'active', '2024-03-01', 3999.00, '备用显示器'
FROM asset_models WHERE name='Dell U2723QE' LIMIT 1;

INSERT IGNORE INTO devices (asset_no, model_id, current_user_id, device_status, status, purchase_date, purchase_price, notes)
SELECT 'ZC-20240315-001', id, NULL, 'idle', 'active', '2024-03-15', 25999.00, '备用工作站'
FROM asset_models WHERE name='高性能开发工作站' LIMIT 1;

INSERT IGNORE INTO devices (asset_no, model_id, current_user_id, device_status, status, purchase_date, purchase_price, notes)
SELECT 'ZC-20240320-001', id, NULL, 'idle', 'active', '2024-03-20', 9999.00, '测试用平板'
FROM asset_models WHERE name='iPad Pro 12.9 M2' LIMIT 1;

-- 5. 确保资产组件类型存在
INSERT IGNORE INTO asset_component_types (name, sort_order, status) VALUES
('CPU', 1, 'active'),
('RAM', 2, 'active'),
('Hard Disk', 3, 'active'),
('GPU', 4, 'active'),
('Monitor', 5, 'active');

-- 6. 插入组件规格
INSERT IGNORE INTO asset_components (type_id, name, model, status, notes)
SELECT id, 'Apple M3 Pro', 'M3 Pro 11-core', 'active', '集成在主板'
FROM asset_component_types WHERE name='CPU';

INSERT IGNORE INTO asset_components (type_id, name, model, status, notes)
SELECT id, 'Intel Core i7-1360P', '13th Gen', 'active', '笔记本处理器'
FROM asset_component_types WHERE name='CPU';

INSERT IGNORE INTO asset_components (type_id, name, model, status, notes)
SELECT id, 'Intel Core i9-13900K', '13th Gen Desktop', 'active', '桌面级旗舰处理器'
FROM asset_component_types WHERE name='CPU';

INSERT IGNORE INTO asset_components (type_id, name, model, status, notes)
SELECT id, 'Apple M2', 'M2 8-core', 'active', 'iPad Pro芯片'
FROM asset_component_types WHERE name='CPU';

INSERT IGNORE INTO asset_components (type_id, name, model, status, notes)
SELECT id, '18GB Unified Memory', 'LPDDR5X', 'active', 'Apple板载内存'
FROM asset_component_types WHERE name='RAM';

INSERT IGNORE INTO asset_components (type_id, name, model, status, notes)
SELECT id, '32GB DDR5', 'DDR5-5600', 'active', '高速DDR5内存'
FROM asset_component_types WHERE name='RAM';

INSERT IGNORE INTO asset_components (type_id, name, model, status, notes)
SELECT id, '64GB DDR5', 'DDR5-5600', 'active', '大容量DDR5内存'
FROM asset_component_types WHERE name='RAM';

INSERT IGNORE INTO asset_components (type_id, name, model, status, notes)
SELECT id, '512GB SSD', 'Apple NVMe', 'active', 'Apple原装SSD'
FROM asset_component_types WHERE name='Hard Disk';

INSERT IGNORE INTO asset_components (type_id, name, model, status, notes)
SELECT id, '1TB NVMe SSD', 'Samsung 980 Pro', 'active', '高速NVMe固态'
FROM asset_component_types WHERE name='Hard Disk';

INSERT IGNORE INTO asset_components (type_id, name, model, status, notes)
SELECT id, '2TB NVMe SSD', 'Samsung 990 Pro', 'active', '大容量高速NVMe'
FROM asset_component_types WHERE name='Hard Disk';

-- 7. 关联组件到设备 (为管理员的MacBook添加配置)
INSERT IGNORE INTO device_config_details (device_id, component_type_id, component_id, quantity, change_type, status)
SELECT
    d.id,
    ct.id,
    c.id,
    1, 'initial', 'active'
FROM devices d
CROSS JOIN asset_component_types ct
CROSS JOIN asset_components c
WHERE d.asset_no='ZC-20240101-001'
  AND ct.name='CPU'
  AND c.name='Apple M3 Pro';

INSERT IGNORE INTO device_config_details (device_id, component_type_id, component_id, quantity, change_type, status)
SELECT
    d.id,
    ct.id,
    c.id,
    1, 'initial', 'active'
FROM devices d
CROSS JOIN asset_component_types ct
CROSS JOIN asset_components c
WHERE d.asset_no='ZC-20240101-001'
  AND ct.name='RAM'
  AND c.name='18GB Unified Memory';

INSERT IGNORE INTO device_config_details (device_id, component_type_id, component_id, quantity, change_type, status)
SELECT
    d.id,
    ct.id,
    c.id,
    1, 'initial', 'active'
FROM devices d
CROSS JOIN asset_component_types ct
CROSS JOIN asset_components c
WHERE d.asset_no='ZC-20240101-001'
  AND ct.name='Hard Disk'
  AND c.name='512GB SSD';

-- 为经理的ThinkPad添加配置
INSERT IGNORE INTO device_config_details (device_id, component_type_id, component_id, quantity, change_type, status)
SELECT
    d.id,
    ct.id,
    c.id,
    1, 'initial', 'active'
FROM devices d
CROSS JOIN asset_component_types ct
CROSS JOIN asset_components c
WHERE d.asset_no='ZC-20240215-001'
  AND ct.name='CPU'
  AND c.name='Intel Core i7-1360P';

INSERT IGNORE INTO device_config_details (device_id, component_type_id, component_id, quantity, change_type, status)
SELECT
    d.id,
    ct.id,
    c.id,
    1, 'initial', 'active'
FROM devices d
CROSS JOIN asset_component_types ct
CROSS JOIN asset_components c
WHERE d.asset_no='ZC-20240215-001'
  AND ct.name='RAM'
  AND c.name='32GB DDR5';

INSERT IGNORE INTO device_config_details (device_id, component_type_id, component_id, quantity, change_type, status)
SELECT
    d.id,
    ct.id,
    c.id,
    1, 'initial', 'active'
FROM devices d
CROSS JOIN asset_component_types ct
CROSS JOIN asset_components c
WHERE d.asset_no='ZC-20240215-001'
  AND ct.name='Hard Disk'
  AND c.name='1TB NVMe SSD';

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Real asset test data inserted successfully' AS 'Status';
