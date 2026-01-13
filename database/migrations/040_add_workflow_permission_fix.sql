-- 040_add_workflow_permission_fix.sql
-- 显式补全流程设置权限并分配给管理员

-- 1. 插入权限（如果不存在）
INSERT IGNORE INTO permissions (name, code, resource, action, module, description) 
VALUES ('流程设置', 'system:workflow:manage', 'workflow', 'manage', 'system', '配置资产、报销、请假等业务的审批流程');

-- 2. 获取权限 ID
SET @perm_id = (SELECT id FROM permissions WHERE code = 'system:workflow:manage' LIMIT 1);

-- 3. 获取超级管理员角色 ID (假设名称为 '超级管理员')
SET @role_id = (SELECT id FROM roles WHERE name = '超级管理员' LIMIT 1);

-- 4. 如果角色和权限都存在，则建立关联（使用 IGNORE 防止重复）
INSERT IGNORE INTO role_permissions (role_id, permission_id) 
SELECT @role_id, @perm_id WHERE @role_id IS NOT NULL AND @perm_id IS NOT NULL;

SELECT 'Workflow permission added and assigned to Super Admin' as result;
