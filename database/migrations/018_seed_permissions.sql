-- 018_seed_permissions.sql
-- 权限种子数据 (幂等化重构版)
-- 说明：此脚本支持多次执行，会自动更新权限名称描述并补全缺失关系，不会删除已有分配。

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 插入或更新权限定义
-- 使用 code 作为唯一标识，如果已存在则更新名称、资源、动作、模块和描述
INSERT INTO permissions (name, code, resource, action, module, description) VALUES
-- 系统管理
('查看控制面板', 'system:dashboard:view', 'dashboard', 'view', 'system', '查看系统首页工作台及统计数据'),
('查看企业看板', 'system:dashboard:admin', 'dashboard', 'admin', 'system', '查看管理员专属的企业全局数据看板'),
('查看角色', 'system:role:view', 'role', 'view', 'system', '查看角色列表'),
('管理角色', 'system:role:manage', 'role', 'manage', 'system', '新增、编辑、删除角色及配置权限'),
('查看日志', 'system:log:view', 'log', 'view', 'system', '查看系统操作日志'),
('流程设置', 'system:workflow:manage', 'workflow', 'manage', 'system', '配置资产、报销、请假等业务的审批流程'),

-- 员工管理
('查看员工', 'user:employee:view', 'employee', 'view', 'user', '查看员工列表及详情'),
('管理员工', 'user:employee:manage', 'employee', 'manage', 'user', '新增、编辑、删除员工'),
('员工审核', 'user:audit:manage', 'audit', 'manage', 'user', '审核新注册员工'),
('重置密码', 'user:security:reset_password', 'security', 'reset_password', 'user', '重置员工密码'),
('部门备忘', 'user:memo:manage', 'memo', 'manage', 'user', '管理部门备忘录'),
('更新个人资料', 'user:profile:update', 'profile', 'update', 'user', '更新个人资料'),

-- 组织架构
('查看部门', 'org:department:view', 'department', 'view', 'organization', '查看部门架构'),
('管理部门', 'org:department:manage', 'department', 'manage', 'organization', '新增、编辑、删除部门'),
('查看职位', 'org:position:view', 'position', 'view', 'organization', '查看职位列表'),
('管理职位', 'org:position:manage', 'position', 'manage', 'organization', '新增、编辑、删除职位'),

-- 资产与库存 (含之前的物品领取)
('查看资产', 'finance:asset:view', 'asset', 'view', 'finance', '查看固定资产列表'),
('管理资产', 'finance:asset:manage', 'asset', 'manage', 'finance', '新增、编辑、分配、报废资产'),
('审批资产申请', 'finance:asset:audit', 'asset_request', 'audit', 'finance', '审核员工提交的设备升级或维修申请'),
('资产配置管理', 'finance:asset:config', 'asset_config', 'manage', 'finance', '管理业务分类、配件类型及设备型号模版'),
('采购管理', 'finance:procurement:manage', 'inventory', 'procure', 'finance', '创建采购单、录入物品'),
('库存盘点', 'finance:inventory:audit', 'inventory', 'audit', 'finance', '进行库存盘点和修正'),
('物品领取', 'finance:inventory:receive', 'inventory', 'receive', 'finance', '申领办公用品及耗材'),

-- 工资管理
('查看工资条', 'payroll:payslip:view', 'payslip', 'view', 'payroll', '查看自己的工资条'),
('工资条管理', 'payroll:payslip:manage', 'payslip', 'manage', 'payroll', '管理所有工资条'),
('工资条发放', 'payroll:payslip:distribute', 'payslip', 'distribute', 'payroll', '发放工资条给员工'),
('二级密码管理', 'payroll:password:manage', 'password', 'manage', 'payroll', '管理员工工资条二级密码'),

-- 报销管理
('提交报销', 'reimbursement:apply:submit', 'apply', 'submit', 'reimbursement', '提交报销申请'),
('审批报销', 'reimbursement:apply:approve', 'apply', 'approve', 'reimbursement', '审批报销申请'),
('查看报销', 'reimbursement:record:view', 'record', 'view', 'reimbursement', '查看报销记录'),
('报销配置', 'reimbursement:config:manage', 'config', 'manage', 'reimbursement', '配置审批流程和审批人'),
('报销设置', 'reimbursement:config:settings', 'config', 'settings', 'reimbursement', '管理报销类型和费用类型'),
('角色流程配置', 'reimbursement:config:role_workflow', 'config', 'role_workflow', 'reimbursement', '为不同角色配置特定审批流程'),

-- 个人中心
('待办中心', 'personal:todo:view', 'todo', 'view', 'personal', '查看并处理个人待办任务'),
('查看我的资产', 'personal:asset:view', 'asset', 'view', 'personal', '查看分配给自己的资产设备'),
('申请设备升级', 'personal:asset:upgrade', 'asset', 'upgrade', 'personal', '提交设备配置升级或维修申请')

ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    resource = VALUES(resource),
    action = VALUES(action),
    module = VALUES(module),
    description = VALUES(description);

-- 2. 补全【超级管理员】缺失的权限 (不会删除已有的)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = '超级管理员';

-- 3. 补全【普通员工】缺失的基础权限 (增量)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = '普通员工' AND p.code IN (
    'system:dashboard:view',
    'user:employee:view',
    'org:department:view',
    'org:position:view',
    'attendance:record:view',
    'vacation:record:view',
    'user:profile:update',
    'payroll:payslip:view',
    'finance:asset:view',
    'finance:inventory:receive',
    'personal:asset:view',
    'personal:asset:upgrade'
);

SET FOREIGN_KEY_CHECKS = 1;
SELECT 'Seed data optimized successfully' as result;