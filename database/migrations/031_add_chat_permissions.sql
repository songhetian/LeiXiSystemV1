-- 031_add_chat_permissions.sql
-- 添加聊天系统相关权限

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 插入新权限
INSERT INTO permissions (name, code, resource, action, module, description) VALUES
('使用聊天', 'messaging:chat:use', 'chat', 'use', 'messaging', '使用即时通讯系统进行单聊和群聊'),
('管理群组', 'messaging:group:manage', 'group', 'manage', 'messaging', '创建和管理群组');

-- 2. 为【超级管理员】分配新权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = '超级管理员' AND p.code IN ('messaging:chat:use', 'messaging:group:manage');

-- 3. 为【普通员工】分配“使用聊天”和“管理群组”权限
-- 默认允许员工使用聊天和创建群组（微信风格通常允许用户建群）
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = '普通员工' AND p.code IN ('messaging:chat:use', 'messaging:group:manage');

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Chat permissions added successfully' as result;
