-- 041_create_special_approval_groups.sql

-- 1. 审批组主表
CREATE TABLE IF NOT EXISTS special_approval_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. 审批组成员表
CREATE TABLE IF NOT EXISTS special_approval_group_members (
    group_id INT NOT NULL,
    member_type ENUM('role', 'user') NOT NULL,
    member_id INT NOT NULL, 
    PRIMARY KEY (group_id, member_type, member_id),
    FOREIGN KEY (group_id) REFERENCES special_approval_groups(id) ON DELETE CASCADE
);

-- 3. 幂等添加字段
SET @dbname = DATABASE();
SET @tablename = "approval_workflow_nodes";
SET @columnname = "special_group_id";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  "SELECT 1",
  "ALTER TABLE approval_workflow_nodes ADD COLUMN special_group_id INT DEFAULT NULL AFTER role_id"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
