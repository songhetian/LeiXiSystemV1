-- 033_asset_specs_and_upgrades.sql
-- 电脑资产详细配置与变更记录

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 修改 assets 表，增加配置详情字段
-- 使用 JSON 类型存储非结构化的硬件参数，方便扩展
ALTER TABLE assets 
ADD COLUMN specs JSON COMMENT '硬件配置详情 (CPU, RAM, Disk, GPU, UUID, MAC)',
ADD COLUMN mac_address VARCHAR(50) COMMENT '主要网卡MAC地址，用于快速检索';

-- 2. 创建资产硬件变更/升级记录表
CREATE TABLE IF NOT EXISTS asset_upgrades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    
    change_type ENUM('upgrade', 'repair', 'replacement', 'initial') DEFAULT 'upgrade',
    -- upgrade: 升级配置, repair: 维修更换, replacement: 损坏更换, initial: 初始录入
    
    description VARCHAR(255) NOT NULL, -- 变更描述 (e.g., "内存从8G升级到16G")
    
    old_specs JSON, -- 变更前的配置快照
    new_specs JSON, -- 变更后的配置快照
    
    cost DECIMAL(10, 2) DEFAULT 0.00, -- 产生的费用
    
    handled_by INT, -- 经办人
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (handled_by) REFERENCES users(id)
);

SET FOREIGN_KEY_CHECKS = 1;
