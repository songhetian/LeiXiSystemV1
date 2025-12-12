import React, { useState, useMemo } from 'react';
import { usePermission } from '../contexts/PermissionContext';

import {
  UserOutlined,
  TeamOutlined,
  ApartmentOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  FileTextOutlined,
  FormOutlined,
  KeyOutlined,
  SafetyOutlined,
  BarChartOutlined,
  LineChartOutlined,
  SyncOutlined,
  CalendarOutlined,
  BellOutlined,
  SearchOutlined,
  FolderOpenOutlined,
  DatabaseOutlined,
  StarOutlined,
  IdcardOutlined,
  BookOutlined,
  EyeOutlined,
  FileSearchOutlined,
  ThunderboltOutlined,
  SendOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  RightOutlined,
  ShopOutlined,
  CloseCircleOutlined,
  TagsOutlined,
  SoundOutlined,
  DesktopOutlined,
} from '@ant-design/icons';

// --- Component Definition ---

const Sidebar = ({ activeTab, setActiveTab, user, onLogout }) => {
  // State to manage which menus are expanded
  const [expandedMenus, setExpandedMenus] = useState(['hr', 'hr-employee', 'collaboration', 'information']);
  const [searchQuery, setSearchQuery] = useState('');

  const { hasPermission } = usePermission();

  // Recursive function to filter children based on permissions
  const filterChildren = (children) => {
    return children
      .filter(child => {
        // If permission is defined, check it
        if (child.permission) {
          return hasPermission(child.permission);
        }
        // If no permission but has admin flag, hide it (legacy support, or force permission)
        // For now, if no permission is set, we assume it's visible (like 'personal' items)
        // UNLESS it has admin: true, then we hide it if we want to be strict.
        // But since I added permissions to all admin items, this should be fine.
        if (child.admin) {
           return false;
        }
        return true;
      })
      .map(child => {
        if (!child.children) {
          return child;
        }
        const filteredGrandChildren = filterChildren(child.children);
        // If parent has permission but all children are filtered out, should we show parent?
        // If parent is just a container, maybe not.
        if (filteredGrandChildren.length === 0 && child.children.length > 0) {
          return null;
        }
        return { ...child, children: filteredGrandChildren };
      })
      .filter(Boolean);
  };

  // Memoized and filtered menu items based on user role and permissions
  const menuItems = useMemo(() => {
    return filterChildren(allMenuItems);
  }, [user, hasPermission]);

  // Search filter logic
  const filteredMenuItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems;

    const query = searchQuery.toLowerCase();

    const filterRecursive = (items) => {
      return items.map(item => {
        const labelMatch = item.label.toLowerCase().includes(query);

        if (!item.children) {
          return labelMatch ? item : null;
        }

        // If parent label matches, include all children
        if (labelMatch) {
          return item;
        }

        // Otherwise, only include children that match
        const filteredChildren = filterRecursive(item.children).filter(Boolean);

        if (filteredChildren.length > 0) {
          return { ...item, children: filteredChildren };
        }

        return null;
      }).filter(Boolean);
    };

    const filtered = filterRecursive(menuItems);

    // Auto-expand all menus when searching
    if (searchQuery.trim()) {
      const allIds = [];
      const collectIds = (items) => {
        items.forEach(item => {
          if (item.children && item.children.length > 0) {
            allIds.push(item.id);
            collectIds(item.children);
          }
        });
      };
      collectIds(filtered);
      setExpandedMenus(allIds);
    }

    return filtered;
  }, [searchQuery, menuItems]);

  // Handler to toggle the expanded/collapsed state of a menu
  const toggleMenu = (menuId) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setExpandedMenus(['hr', 'hr-employee', 'collaboration', 'information']);
  };

  return (
    <aside className="w-80 bg-white border-r border-gray-200 shadow-sm flex flex-col">
      {/* Scrollable Main Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <SidebarHeader />
        <SearchBox
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          clearSearch={clearSearch}
        />

        <MainMenu
          menuItems={filteredMenuItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          expandedMenus={expandedMenus}
          toggleMenu={toggleMenu}
          searchQuery={searchQuery}
        />
      </div>

      {/* Fixed Footer */}
      <SidebarFooter onLogout={onLogout} />
    </aside>
  );
};

// --- Sub-components for Clarity ---

const SidebarHeader = () => (
  <div className="mb-4 pb-4 border-b border-gray-200">
    <h1 className="text-xl font-bold text-gray-800">雷犀客服系统</h1>
    <p className="text-gray-500 text-xs mt-1">桌面版</p>
  </div>
);

const SearchBox = ({ searchQuery, setSearchQuery, clearSearch }) => (
  <div className="mb-4">
    <div className="relative">
      <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
      <input
        type="text"
        placeholder="搜索功能..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
      />
      {searchQuery && (
        <button
          onClick={clearSearch}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <CloseCircleOutlined className="text-sm" />
        </button>
      )}
    </div>
  </div>
);

const UserInfo = ({ user, onNavigate }) => (
  <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-lg text-white font-semibold">
          {user?.real_name?.charAt(0) || '用户'}
        </div>

      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-gray-800">{user?.real_name || '用户'}</p>
        <p className="text-xs text-gray-500 truncate">{user?.username}</p>
      </div>
    </div>
  </div>
);

const MainMenu = ({ menuItems, activeTab, setActiveTab, expandedMenus, toggleMenu, searchQuery }) => (
  <nav className="space-y-1">
    {menuItems.map(item => (
      <MenuItem
        key={item.id}
        item={item}
        level={1}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        expandedMenus={expandedMenus}
        toggleMenu={toggleMenu}
        searchQuery={searchQuery}
      />
    ))}
  </nav>
);

// Recursive MenuItem component
const MenuItem = ({ item, level, activeTab, setActiveTab, expandedMenus, toggleMenu, searchQuery }) => {
  const isExpanded = expandedMenus.includes(item.id);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = activeTab === item.id;

  // Styling based on level - simplified and clearer
  const getLevelStyles = () => {
    switch (level) {
      case 1:
        return {
          container: 'mb-1',
          button: `px-4 py-2.5 text-gray-800 hover:bg-gray-100 font-semibold rounded-lg transition-colors ${
            isActive ? 'bg-blue-50 text-blue-600' : ''
          }`,
          icon: 'text-base',
          text: 'text-sm',
        };
      case 2:
        return {
          container: 'ml-4 border-l-2 border-gray-200',
          button: `pl-4 pr-4 py-2 rounded-lg transition-colors ${
            isActive
              ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-500 font-medium'
              : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
          }`,
          icon: 'text-sm',
          text: 'text-sm',
        };
      case 3:
        return {
          container: 'ml-8 border-l-2 border-gray-200',
          button: `pl-4 pr-4 py-1.5 rounded-md transition-colors ${
            isActive
              ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-400 font-medium'
              : 'text-gray-600 hover:bg-gray-50 hover:text-blue-500'
          }`,
          icon: 'text-xs',
          text: 'text-xs',
        };
      default:
        return {
          container: '',
          button: 'px-3 py-2',
          icon: 'text-base',
          text: 'text-sm',
        };
    }
  };

  const styles = getLevelStyles();

  // Highlight search matches
  const highlightText = (text) => {
    if (!searchQuery.trim()) return text;

    const query = searchQuery.toLowerCase();
    const index = text.toLowerCase().indexOf(query);

    if (index === -1) return text;

    return (
      <>
        {text.substring(0, index)}
        <span className="bg-yellow-200 text-gray-900 font-medium">{text.substring(index, index + searchQuery.length)}</span>
        {text.substring(index + searchQuery.length)}
      </>
    );
  };

  return (
    <div className={styles.container}>
      {/* Menu Item Button */}
      <button
        onClick={() => (hasChildren ? toggleMenu(item.id) : setActiveTab(item.id))}
        className={`w-full flex items-center justify-between ${styles.button}`}
      >
        <div className="flex items-center gap-2.5">
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.text}>{highlightText(item.label)}</span>
        </div>
        {hasChildren && (
          <RightOutlined
            className={`text-xs transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            } ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
          />
        )}
      </button>

      {/* Children Menu Items */}
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-0.5">
          {item.children.map(child => (
            <MenuItem
              key={child.id}
              item={child}
              level={level + 1}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              expandedMenus={expandedMenus}
              toggleMenu={toggleMenu}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SidebarFooter = ({ onLogout }) => (
  <div className="p-4 border-t border-gray-200 space-y-2">
    <button
      onClick={onLogout}
      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
    >
      退出登录
    </button>
    <div className="text-xs text-gray-400 text-center">
      © 2024 雷犀客服系统
    </div>
  </div>
);

// --- Menu Item Definitions with Three-Level Structure ---

const allMenuItems = [
  {
    id: 'hr',
    label: '人事管理',
    icon: <TeamOutlined />,
    children: [
      {
        id: 'hr-employee',
        label: '员工管理',
        icon: <UserOutlined />,
        permission: 'user:employee:view',
        children: [
          { id: 'user-employee', label: '员工管理', icon: <UserOutlined />, permission: 'user:employee:view' },
          { id: 'user-changes', label: '变动记录', icon: <FileTextOutlined />, permission: 'user:employee:view' },
          { id: 'user-approval', label: '员工审核', icon: <CheckCircleOutlined />, permission: 'user:audit:manage' },
        ]
      },
      {
        id: 'hr-org',
        label: '组织架构',
        icon: <ApartmentOutlined />,
        permission: 'org:department:view',
        children: [
          { id: 'org-department', label: '部门管理', icon: <ApartmentOutlined />, permission: 'org:department:view' },
          { id: 'org-position', label: '职位管理', icon: <IdcardOutlined />, permission: 'org:position:view' },
        ]
      }
    ]
  },
  {
    id: 'permission',
    label: '权限管理',
    icon: <SafetyOutlined />,
    children: [
      { id: 'user-permission', label: '权限管理', icon: <SafetyOutlined />, permission: 'system:role:view' },
      { id: 'user-role-management', label: '角色分配', icon: <TeamOutlined />, permission: 'system:role:manage' },
      { id: 'user-reset-password', label: '重置密码', icon: <KeyOutlined />, permission: 'user:security:reset_password' },
    ]
  },
  {
    id: 'collaboration',
    label: '办公协作',
    icon: <MessageOutlined />,
    children: [
      {
        id: 'information',
        label: '信息发布',
        icon: <SoundOutlined />,
        children: [
          { id: 'messaging-broadcast', label: '系统广播', icon: <SoundOutlined />, permission: 'messaging:broadcast:view' },
          { id: 'broadcast-management', label: '发布广播', icon: <SendOutlined />, permission: 'messaging:broadcast:manage' },
          { id: 'notification-settings', label: '通知设置', icon: <BellOutlined />, permission: 'messaging:config:manage' },
        ]
      },
      { id: 'employee-memos', label: '部门备忘录', icon: <BellOutlined />, permission: 'user:memo:manage' },
    ]
  },
  {
    id: 'attendance',
    label: '考勤管理',
    icon: <ClockCircleOutlined />,
    permission: 'attendance:record:view',
    children: [
      {
        id: 'attendance-records-section',
        label: '考勤记录',
        icon: <FileTextOutlined />,
        children: [
          { id: 'attendance-home', label: '考勤主页', icon: <HomeOutlined />, permission: 'attendance:record:view' },
          { id: 'attendance-records', label: '考勤记录', icon: <FileTextOutlined />, permission: 'attendance:record:view' },
        ]
      },
      {
        id: 'leave-section',
        label: '请假管理',
        icon: <FormOutlined />,
        children: [
          { id: 'attendance-leave-apply', label: '请假申请', icon: <FormOutlined />, permission: 'attendance:record:view' },
          { id: 'attendance-leave-records', label: '请假记录', icon: <FileTextOutlined />, permission: 'attendance:record:view' },
        ]
      },
      {
        id: 'overtime-section',
        label: '加班管理',
        icon: <ClockCircleOutlined />,
        children: [
          { id: 'attendance-overtime-apply', label: '加班申请', icon: <FormOutlined />, permission: 'attendance:record:view' },
          { id: 'attendance-overtime-records', label: '加班记录', icon: <FileTextOutlined />, permission: 'attendance:record:view' },
        ]
      },
      {
        id: 'makeup-section',
        label: '补卡管理',
        icon: <FormOutlined />,
        children: [
          { id: 'attendance-makeup', label: '补卡申请', icon: <FormOutlined />, permission: 'attendance:record:view' },
        ]
      },
      {
        id: 'reports-section',
        label: '统计报表',
        icon: <BarChartOutlined />,
        children: [
          { id: 'attendance-stats', label: '考勤统计', icon: <BarChartOutlined />, permission: 'attendance:report:view' },
          { id: 'attendance-department', label: '部门考勤统计', icon: <ApartmentOutlined />, permission: 'attendance:report:view' },
        ]
      },
      {
        id: 'schedule-section',
        label: '排班管理',
        icon: <CalendarOutlined />,
        children: [
          { id: 'attendance-shift', label: '班次管理', icon: <SyncOutlined />, permission: 'attendance:config:manage' },
          { id: 'attendance-schedule', label: '排班管理', icon: <CalendarOutlined />, permission: 'attendance:schedule:manage' },
          { id: 'attendance-smart-schedule', label: '智能排班', icon: <ThunderboltOutlined />, permission: 'attendance:schedule:manage' },
        ]
      },
      {
        id: 'approval-section',
        label: '审批管理',
        icon: <CheckCircleOutlined />,
        children: [
          { id: 'attendance-approval', label: '审批管理', icon: <CheckCircleOutlined />, permission: 'attendance:approval:manage' },
        ]
      },
      {
        id: 'attendance-settings-section',
        label: '系统设置',
        icon: <SettingOutlined />,
        children: [
          { id: 'attendance-settings', label: '考勤设置', icon: <SettingOutlined />, permission: 'attendance:config:manage' },
        ]
      },
    ],
  },
  {
    id: 'vacation',
    label: '假期管理',
    icon: <CalendarOutlined />,
    permission: 'vacation:record:view',
    children: [
      {
        id: 'vacation-application',
        label: '假期申请',
        icon: <FormOutlined />,
        children: [
          { id: 'compensatory-apply', label: '申请调休', icon: <FormOutlined />, permission: 'vacation:record:view' },
        ]
      },
      {
        id: 'vacation-records',
        label: '假期记录',
        icon: <FileTextOutlined />,
        children: [
          { id: 'vacation-details', label: '假期明细', icon: <FileTextOutlined />, permission: 'vacation:record:view' },
          { id: 'vacation-summary', label: '假期汇总', icon: <BarChartOutlined />, permission: 'vacation:record:view' },
        ]
      },
      {
        id: 'vacation-approval',
        label: '审批管理',
        icon: <CheckCircleOutlined />,
        children: [
          { id: 'compensatory-approval', label: '调休审批', icon: <CheckCircleOutlined />, permission: 'vacation:approval:manage' },
        ]
      },
      {
        id: 'vacation-settings',
        label: '系统设置',
        icon: <SettingOutlined />,
        children: [
          { id: 'quota-config', label: '额度配置', icon: <SettingOutlined />, permission: 'vacation:config:manage' },
        ]
      },
    ],
  },
  {
    id: 'quality',
    label: '质检管理',
    icon: <SearchOutlined />,
    permission: 'quality:session:view',
    children: [
      {
        id: 'quality-config',
        label: '质检配置',
        icon: <SettingOutlined />,
        children: [
          { id: 'quality-platform-shop', label: '平台店铺', icon: <ShopOutlined />, permission: 'quality:config:manage' },
          { id: 'quality-tags', label: '标签管理', icon: <TagsOutlined />, permission: 'quality:config:manage' },
        ]
      },
      { id: 'quality-score', label: '会话质检', icon: <StarOutlined />, permission: 'quality:session:view' },
      {
        id: 'quality-cases',
        label: '案例管理',
        icon: <FolderOpenOutlined />,
        children: [
          { id: 'quality-case-library', label: '案例库', icon: <FolderOpenOutlined />, permission: 'quality:case:manage' },
          { id: 'quality-case-categories', label: '案例分类管理', icon: <FolderOpenOutlined />, permission: 'quality:case:manage' },
        ]
      },
    ],
  },
  {
    id: 'knowledge',
    label: '知识管理',
    icon: <BookOutlined />,
    permission: 'knowledge:article:view',
    children: [
      { id: 'knowledge-articles', label: '公共知识库', icon: <FileTextOutlined />, permission: 'knowledge:article:view' },
      { id: 'knowledge-base', label: '知识库', icon: <DatabaseOutlined />, permission: 'knowledge:article:manage' },
      { id: 'my-knowledge', label: '我的知识库', icon: <StarOutlined />, permission: 'knowledge:article:view' },
    ],
  },
  {
    id: 'assessment',
    label: '考核系统',
    icon: <FormOutlined />,
    permission: 'assessment:plan:view',
    children: [
      {
        id: 'assessment-questions',
        label: '试题管理',
        icon: <FileTextOutlined />,
        children: [
          { id: 'assessment-exams', label: '试卷管理', icon: <FileTextOutlined />, permission: 'assessment:plan:manage' },
          { id: 'assessment-categories', label: '分类管理', icon: <FolderOpenOutlined />, permission: 'assessment:plan:manage' },
        ]
      },
      {
        id: 'assessment-management',
        label: '考核管理',
        icon: <CalendarOutlined />,
        children: [
          { id: 'exam-plans', label: '考核计划', icon: <CalendarOutlined />, permission: 'assessment:plan:manage' },
        ]
      },
      {
        id: 'assessment-results',
        label: '成绩管理',
        icon: <EyeOutlined />,
        children: [
          { id: 'exam-results', label: '考试结果', icon: <EyeOutlined />, permission: 'assessment:result:view' },
          { id: 'my-exams', label: '我的考试', icon: <IdcardOutlined /> }, // 基础功能
          { id: 'my-exam-results', label: '我的考试结果', icon: <FileTextOutlined /> },
        ]
      },
    ],
  },
  {
    id: 'personal',
    label: '个人中心',
    icon: <UserOutlined />,
    children: [
      {
        id: 'personal-info-section',
        label: '个人信息',
        icon: <IdcardOutlined />,
        children: [
          { id: 'personal-info', label: '个人信息', icon: <IdcardOutlined /> },
        ]
      },
      {
        id: 'personal-office',
        label: '个人办公',
        icon: <DesktopOutlined />,
        children: [
          { id: 'my-schedule', label: '我的排班', icon: <CalendarOutlined /> },
          { id: 'my-notifications', label: '我的通知', icon: <BellOutlined /> },
          { id: 'my-memos', label: '我的备忘录', icon: <FileTextOutlined /> },
        ]
      },
    ],
  },
];

export default Sidebar;
