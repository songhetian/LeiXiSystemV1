-- 028_create_operation_logs_table.sql
-- 创建系统操作日志表

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `operation_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL COMMENT '执行用户ID',
  `username` VARCHAR(50) NULL COMMENT '执行用户名',
  `real_name` VARCHAR(50) NULL COMMENT '执行用户真实姓名',
  `module` VARCHAR(50) NOT NULL COMMENT '所属模块',
  `action` VARCHAR(100) NOT NULL COMMENT '动作/描述',
  `method` VARCHAR(10) NULL COMMENT '请求方法(GET/POST等)',
  `url` VARCHAR(255) NULL COMMENT '请求路径',
  `params` JSON NULL COMMENT '请求参数',
  `ip` VARCHAR(45) NULL COMMENT '操作IP地址',
  `user_agent` VARCHAR(255) NULL COMMENT '浏览器标识',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态(1:成功, 0:失败)',
  `error_msg` TEXT NULL COMMENT '错误信息',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_module` (`module`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统操作日志表';

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Operation logs table created successfully' as result;
