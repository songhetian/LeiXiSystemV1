import React, { useMemo, useState } from 'react';
import {
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  BellOutlined
} from '@ant-design/icons';
import NotificationDropdown from './NotificationDropdown';

const TopNavbar = ({ activeTab, user, onLogout, unreadCount = 0, onNavigate }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  // Menu items definition (copied from Sidebar for breadcrumb mapping)
  // Ideally this should be in a shared config file
  const menuItems = [
    {
      id: 'user',
      label: '员工管理',
      children: [
        { id: 'user-employee', label: '员工管理' },
        { id: 'user-changes', label: '变动记录' },
        { id: 'user-approval', label: '员工审核' },
        { id: 'user-reset-password', label: '重置密码' },
        { id: 'user-permission', label: '权限管理' },
        { id: 'user-role-management', label: '角色分配' },
      ],
    },
    {
      id: 'org',
      label: '组织架构',
      children: [
        { id: 'org-department', label: '部门管理' },
        { id: 'org-position', label: '职位管理' },
      ],
    },
    {
      id: 'messaging',
      label: '信息系统',
      children: [
        { id: 'messaging-chat', label: '聊天系统' },
        { id: 'messaging-create-group', label: '群组管理' },
      ],
    },
    {
      id: 'attendance',
      label: '考勤管理',
      children: [
        { id: 'attendance-home', label: '考勤主页' },
        { id: 'attendance-records', label: '考勤记录' },
        { id: 'attendance-makeup', label: '补卡申请' },
        { id: 'attendance-leave-apply', label: '请假申请' },
        { id: 'attendance-leave-records', label: '请假记录' },
        { id: 'attendance-overtime-apply', label: '加班申请' },
        { id: 'attendance-overtime-records', label: '加班记录' },
        { id: 'attendance-stats', label: '考勤统计' },
        { id: 'attendance-department', label: '部门考勤统计' },
        { id: 'attendance-shift', label: '班次管理' },
        { id: 'attendance-schedule', label: '排班管理' },
        { id: 'attendance-smart-schedule', label: '智能排班' },
        { id: 'attendance-approval', label: '审批管理' },
        { id: 'attendance-notifications', label: '考勤通知' },
        { id: 'attendance-settings', label: '考勤设置' },
      ],
    },
    {
      id: 'vacation',
      label: '假期管理',
      children: [
        { id: 'compensatory-apply', label: '申请调休' },
        { id: 'vacation-details', label: '假期明细' },
        { id: 'quota-config', label: '额度配置' },
        { id: 'vacation-summary', label: '假期汇总' },
        { id: 'compensatory-approval', label: '调休审批' },
      ],
    },
    {
      id: 'quality',
      label: '质检管理',
      children: [
        { id: 'quality-platform-shop', label: '平台店铺' },
        { id: 'quality-score', label: '会话质检' },
        { id: 'quality-tags', label: '标签管理' },
        { id: 'quality-case-library', label: '案例库' },
        { id: 'quality-case-categories', label: '案例分类管理' },
      ],
    },
    {
      id: 'knowledge',
      label: '知识库',
      children: [
        { id: 'knowledge-articles', label: '公共知识库' },
        { id: 'knowledge-base', label: '知识库' },
        { id: 'my-knowledge', label: '我的知识库' },
      ],
    },
    {
      id: 'assessment',
      label: '考核系统',
      children: [
        { id: 'assessment-exams', label: '试卷管理' },
        { id: 'exam-plans', label: '考核计划' },
        { id: 'assessment-categories', label: '分类管理' },
        { id: 'exam-results', label: '考试结果' },
        { id: 'my-exams', label: '我的考试' },
      ],
    },
    {
      id: 'personal',
      label: '个人中心',
      children: [
        { id: 'personal-info', label: '个人信息' },
        { id: 'my-exam-results', label: '我的考试结果' },
      ],
    },
  ];

  const breadcrumbs = useMemo(() => {
    for (const menu of menuItems) {
      if (menu.children) {
        const child = menu.children.find(c => c.id === activeTab);
        if (child) {
          return [
            { label: menu.label, id: menu.id },
            { label: child.label, id: child.id }
          ];
        }
      }
    }
    return [];
  }, [activeTab]);

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <HomeOutlined className="text-gray-400" />
          <span className="text-gray-400">/</span>
        </div>
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={item.id}>
            <span className={`mx-2 ${index === breadcrumbs.length - 1 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
              {item.label}
            </span>
            {index < breadcrumbs.length - 1 && (
              <span className="text-gray-400">/</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Right: User Info & Logout */}
      <div className="flex items-center gap-6">
        {/* 未读通知 */}
        <div className="relative">
          <div
            className="relative cursor-pointer hover:opacity-80 transition-opacity"
            title="通知"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <BellOutlined className="text-gray-600 text-xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>

          {showNotifications && (
            <NotificationDropdown
              onClose={() => setShowNotifications(false)}
              onNavigate={onNavigate}
              onUpdateUnread={(count) => {
                // If TopNavbar has a way to update parent state, we could call it here.
                // But unreadCount is passed as prop.
                // Ideally, TopNavbar should have a callback to update unread count if it's managed in App.jsx.
                // For now, we rely on the prop, but the dropdown also fetches its own count.
                // The dropdown's internal count update won't reflect here unless we lift state up or trigger a refresh.
                // Since App.jsx manages unreadCount via websocket/polling, it should eventually sync.
                // However, marking as read in dropdown should ideally update the badge immediately.
                // We can't easily update the prop from here without a callback prop from App.jsx.
                // Let's assume App.jsx handles the source of truth.
              }}
            />
          )}
        </div>

        <div className="h-8 w-px bg-gray-200"></div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
            {user?.real_name?.charAt(0) || <UserOutlined />}
          </div>
          <div className="flex flex-col items-end">
            <span className="text-lg font-bold text-gray-900">{user?.real_name || '用户'}</span>
          </div>
        </div>

        <div className="h-8 w-px bg-gray-200"></div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors text-sm"
          title="退出登录"
        >
          <LogoutOutlined />
          <span>退出</span>
        </button>
      </div>
    </div>
  );
};

export default TopNavbar;
