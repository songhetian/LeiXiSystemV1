-- 051_add_performance_indexes.sql
-- 数据库查询性能优化：增加关键业务字段索引

-- 1. 聊天消息表优化
-- 场景：高频统计群组未读数 (WHERE group_id = ? AND id > ?)
-- 场景：高频加载群组历史记录 (WHERE group_id = ? ORDER BY id DESC)
CREATE INDEX `idx_group_id_msg_id` ON `chat_messages` (`group_id`, `id`);

-- 2. 通知表优化
-- 场景：高频统计用户未读通知总数 (WHERE user_id = ? AND is_read = 0)
CREATE INDEX `idx_user_unread` ON `notifications` (`user_id`, `is_read`);

-- 3. 库存领用记录优化
-- 场景：按物品或按用户查询领用历史
CREATE INDEX `idx_usage_item` ON `inventory_usage` (`item_id`);
CREATE INDEX `idx_usage_user` ON `inventory_usage` (`user_id`);

-- 4. 员工变动履历优化
-- 场景：查看特定员工的所有变动记录
CREATE INDEX `idx_emp_changes_user` ON `employee_changes` (`user_id`);

-- 5. 操作日志表增强 (如果之前 idx_module 等不存在则创建)
-- 之前 50_leixi_init_schema.sql 中已有 idx_module 和 idx_created_at
-- 此处增加一个针对用户名的快速搜索索引
CREATE INDEX `idx_op_log_username` ON `operation_logs` (`username`);
