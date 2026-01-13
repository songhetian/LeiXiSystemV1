-- ==========================================
-- 审批流程测试数据插入脚本
-- ==========================================

SET FOREIGN_KEY_CHECKS = 0;

-- 清理已存在的测试数据
DELETE FROM `approval_workflow_nodes` WHERE workflow_id IN (
  SELECT id FROM `approval_workflows` WHERE type = 'reimbursement'
);
DELETE FROM `approval_workflows` WHERE type = 'reimbursement';

-- 插入测试审批流程 - 标准报销流程
INSERT INTO `approval_workflows` (
  `name`, `description`, `type`, `is_default`, `status`, `conditions`, `created_by`, `created_at`
) VALUES
('标准报销审批流程', '适用于普通员工的日常报销审批', 'reimbursement', 1, 'active', NULL, 1, NOW());
SET @workflow_standard = LAST_INSERT_ID();

-- 插入测试审批流程 - 大额报销流程
INSERT INTO `approval_workflows` (
  `name`, `description`, `type`, `is_default`, `status`, `conditions`, `created_by`, `created_at`
) VALUES
('大额报销审批流程', '适用于金额超过5000元的报销申请', 'reimbursement', 0, 'active', '{"amount_greater_than": 5000}', 1, NOW());
SET @workflow_large = LAST_INSERT_ID();

-- 插入测试审批流程 - 紧急报销流程
INSERT INTO `approval_workflows` (
  `name`, `description`, `type`, `is_default`, `status`, `conditions`, `created_by`, `created_at`
) VALUES
('紧急报销审批流程', '适用于紧急情况下的快速报销', 'reimbursement', 0, 'active', NULL, 1, NOW());
SET @workflow_urgent = LAST_INSERT_ID();

-- 为标准报销流程添加审批节点
-- approver_type 枚举值: 'user','role','department_manager','boss','finance','initiator','custom'
INSERT INTO `approval_workflow_nodes` (
  `workflow_id`, `node_name`, `node_order`, `approver_type`, `role_id`, `approver_id`,
  `custom_type_name`, `approval_mode`, `can_skip`, `created_at`
) VALUES
(@workflow_standard, '部门主管审批', 1, 'department_manager', NULL, NULL, NULL, 'serial', 0, NOW()),
(@workflow_standard, '财务审核', 2, 'finance', NULL, NULL, NULL, 'serial', 0, NOW()),
(@workflow_standard, '老板审批', 3, 'boss', NULL, NULL, NULL, 'serial', 0, NOW());

-- 为大额报销流程添加审批节点
INSERT INTO `approval_workflow_nodes` (
  `workflow_id`, `node_name`, `node_order`, `approver_type`, `role_id`, `approver_id`,
  `custom_type_name`, `approval_mode`, `can_skip`, `created_at`
) VALUES
(@workflow_large, '部门主管审批', 1, 'department_manager', NULL, NULL, NULL, 'serial', 0, NOW()),
(@workflow_large, '财务总监审批', 2, 'finance', NULL, NULL, NULL, 'serial', 0, NOW()),
(@workflow_large, 'CEO审批', 3, 'custom', NULL, NULL, 'CEO', 'serial', 0, NOW());

-- 为紧急报销流程添加审批节点
INSERT INTO `approval_workflow_nodes` (
  `workflow_id`, `node_name`, `node_order`, `approver_type`, `role_id`, `approver_id`,
  `custom_type_name`, `approval_mode`, `can_skip`, `created_at`
) VALUES
(@workflow_urgent, '财务快速审批', 1, 'finance', NULL, NULL, NULL, 'serial', 0, NOW()),
(@workflow_urgent, '老板确认', 2, 'boss', NULL, NULL, NULL, 'serial', 0, NOW());

SET FOREIGN_KEY_CHECKS = 1;

-- 输出确认信息
SELECT '审批流程测试数据插入完成' AS 'Status';

-- 显示插入的流程信息
SELECT
  w.id,
  w.name,
  w.description,
  w.type,
  w.is_default,
  w.status,
  (SELECT COUNT(*) FROM approval_workflow_nodes WHERE workflow_id = w.id) as node_count
FROM `approval_workflows` w
WHERE w.type = 'reimbursement'
ORDER BY w.id;
