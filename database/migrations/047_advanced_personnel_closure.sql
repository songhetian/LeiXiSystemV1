-- 047_advanced_personnel_closure.sql
-- 资产管理与人员状态闭环逻辑增强

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 扩展状态枚举，增加 deleted 状态 (支持重复执行)
ALTER TABLE users MODIFY COLUMN status ENUM('active', 'inactive', 'pending', 'resigned', 'deleted') DEFAULT 'pending';
ALTER TABLE employees MODIFY COLUMN status ENUM('active', 'inactive', 'resigned', 'deleted') DEFAULT 'active';

-- 2. 安全补全变动记录表字段
DROP PROCEDURE IF EXISTS AddPositionColumns;
DELIMITER //
CREATE PROCEDURE AddPositionColumns()
BEGIN
    -- 检查并添加 old_position_id
    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='employee_changes' AND COLUMN_NAME='old_position_id') THEN
        ALTER TABLE employee_changes ADD COLUMN old_position_id INT COMMENT '原职位ID';
    END IF;
    
    -- 检查并添加 new_position_id
    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='employee_changes' AND COLUMN_NAME='new_position_id') THEN
        ALTER TABLE employee_changes ADD COLUMN new_position_id INT COMMENT '新职位ID';
    END IF;
END //
DELIMITER ;

CALL AddPositionColumns();
DROP PROCEDURE AddPositionColumns;

SET FOREIGN_KEY_CHECKS = 1;
