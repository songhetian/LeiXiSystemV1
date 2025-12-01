# 质检规则ID问题 - 快速修复指南

## 问题
```
请求失败: Invalid rule IDs: 1, 2, 3. Available rule IDs: 4, 5, 6
```

## 快速修复步骤

### 1️⃣ 前端代码已修复 ✅
代码已经修改为动态获取规则ID，无需手动操作。

### 2️⃣ 检查数据库规则（可选）

运行检查脚本：
```bash
npm run db:check-quality-rules
```

### 3️⃣ 如果数据库中没有规则

运行修复脚本（自动从.env读取数据库配置）：
```bash
npm run db:fix-quality-rules
```

或者使用SQL脚本（需要手动指定数据库）：
```bash
# Windows PowerShell
Get-Content database\fix-quality-rules.sql | mysql -u root -p your_database_name

# Linux/Mac
mysql -u root -p your_database_name < database/fix-quality-rules.sql
```

### 4️⃣ 重启应用

```bash
npm start
```

## 验证修复

1. 打开应用
2. 进入 **质检管理 -> 会话质检**
3. 选择一个会话进行质检
4. 评分并保存
5. 确认没有错误提示 ✅

## 技术说明

**修改的文件：**
- `src/components/SessionDetailModal.jsx` - 动态获取规则ID

**新增的文件：**
- `database/fix-quality-rules.sql` - 数据库修复脚本
- `check-quality-rules.js` - 规则检查脚本
- `FIX_QUALITY_RULES.md` - 详细修复文档

## 需要帮助？

查看详细文档：`FIX_QUALITY_RULES.md`
