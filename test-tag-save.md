# 标签保存测试指南

## 问题诊断

标签无法保存的原因是数据库表引用不一致：
- 数据库外键约束指向 `tags` 表
- 但代码中部分查询使用了 `quality_tags` 表

## 已修复

所有查询已统一使用 `tags` 表：

### 修复的查询

1. **会话详情中的标签查询**
```sql
-- 修改前
FROM quality_tags t

-- 修改后
FROM tags t
```

2. **消息标签查询**
```sql
-- 修改前
JOIN quality_tags t ON qmt.tag_id = t.id

-- 修改后
JOIN tags t ON qmt.tag_id = t.id
```

3. **获取会话标签API**
```sql
-- 修改前
FROM quality_tags t

-- 修改后
FROM tags t
```

## 数据库表说明

### tags 表（通用标签表）
```sql
CREATE TABLE tags (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    parent_id INT,           -- 支持层级结构
    category_id INT,         -- 标签分类
    tag_type VARCHAR(20),    -- 标签类型：'quality', 'case', etc.
    color VARCHAR(20),
    description TEXT,
    is_active TINYINT(1),
    ...
);
```

### quality_session_tags 表（会话标签关联）
```sql
CREATE TABLE quality_session_tags (
    id INT PRIMARY KEY,
    session_id INT,
    tag_id INT,  -- 外键指向 tags.id
    ...
    FOREIGN KEY (tag_id) REFERENCES tags(id)
);
```

### quality_message_tags 表（消息标签关联）
```sql
CREATE TABLE quality_message_tags (
    id INT PRIMARY KEY,
    message_id INT,
    tag_id INT,  -- 外键指向 tags.id
    ...
    FOREIGN KEY (tag_id) REFERENCES tags(id)
);
```

## 测试步骤

### 1. 检查数据库中的标签

```sql
-- 查看所有质检标签
SELECT id, name, tag_type, color, is_active
FROM tags
WHERE tag_type = 'quality' AND is_active = 1;
```

### 2. 测试会话标签保存

```
1. 打开会话质检
2. 选择一个会话
3. 在"会话标签"区域选择标签
4. 点击保存
5. 检查浏览器控制台是否有错误
6. 关闭并重新打开会话
7. ✅ 确认标签正确显示
```

### 3. 测试消息标签保存

```
1. 在会话详情中选择一条消息
2. 在"消息标签"区域选择标签
3. 点击保存
4. 关闭并重新打开会话
5. 选择同一条消息
6. ✅ 确认标签正确显示
```

### 4. 验证数据库记录

```sql
-- 检查会话标签是否保存
SELECT qst.*, t.name as tag_name
FROM quality_session_tags qst
JOIN tags t ON qst.tag_id = t.id
WHERE qst.session_id = 1;  -- 替换为实际的session_id

-- 检查消息标签是否保存
SELECT qmt.*, t.name as tag_name
FROM quality_message_tags qmt
JOIN tags t ON qmt.tag_id = t.id
JOIN session_messages sm ON qmt.message_id = sm.id
WHERE sm.session_id = 1;  -- 替换为实际的session_id
```

## 常见问题排查

### 问题1: 标签列表为空

**原因：** 数据库中没有质检标签

**解决：**
```sql
-- 检查是否有质检标签
SELECT COUNT(*) FROM tags WHERE tag_type = 'quality' AND is_active = 1;

-- 如果没有，需要添加标签（通过前端标签管理界面）
```

### 问题2: 保存时报外键约束错误

**错误信息：**
```
Cannot add or update a child row: a foreign key constraint fails
```

**原因：** 尝试保存的 tag_id 在 tags 表中不存在

**解决：**
```sql
-- 检查标签是否存在
SELECT id, name FROM tags WHERE id = ?;  -- 替换为实际的tag_id
```

### 问题3: 保存成功但重新打开后看不到

**原因：** 查询使用了错误的表

**解决：** 已修复，确保所有查询都使用 `tags` 表

### 问题4: 前端显示的标签ID与数据库不匹配

**检查：**
```javascript
// 在浏览器控制台查看发送的数据
console.log('Session tags:', sessionTags);
console.log('Message tags:', tags);

// 确认 tag.id 是正确的数字ID
```

## API端点测试

### 测试获取标签列表
```bash
curl http://localhost:3000/api/quality/tags?tag_type=quality
```

### 测试获取会话标签
```bash
curl http://localhost:3000/api/quality/sessions/1/tags
```

### 测试保存质检评分（包含标签）
```bash
curl -X POST http://localhost:3000/api/quality/sessions/1/review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "score": 80,
    "grade": "B",
    "comment": "测试评语",
    "session_tags": [1, 2, 3],
    "message_tags": [
      {"messageId": 1, "tagId": 4},
      {"messageId": 2, "tagId": 5}
    ],
    "rule_scores": []
  }'
```

## 修改的文件

- `server/routes/quality-inspection.js` - 统一使用 tags 表

## 下一步

如果标签仍然无法保存，请：

1. 检查浏览器控制台的错误信息
2. 检查服务器日志
3. 使用上面的SQL查询验证数据库状态
4. 确认标签ID是否正确

---

**修复完成时间：** 2024-12-01
**版本：** v1.0.3
**状态：** ✅ 已修复
