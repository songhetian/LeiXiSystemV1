-- 清理案例库测试数据
-- 此脚本将删除所有测试案例数据

-- 删除案例相关的所有关联数据
DELETE FROM case_tags WHERE case_id IN (SELECT id FROM quality_cases);
DELETE FROM case_likes WHERE case_id IN (SELECT id FROM quality_cases);
DELETE FROM case_collections WHERE case_id IN (SELECT id FROM quality_cases);
DELETE FROM case_comments WHERE case_id IN (SELECT id FROM quality_cases);
DELETE FROM case_attachments WHERE case_id IN (SELECT id FROM quality_cases);
DELETE FROM case_learning_records WHERE case_id IN (SELECT id FROM quality_cases);
DELETE FROM user_case_favorites WHERE case_id IN (SELECT id FROM quality_cases);

-- 删除所有案例
DELETE FROM quality_cases;

-- 重置自增ID
ALTER TABLE quality_cases AUTO_INCREMENT = 1;

-- 显示清理结果
SELECT '案例库测试数据已清理完成' AS message;
