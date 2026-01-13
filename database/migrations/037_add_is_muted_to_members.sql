-- 037_add_is_muted_to_members.sql
ALTER TABLE chat_group_members ADD COLUMN is_muted BOOLEAN DEFAULT FALSE;
