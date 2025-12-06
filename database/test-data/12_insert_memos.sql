-- 插入备忘录测试数据
-- 依赖：users表、departments表

-- 1. 个人备忘录
INSERT INTO `memos` (`user_id`, `title`, `content`, `type`, `priority`, `is_read`, `created_at`) VALUES
(1, '今日工作计划', '## 今日任务\n\n1. 完成项目文档\n2. 代码审查\n3. 团队会议', 'personal', 'high', 0, '2024-12-06 09:00:00'),
(2, '学习笔记', '## React Hooks\n\n- useState\n- useEffect\n- useContext', 'personal', 'normal', 1, '2024-12-05 14:30:00'),
(3, '重要提醒', '明天下午3点客户会议，准备演示材料', 'personal', 'urgent', 0, '2024-12-06 10:00:00');

-- 2. 部门备忘录（发送给技术部）
INSERT INTO `memos` (`user_id`, `title`, `content`, `type`, `priority`, `target_department_id`, `created_at`) VALUES
(1, '技术部周会通知', '## 周会安排\n\n**时间**：本周五下午2点\n**地点**：会议室A\n**议题**：\n1. 项目进度汇报\n2. 技术难点讨论', 'department', 'high', 1, '2024-12-06 08:00:00'),
(1, '代码规范更新', '请大家注意新的代码规范已发布，详见文档中心', 'department', 'normal', 1, '2024-12-05 16:00:00');

-- 3. 部门备忘录接收记录
INSERT INTO `memo_recipients` (`memo_id`, `user_id`, `is_read`, `read_at`) VALUES
(4, 2, 1, '2024-12-06 09:00:00'),
(4, 3, 0, NULL),
(5, 2, 1, '2024-12-05 17:00:00'),
(5, 3, 0, NULL);
