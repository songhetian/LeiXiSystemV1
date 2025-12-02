-- 添加软删除字段到案例表
ALTER TABLE quality_cases ADD COLUMN deleted_at DATETIME DEFAULT NULL COMMENT '删除时间（软删除）';

-- 添加索引以提高查询性能
CREATE INDEX idx_deleted_at ON quality_cases(deleted_at);

-- 显示结果
SELECT '已成功添加 deleted_at 字段和索引' AS message;
