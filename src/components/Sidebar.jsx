import React, { useState, useMemo } from 'react';
import { usePermission } from '../contexts/PermissionContext';

import {
  Search,
  XCircle,
  Users,
  User,
  Building,
  MessageSquare,
  Clock,
  Home,
  FileText,
  FileSearch,
  FileEdit,
  Key,
  Shield,
  BarChart3,
  RefreshCcw,
  Calendar,
  Bell,
  FolderOpen,
  Database,
  Star,
  IdCard,
  Book,
  Eye,
  Zap,
  Send,
  CheckCircle,
  Settings,
  ChevronRight,
  Store,
  Tags,
  Megaphone,
  Monitor,
} from 'lucide-react';

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
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
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
          <XCircle className="text-sm" />
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

  // Styling based on level
  const getLevelStyles = () => {
    switch (level) {
      case 1:
        return {
          container: '',
          button: 'px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 font-bold rounded-xl transition-all duration-200 shadow-sm',
          icon: 'text-lg',
          text: 'text-sm font-bold',
        };
      case 2:
        return {
          container: 'ml-4 pl-4 border-l-2 border-blue-200',
          button: `px-4 py-2.5 rounded-lg transition-all duration-200 ${isActive
              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-200 font-semibold'
              : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600 font-medium'
            }`,
          icon: 'text-base',
          text: 'text-sm font-semibold',
        };
      case 3:
        return {
          container: 'ml-6 pl-4 border-l-2 border-green-200',
          button: `px-4 py-2 rounded-md transition-all duration-200 ${isActive
              ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg shadow-green-200 font-medium'
              : 'text-gray-500 hover:bg-green-50 hover:text-green-600'
            }`,
          icon: 'text-sm',
          text: 'text-xs font-medium',
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
        <span className="bg-yellow-200 text-gray-900">{text.substring(index, index + searchQuery.length)}</span>
        {text.substring(index + searchQuery.length)}
      </>
    );
  };

  return (
    <div>
      {/* Menu Item Button */}
      <button
        onClick={() => (hasChildren ? toggleMenu(item.id) : setActiveTab(item.id))}
        className={`w-full flex items-center justify-between rounded-lg transition-all ${styles.button}`}
      >
        <div className="flex items-center gap-3">
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.text}>{highlightText(item.label)}</span>
        </div>
        {hasChildren && (
          <ChevronRight
            className={`text-xs transition-transform duration-200 text-gray-400 ${isExpanded ? 'rotate-90' : ''
              }`}
          />
        )}
      </button>

      {/* Children Menu Items */}
      {hasChildren && isExpanded && (
        <div className={`mt-1 space-y-1 ${styles.container}`}>
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
    icon: <Users />,
    children: [
      {
        id: 'hr-employee',
        label: '员工管理',
        icon: <User />,
        permission: 'user:employee:view',
        children: [
          { id: 'user-employee', label: '员工管理', icon: <User />, permission: 'user:employee:view' },
          { id: 'user-changes', label: '变动记录', icon: <FileText />, permission: 'user:employee:view' },
          { id: 'user-approval', label: '员工审核', icon: <CheckCircle />, permission: 'user:audit:manage' },
        ]
      },
      {
        id: 'hr-org',
        label: '组织架构',
    icon: <Building />,
        permission: 'org:department:view',
        children: [
          { id: 'org-department', label: '部门管理', icon: <Building />, permission: 'org:department:view' },
          { id: 'org-position', label: '职位管理', icon: <IdCard />, permission: 'org:position:view' },
        ]
      }
    ]
  },
  {
    id: 'permission',
    label: '权限管理',
    icon: <Shield />,
    children: [
      { id: 'user-permission', label: '权限管理', icon: <Shield />, permission: 'system:role:view' },
      { id: 'user-role-management', label: '角色分配', icon: <Users />, permission: 'system:role:manage' },
      { id: 'user-reset-password', label: '重置密码', icon: <Key />, permission: 'user:security:reset_password' },
    ]
  },
  {
    id: 'collaboration',
    label: '办公协作',
    icon: <MessageSquare />,
    children: [
      {
        id: 'information',
        label: '信息发布',
        icon: <Megaphone />,
        children: [
          { id: 'messaging-broadcast', label: '系统广播', icon: <Megaphone />, permission: 'messaging:broadcast:view' },
          { id: 'broadcast-management', label: '发布广播', icon: <Send />, permission: 'messaging:broadcast:manage' },
          { id: 'notification-settings', label: '通知设置', icon: <Bell />, permission: 'messaging:config:manage' },
        ]
      },
      { id: 'employee-memos', label: '部门备忘录', icon: <Bell />, permission: 'user:memo:manage' },
    ]
  },
  {
    id: 'attendance',
    label: '考勤管理',
    icon: <Clock />,
    permission: 'attendance:record:view',
    children: [
      {
        id: 'attendance-records-section',
        label: '考勤记录',
        icon: <FileText />,
        children: [
          { id: 'attendance-home', label: '考勤主页', icon: <Home />, permission: 'attendance:record:view' },
          { id: 'attendance-records', label: '考勤记录', icon: <FileText />, permission: 'attendance:record:view' },
        ]
      },
      {
        id: 'leave-section',
        label: '请假管理',
        icon: <FileEdit />,
        children: [
          { id: 'attendance-leave-apply', label: '请假申请', icon: <FileEdit />, permission: 'attendance:record:view' },
          { id: 'attendance-leave-records', label: '请假记录', icon: <FileText />, permission: 'attendance:record:view' },
        ]
      },
      {
        id: 'overtime-section',
        label: '加班管理',
        icon: <Clock />,
        children: [
          { id: 'attendance-overtime-apply', label: '加班申请', icon: <FileEdit />, permission: 'attendance:record:view' },
          { id: 'attendance-overtime-records', label: '加班记录', icon: <FileText />, permission: 'attendance:record:view' },
        ]
      },
      {
        id: 'makeup-section',
        label: '补卡管理',
        icon: <FileEdit />,
        children: [
          { id: 'attendance-makeup', label: '补卡申请', icon: <FileEdit />, permission: 'attendance:record:view' },
        ]
      },
      {
        id: 'reports-section',
        label: '统计报表',
        icon: <BarChart3 />,
        children: [
          { id: 'attendance-stats', label: '考勤统计', icon: <BarChart3 />, permission: 'attendance:report:view' },
          { id: 'attendance-department', label: '部门考勤统计', icon: <Building />, permission: 'attendance:report:view' },
        ]
      },
      {
        id: 'schedule-section',
        label: '排班管理',
        icon: <Calendar />,
        children: [
          { id: 'attendance-shift', label: '班次管理', icon: <RefreshCcw />, permission: 'attendance:config:manage' },
          { id: 'attendance-schedule', label: '排班管理', icon: <Calendar />, permission: 'attendance:schedule:manage' },
          { id: 'attendance-smart-schedule', label: '智能排班', icon: <Zap />, permission: 'attendance:schedule:manage' },
        ]
      },
      {
        id: 'approval-section',
        label: '审批管理',
        icon: <CheckCircle />,
        children: [
          { id: 'attendance-approval', label: '审批管理', icon: <CheckCircle />, permission: 'attendance:approval:manage' },
        ]
      },
      {
        id: 'attendance-settings-section',
        label: '系统设置',
        icon: <Settings />,
        children: [
          { id: 'attendance-settings', label: '考勤设置', icon: <Settings />, permission: 'attendance:config:manage' },
        ]
      },
    ],
  },
  {
    id: 'vacation',
    label: '假期管理',
    icon: <Calendar />,
    permission: 'vacation:record:view',
    children: [
      {
        id: 'vacation-application',
        label: '假期申请',
        icon: <FileEdit />,
        children: [
          { id: 'compensatory-apply', label: '申请调休', icon: <FileEdit />, permission: 'vacation:record:view' },
        ]
      },
      {
        id: 'vacation-records',
        label: '假期记录',
        icon: <FileText />,
        children: [
          { id: 'vacation-details', label: '假期明细', icon: <FileText />, permission: 'vacation:record:view' },
          { id: 'vacation-summary', label: '假期汇总', icon: <BarChart3 />, permission: 'vacation:record:view' },
        ]
      },
      {
        id: 'vacation-approval',
        label: '审批管理',
        icon: <CheckCircle />,
        children: [
          { id: 'compensatory-approval', label: '调休审批', icon: <CheckCircle />, permission: 'vacation:approval:manage' },
        ]
      },
      {
        id: 'vacation-settings',
        label: '系统设置',
        icon: <Settings />,
        children: [
          { id: 'quota-config', label: '额度配置', icon: <Settings />, permission: 'vacation:config:manage' },
        ]
      },
    ],
  },
  {
    id: 'quality',
    label: '质检管理',
    icon: <Search />,
    permission: 'quality:session:view',
    children: [
      {
        id: 'quality-config',
        label: '质检配置',
        icon: <Settings />,
        children: [
          { id: 'quality-platform-shop', label: '平台店铺', icon: <Store />, permission: 'quality:config:manage' },
          { id: 'quality-tags', label: '标签管理', icon: <Tags />, permission: 'quality:config:manage' },
        ]
      },
      { id: 'quality-score', label: '会话质检', icon: <Star />, permission: 'quality:session:view' },
      {
        id: 'quality-cases',
        label: '案例管理',
        icon: <FolderOpen />,
        children: [
          { id: 'quality-case-library', label: '案例库', icon: <FolderOpen />, permission: 'quality:case:manage' },
          { id: 'quality-case-categories', label: '案例分类管理', icon: <FolderOpen />, permission: 'quality:case:manage' },
        ]
      },
    ],
  },
  {
    id: 'knowledge',
    label: '知识管理',
    icon: <Book />,
    permission: 'knowledge:article:view',
    children: [
      { id: 'knowledge-articles', label: '公共知识库', icon: <FileText />, permission: 'knowledge:article:view' },
      { id: 'knowledge-base', label: '知识库', icon: <Database />, permission: 'knowledge:article:manage' },
      { id: 'my-knowledge', label: '我的知识库', icon: <Star />, permission: 'knowledge:article:view' },
    ],
  },
  {
    id: 'assessment',
    label: '考核系统',
    icon: <FileEdit />,
    permission: 'assessment:plan:view',
    children: [
      {
        id: 'assessment-questions',
        label: '试题管理',
        icon: <FileText />,
        children: [
          { id: 'assessment-exams', label: '试卷管理', icon: <FileText />, permission: 'assessment:plan:manage' },
          { id: 'assessment-categories', label: '分类管理', icon: <FolderOpen />, permission: 'assessment:plan:manage' },
        ]
      },
      {
        id: 'assessment-management',
        label: '考核管理',
        icon: <Calendar />,
        children: [
          { id: 'exam-plans', label: '考核计划', icon: <Calendar />, permission: 'assessment:plan:manage' },
        ]
      },
      {
        id: 'assessment-results',
        label: '成绩管理',
    icon: <Eye />,
        children: [
          { id: 'exam-results', label: '考试结果', icon: <Eye />, permission: 'assessment:result:view' },
          { id: 'my-exams', label: '我的考试', icon: <IdCard /> },
          { id: 'my-exam-results', label: '我的考试结果', icon: <FileText /> },
        ]
      },
    ],
  },
  {
    id: 'personal',
    label: '个人中心',
    icon: <User />,
    children: [
      {
        id: 'personal-info-section',
        label: '个人信息',
        icon: <IdCard />,
        children: [
          { id: 'personal-info', label: '个人信息', icon: <IdCard /> },
        ]
      },
      {
        id: 'personal-office',
        label: '个人办公',
    icon: <Monitor />,
        children: [
          { id: 'my-schedule', label: '我的排班', icon: <Calendar /> },
          { id: 'my-notifications', label: '我的通知', icon: <Bell /> },
          { id: 'my-memos', label: '我的备忘录', icon: <FileText /> },
        ]
      },
    ],
  },
];

export default Sidebar;
