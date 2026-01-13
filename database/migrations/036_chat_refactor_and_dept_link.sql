-- 036_chat_refactor_and_dept_link.sql

-- 1. Add department_id to chat_groups to link strictly 1:1
ALTER TABLE chat_groups ADD COLUMN department_id INT UNIQUE DEFAULT NULL;
ALTER TABLE chat_groups ADD FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE;

-- 2. Add last_read_message_id to group_members for unread count calculation
ALTER TABLE chat_group_members ADD COLUMN last_read_message_id INT DEFAULT 0;

-- 3. Ensure uniqueness in membership
ALTER TABLE chat_group_members ADD UNIQUE KEY unique_group_user (group_id, user_id);
