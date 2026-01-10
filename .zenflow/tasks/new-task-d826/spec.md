# 工资条管理系统 - 技术规范

## 1. 概述

### 1.1 难度评估
**难度级别**: Medium

**理由**:
- 需要设计多个关联的数据库表（工资条、模板配置、发放记录等）
- 涉及敏感数据的安全处理（二级密码、数据隔离）
- 需要实现复杂的权限控制和数据验证
- 包含批量导入、PDF导出等功能
- 需要与现有的考勤系统集成获取考勤数据

### 1.2 技术栈
- **前端**: React 18.2 + Ant Design 5.29 + Tailwind CSS
- **后端**: Fastify 4.25 + Node.js
- **数据库**: MySQL 8.0 with utf8mb4_unicode_ci
- **其他**: ExcelJS (Excel处理), jsPDF/html2canvas (PDF生成), bcryptjs (密码加密)

## 2. 数据库设计

### 2.1 工资条主表 (payslips)

存储工资条的基本信息和工资明细。

```sql
CREATE TABLE `payslips` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '工资条唯一标识ID',
  `payslip_no` VARCHAR(50) NOT NULL COMMENT '工资条编号，格式：PS-YYYYMM-序号',
  `employee_id` INT NOT NULL COMMENT '员工ID，关联employees表',
  `user_id` INT NOT NULL COMMENT '用户ID，关联users表',
  `salary_month` DATE NOT NULL COMMENT '工资所属月份，格式：YYYY-MM-01',
  `payment_date` DATE NULL COMMENT '发放日期',
  
  -- 考勤统计（从考勤系统获取）
  `attendance_days` DECIMAL(5,2) DEFAULT 0.00 COMMENT '出勤天数',
  `late_count` INT DEFAULT 0 COMMENT '迟到次数',
  `early_leave_count` INT DEFAULT 0 COMMENT '早退次数',
  `leave_days` DECIMAL(5,2) DEFAULT 0.00 COMMENT '请假天数',
  `overtime_hours` DECIMAL(6,2) DEFAULT 0.00 COMMENT '加班时长（小时）',
  `absent_days` DECIMAL(5,2) DEFAULT 0.00 COMMENT '缺勤天数',
  
  -- 工资明细
  `basic_salary` DECIMAL(10,2) DEFAULT 0.00 COMMENT '基本工资',
  `position_salary` DECIMAL(10,2) DEFAULT 0.00 COMMENT '岗位工资',
  `performance_bonus` DECIMAL(10,2) DEFAULT 0.00 COMMENT '绩效奖金',
  `overtime_pay` DECIMAL(10,2) DEFAULT 0.00 COMMENT '加班费',
  `allowances` DECIMAL(10,2) DEFAULT 0.00 COMMENT '各类补贴',
  `deductions` DECIMAL(10,2) DEFAULT 0.00 COMMENT '各类扣款',
  `social_security` DECIMAL(10,2) DEFAULT 0.00 COMMENT '社保扣款',
  `housing_fund` DECIMAL(10,2) DEFAULT 0.00 COMMENT '公积金扣款',
  `tax` DECIMAL(10,2) DEFAULT 0.00 COMMENT '个人所得税',
  `other_deductions` DECIMAL(10,2) DEFAULT 0.00 COMMENT '其他扣款',
  `net_salary` DECIMAL(10,2) NOT NULL COMMENT '实发工资（自动计算）',
  
  -- 状态与备注
  `status` ENUM('draft', 'sent', 'viewed', 'confirmed') NOT NULL DEFAULT 'draft' COMMENT '状态：草稿、已发放、已查看、已确认',
  `remark` TEXT NULL COMMENT '备注信息',
  `custom_fields` JSON NULL COMMENT '自定义字段数据，存储额外的工资项目',
  
  -- 发放信息
  `issued_by` INT NULL COMMENT '发放人ID',
  `issued_at` DATETIME NULL COMMENT '发放时间',
  `viewed_at` DATETIME NULL COMMENT '首次查看时间',
  `confirmed_at` DATETIME NULL COMMENT '确认时间',
  
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payslip_no` (`payslip_no`),
  UNIQUE KEY `uk_employee_month` (`employee_id`, `salary_month`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_salary_month` (`salary_month`),
  KEY `idx_status` (`status`),
  KEY `idx_issued_by` (`issued_by`),
  KEY `idx_issued_at` (`issued_at`),
  CONSTRAINT `fk_payslips_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payslips_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payslips_issued_by` FOREIGN KEY (`issued_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工资条表-存储员工工资条信息';
```

### 2.2 工资条模板配置表 (payslip_templates)

存储工资条的显示模板和字段配置。

```sql
CREATE TABLE `payslip_templates` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '模板ID',
  `template_name` VARCHAR(100) NOT NULL COMMENT '模板名称',
  `template_code` VARCHAR(50) NOT NULL COMMENT '模板代码，唯一标识',
  `is_default` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否默认模板',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  
  -- 字段配置（JSON格式）
  `field_config` JSON NOT NULL COMMENT '字段配置，包含字段名、显示名、是否显示、排序等',
  
  -- 模板说明
  `description` TEXT NULL COMMENT '模板描述',
  
  `created_by` INT NULL COMMENT '创建人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_template_code` (`template_code`),
  KEY `idx_is_default` (`is_default`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `fk_payslip_templates_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工资条模板配置表';
```

### 2.3 工资条发放配置表 (payslip_distribution_settings)

存储工资条的发放时间和范围配置。

```sql
CREATE TABLE `payslip_distribution_settings` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `setting_name` VARCHAR(100) NOT NULL COMMENT '配置名称',
  `frequency` ENUM('monthly', 'weekly', 'daily') NOT NULL DEFAULT 'monthly' COMMENT '发放频率',
  `distribution_day` INT NULL COMMENT '发放日（月中的第几天，1-31）',
  `distribution_weekday` INT NULL COMMENT '发放周几（1-7，周一到周日）',
  `distribution_time` TIME NULL COMMENT '发放时间',
  `auto_send` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否自动发放',
  
  -- 发放范围
  `target_departments` JSON NULL COMMENT '目标部门ID列表',
  `target_positions` JSON NULL COMMENT '目标职位列表',
  `target_employees` JSON NULL COMMENT '目标员工ID列表',
  
  -- 通知设置
  `notify_internal` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否发送站内信',
  `notify_sms` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否发送短信',
  `notify_email` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否发送邮件',
  
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_by` INT NULL COMMENT '创建人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `fk_distribution_settings_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工资条发放配置表';
```

### 2.4 二级密码表 (payslip_passwords)

存储员工查看工资条所需的二级密码。

```sql
CREATE TABLE `payslip_passwords` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '二级密码哈希值',
  `is_default` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否为默认密码（首次需修改）',
  `last_changed_at` DATETIME NULL COMMENT '最后修改时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  CONSTRAINT `fk_payslip_passwords_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工资条二级密码表';
```

### 2.5 工资导入历史表 (payslip_import_history)

记录批量导入工资数据的历史。

```sql
CREATE TABLE `payslip_import_history` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '导入记录ID',
  `file_name` VARCHAR(255) NOT NULL COMMENT '导入文件名',
  `salary_month` DATE NOT NULL COMMENT '工资所属月份',
  `total_count` INT NOT NULL DEFAULT 0 COMMENT '总记录数',
  `success_count` INT NOT NULL DEFAULT 0 COMMENT '成功导入数',
  `failed_count` INT NOT NULL DEFAULT 0 COMMENT '失败数',
  `error_details` JSON NULL COMMENT '错误详情',
  `import_data` JSON NULL COMMENT '导入的原始数据',
  `status` ENUM('processing', 'completed', 'failed') NOT NULL DEFAULT 'processing' COMMENT '导入状态',
  `imported_by` INT NOT NULL COMMENT '导入人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '导入时间',
  
  PRIMARY KEY (`id`),
  KEY `idx_salary_month` (`salary_month`),
  KEY `idx_imported_by` (`imported_by`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_import_history_imported_by` FOREIGN KEY (`imported_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工资导入历史表';
```

## 3. API 端点设计

### 3.1 员工端 API

#### 3.1.1 验证二级密码
```
POST /api/payslips/verify-password
Request: { password: string }
Response: { success: boolean, token: string, message: string }
```

#### 3.1.2 获取我的工资条列表
```
GET /api/payslips/my-payslips
Query: { page: number, limit: number, year: number, month: number }
Response: { success: boolean, data: Payslip[], total: number, pagination: {} }
```

#### 3.1.3 获取工资条详情
```
GET /api/payslips/:id
Headers: { Authorization: Bearer token, X-Payslip-Token: string }
Response: { success: boolean, data: PayslipDetail }
```

#### 3.1.4 确认工资条
```
POST /api/payslips/:id/confirm
Response: { success: boolean, message: string }
```

#### 3.1.5 导出工资条PDF
```
GET /api/payslips/:id/export-pdf
Response: PDF file
```

#### 3.1.6 修改二级密码
```
POST /api/payslips/change-password
Request: { oldPassword: string, newPassword: string }
Response: { success: boolean, message: string }
```

### 3.2 管理端 API

#### 3.2.1 工资条管理

```
GET /api/admin/payslips
Query: { page, limit, month, department, status, keyword }
Response: { success: boolean, data: Payslip[], total: number }

POST /api/admin/payslips
Request: { employee_id, salary_month, salary_data }
Response: { success: boolean, data: Payslip }

PUT /api/admin/payslips/:id
Request: { salary_data }
Response: { success: boolean, data: Payslip }

DELETE /api/admin/payslips/:id
Response: { success: boolean, message: string }
```

#### 3.2.2 批量导入
```
POST /api/admin/payslips/import
Request: FormData with Excel file
Response: { success: boolean, data: ImportResult }

GET /api/admin/payslips/import-template
Response: Excel template file

GET /api/admin/payslips/import-history
Response: { success: boolean, data: ImportHistory[] }
```

#### 3.2.3 批量发放
```
POST /api/admin/payslips/batch-send
Request: { payslip_ids: number[], notify_options: {} }
Response: { success: boolean, sent_count: number }
```

#### 3.2.4 模板管理
```
GET /api/admin/payslip-templates
Response: { success: boolean, data: Template[] }

POST /api/admin/payslip-templates
Request: { template_name, field_config }
Response: { success: boolean, data: Template }

PUT /api/admin/payslip-templates/:id
Request: { template_name, field_config }
Response: { success: boolean, data: Template }

DELETE /api/admin/payslip-templates/:id
Response: { success: boolean }
```

#### 3.2.5 发放配置
```
GET /api/admin/payslip-distribution-settings
Response: { success: boolean, data: Settings[] }

POST /api/admin/payslip-distribution-settings
Request: { setting configuration }
Response: { success: boolean, data: Setting }

PUT /api/admin/payslip-distribution-settings/:id
Request: { setting configuration }
Response: { success: boolean, data: Setting }
```

#### 3.2.6 二级密码管理
```
POST /api/admin/payslips/reset-password
Request: { user_ids: number[], reset_to_default: boolean }
Response: { success: boolean, reset_count: number }

POST /api/admin/payslips/batch-reset-password
Request: { department_id?: number, user_ids?: number[] }
Response: { success: boolean, reset_count: number, default_password: string }
```

#### 3.2.7 统计报表
```
GET /api/admin/payslips/statistics
Query: { year, month, department_id }
Response: { success: boolean, data: Statistics }

GET /api/admin/payslips/view-status
Query: { salary_month }
Response: { success: boolean, data: ViewStatusList }
```

## 4. 权限配置

### 4.1 权限定义

需要在 `database/migrations/018_seed_permissions.sql` 中添加以下权限：

```sql
-- ============================================================
-- 工资管理 (Payroll)
-- ============================================================
('查看工资条', 'payroll:payslip:view', 'payslip', 'view', 'payroll', '查看自己的工资条'),
('工资条管理', 'payroll:payslip:manage', 'payslip', 'manage', 'payroll', '管理所有工资条，包括新增、编辑、删除'),
('工资条发放', 'payroll:payslip:distribute', 'payslip', 'distribute', 'payroll', '发放工资条给员工'),
('二级密码管理', 'payroll:password:manage', 'password', 'manage', 'payroll', '管理员工工资条二级密码'),
```

### 4.2 角色权限分配

- **普通员工**: `payroll:payslip:view`
- **人事管理员**: `payroll:payslip:view`, `payroll:payslip:manage`, `payroll:payslip:distribute`, `payroll:password:manage`
- **超级管理员**: 全部权限

## 5. 前端实现

### 5.1 页面结构

#### 5.1.1 员工端页面

**文件路径**: `src/pages/Payroll/MyPayslips.jsx`

**主要功能**:
- 工资条列表（显示月份、发放日期、状态）
- 筛选：按年份、月份筛选
- 查看详情（需二级密码验证）
- PDF导出
- 确认工资条

**组件**:
- `PayslipList`: 工资条列表组件
- `PayslipDetailModal`: 工资条详情模态框
- `PasswordVerifyModal`: 二级密码验证模态框
- `ChangePasswordModal`: 修改二级密码模态框

#### 5.1.2 管理端页面

**文件路径**: `src/pages/Payroll/PayslipManagement.jsx`

**主要功能**:
- 工资条列表管理（CRUD）
- 批量导入
- 批量发放
- 查看状态追踪
- 筛选和搜索

**文件路径**: `src/pages/Payroll/PayslipTemplateSettings.jsx`

**主要功能**:
- 模板列表
- 模板编辑器（拖拽排序字段）
- 字段自定义配置

**文件路径**: `src/pages/Payroll/PayslipDistributionSettings.jsx`

**主要功能**:
- 发放时间配置
- 发放范围配置
- 通知设置

**文件路径**: `src/pages/Payroll/PayslipPasswordManagement.jsx`

**主要功能**:
- 批量重置密码
- 单个重置密码
- 密码策略设置

### 5.2 路由配置

在 `src/App.jsx` 中添加路由：

```jsx
// 员工端
{ name: 'my-payslips', component: MyPayslips, permission: 'payroll:payslip:view' }

// 管理端
{ name: 'payslip-management', component: PayslipManagement, permission: 'payroll:payslip:manage' }
{ name: 'payslip-templates', component: PayslipTemplateSettings, permission: 'payroll:payslip:manage' }
{ name: 'payslip-distribution', component: PayslipDistributionSettings, permission: 'payroll:payslip:distribute' }
{ name: 'payslip-passwords', component: PayslipPasswordManagement, permission: 'payroll:password:manage' }
```

### 5.3 组件样式

参考现有页面样式（如 AttendanceRecords.jsx, EmployeeManagement.jsx）：

- 使用 Ant Design 组件（Table, Modal, Form, Button, DatePicker 等）
- 使用 Tailwind CSS 进行布局和样式调整
- 使用 Heroicons 图标
- 保持统一的卡片布局和间距
- 响应式设计

## 6. 数据流与集成

### 6.1 与考勤系统集成

工资条需要从考勤系统获取以下数据：
- 出勤天数
- 迟到/早退次数
- 请假天数
- 加班时长
- 缺勤天数

**实现方式**:
在创建或导入工资条时，自动从 `attendance_records` 表中查询并计算对应月份的考勤数据。

```sql
-- 示例查询
SELECT 
  COUNT(DISTINCT DATE(record_date)) as attendance_days,
  SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
  SUM(CASE WHEN status = 'early_leave' THEN 1 ELSE 0 END) as early_leave_count,
  SUM(CASE WHEN status IN ('leave', 'sick_leave', 'annual_leave') THEN 1 ELSE 0 END) as leave_days,
  SUM(overtime_hours) as overtime_hours,
  SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days
FROM attendance_records
WHERE employee_id = ? 
  AND DATE_FORMAT(record_date, '%Y-%m') = ?
```

### 6.2 二级密码验证流程

1. 员工首次访问工资条页面，系统检查是否设置二级密码
2. 如未设置，提示设置二级密码（默认密码为身份证后6位或员工号）
3. 点击查看工资条详情时，弹出密码验证框
4. 验证通过后，生成临时token（有效期30分钟）
5. 在token有效期内可以查看工资条，无需再次验证
6. Token过期后需重新验证

### 6.3 Excel导入流程

1. 下载导入模板（包含所有字段说明）
2. 填写Excel数据
3. 上传文件
4. 后端解析并验证数据：
   - 检查员工是否存在
   - 验证数据格式
   - 检查是否已存在该月份工资条
5. 预览导入结果
6. 确认导入
7. 记录导入历史

### 6.4 PDF导出实现

使用 jsPDF + html2canvas 或服务器端生成：

**客户端生成** (推荐用于简单场景):
```javascript
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const exportPDF = async (payslipData) => {
  const element = document.getElementById('payslip-detail');
  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF();
  pdf.addImage(imgData, 'PNG', 0, 0);
  pdf.save(`payslip-${payslipData.salary_month}.pdf`);
};
```

**服务器端生成** (推荐用于正式环境):
使用 puppeteer 或 pdfkit 在服务器端生成PDF。

## 7. 安全考虑

### 7.1 数据隔离
- 员工只能查询自己的工资条（通过 `user_id` 过滤）
- 后端API严格验证用户身份和权限
- 使用prepared statements防止SQL注入

### 7.2 密码安全
- 二级密码使用bcrypt加密存储
- 密码长度至少6位
- 支持密码复杂度策略配置
- 记录密码修改历史

### 7.3 敏感数据保护
- 工资数据传输使用HTTPS
- 敏感字段在日志中脱敏
- PDF导出添加水印

### 7.4 操作审计
- 记录所有工资条的查看、确认操作
- 记录密码重置操作
- 记录导入、发放操作

## 8. 验证步骤

### 8.1 数据库验证
```bash
npm run db:migrate
# 检查所有表是否正确创建
# 检查权限是否正确插入
```

### 8.2 后端验证
- 使用Postman或类似工具测试所有API端点
- 验证权限控制是否生效
- 验证数据验证逻辑
- 测试错误处理

### 8.3 前端验证
- 测试所有页面的基本功能
- 测试响应式布局
- 测试表单验证
- 测试权限显示/隐藏

### 8.4 集成测试
- 测试完整的工资条创建、发放、查看流程
- 测试Excel导入功能
- 测试PDF导出功能
- 测试二级密码验证流程
- 测试与考勤系统的数据集成

### 8.5 性能测试
- 测试大量数据下的列表加载性能
- 测试批量导入性能（1000+条记录）
- 测试并发访问性能

## 9. 实施计划

### Phase 1: 数据库和权限（1-2天）
- [ ] 创建数据库迁移文件
- [ ] 添加权限到权限系统
- [ ] 测试数据库结构

### Phase 2: 后端API（3-4天）
- [ ] 实现员工端API
- [ ] 实现管理端API
- [ ] 实现二级密码功能
- [ ] 实现Excel导入导出
- [ ] API测试

### Phase 3: 前端实现（4-5天）
- [ ] 员工端页面开发
- [ ] 管理端页面开发
- [ ] 组件开发
- [ ] 样式调整
- [ ] 前端测试

### Phase 4: 集成测试与优化（2-3天）
- [ ] 功能集成测试
- [ ] 性能优化
- [ ] Bug修复
- [ ] 用户体验优化

### Phase 5: 文档与部署（1天）
- [ ] 编写用户文档
- [ ] 代码审查
- [ ] 部署验证

## 10. 潜在风险与挑战

### 10.1 技术风险
- **Excel导入性能**: 大量数据导入可能较慢，需要优化
  - 解决方案：分批处理，使用队列
  
- **PDF生成质量**: 客户端生成可能有兼容性问题
  - 解决方案：使用服务器端生成

### 10.2 业务风险
- **数据准确性**: 工资计算错误影响严重
  - 解决方案：多重验证，支持预览和审核

- **权限控制**: 工资数据泄露风险高
  - 解决方案：严格的权限验证和审计日志

### 10.3 用户体验
- **二级密码**: 可能增加使用复杂度
  - 解决方案：提供记住密码选项（session内有效）

## 11. 后续优化方向

1. **数据分析**: 工资趋势分析、部门薪资对比
2. **批量操作**: 支持批量修改、批量删除
3. **通知增强**: 支持微信、企业微信通知
4. **移动端适配**: 开发移动端H5页面
5. **数据备份**: 自动备份工资数据
6. **报表导出**: 支持多种格式的报表导出
