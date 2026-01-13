# LeiXi System 数据库部署指南

## 📋 快速部署

### 一键初始化（推荐）

```bash
# 1. 创建数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS leixi_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. 执行初始化脚本
mysql -u root -p leixi_system < database/leixi_init_schema.sql
```

### 环境要求

- **MySQL**: 8.0+
- **字符集**: utf8mb4
- **存储引擎**: InnoDB

---

## 📁 文件说明

| 文件 | 说明 | 状态 |
|------|------|------|
| `leixi_init_schema.sql` | **完整数据库初始化脚本** | ✅ 推荐使用 |
| `migrations/001_full_install.sql` | 原始完整安装脚本 | 📦 归档 |
| `migrations/*.sql` | 增量迁移脚本 | 📦 归档 |
| `test-data/` | 测试数据目录 | 🧪 可选 |

---

## 🔧 初始化脚本特性

`leixi_init_schema.sql` 包含以下内容：

### 表结构（按依赖顺序创建）
- **Phase 1**: 核心系统表（无外键依赖）
  - platforms, departments, roles, permissions
  - vacation_types, shifts, work_shifts
  - tag_categories, exam_categories, knowledge_categories
  
- **Phase 2**: 用户相关表
  - users, employees, positions
  - user_roles, role_permissions, user_departments
  
- **Phase 3**: 业务表
  - tags, exams, questions, assessment_plans
  - quality_sessions, quality_cases, knowledge_articles
  
- **Phase 4**: 考勤与假期表
  - attendance_records, leave_records
  - vacation_balances, overtime_records, schedules
  
- **Phase 5**: 聊天与消息表
  - conversations, messages, notifications

### 预置数据
- ✅ 默认平台（淘宝、京东、拼多多）
- ✅ 管理部门
- ✅ 系统角色（超级管理员、普通员工）
- ✅ 权限定义（35+项）
- ✅ 默认假期类型
- ✅ 默认班次
- ✅ 管理员账号

---

## 🔐 默认管理员账号

| 项目 | 值 |
|------|------|
| 用户名 | `admin` |
| 密码 | `admin123` |
| 角色 | 超级管理员 |

> ⚠️ **安全提示**: 首次登录后请立即修改默认密码！

---

## 🧪 导入测试数据（可选）

```bash
cd database/test-data

# 按顺序执行测试数据
for file in *.sql; do
  mysql -u root -p leixi_system < "$file"
done
```

---

## ✅ 验证部署

```sql
USE leixi_system;

-- 查看所有表
SHOW TABLES;

-- 验证管理员账号
SELECT id, username, real_name, status FROM users WHERE username = 'admin';

-- 验证角色权限
SELECT r.name as role_name, COUNT(rp.id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id;

-- 验证迁移记录
SELECT * FROM migrations_history;
```

---

## 🔄 重置数据库

```bash
# 删除并重建数据库
mysql -u root -p -e "DROP DATABASE IF EXISTS leixi_system;"
mysql -u root -p -e "CREATE DATABASE leixi_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p leixi_system < database/leixi_init_schema.sql
```

---

## 📊 数据库统计

- **核心表数量**: 50+ 张
- **预置权限**: 35+ 项
- **字符集**: utf8mb4_unicode_ci
- **存储引擎**: InnoDB
- **外键约束**: 已配置级联删除

---

## 🚀 部署后步骤

1. ✅ 启动后端服务器: `npm run dev:server`
2. ✅ 启动前端应用: `npm run dev:react`
3. ✅ 使用 admin/admin123 登录系统
4. ✅ 修改默认管理员密码
5. ✅ 配置系统参数

---

## ❓ 常见问题

### Q: 执行脚本报外键约束错误？
A: 脚本已设置 `SET FOREIGN_KEY_CHECKS=0`，应该不会出现。如果仍有问题，请确保使用 MySQL 8.0+。

### Q: 字符集乱码？
A: 确保数据库和连接都使用 utf8mb4：
```sql
SET NAMES utf8mb4;
```

### Q: 如何备份数据库？
```bash
mysqldump -u root -p leixi_system > backup_$(date +%Y%m%d).sql
```

---

**数据库已准备就绪！** 🎉