-- ==========================================
-- 角色审批流程配置表
-- ==========================================

-- 创建角色审批流程映射表
DROP TABLE IF EXISTS `role_workflows`;
CREATE TABLE `role_workflows` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `role_id` INT NOT NULL COMMENT '角色ID',
  `workflow_id` INT NOT NULL COMMENT '审批流程ID',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_workflow` (`role_id`, `workflow_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_workflow_id` (`workflow_id`),
  
  CONSTRAINT `fk_role_workflows_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_workflows_workflow` FOREIGN KEY (`workflow_id`) REFERENCES `approval_workflows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色审批流程配置表';

-- 输出创建成功信息
SELECT 'role_workflows table created successfully' AS 'Status';