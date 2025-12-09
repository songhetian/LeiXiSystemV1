-- 添加更多通知设置默认值
INSERT IGNORE INTO `notification_settings` (`event_type`, `target_roles`) VALUES
('leave_cancel', '["部门管理员"]'),
('overtime_apply', '["部门管理员"]'),
('overtime_approval', '["申请人"]'),
('overtime_rejection', '["申请人"]'),
('makeup_apply', '["部门管理员"]'),
('makeup_approval', '["申请人"]'),
('makeup_rejection', '["申请人"]');
