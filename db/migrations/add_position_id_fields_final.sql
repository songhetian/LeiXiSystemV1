-- 添加position_id字段到employees表
ALTER TABLE employees ADD COLUMN position_id INT NULL COMMENT '职位ID，关联positions表';

-- 为employees表的position_id字段添加索引
ALTER TABLE employees ADD INDEX idx_position_id (position_id);

-- 为employees表的position_id字段添加外键约束
ALTER TABLE employees ADD CONSTRAINT fk_employees_position
FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- 添加old_position_id字段到employee_changes表
ALTER TABLE employee_changes ADD COLUMN old_position_id INT NULL COMMENT '原职位ID';

-- 添加new_position_id字段到employee_changes表
ALTER TABLE employee_changes ADD COLUMN new_position_id INT NULL COMMENT '新职位ID';

-- 为employee_changes表的old_position_id字段添加索引
ALTER TABLE employee_changes ADD INDEX idx_old_position_id (old_position_id);

-- 为employee_changes表的new_position_id字段添加索引
ALTER TABLE employee_changes ADD INDEX idx_new_position_id (new_position_id);

-- 为employee_changes表的old_position_id字段添加外键约束
ALTER TABLE employee_changes ADD CONSTRAINT fk_employee_changes_old_position
FOREIGN KEY (old_position_id) REFERENCES positions(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- 为employee_changes表的new_position_id字段添加外键约束
ALTER TABLE employee_changes ADD CONSTRAINT fk_employee_changes_new_position
FOREIGN KEY (new_position_id) REFERENCES positions(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- 更新现有数据：将employees表中的position字段值与positions表关联 (使用CONVERT进行字符集转换)
UPDATE employees e
JOIN positions p ON CONVERT(e.position USING utf8mb4) = CONVERT(p.name USING utf8mb4)
SET e.position_id = p.id
WHERE e.position IS NOT NULL AND e.position != '';

-- 更新现有数据：将employee_changes表中的old_position和new_position字段值与positions表关联 (使用CONVERT进行字符集转换)
UPDATE employee_changes ec
JOIN positions p ON CONVERT(ec.old_position USING utf8mb4) = CONVERT(p.name USING utf8mb4)
SET ec.old_position_id = p.id
WHERE ec.old_position IS NOT NULL AND ec.old_position != '';

UPDATE employee_changes ec
JOIN positions p ON CONVERT(ec.new_position USING utf8mb4) = CONVERT(p.name USING utf8mb4)
SET ec.new_position_id = p.id
WHERE ec.new_position IS NOT NULL AND ec.new_position != '';
