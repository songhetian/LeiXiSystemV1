import { lazy } from 'react';

// 定义所有页面组件的延时加载
export const routes = [
  { id: 'dashboard', component: lazy(() => import('../pages/Dashboard/Dashboard')) },
  { id: 'admin-dashboard', component: lazy(() => import('../pages/Dashboard/AdminDashboard')) },
  
  // 员工管理
  { id: 'user-employee', component: lazy(() => import('../components/EmployeeManagement')) },
  { id: 'user-changes', component: lazy(() => import('../components/EmployeeChanges')) },
  { id: 'user-approval', component: lazy(() => import('../components/EmployeeApproval')) },
  { id: 'user-reset-password', component: lazy(() => import('../components/ResetPassword')) },
  { id: 'user-permission', component: lazy(() => import('../pages/System/RoleManagement')) },
  { id: 'user-role-management', component: lazy(() => import('../pages/System/UserRoleManagement')) },
  { id: 'system-logs', component: lazy(() => import('../pages/System/OperationLogs')) },
  
  // 组织架构
  { id: 'org-department', component: lazy(() => import('../components/DepartmentManagement')) },
  { id: 'org-position', component: lazy(() => import('../components/PositionManagement')) },

  // 信息系统
  { id: 'messaging-broadcast', component: lazy(() => import('../pages/Messaging').then(m => ({ default: m.BroadcastList }))) },
  { id: 'broadcast-management', component: lazy(() => import('../pages/Admin/BroadcastManagement')) },
  { id: 'notification-settings', component: lazy(() => import('../components/NotificationSettings')) },
  { id: 'messaging-chat', component: lazy(() => import('../pages/Messaging/WeChatPage')) },
  { id: 'messaging-group-management', component: lazy(() => import('../pages/Messaging/GroupManagement')) },
  { id: 'employee-memos', component: lazy(() => import('../pages/Employee/EmployeeMemos')) },

  // 考勤管理
  { id: 'attendance-home', component: lazy(() => import('../pages/Attendance').then(m => ({ default: m.AttendanceHome }))) },
  { id: 'attendance-records', component: lazy(() => import('../pages/Attendance').then(m => ({ default: m.AttendanceRecords }))) },
  { id: 'attendance-makeup', component: lazy(() => import('../pages/Attendance').then(m => ({ default: m.MakeupApply }))) },
  { id: 'attendance-leave-apply', component: lazy(() => import('../pages/Attendance').then(m => ({ default: m.LeaveApply }))) },
  { id: 'attendance-leave-records', component: lazy(() => import('../pages/Attendance').then(m => ({ default: m.LeaveRecords }))) },
  { id: 'attendance-overtime-apply', component: lazy(() => import('../pages/Attendance').then(m => ({ default: m.OvertimeApply }))) },
  { id: 'attendance-overtime-records', component: lazy(() => import('../pages/Attendance').then(m => ({ default: m.OvertimeRecords }))) },
  { id: 'attendance-stats', component: lazy(() => import('../pages/Attendance').then(m => ({ default: m.AttendanceStats }))) },
  { id: 'attendance-department', component: lazy(() => import('../pages/Attendance').then(m => ({ default: m.DepartmentStats }))) },
  { id: 'attendance-shift', component: lazy(() => import('../pages/Attendance').then(m => ({ default: m.ShiftManagement }))) },
  { id: 'attendance-schedule', component: lazy(() => import('../pages/Attendance').then(m => ({ default: m.ScheduleManagement }))) },
  { id: 'attendance-smart-schedule', component: lazy(() => import('../pages/Attendance').then(m => ({ default: m.SmartSchedule }))) },
  { id: 'attendance-approval', component: lazy(() => import('../pages/Attendance').then(m => ({ default: m.ApprovalManagement }))) },
  { id: 'attendance-settings', component: lazy(() => import('../pages/Attendance').then(m => ({ default: m.AttendanceSettings }))) },

  // 假期管理
  { id: 'compensatory-apply', component: lazy(() => import('../components/CompensatoryApply')) },
  { id: 'vacation-details', component: lazy(() => import('../components/VacationDetailsNew')) },
  { id: 'quota-config', component: lazy(() => import('../components/QuotaConfigLayout')) },
  { id: 'vacation-summary', component: lazy(() => import('../components/VacationSummary')) },
  { id: 'compensatory-approval', component: lazy(() => import('../components/CompensatoryApproval')) },
  { id: 'vacation-permissions', component: lazy(() => import('../components/VacationPermissions')) },

  // 工资管理
  { id: 'my-payslips', component: lazy(() => import('../pages/Payroll/MyPayslips')) },
  { id: 'payslip-management', component: lazy(() => import('../pages/Payroll/PayslipManagement')) },

  // 报销管理
  { id: 'reimbursement-apply', component: lazy(() => import('../components/ReimbursementApply')) },
  { id: 'reimbursement-list', component: lazy(() => import('../components/ReimbursementList')) },
  { id: 'reimbursement-approval', component: lazy(() => import('../components/ReimbursementApproval')) },
  { id: 'reimbursement-detail', component: lazy(() => import('../components/ReimbursementDetail')) },
  { id: 'approval-workflow-config', component: lazy(() => import('../components/ApprovalWorkflowConfig')) },
  { id: 'approver-management', component: lazy(() => import('../components/ApproverManagement')) },
  { id: 'reimbursement-settings', component: lazy(() => import('../components/ReimbursementSettings')) },
  { id: 'role-workflow-config', component: lazy(() => import('../components/RoleWorkflowConfig')) },

  // 后勤与库存
  { id: 'logistics-device-mgmt', component: lazy(() => import('../pages/Finance/Assets/AssetManagement')) },
  { id: 'logistics-device-list', component: lazy(() => import('../pages/Logistics/DeviceList')) },
  { id: 'asset-request-audit', component: lazy(() => import('../pages/Finance/Assets/AssetRequestAudit')) },
  { id: 'inventory-management', component: lazy(() => import('../pages/Finance/Inventory/InventoryManagement')) },
  { id: 'inventory-receive', component: lazy(() => import('../pages/Finance/Inventory/InventoryReceive')) },

  // 质检管理
  { id: 'quality-score', component: lazy(() => import('../components/QualityInspection')) },
  { id: 'quality-tags', component: lazy(() => import('../components/QualityTagManagement')) },
  { id: 'quality-platform-shop', component: lazy(() => import('../components/PlatformShopManagement')) },
  { id: 'quality-case-library', component: lazy(() => import('../pages/CaseLibraryPage')) },
  { id: 'quality-case-categories', component: lazy(() => import('../pages/CaseCategoryManagementPage')) },
  { id: 'quality-recommendation', component: lazy(() => import('../pages/CaseRecommendationPage')) },

  // 知识库
  { id: 'knowledge-articles', component: lazy(() => import('../components/Win11KnowledgeBase')) },
  { id: 'knowledge-base', component: lazy(() => import('../components/Win11KnowledgeFolderView')) },
  { id: 'my-knowledge', component: lazy(() => import('../components/Win11MyKnowledgeBase')) },

  // 考核系统
  { id: 'assessment-exams', component: lazy(() => import('../components/ExamManagement')) },
  { id: 'assessment-plans', component: lazy(() => import('../components/AssessmentPlanManagement')) },
  { id: 'assessment-categories', component: lazy(() => import('../components/CategoryManagement')) },
  { id: 'my-exams', component: lazy(() => import('../components/MyExams')) },
  { id: 'my-exam-results', component: lazy(() => import('../components/MyExamResults')) },
  { id: 'exam-results', component: lazy(() => import('../components/ExamResultsManagement')) },
  { id: 'exam-taking', component: lazy(() => import('../components/ExamTaking')) },
  { id: 'exam-result', component: lazy(() => import('../components/ExamResult')) },
  { id: 'assessment-management', component: lazy(() => import('../components/AssessmentManagement')) },

  // 个人中心
  { id: 'personal-info', component: lazy(() => import('../components/PersonalInfo')) },
  { id: 'my-todo', component: lazy(() => import('../pages/Personal/TodoCenter')) },
  { id: 'my-schedule', component: lazy(() => import('../pages/Personal/MySchedule')) },
  { id: 'my-notifications', component: lazy(() => import('../pages/Personal/MyNotifications')) },
  { id: 'my-assets', component: lazy(() => import('../pages/Personal/MyAssets')) },
  { id: 'my-memos', component: lazy(() => import('../pages/Personal/MyMemos')) },

  // 系统管理
  { id: 'system-workflow', component: lazy(() => import('../pages/System/WorkflowSettings')) },
];
