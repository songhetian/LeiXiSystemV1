-- 046_fix_asset_request_features.sql
SET FOREIGN_KEY_CHECKS = 0;

-- 1. 资产申请表增加数量字段和催办统计
ALTER TABLE asset_requests 
ADD COLUMN quantity INT DEFAULT 1 AFTER target_component_type_id,
ADD COLUMN urge_count INT DEFAULT 0,
ADD COLUMN last_urged_at TIMESTAMP NULL;

SET FOREIGN_KEY_CHECKS = 1;
