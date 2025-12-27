# 雷犀客服管理系统 (LeiXi System)

## 项目概述

雷犀客服管理系统是一套专为客服团队设计的综合性管理平台，采用现代化的前后端分离架构，结合 Electron 桌面应用的便捷性，提供完整的员工管理、考勤管理、排班调度、请假审批、加班申请、质检管理、知识库、考核系统等功能。

### 技术栈

**前端技术:**
- React 18 - JavaScript UI 库
- Vite - 构建工具
- Tailwind CSS - 样式框架
- Ant Design - UI 组件库
- Zustand - 状态管理
- Socket.IO Client - 实时通信
- React Router DOM - 路由管理

**后端技术:**
- Fastify - Node.js Web 框架
- MySQL 8.0 - 关系型数据库
- Socket.IO - 实时通信
- JSON Web Token (JWT) - 身份认证
- bcrypt - 密码加密

**桌面应用:**
- Electron - 跨平台桌面应用框架

### 架构特点

- **前后端分离**: React 前端 + Fastify 后端
- **实时通信**: 基于 WebSocket 的通知和消息推送
- **权限控制**: 基于角色的访问控制 (RBAC) 系统
- **单设备登录**: 通过 session_token 实现单设备登录限制
- **跨平台**: 支持 Windows、macOS、Linux

## 构建和运行

### 环境要求

- Node.js >= 16.0.0
- MySQL >= 8.0
- npm >= 8.0.0

### 开发环境

```bash
# 安装依赖
npm install

# 配置数据库
cp .envexample .env
# 编辑 .env 文件，配置数据库连接信息

# 初始化数据库
npm run db:migrate
npm run db:seed

# 启动开发环境（同时启动前端和后端）
npm start

# 分别启动
npm run dev:server  # 启动后端服务（使用 nodemon 热重载）
npm run dev:react   # 启动前端开发服务器
npm run dev:electron  # 启动 Electron 应用
```

### 生产构建

```bash
# 构建前端资源
npm run build

# 启动生产服务器
npm run prod:server

# 打包桌面应用
npm run package:win    # Windows
npm run package:mac    # macOS
npm run package:linux  # Linux
```

### 数据库管理

```bash
# 重置数据库
npm run db:reset

# 运行迁移
npm run db:migrate

# 运行种子数据
npm run db:seed

# 重置管理员密码
npm run db:reset-admin

# 初始化权限
npm run db:init-permissions

# 清除迁移历史
npm run db:clear-history
```

### 开发工具

- **nodemon**: 自动重启后端服务（监控 `server/**/*` 和 `.env` 文件）
- **Vite**: 前端开发服务器（端口 5173）
- **Electron**: 桌面应用开发

## 项目结构

```
LeiXiSystem/
├── src/                          # 前端源码
│   ├── components/               # 公共组件
│   ├── pages/                    # 页面组件
│   ├── contexts/                 # React Context（权限、主题等）
│   ├── hooks/                    # 自定义 Hooks
│   ├── services/                 # API 服务（WebSocket、API 客户端）
│   ├── utils/                    # 工具函数
│   ├── styles/                   # 全局样式
│   ├── App.jsx                   # 主应用组件
│   └── main.jsx                  # React 入口文件
├── server/                       # 后端服务
│   ├── routes/                   # API 路由（按功能模块划分）
│   ├── middleware/               # 中间件（认证、权限、用户状态）
│   ├── utils/                    # 后端工具函数
│   ├── scheduled-tasks/          # 定时任务
│   ├── scripts/                  # 后端脚本
│   ├── migrations/               # 数据库迁移脚本
│   ├── index.js                  # 后端入口文件
│   └── websocket.js              # WebSocket 服务
├── database/                     # 数据库脚本
│   ├── migrations/               # 数据库迁移文件
│   ├── test-data/                # 测试数据
│   └── scripts/                  # 数据库管理脚本
├── db/                           # 数据库初始化脚本
├── electron/                     # Electron 主进程
├── config/                       # 配置文件
│   ├── db-config.json            # 数据库配置（加密）
│   └── db-config.example.json    # 数据库配置模板
├── scripts/                      # 项目脚本
├── public/                       # 静态资源
├── tests/                        # 测试文件
├── package.json                  # 项目配置
├── vite.config.js                # Vite 配置
├── tailwind.config.js            # Tailwind CSS 配置
├── nodemon.json                  # Nodemon 配置
└── .envexample                   # 环境变量模板
```

## 核心功能模块

### 1. 员工管理
- 员工信息维护
- 部门组织架构管理
- 角色权限分配
- 员工备忘录管理
- 批量导入员工

### 2. 考勤管理
- 打卡记录管理
- 考勤异常处理
- 考勤统计报表
- 部门考勤分析
- 排班管理（班次、排班、智能排班）

### 3. 请假管理
- 多种请假类型申请
- 在线审批流程
- 请假记录查询
- 请假统计分析
- 调休管理

### 4. 加班管理
- 加班申请审批
- 加班时长统计
- 加班费结算

### 5. 质检管理
- 质检会话管理
- 质检评分系统
- 质检标签管理
- 案例库管理
- 质检统计报表

### 6. 知识库
- 知识文章管理
- 文件夹分类
- 知识阅读统计
- 知识推荐

### 7. 考核系统
- 考试管理
- 考核计划
- 考试结果分析
- 在线考试

### 8. 权限管理
- 基于角色的访问控制 (RBAC)
- 细粒度权限配置
- 部门数据权限
- 用户角色分配

### 9. 通知系统
- 实时通知推送
- 系统广播
- 备忘录管理
- 通知设置

## 开发规范

### 代码风格

- **JavaScript/JSX**: 使用 ES6+ 语法，遵循 Airbnb 风格指南
- **CSS**: 优先使用 Tailwind CSS 工具类，复杂样式使用 CSS Modules
- **命名规范**:
  - 组件: PascalCase (如 `UserManagement`)
  - 函数/变量: camelCase (如 `getUserInfo`)
  - 常量: UPPER_SNAKE_CASE (如 `API_BASE_URL`)
  - 文件名: kebab-case (如 `user-management.jsx`)

### API 设计

- **RESTful 风格**: 使用标准的 HTTP 方法和状态码
- **路由前缀**: 所有 API 路由以 `/api` 开头
- **认证**: 使用 JWT Bearer Token
- **响应格式**:
  ```json
  {
    "success": true/false,
    "data": {},
    "message": "操作结果描述"
  }
  ```

### 数据库规范

- **表名**: 使用小写加下划线 (如 `user_roles`)
- **字段名**: 使用小写加下划线 (如 `created_at`)
- **主键**: 统一使用 `id` (自增)
- **时间戳**: 使用 `created_at` 和 `updated_at`
- **外键**: 使用 `关联表_id` 格式 (如 `user_id`)

### 测试账号

| 用户名 | 密码 | 角色 | 部门 |
|--------|------|------|------|
| admin | 123456 | 超级管理员 | 管理部 |
| manager1 | 123456 | 部门经理 | 客服部 |
| service1 | 123456 | 客服专员 | 客服部 |
| qa1 | 123456 | 质检员 | 质检部 |
| tech1 | 123456 | 技术人员 | 技术部 |

### 权限系统

- **角色**: 超级管理员、部门经理、客服专员、质检员、技术人员
- **权限**: 基于资源-操作模型 (如 `employees.view`, `employees.edit`)
- **数据权限**: 支持部门级数据隔离

### 安全措施

- **密码加密**: 使用 bcrypt 加密（salt rounds: 10）
- **JWT 认证**: Access Token (1h) + Refresh Token (7d)
- **单设备登录**: 通过 session_token 实现
- **配置加密**: 数据库配置文件支持加密存储
- **CORS**: 开发环境允许所有来源，生产环境需配置

## 常见问题

### Q: 数据库连接失败？
A: 检查 `config/db-config.json` 配置是否正确，确保 MySQL 服务已启动。

### Q: 文件上传失败？
A: 检查 `sharedDirectory` 配置是否有写入权限，确保目录存在。

### Q: WebSocket 连接失败？
A: 检查后端服务是否正常运行，确保防火墙允许 WebSocket 端口。

### Q: 权限不生效？
A: 运行 `npm run db:init-permissions` 初始化权限数据。

### Q: 如何重置管理员密码？
A: 运行 `npm run db:reset-admin`。

## 部署说明

### 数据库配置

1. 创建数据库用户（参考 `database/create_leixi_mysql_user.sql`）
2. 运行迁移脚本初始化表结构
3. 导入测试数据（可选）

### 打包部署

1. 构建前端资源: `npm run build`
2. 打包应用: `npm run package:win`
3. 修改 `resources/config/db-config.json` 配置数据库连接
4. 运行打包后的应用

### 环境变量

- `JWT_SECRET`: JWT 密钥
- `JWT_REFRESH_SECRET`: Refresh Token 密钥
- `DB_HOST`: 数据库主机
- `DB_USER`: 数据库用户
- `DB_PASSWORD`: 数据库密码
- `DB_NAME`: 数据库名称
- `DB_PORT`: 数据库端口

## 相关文档

- [操作手册](./操作手册.md) - 详细的系统操作指南
- [部署文档](./部署.md) - 系统部署和配置说明
- [数据库文档](./database/README.md) - 数据库结构和测试数据说明
- [配置文档](./config/README.md) - 配置文件说明

## 技术支持

如有问题，请联系项目维护团队。