-- 16_insert_reimbursement_workflows.sql
-- 初始化默认审批流程数据

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- 1. 清理旧数据（仅清理报销类型的流程）
-- =============================================================================
DELETE FROM approval_workflow_nodes WHERE workflow_id IN (SELECT id FROM approval_workflows WHERE type = 'reimbursement');
DELETE FROM approval_workflows WHERE type = 'reimbursement';

-- =============================================================================
-- 2. 插入审批流程
-- =============================================================================

-- 默认流程：普通员工使用
INSERT INTO `approval_workflows` (`name`, `type`, `description`, `is_default`, `conditions`, `status`) VALUES
('标准报销审批流程', 'reimbursement', '适用于普通员工的标准报销审批流程', 1, NULL, 'active');
SET @wf1_id = LAST_INSERT_ID();

-- 部门主管专用流程
INSERT INTO `approval_workflows` (`name`, `type`, `description`, `is_default`, `conditions`, `status`) VALUES
('管理层报销流程', 'reimbursement', '适用于部门主管的报销流程，跳过部门主管审批', 0, '{"is_department_manager": true}', 'active');
SET @wf2_id = LAST_INSERT_ID();

-- 大额报销流程
INSERT INTO `approval_workflows` (`name`, `type`, `description`, `is_default`, `conditions`, `status`) VALUES
('大额报销审批流程', 'reimbursement', '适用于金额超过5000元的报销申请', 0, '{"amount_greater_than": 5000}', 'active');
SET @wf3_id = LAST_INSERT_ID();

-- =============================================================================
-- 3. 标准流程节点: 部门主管 → 财务 → 申请人确认
-- approver_type 有效值: 'user','role','department_manager','boss','finance','initiator','custom'
-- =============================================================================
INSERT INTO `approval_workflow_nodes` (`workflow_id`, `node_order`, `node_name`, `approver_type`, `custom_type_name`, `approval_mode`) VALUES
(@wf1_id, 1, '部门主管审批', 'department_manager', NULL, 'serial'),
(@wf1_id, 2, '财务审核', 'finance', NULL, 'serial'),
(@wf1_id, 3, '申请人确认', 'initiator', NULL, 'serial');

-- =============================================================================
-- 4. 管理层流程节点: 老板 → 财务 → 申请人确认
-- =============================================================================
INSERT INTO `approval_workflow_nodes` (`workflow_id`, `node_order`, `node_name`, `approver_type`, `custom_type_name`, `approval_mode`) VALUES
(@wf2_id, 1, '老板审批', 'boss', NULL, 'serial'),
(@wf2_id, 2, '财务审核', 'finance', NULL, 'serial'),
(@wf2_id, 3, '申请人确认', 'initiator', NULL, 'serial');

-- =============================================================================
-- 5. 大额流程节点: 部门主管 → 老板 → 财务 → 申请人确认
-- =============================================================================
INSERT INTO `approval_workflow_nodes` (`workflow_id`, `node_order`, `node_name`, `approver_type`, `custom_type_name`, `approval_mode`) VALUES
(@wf3_id, 1, '部门主管审批', 'department_manager', NULL, 'serial'),
(@wf3_id, 2, '老板审批', 'boss', NULL, 'serial'),
(@wf3_id, 3, '财务审核', 'finance', NULL, 'serial'),
(@wf3_id, 4, '申请人确认', 'initiator', NULL, 'serial');

SET FOREIGN_KEY_CHECKS = 1;

SELECT '报销审批流程初始化数据插入成功' as result;
