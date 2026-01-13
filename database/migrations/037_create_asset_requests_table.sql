-- 037_create_asset_requests_table.sql
-- 资产申请与审核系统

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 资产申请表 (升级/报修)
CREATE TABLE IF NOT EXISTS asset_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    user_id INT NOT NULL, -- 申请人
    
    type ENUM('upgrade', 'repair') NOT NULL, -- 升级或报修
    description TEXT NOT NULL, -- 申请描述
    
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    
    admin_notes TEXT, -- 管理员回复/审核意见
    handled_by INT, -- 处理人
    handled_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (handled_by) REFERENCES users(id)
);

-- 2. 增加权限 (使用 IGNORE 防止重复执行报错)
INSERT IGNORE INTO permissions (name, code, resource, action, module, description) VALUES
('审批资产申请', 'finance:asset:audit', 'asset_request', 'audit', 'finance', '审核员工提交的设备升级或报修申请');

-- 分配权限给超级管理员 (确保不会重复插入关联关系)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = '超级管理员' AND p.code = 'finance:asset:audit'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

SET FOREIGN_KEY_CHECKS = 1;
