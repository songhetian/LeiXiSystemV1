-- Chat System Tables

-- 1. Groups Table
CREATE TABLE IF NOT EXISTS chat_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    owner_id INT NOT NULL, -- User who created the group
    type ENUM('group', 'p2p') DEFAULT 'group', -- 'p2p' is virtual for direct messages logic if needed, usually just 'group'
    avatar VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- 2. Group Members Table
CREATE TABLE IF NOT EXISTS chat_group_members (
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role ENUM('admin', 'member') DEFAULT 'member',
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Messages Table (Unified for P2P and Groups)
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    
    -- If group_id is set, it's a group message.
    -- If group_id is NULL, receiver_id MUST be set (Private Message).
    group_id INT DEFAULT NULL, 
    receiver_id INT DEFAULT NULL,
    
    content TEXT, -- Text content
    msg_type ENUM('text', 'image', 'file', 'system') DEFAULT 'text',
    file_url VARCHAR(255), -- For images/files
    
    is_read BOOLEAN DEFAULT FALSE, -- For P2P only. Groups use separate read receipt table if strict tracking needed.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);

-- Index for faster history retrieval
CREATE INDEX idx_chat_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_receiver ON chat_messages(receiver_id);
CREATE INDEX idx_chat_group ON chat_messages(group_id);
CREATE INDEX idx_chat_time ON chat_messages(created_at);
