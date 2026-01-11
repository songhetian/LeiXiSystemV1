-- 027_add_role_workflow_permission.sql
-- 修复：将 category 改为 resource

SET FOREIGN_KEY_CHECKS = 0;

INSERT IGNORE INTO permissions (name, code, module, action, resource, description)
VALUES ('角色流程配置', 'reimbursement:config:role_workflow', 'reimbursement', 'manage', 'config', '为不同角色配置审批流程');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = '超级管理员' AND p.code = 'reimbursement:config:role_workflow';

SET FOREIGN_KEY_CHECKS = 1;
