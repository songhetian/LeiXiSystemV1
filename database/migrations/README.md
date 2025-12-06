# 数据库部署指南

## 📋 快速部署

### 一键部署所有表（推荐）

```bash
# 1. 创建数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS leixi_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. 执行完整初始化脚本
mysql -u root -p leixi_system < database/migrations/001_init_database.sql
```

**说明**: `001_init_database.sql` 包含所有表结构（113个CREATE TABLE语句）：
- ✅ 核心业务表（50+张）
- ✅ 备忘录系统（memos + memo_recipients）
- ✅ 系统广播（broadcasts + broadcast_recipients）
- ✅ 转换假期记录（conversion_usage_records）
- ✅ 用户审批备注字段（approval_note）
- ✅ 所有索引和外键

---

## 📁 文件说明

| 文件 | 说明 | 状态 |
|------|------|------|
| `001_init_database.sql` | **完整数据库初始化文件（唯一）** | ✅ 使用此文件 |
| `README.md` | 部署指南 | 📖 文档 |

**所有其他迁移文件已合并到001_init_database.sql中**

---

## 🧪 测试数据

测试数据位于 `database/test-data/` 目录：

```bash
# 按顺序执行测试数据
mysql -u root -p leixi_system < database/test-data/01_insert_departments.sql
mysql -u root -p leixi_system < database/test-data/02_insert_roles.sql
mysql -u root -p leixi_system < database/test-data/03_insert_users.sql
# ... 其他测试数据文件
mysql -u root -p leixi_system < database/test-data/12_insert_memos.sql
mysql -u root -p leixi_system < database/test-data/13_insert_broadcasts.sql
```

**测试数据包括**:
- 部门、角色、用户
- 平台、店铺
- 质检会话、标签
- 质检案例
- **备忘录数据**（新增）
- **系统广播数据**（新增）

---

## 🔄 部署步骤

### 新系统完整部署

```bash
# 1. 创建数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS leixi_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. 初始化表结构
mysql -u root -p leixi_system < database/migrations/001_init_database.sql

# 3. 导入测试数据（可选）
cd database/test-data
for file in *.sql; do mysql -u root -p leixi_system < "$file"; done
```

### 验证部署

```sql
USE leixi_system;

-- 查看所有表（应该有50+张）
SHOW TABLES;

-- 验证新增表
DESC memos;
DESC memo_recipients;
DESC broadcasts;
DESC broadcast_recipients;
DESC conversion_usage_records;

-- 验证测试数据
SELECT COUNT(*) FROM memos;
SELECT COUNT(*) FROM broadcasts;
```

---

## 📊 数据库统计

- **总表数**: 50+ 张表
- **CREATE TABLE语句**: 113个
- **文件大小**: ~160KB
- **字符集**: utf8mb4
- **引擎**: InnoDB
- **外键**: 已配置级联删除

---

## 🎯 下一步

部署完成后：

1. ✅ 启动后端服务器: `npm run dev`
2. ✅ 启动前端应用: `npm start`
3. ✅ 登录系统测试
4. ✅ 测试WebSocket通知功能
5. ✅ 测试备忘录功能
6. ✅ 测试系统广播功能

**数据库已准备就绪！** 🚀
