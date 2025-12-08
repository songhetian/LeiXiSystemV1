-- ==========================================
-- 为 admin（超级管理员）分配所有权限
-- 在执行 npm run db:seed 时执行
-- ==========================================

-- 获取超级管理员角色ID
SET @role_admin_id = (SELECT id FROM `roles` WHERE `name` = '超级管理员' LIMIT 1);

-- 如果不存在超级管理员角色，输出提示
SELECT '未找到超级管理员角色，跳过权限分配' AS 'Status' WHERE @role_admin_id IS NULL;

-- 为超级管理员分配当前系统中已存在的所有权限（去重）
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
SELECT @role_admin_id, p.id FROM `permissions` p WHERE @role_admin_id IS NOT NULL;

-- 输出分配结果（仅在角色存在时输出）
SELECT CONCAT('已为超级管理员分配权限数量: ', (SELECT COUNT(*) FROM `role_permissions` WHERE `role_id` = @role_admin_id)) AS 'Status' WHERE @role_admin_id IS NOT NULL;

-- 将 admin 用户绑定到超级管理员角色（如果尚未绑定）
SET @user_admin_id = (SELECT id FROM `users` WHERE `username` = 'admin' LIMIT 1);

INSERT IGNORE INTO `user_roles` (`user_id`, `role_id`, `assigned_at`)
SELECT @user_admin_id, @role_admin_id, NOW()
WHERE @user_admin_id IS NOT NULL AND @role_admin_id IS NOT NULL;

SELECT 'admin角色绑定检查完成' AS 'Status';
