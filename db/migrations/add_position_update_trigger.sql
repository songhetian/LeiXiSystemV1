-- 创建触发器：当positions表中的职位名称更新时，同步更新employees表中的职位名称
DELIMITER $$

CREATE TRIGGER update_employee_position_on_position_change
AFTER UPDATE ON positions
FOR EACH ROW
BEGIN
  -- 当职位名称改变时，更新所有关联的员工记录中的职位名称
  IF OLD.name != NEW.name THEN
    UPDATE employees
    SET position = NEW.name
    WHERE position_id = NEW.id;
  END IF;
END$$

DELIMITER ;
