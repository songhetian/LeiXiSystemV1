-- 初始化资产申请默认流程
-- 注意：假设超级管理员角色的 ID 为 1，如果不同请根据实际情况调整

INSERT IGNORE INTO approval_workflows (name, type, description, is_default, status, created_by) 
VALUES ('默认资产申请流程', 'asset_request', '系统自动创建的固定资产申请/升级审批流程', 1, 'active', 1);

-- 获取刚插入的流程 ID 并插入节点
SET @workflow_id = (SELECT id FROM approval_workflows WHERE name = '默认资产申请流程' AND type = 'asset_request' LIMIT 1);

-- 第一级：部门主管
INSERT IGNORE INTO approval_workflow_nodes (workflow_id, node_order, node_name, approver_type, approval_mode)
VALUES (@workflow_id, 1, '部门主管审批', 'dept_manager', 'serial');

-- 第二级：超级管理员 (假设 role_id = 1)
INSERT IGNORE INTO approval_workflow_nodes (workflow_id, node_order, node_name, approver_type, role_id, approval_mode)
VALUES (@workflow_id, 2, '行政总监审核', 'role', 1, 'serial');
