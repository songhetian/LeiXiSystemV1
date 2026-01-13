-- 018_seed_permissions.sql
-- 初始化权限数据

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 清理现有权限数据 (防止重复执行导致的主键冲突或冗余)
TRUNCATE TABLE role_permissions;
TRUNCATE TABLE permissions;

-- 2. 插入所有系统权限
INSERT INTO permissions (name, code, resource, action, module, description) VALUES
-- ============================================================
-- 系统管理 (System)
-- ============================================================
('查看控制面板', 'system:dashboard:view', 'dashboard', 'view', 'system', '查看系统首页工作台及统计数据'),
('查看企业看板', 'system:dashboard:admin', 'dashboard', 'admin', 'system', '查看管理员专属的企业全局数据看板'),
('查看角色', 'system:role:view', 'role', 'view', 'system', '查看角色列表'),
('管理角色', 'system:role:manage', 'role', 'manage', 'system', '新增、编辑、删除角色及配置权限'),
('查看日志', 'system:log:view', 'log', 'view', 'system', '查看系统操作日志'),
('流程设置', 'system:workflow:manage', 'workflow', 'manage', 'system', '配置资产、报销、请假等业务的审批流程'),

-- ============================================================
-- 员工管理 (User)
-- ============================================================
('查看员工', 'user:employee:view', 'employee', 'view', 'user', '查看员工列表及详情'),
('管理员工', 'user:employee:manage', 'employee', 'manage', 'user', '新增、编辑、删除员工'),
('员工审核', 'user:audit:manage', 'audit', 'manage', 'user', '审核新注册员工'),
('重置密码', 'user:security:reset_password', 'security', 'reset_password', 'user', '重置员工密码'),
('部门备忘', 'user:memo:manage', 'memo', 'manage', 'user', '管理部门备忘录'),
('更新个人资料', 'user:profile:update', 'profile', 'update', 'user', '更新个人资料'),

-- ============================================================
-- 组织架构 (Organization)
-- ============================================================
('查看部门', 'org:department:view', 'department', 'view', 'organization', '查看部门架构'),
('管理部门', 'org:department:manage', 'department', 'manage', 'organization', '新增、编辑、删除部门'),
('查看职位', 'org:position:view', 'position', 'view', 'organization', '查看职位列表'),
('管理职位', 'org:position:manage', 'position', 'manage', 'organization', '新增、编辑、删除职位'),

-- ============================================================
-- 信息系统 (Messaging)
-- ============================================================
('查看广播', 'messaging:broadcast:view', 'broadcast', 'view', 'messaging', '查看系统广播'),
('发布广播', 'messaging:broadcast:manage', 'broadcast', 'manage', 'messaging', '发布、管理系统广播'),
('使用聊天', 'messaging:chat:use', 'chat', 'use', 'messaging', '使用即时通讯系统进行单聊和群聊'),
('管理群组', 'messaging:chat:manage', 'group', 'manage', 'messaging', '创建和管理群组'),
('通知设置', 'messaging:config:manage', 'config', 'manage', 'messaging', '配置系统通知规则'),

-- ============================================================
-- 考勤管理 (Attendance)
-- ============================================================
('查看考勤', 'attendance:record:view', 'record', 'view', 'attendance', '查看考勤记录'),
('考勤统计', 'attendance:report:view', 'report', 'view', 'attendance', '查看考勤统计报表'),
('考勤设置', 'attendance:config:manage', 'config', 'manage', 'attendance', '修改考勤规则、班次、排班'),
('考勤审批', 'attendance:approval:manage', 'approval', 'manage', 'attendance', '审批请假、加班、补卡申请'),
('排班管理', 'attendance:schedule:manage', 'schedule', 'manage', 'attendance', '管理员工排班'),

-- ============================================================
-- 资产与库存管理 (Finance & Assets)
-- ============================================================
('查看资产', 'finance:asset:view', 'asset', 'view', 'finance', '查看固定资产列表'),
('管理资产', 'finance:asset:manage', 'asset', 'manage', 'finance', '新增、编辑、分配、报废资产'),
('审批资产申请', 'finance:asset:audit', 'asset_request', 'audit', 'finance', '审核员工提交的设备升级或报修申请'),
('资产配置管理', 'finance:asset:config', 'asset_config', 'manage', 'finance', '管理业务分类、配件类型及设备型号模版'),
('采购管理', 'finance:procurement:manage', 'inventory', 'procure', 'finance', '创建采购单、录入物品'),
('库存盘点', 'finance:inventory:audit', 'inventory', 'audit', 'finance', '进行库存盘点和修正'),

-- ============================================================
-- 假期管理 (Vacation)
-- ============================================================
('查看假期', 'vacation:record:view', 'record', 'view', 'vacation', '查看假期余额及记录'),
('假期配置', 'vacation:config:manage', 'config', 'manage', 'vacation', '配置假期规则及额度'),
('假期审批', 'vacation:approval:manage', 'approval', 'manage', 'vacation', '审批调休申请'),

-- ============================================================
-- 质检管理 (Quality)
-- ============================================================
('查看质检', 'quality:session:view', 'session', 'view', 'quality', '查看质检会话及记录'),
('质检评分', 'quality:score:manage', 'score', 'manage', 'quality', '进行质检评分'),
('质检配置', 'quality:config:manage', 'config', 'manage', 'quality', '配置质检规则、标签、平台店铺'),
('案例管理', 'quality:case:manage', 'case', 'manage', 'quality', '管理质检案例库'),

-- ============================================================
-- 知识库 (Knowledge)
-- ============================================================
('查看知识库', 'knowledge:article:view', 'article', 'view', 'knowledge', '查看公共知识库'),
('管理知识库', 'knowledge:article:manage', 'article', 'manage', 'knowledge', '发布、编辑、删除知识库文章'),

-- ============================================================
-- 考核系统 (Assessment)
-- ============================================================
('查看考核', 'assessment:plan:view', 'plan', 'view', 'assessment', '查看考核计划及试卷'),
('管理考核', 'assessment:plan:manage', 'plan', 'manage', 'assessment', '创建试卷、发布考核计划'),
('查看成绩', 'assessment:result:view', 'result', 'view', 'assessment', '查看所有员工考试成绩'),

-- ============================================================
-- 工资管理 (Payroll)
-- ============================================================
('查看工资条', 'payroll:payslip:view', 'payslip', 'view', 'payroll', '查看自己的工资条'),
('工资条管理', 'payroll:payslip:manage', 'payslip', 'manage', 'payroll', '管理所有工资条，包括新增、编辑、删除'),
('工资条发放', 'payroll:payslip:distribute', 'payslip', 'distribute', 'payroll', '发放工资条给员工'),
('二级密码管理', 'payroll:password:manage', 'password', 'manage', 'payroll', '管理员工工资条二级密码'),

-- ============================================================
-- 报销管理 (Reimbursement)
-- ============================================================
('提交报销', 'reimbursement:apply:submit', 'apply', 'submit', 'reimbursement', '提交报销申请'),
('审批报销', 'reimbursement:apply:approve', 'apply', 'approve', 'reimbursement', '审批报销申请'),
('查看报销', 'reimbursement:record:view', 'record', 'view', 'reimbursement', '查看报销记录'),
('报销配置', 'reimbursement:config:manage', 'config', 'manage', 'reimbursement', '配置审批流程和审批人'),
('报销设置', 'reimbursement:config:settings', 'config', 'settings', 'reimbursement', '管理报销类型和费用类型'),
('角色流程配置', 'reimbursement:config:role_workflow', 'config', 'role_workflow', 'reimbursement', '为不同角色配置特定审批流程'),

-- ============================================================
-- 个人中心 (Personal)
-- ============================================================
('待办中心', 'personal:todo:view', 'todo', 'view', 'personal', '查看并处理个人待办任务'),
('查看我的资产', 'personal:asset:view', 'asset', 'view', 'personal', '查看分配给自己的资产设备'),
('申请设备升级', 'personal:asset:upgrade', 'asset', 'upgrade', 'personal', '提交设备配置升级或维修申请');

-- 3. 确保基础角色存在
INSERT IGNORE INTO roles (name, description, level, is_system) VALUES
('超级管理员', '系统最高权限管理员', 100, 1),
('普通员工', '系统默认基础角色，拥有基本查看权限', 1, 1);

-- 4. 为【超级管理员】分配所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = '超级管理员';

-- 5. 为【普通员工】分配基础权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'system:dashboard:view',
    'user:employee:view',
    'org:department:view',
    'org:position:view',
    'messaging:broadcast:view',
    'messaging:chat:use',
    'messaging:chat:manage',
    'attendance:record:view',
    'vacation:record:view',
    'knowledge:article:view',
    'assessment:plan:view',
    'user:profile:update',
    'payroll:payslip:view',
    'finance:asset:view',
    'finance:procurement:manage',
    'personal:asset:view',
    'personal:asset:upgrade'
)
WHERE r.name = '普通员工';

-- 6. 创建默认员工权限模板
INSERT INTO permission_templates (name, description, permission_ids)
SELECT
    '员工基础权限',
    '包含所有员工都需要的基本功能权限',
    JSON_ARRAY(
        (SELECT id FROM permissions WHERE code = 'messaging:broadcast:view'),
        (SELECT id FROM permissions WHERE code = 'attendance:record:view'),
        (SELECT id FROM permissions WHERE code = 'vacation:record:view'),
        (SELECT id FROM permissions WHERE code = 'attendance:approval:manage'),
        (SELECT id FROM permissions WHERE code = 'vacation:approval:manage'),
        (SELECT id FROM permissions WHERE code = 'knowledge:article:view'),
        (SELECT id FROM permissions WHERE code = 'assessment:plan:view'),
        (SELECT id FROM permissions WHERE code = 'assessment:result:view'),
        (SELECT id FROM permissions WHERE code = 'user:profile:update'),
        (SELECT id FROM permissions WHERE code = 'user:memo:manage'),
        (SELECT id FROM permissions WHERE code = 'personal:asset:view'),
        (SELECT id FROM permissions WHERE code = 'personal:asset:upgrade')
    )
WHERE NOT EXISTS (SELECT 1 FROM permission_templates WHERE name = '员工基础权限');

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Permissions seeded successfully' as result;