-- ============================================
-- 创建受限权限的数据库用户
-- 用户名: leixi_mysql_user
-- 密码: leixi@123456
-- ============================================

-- 1. 创建用户
-- 如果用户已存在，先删除以确保重新创建时使用新密码和默认权限
DROP USER IF EXISTS 'leixi_mysql_user'@'%';
CREATE USER 'leixi_mysql_user'@'%' IDENTIFIED BY 'leixi@123456';

-- 2. 授予权限
-- 只授予必要的增删改查权限，不授予 DROP/ALTER 等危险权限
-- 针对 leixin_customer_service 数据库
GRANT SELECT, INSERT, UPDATE, DELETE ON leixin_customer_service.* TO 'leixi_mysql_user'@'%';
-- 针对 leixin_customer_service_v1 数据库 (如果存在)
GRANT SELECT, INSERT, UPDATE, DELETE ON leixin_customer_service_v1.* TO 'leixi_mysql_user'@'%';

-- 3. 刷新权限
FLUSH PRIVILEGES;

-- 4. 查看权限确认
SHOW GRANTS FOR 'leixi_mysql_user'@'%';

SELECT '用户 leixi_mysql_user 创建成功' AS 'Status';
