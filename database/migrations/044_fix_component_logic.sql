-- 044_fix_component_logic.sql
SET FOREIGN_KEY_CHECKS = 0;

-- 1. 移除配件表的 SN 唯一限制，改为纯规格描述
ALTER TABLE asset_components 
DROP INDEX sn, -- 移除唯一索引
MODIFY COLUMN sn VARCHAR(100) NULL; -- SN 变为可选

-- 2. 增加配件规格的库存数量字段 (因为它们不是唯一的，所以按数量管)
ALTER TABLE asset_components 
ADD COLUMN stock_quantity INT DEFAULT 0 AFTER status;

-- 3. 修正设备模板，使其直接关联到具体的配件 ID
-- 之前是关联分类，现在改为关联具体的配件规格
ALTER TABLE asset_model_templates 
ADD COLUMN component_id INT AFTER model_id,
ADD CONSTRAINT fk_template_component FOREIGN KEY (component_id) REFERENCES asset_components(id);

SET FOREIGN_KEY_CHECKS = 1;
