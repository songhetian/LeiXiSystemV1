-- 插入系统广播测试数据
-- 依赖：users表、departments表

-- 获取有效的用户ID
SET @admin_user_id = (SELECT id FROM users WHERE username = 'admin' LIMIT 1);
SET @manager_user_id = (SELECT id FROM users WHERE username = 'manager1' LIMIT 1);
SET @service_user_id = (SELECT id FROM users WHERE username = 'service1' LIMIT 1);

-- 1. 全体广播
INSERT INTO `broadcasts` (`title`, `content`, `type`, `priority`, `target_type`, `creator_id`, `created_at`) VALUES
('系统维护通知', '系统将于今晚22:00-23:00进行例行维护，期间可能无法访问，请提前保存工作。', 'warning', 'high', 'all', @admin_user_id, '2024-12-06 10:00:00'),
('新功能上线', '实时通知系统已上线！现在您可以即时收到各类通知，无需刷新页面。', 'success', 'normal', 'all', @admin_user_id, '2024-12-05 15:00:00');

-- 2. 部门广播（技术部）
INSERT INTO `broadcasts` (`title`, `content`, `type`, `priority`, `target_type`, `target_departments`, `creator_id`, `created_at`) VALUES
('技术分享会', '本周四下午3点，技术分享会：《WebSocket实战》，欢迎参加！', 'info', 'normal', 'department', '[1]', @admin_user_id, '2024-12-06 09:00:00');

-- 3. 角色广播（管理员）
INSERT INTO `broadcasts` (`title`, `content`, `type`, `priority`, `target_type`, `target_roles`, `creator_id`, `created_at`) VALUES
('管理员培训通知', '新版管理后台培训将于下周一上午10点举行，请所有管理员准时参加。', 'announcement', 'high', 'role', '["超级管理员", "部门管理员"]', @admin_user_id, '2024-12-06 11:00:00');

-- 4. 个人广播
INSERT INTO `broadcasts` (`title`, `content`, `type`, `priority`, `target_type`, `target_users`, `creator_id`, `created_at`) VALUES
('个人提醒', '您的年度考核报告需要在本周五前提交，请及时完成。', 'warning', 'urgent', 'individual', CONCAT('[', @manager_user_id, ',', @service_user_id, ']'), @admin_user_id, '2024-12-06 12:00:00');

-- 5. 广播接收记录
SET @b1 = (SELECT id FROM broadcasts WHERE title = '系统维护通知' LIMIT 1);
SET @b2 = (SELECT id FROM broadcasts WHERE title = '新功能上线' LIMIT 1);
SET @b3 = (SELECT id FROM broadcasts WHERE title = '技术分享会' LIMIT 1);
SET @b4 = (SELECT id FROM broadcasts WHERE title = '管理员培训通知' LIMIT 1);
SET @b5 = (SELECT id FROM broadcasts WHERE title = '个人提醒' LIMIT 1);

INSERT INTO `broadcast_recipients` (`broadcast_id`, `user_id`, `is_read`, `read_at`) VALUES
(@b1, @admin_user_id, 1, '2024-12-06 10:05:00'),
(@b1, @manager_user_id, 1, '2024-12-06 10:10:00'),
(@b1, @service_user_id, 0, NULL),
(@b2, @admin_user_id, 1, '2024-12-05 15:30:00'),
(@b2, @manager_user_id, 1, '2024-12-05 16:00:00'),
(@b2, @service_user_id, 1, '2024-12-05 17:00:00'),
(@b3, @manager_user_id, 1, '2024-12-06 09:30:00'),
(@b3, @service_user_id, 0, NULL),
(@b4, @admin_user_id, 1, '2024-12-06 11:15:00'),
(@b5, @manager_user_id, 0, NULL),
(@b5, @service_user_id, 0, NULL);
