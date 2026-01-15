import React, { useState, useEffect } from 'react';
import { apiGet, apiPut, apiDelete } from '../../utils/apiClient';
import { toast } from 'sonner';
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function MyNotifications({ unreadCount: propUnreadCount, setUnreadCount: propSetUnreadCount }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // 使用传入的unreadCount或本地状态
  const unreadCount = propUnreadCount !== undefined ? propUnreadCount : localUnreadCount;
  const setUnreadCount = propSetUnreadCount || setLocalUnreadCount;


  // 筛选状态
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    isRead: '',
    startDate: '',
    endDate: ''
  });

  // 分页状态
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });

  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const userId = JSON.parse(localStorage.getItem('user') || '{}').id;

  // Tab配置
  const tabs = [
    { id: 'all', label: '全部通知', icon: BellIcon },
    { id: 'unread', label: '未读消息', icon: ExclamationCircleIcon, badge: unreadCount },
    { id: 'system', label: '系统通知', icon: BellIcon },
    { id: 'approval', label: '审批通知', icon: DocumentTextIcon },
    { id: 'attendance', label: '考勤通知', icon: ClockIcon },
    { id: 'exam', label: '考试通知', icon: CheckCircleIcon }
  ];

  // 根据Tab获取类型筛选
  const getTypeFilterByTab = (tab) => {
    switch (tab) {
      case 'unread':
        return { isRead: 'false' };
      case 'system':
        return { type: 'system' };
      case 'approval':
        return { type: 'leave_approval,overtime_approval,makeup_approval' };
      case 'attendance':
        return { type: 'clock_reminder,schedule_change,attendance_abnormal' };
      case 'exam':
        return { type: 'exam_notification,exam_result' };
      default:
        return {};
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const tabFilters = getTypeFilterByTab(activeTab);
      const params = {
        page: pagination.page,
        limit: pagination.pageSize,
        userId,
        search: filters.search || undefined,
        type: filters.type || tabFilters.type || undefined,
        isRead: filters.isRead || tabFilters.isRead || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      };

      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await apiGet('/api/notifications', { params });

      if (response.success) {
        const notificationData = (response.data || []).map(item => ({
          ...item,
          is_read: item.is_read === 1 || item.is_read === true
        }));

        setNotifications(notificationData);
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.totalPages || 0
        }));
      }
    } catch (error) {
      console.error('加载通知失败:', error);
      toast.error('加载通知失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadNotifications();
      loadUnreadCount();
      setLoading(false);
    }
  }, [userId, pagination.page, filters, activeTab]);

  const loadUnreadCount = async () => {
    try {
      const response = await apiGet(`/api/notifications/unread-count?userId=${userId}`);
      if (response.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('加载未读数量失败:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await apiPut(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ));
      loadUnreadCount();
      if (selectedNotification?.id === id) {
        setSelectedNotification(prev => ({ ...prev, is_read: true }));
      }
    } catch (error) {
      console.error('标记已读失败:', error);
      toast.error('操作失败');
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiPut('/api/notifications/read-all', { userId });
      loadNotifications();
      loadUnreadCount();
      toast.success('全部已读');
    } catch (error) {
      console.error('标记全部已读失败:', error);
      toast.error('操作失败');
    }
  };

  const markSelectedAsRead = async () => {
    if (selectedIds.length === 0) {
      toast.warning('请先选择通知');
      return;
    }
    try {
      await Promise.all(selectedIds.map(id =>
        apiPut(`/api/notifications/${id}/read`)
      ));
      loadNotifications();
      loadUnreadCount();
      setSelectedIds([]);
      toast.success(`已标记 ${selectedIds.length} 条通知为已读`);
    } catch (error) {
      console.error('批量标记已读失败:', error);
      toast.error('操作失败');
    }
  };

  const deleteNotification = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('确定要删除这条通知吗？')) return;

    try {
      await apiDelete(`/api/notifications/${id}`);
      loadNotifications();
      loadUnreadCount();
      toast.success('删除成功');
      if (selectedNotification?.id === id) {
        setShowModal(false);
      }
    } catch (error) {
      console.error('删除通知失败:', error);
      toast.error('删除失败');
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.warning('请先选择通知');
      return;
    }
    if (!window.confirm(`确定要删除选中的 ${selectedIds.length} 条通知吗？`)) return;

    try {
      await Promise.all(selectedIds.map(id =>
        apiDelete(`/api/notifications/${id}`)
      ));
      loadNotifications();
      loadUnreadCount();
      setSelectedIds([]);
      toast.success(`已删除 ${selectedIds.length} 条通知`);
    } catch (error) {
      console.error('批量删除失败:', error);
      toast.error('操作失败');
    }
  };

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    setShowModal(true);
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n.id));
    }
  };

  const handleSelectOne = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const setQuickDateFilter = (type) => {
    const today = new Date();
    const startDate = new Date();

    switch (type) {
      case 'today':
        setFilters(prev => ({
          ...prev,
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        }));
        break;
      case 'week':
        startDate.setDate(today.getDate() - 7);
        setFilters(prev => ({
          ...prev,
          startDate: startDate.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        }));
        break;
      case 'month':
        startDate.setMonth(today.getMonth() - 1);
        setFilters(prev => ({
          ...prev,
          startDate: startDate.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        }));
        break;
      default:
        break;
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'clock_reminder': return <ClockIcon className="w-5 h-5" />;
      case 'leave_approval': return <DocumentTextIcon className="w-5 h-5" />;
      case 'overtime_approval': return <ClockIcon className="w-5 h-5" />;
      case 'makeup_approval': return <ClockIcon className="w-5 h-5" />;
      case 'schedule_change': return <CalendarIcon className="w-5 h-5" />;
      case 'attendance_abnormal': return <ExclamationCircleIcon className="w-5 h-5" />;
      case 'exam_notification': return <DocumentTextIcon className="w-5 h-5" />;
      case 'exam_result': return <CheckCircleIcon className="w-5 h-5" />;
      case 'system': return <BellIcon className="w-5 h-5" />;
      default: return <BellIcon className="w-5 h-5" />;
    }
  };

  const getColorClass = (type) => {
    switch (type) {
      case 'clock_reminder': return 'bg-orange-100 text-orange-600';
      case 'leave_approval': return 'bg-green-100 text-green-600';
      case 'overtime_approval': return 'bg-purple-100 text-purple-600';
      case 'makeup_approval': return 'bg-cyan-100 text-cyan-600';
      case 'schedule_change': return 'bg-blue-100 text-blue-600';
      case 'attendance_abnormal': return 'bg-red-100 text-red-600';
      case 'exam_notification': return 'bg-indigo-100 text-indigo-600';
      case 'exam_result': return 'bg-teal-100 text-teal-600';
      case 'system': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeName = (type) => {
    const names = {
      'clock_reminder': '打卡提醒',
      'leave_approval': '请假审批',
      'overtime_approval': '加班审批',
      'makeup_approval': '补卡审批',
      'schedule_change': '排班变更',
      'attendance_abnormal': '考勤异常',
      'exam_notification': '考试通知',
      'exam_result': '考试成绩',
      'system': '系统通知'
    };
    return names[type] || '系统通知';
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      isRead: '',
      startDate: '',
      endDate: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      {/* 1. Header & Tabs (Sticky) */}
      <div className="bg-white border-b border-gray-100 shadow-sm z-20 sticky top-0 backdrop-blur-xl bg-white/90">
        <div className="max-w-6xl mx-auto w-full">
          {/* Header Top */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20 text-white">
                <BellIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">通知中心</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  您有 <span className="font-bold text-blue-600">{unreadCount}</span> 条未读消息
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {selectedIds.length > 0 && (
                <>
                  <button
                    onClick={markSelectedAsRead}
                    className="px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors text-sm font-semibold"
                  >
                    标记已读 ({selectedIds.length})
                  </button>
                  <button
                    onClick={deleteSelected}
                    className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm font-semibold"
                  >
                    删除 ({selectedIds.length})
                  </button>
                </>
              )}
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                全部已读
              </button>
              <button
                onClick={loadNotifications}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shadow-md shadow-gray-900/10"
              >
                刷新
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 pb-0 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setPagination(prev => ({ ...prev, page: 1 }));
                      setSelectedIds([]);
                    }}
                    className={`
                      relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap border-b-2
                      ${isActive
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'stroke-2' : ''}`} />
                    {tab.label}
                    {tab.badge > 0 && (
                      <span className={`
                        ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[18px] text-center leading-tight
                        ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-red-500 text-white'}
                      `}>
                        {tab.badge > 99 ? '99+' : tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50">
        <div className="max-w-6xl mx-auto w-full px-6 py-6 pb-24">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="搜索通知..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent focus:bg-white border focus:border-blue-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-sm"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>

               {/* 快速日期筛选 */}
              <div className="flex gap-2">
                <button onClick={() => setQuickDateFilter('today')} className="px-3 py-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium">今天</button>
                <button onClick={() => setQuickDateFilter('week')} className="px-3 py-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium">本周</button>
                <button onClick={() => setShowFilters(!showFilters)} className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${showFilters ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                   <FunnelIcon className="w-4 h-4" /> 筛选 {showFilters ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200">
                <select className="px-3 py-2.5 bg-gray-50 border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm outline-none transition-all" value={filters.type} onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}>
                   <option value="">全部类型</option>
                   <option value="leave_approval">请假审批</option>
                   <option value="overtime_approval">加班审批</option>
                   <option value="makeup_approval">补卡审批</option>
                   <option value="schedule_change">排班变更</option>
                   <option value="attendance_abnormal">考勤异常</option>
                   <option value="clock_reminder">打卡提醒</option>
                   <option value="exam_notification">考试通知</option>
                   <option value="exam_result">考试成绩</option>
                   <option value="system">系统通知</option>
                </select>
                <select className="px-3 py-2.5 bg-gray-50 border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm outline-none transition-all" value={filters.isRead} onChange={(e) => setFilters(prev => ({ ...prev, isRead: e.target.value }))}>
                   <option value="">全部状态</option>
                   <option value="false">未读</option>
                   <option value="true">已读</option>
                </select>
                <input type="date" className="px-3 py-2.5 bg-gray-50 border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm outline-none transition-all" value={filters.startDate} onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))} />
                <input type="date" className="px-3 py-2.5 bg-gray-50 border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm outline-none transition-all" value={filters.endDate} onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))} />
              </div>
            )}
             {(filters.search || filters.type || filters.isRead || filters.startDate || filters.endDate) && (
               <div className="mt-4 flex items-center justify-between pt-2 border-t border-gray-50">
                   <div className="text-xs text-gray-500">找到 <span className="font-bold text-gray-900">{pagination.total}</span> 条结果</div>
                   <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><XMarkIcon className="w-3 h-3"/> 清除条件</button>
               </div>
             )}
          </div>

          {/* Batch Actions (Check All) */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between mb-3 px-2">
               <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={selectedIds.length === notifications.length && notifications.length > 0} onChange={handleSelectAll} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all cursor-pointer" />
                  <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">全选本页</span>
               </label>
               {selectedIds.length > 0 && (
                 <span className="text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full animate-in fade-in">已选择 {selectedIds.length} 项</span>
               )}
            </div>
          )}

          {/* List */}
          <div className="space-y-3 min-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4 text-sm font-medium">正在加载通知...</p>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="text-center">
                  <div className="bg-gray-50 rounded-full p-6 inline-block mb-4">
                     <BellIcon className="w-12 h-12 text-gray-300" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">暂无通知</h3>
                  <p className="text-gray-500 text-sm">当前列表没有新的消息通知</p>
                </div>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    group relative bg-white rounded-xl p-5 border transition-all duration-200 cursor-pointer
                    ${notification.is_read
                      ? 'border-gray-100 hover:shadow-md hover:border-gray-200'
                      : 'border-blue-100 shadow-sm shadow-blue-500/5 hover:shadow-md hover:border-blue-200 bg-blue-50/10'
                    }
                  `}
                >
                  <div className="flex items-start gap-5">
                    {/* Checkbox */}
                    <div className={`pt-1 ${selectedIds.length > 0 || selectedIds.includes(notification.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`} onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.includes(notification.id)} onChange={(e) => handleSelectOne(notification.id, e)} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" />
                    </div>

                    {/* Icon */}
                    <div className={`p-3 rounded-2xl shrink-0 ${getColorClass(notification.type)} bg-opacity-80 shadow-sm`}>
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                         <div className="flex items-center gap-3 flex-wrap min-w-0">
                           {!notification.is_read && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse"></span>}
                           <h3 className={`font-semibold text-base truncate ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                             {notification.title}
                           </h3>
                           <span className={`px-2.5 py-0.5 text-[10px] rounded-md font-semibold tracking-wide uppercase border ${notification.is_read ? 'bg-gray-50 text-gray-500 border-gray-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                             {getTypeName(notification.type)}
                           </span>
                         </div>
                         <div className="flex items-center gap-3 shrink-0">
                           <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded">
                             {new Date(notification.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                           </span>
                           <button onClick={(e) => deleteNotification(notification.id, e)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="删除">
                             <TrashIcon className="w-4 h-4" />
                           </button>
                         </div>
                      </div>
                      <p className={`text-sm leading-relaxed line-clamp-2 ${notification.is_read ? 'text-gray-500' : 'text-gray-700'}`}>{notification.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
             <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                   {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let p = i + 1;
                      if (pagination.totalPages > 5 && pagination.page > 3) {
                         p = pagination.page - 2 + i;
                         if (p > pagination.totalPages) p = pagination.totalPages - (4 - i);
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                          className={`w-10 h-10 rounded-xl font-medium text-sm transition-all shadow-sm
                             ${pagination.page === p
                               ? 'bg-blue-600 text-white shadow-blue-500/30'
                               : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                             }
                          `}
                        >
                          {p}
                        </button>
                      );
                   })}
                </div>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
             </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && selectedNotification && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all scale-100">
            {/* Modal Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${getColorClass(selectedNotification.type)}`}>
                  {getIcon(selectedNotification.type)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{getTypeName(selectedNotification.type)}</h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{new Date(selectedNotification.created_at).toLocaleString('zh-CN')}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"><XMarkIcon className="w-6 h-6" /></button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 leading-tight max-w-md">{selectedNotification.title}</h2>
              <div className="bg-gray-50 p-6 rounded-2xl text-gray-700 leading-relaxed text-sm border border-gray-100 font-medium">
                {selectedNotification.content}
              </div>
              {selectedNotification.related_id && (
                <div className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-50 inline-flex px-3 py-1.5 rounded-lg border border-gray-100">
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>ID: {selectedNotification.related_id}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => deleteNotification(selectedNotification.id)} className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2 text-sm font-semibold">
                <TrashIcon className="w-4 h-4" /> 删除
              </button>
              <button onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 text-sm font-semibold">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
