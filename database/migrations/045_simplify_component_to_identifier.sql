-- 045_simplify_component_to_identifier.sql
SET FOREIGN_KEY_CHECKS = 0;

-- 1. 移除配件表的库存数量字段，它现在仅作为一个规格标识
ALTER TABLE asset_components 
DROP COLUMN stock_quantity;

SET FOREIGN_KEY_CHECKS = 1;
