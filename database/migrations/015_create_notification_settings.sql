CREATE TABLE IF NOT EXISTS `notification_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_type` varchar(50) NOT NULL COMMENT '事件类型',
  `target_roles` json DEFAULT NULL COMMENT '接收通知的角色列表',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_event_type` (`event_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知设置表';

-- 插入默认设置
INSERT INTO `notification_settings` (`event_type`, `target_roles`) VALUES
('leave_apply', '["部门管理员"]'),
('leave_approval', '["申请人"]'),
('leave_rejection', '["申请人"]'),
('exam_publish', '["全体员工"]'),
('exam_result', '["考生"]');
