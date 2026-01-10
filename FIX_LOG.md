# 工资条管理页面部门显示问题修复记录

## 问题描述
工资条管理页面 (`src/pages/Payroll/PayslipManagement.jsx`) 中的部门下拉选择框不显示任何部门选项。

## 问题根本原因

### API端点使用错误
- ❌ **错误使用**: `/api/departments` (在 `server/index.js:1017` 中定义)
- ✅ **应该使用**: `/api/departments/list` (在 `server/routes/departments.js:8` 中定义)

### API端点行为差异

#### `/api/departments` (index.js)
- 有复杂的权限过滤逻辑
- 当 `forManagement !== 'true'` 时会严格按部门权限过滤
- 如果权限配置不当可能返回空数组
- 适用于管理场景，不适合前端列表展示

#### `/api/departments/list` (routes/departments.js)
- 专门为前端列表展示设计
- 权限逻辑更清晰合理
- 其他页面都正常使用这个端点
- 支持基于JWT的部门权限控制

## 修复内容

### 1. 修复部门API调用
```javascript
// 修复前
const response = await axios.get(getApiUrl('/api/departments'));

// 修复后
const token = localStorage.getItem('token');
const response = await fetch(getApiUrl('/api/departments/list'), {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 2. 修复员工API调用
```javascript
// 修复前
const response = await axios.get(getApiUrl('/api/employees'));

// 修复后
const token = localStorage.getItem('token');
const response = await fetch(getApiUrl('/api/employees'), {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 3. 修复工资条API调用
```javascript
// 修复前
const response = await axios.get(getApiUrl('/api/admin/payslips'), { params });

// 修复后
const queryString = new URLSearchParams(params).toString();
const url = queryString ? `/api/admin/payslips?${queryString}` : '/api/admin/payslips';
const token = localStorage.getItem('token');
const response = await fetch(getApiUrl(url), {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 4. 移除不必要的依赖
- 移除了 `axios` 导入，统一使用 `fetch`
- 保持与项目中其他页面的API调用模式一致

## 权限系统集成

### JWT Token 部门权限提取
后端已有完善的JWT部门权限机制：
- JWT token 中包含 `department_id`
- `extractUserPermissions()` 从 JWT 和数据库提取权限
- `getUserPermissions()` 计算可查看的部门列表
- 支持用户个人部门权限和角色部门权限

### 权限验证流程
1. 前端发送请求时附带 JWT token
2. 后端从 JWT 中解析 `department_id`
3. 查询用户的部门权限配置
4. 根据权限过滤返回的部门列表

## 修复验证

### 测试步骤
1. 启动开发服务器
2. 登录系统
3. 导航到工资条管理页面
4. 检查部门下拉选择框是否正常显示部门列表

### 预期结果
- 部门下拉选择框显示用户有权限查看的部门
- 根据JWT中的部门权限正确过滤部门列表
- 与其他页面的部门显示行为保持一致

## 影响范围
- **文件**: `src/pages/Payroll/PayslipManagement.jsx`
- **功能**: 工资条管理页面的部门和员工选择功能
- **用户**: 工资条管理员

## 相关文件
- `server/index.js` - 部门API原始实现
- `server/routes/departments.js` - 部门列表API正确实现
- `server/middleware/checkPermission.js` - 权限检查中间件
- `src/contexts/PermissionContext.jsx` - 前端权限上下文

## 修复完成时间
2026年1月10日

## 修复状态
✅ 已完成 - 代码修复已完成

### 具体修改内容

1. **fetchDepartments 函数修复**：
   - 从使用 `/api/departments` 改为 `/api/departments/list`
   - 添加了正确的 Authorization header
   - 使用 fetch 替代 axios

2. **fetchEmployees 函数修复**：
   - 添加了正确的 Authorization header
   - 使用 fetch 替代 axios
   - 统一响应处理方式

3. **fetchPayslips 函数修复**：
   - 添加了正确的 Authorization header
   - 使用 fetch 替代 axios
   - 改进了查询参数处理

4. **依赖清理**：
   - 移除了 axios 导入
   - 统一使用原生的 fetch API

### 修复原理

**问题根源**：工资条管理页面使用了错误的API端点 `/api/departments`，该端点有严格的权限过滤逻辑，可能在某些配置下返回空数组。

**解决方案**：改为使用 `/api/departments/list` 端点，该端点专门为前端列表展示设计，权限逻辑更清晰合理，与项目中其他页面保持一致。

### 权限系统说明

后端已实现完善的JWT部门权限机制：
- JWT token 包含用户的 `department_id`
- `extractUserPermissions()` 函数从JWT和数据库提取权限
- `getUserPermissions()` 计算用户可查看的部门列表
- 支持用户个人部门权限和角色部门权限

修复后的代码将正确：
1. 从localStorage获取JWT token
2. 在请求头中包含认证信息
3. 调用正确的API端点
4. 根据JWT中的部门权限过滤返回的部门列表

### 测试建议

1. 启动开发服务器：`npm start`
2. 登录系统（确保用户有部门权限）
3. 导航到 工资管理 > 工资条管理
4. 验证部门下拉选择框是否正常显示部门
5. 验证员工下拉选择框是否正常显示员工

### 预期结果

- 部门下拉选择框显示用户有权限查看的所有部门
- 根据JWT中的部门权限正确过滤
- 与其他页面（如员工管理）的部门显示行为完全一致
- 不再出现空的下拉选择框

## 额外修复：SQL语法错误

### 发现的新问题
在修复部门API后，发现了工资条查询的SQL语法错误：
```
You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '? = 'net_salary' AND ? = 'ASC' THEN p.net_salary'
```

### 问题原因
工资条查询的排序逻辑使用了复杂的CASE语句，在WHERE条件中错误地使用了占位符`?`来比较字符串常量，这在MySQL中是不允许的。

### 修复内容
**文件**: `server/routes/payslips.js`

**原代码**（错误的SQL）：
```sql
ORDER BY
CASE
  WHEN ? = 'salary_month' AND ? = 'ASC' THEN p.salary_month
  WHEN ? = 'salary_month' AND ? = 'DESC' THEN p.salary_month
  ...
```

**修复后**（使用动态SQL构建）：
```javascript
// 构建排序子句
let orderClause = 'ORDER BY ';
switch (validSortBy) {
  case 'salary_month':
    orderClause += `p.salary_month ${validSortOrder}`;
    break;
  case 'net_salary':
    orderClause += `p.net_salary ${validSortOrder}`;
    break;
  case 'employee_name':
    orderClause += `u.real_name ${validSortOrder}`;
    break;
  case 'created_at':
    orderClause += `p.created_at ${validSortOrder}`;
    break;
  default:
    orderClause += `p.salary_month ${validSortOrder}`;
}
orderClause += ', p.created_at DESC';
```

### 修复优势
1. **更好的性能**：避免了复杂的CASE语句
2. **更清晰的逻辑**：直接使用动态SQL构建
3. **更安全**：避免了SQL注入风险
4. **更易维护**：排序逻辑更直观

## 修复总结

### 完成的修复
1. ✅ **部门API端点修复**：从 `/api/departments` 改为 `/api/departments/list`
2. ✅ **认证header添加**：所有API调用都包含正确的JWT token
3. ✅ **API调用统一**：使用fetch替代axios，与项目其他页面保持一致
4. ✅ **SQL语法错误修复**：修复了工资条排序查询的SQL语法问题

### 测试建议
1. 访问工资条管理页面
2. 验证部门下拉选择框正常显示
3. 验证工资条列表正常加载和排序
4. 测试各种排序功能（按月份、工资、员工姓名等）

### 预期效果
- ✅ 部门下拉选择框显示用户权限内的部门
- ✅ 工资条列表正常加载，无SQL错误
- ✅ 排序功能正常工作
- ✅ 与其他页面功能保持一致