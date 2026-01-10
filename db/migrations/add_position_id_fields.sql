-- 添加position_id字段到employees表
ALTER TABLE employees
ADD COLUMN position_id INT NULL COMMENT '职位ID，关联positions表',
ADD INDEX idx_position_id (position_id),
ADD CONSTRAINT fk_employees_position
FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- 添加position_id字段到employee_changes表
ALTER TABLE employee_changes
ADD COLUMN old_position_id INT NULL COMMENT '原职位ID',
ADD COLUMN new_position_id INT NULL COMMENT '新职位ID',
ADD INDEX idx_old_position_id (old_position_id),
ADD INDEX idx_new_position_id (new_position_id),
ADD CONSTRAINT fk_employee_changes_old_position
FOREIGN KEY (old_position_id) REFERENCES positions(id) ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT fk_employee_changes_new_position
FOREIGN KEY (new_position_id) REFERENCES positions(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- 更新现有数据：将employees表中的position字段值与positions表关联
UPDATE employees e
JOIN positions p ON e.position = p.name
SET e.position_id = p.id
WHERE e.position IS NOT NULL AND e.position != '';

-- 更新现有数据：将employee_changes表中的old_position和new_position字段值与positions表关联
UPDATE employee_changes ec
JOIN positions p ON ec.old_position = p.name
SET ec.old_position_id = p.id
WHERE ec.old_position IS NOT NULL AND ec.old_position != '';

UPDATE employee_changes ec
JOIN positions p ON ec.new_position = p.name
SET ec.new_position_id = p.id
WHERE ec.new_position IS NOT NULL AND ec.new_position != '';
