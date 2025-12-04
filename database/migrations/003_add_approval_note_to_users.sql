-- 添加审批备注字段到用户表
-- 用于存储员工审核的拒绝原因

ALTER TABLE users ADD COLUMN approval_note TEXT NULL COMMENT '审批备注（拒绝原因）';
