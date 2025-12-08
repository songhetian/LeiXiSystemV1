SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'is_department_manager'
);

SET @ddl = IF(
  @col_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `is_department_manager` BOOLEAN DEFAULT FALSE COMMENT ''是否为部门主管''',
  'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
