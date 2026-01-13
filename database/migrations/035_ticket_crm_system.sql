-- 035_ticket_crm_system.sql
-- 客户管理与工单系统 (CRM & Ticket)

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 客户表 (CRM)
CREATE TABLE IF NOT EXISTS crm_customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE, -- 客户电话作为唯一标识
    email VARCHAR(100),
    company VARCHAR(100),
    level ENUM('normal', 'vip', 'black') DEFAULT 'normal',
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT, -- 录入人
    
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 2. 工单表 (Tickets)
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_no VARCHAR(50) UNIQUE NOT NULL, -- 工单号 (e.g. TK-20240112-001)
    title VARCHAR(200) NOT NULL,
    description TEXT,
    
    customer_id INT NOT NULL,
    
    status ENUM('open', 'pending', 'resolved', 'closed') DEFAULT 'open',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    category VARCHAR(50), -- 分类 (e.g. 咨询, 投诉, 技术支持)
    
    creator_id INT NOT NULL, -- 创建人 (客服)
    assignee_id INT, -- 当前处理人
    assignee_dept_id INT, -- 指派部门 (可选)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    
    FOREIGN KEY (customer_id) REFERENCES crm_customers(id),
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (assignee_id) REFERENCES users(id),
    FOREIGN KEY (assignee_dept_id) REFERENCES departments(id)
);

-- 3. 工单流转记录 (Ticket Logs)
CREATE TABLE IF NOT EXISTS ticket_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    operator_id INT NOT NULL,
    
    action VARCHAR(50), -- e.g. 'create', 'assign', 'reply', 'resolve'
    content TEXT, -- 备注或回复内容
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    FOREIGN KEY (operator_id) REFERENCES users(id)
);

-- 4. 权限
INSERT INTO permissions (name, code, resource, action, module, description) VALUES
('工单管理', 'service:ticket:manage', 'ticket', 'manage', 'service', '创建、分配、处理工单'),
('客户管理', 'service:customer:manage', 'customer', 'manage', 'service', '管理客户档案');

-- 分配权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name IN ('超级管理员', '普通员工') AND p.module = 'service';

SET FOREIGN_KEY_CHECKS = 1;
