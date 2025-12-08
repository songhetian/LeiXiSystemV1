import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getApiUrl } from '../../utils/apiConfig';
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
  ChevronUpIcon
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

      const response = await axios.get(getApiUrl('/api/notifications'), { params });

      if (response.data && response.data.success) {
        const notificationData = (response.data.data || []).map(item => ({
          ...item,
          is_read: item.is_read === 1 || item.is_read === true
        }));

        setNotifications(notificationData);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.totalPages || 0
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
      const response = await axios.get(getApiUrl(`/api/notifications/unread-count?userId=${userId}`));
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('加载未读数量失败:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(getApiUrl(`/api/notifications/${id}/read`));
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
      await axios.put(getApiUrl('/api/notifications/read-all'), { userId });
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
        axios.put(getApiUrl(`/api/notifications/${id}/read`))
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
      await axios.delete(getApiUrl(`/api/notifications/${id}`));
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
        axios.delete(getApiUrl(`/api/notifications/${id}`))
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
    <div className="h-full flex flex-col bg-gray-50">
      {/* 头部区域 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <BellIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">通知中心</h1>
              <p className="text-sm text-gray-600 mt-0.5">
                共 <span className="font-semibold text-blue-600">{unreadCount}</span> 条未读消息
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {selectedIds.length > 0 && (
              <>
                <button
                  onClick={markSelectedAsRead}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  标记已读 ({selectedIds.length})
                </button>
                <button
                  onClick={deleteSelected}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  删除 ({selectedIds.length})
                </button>
              </>
            )}
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              全部已读
            </button>
            <button
              onClick={loadNotifications}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              刷新
            </button>
          </div>
        </div>

        {/* Tab导航 */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPagination(prev => ({ ...prev, page: 1 }));
                  setSelectedIds([]);
                }}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.badge > 0 && (
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-bold
                    ${activeTab === tab.id ? 'bg-white text-blue-600' : 'bg-red-500 text-white'}
                  `}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 搜索和筛选区域 */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-3">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索通知标题或内容..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          {/* 快速日期筛选 */}
          <div className="flex gap-2">
            <button
              onClick={() => setQuickDateFilter('today')}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              今天
            </button>
            <button
              onClick={() => setQuickDateFilter('week')}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              本周
            </button>
            <button
              onClick={() => setQuickDateFilter('month')}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              本月
            </button>
          </div>

          {/* 高级筛选按钮 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <FunnelIcon className="w-4 h-4" />
            筛选
            {showFilters ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </button>
        </div>

        {/* 高级筛选面板 */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-4 gap-3">
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              >
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

              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                value={filters.isRead}
                onChange={(e) => setFilters(prev => ({ ...prev, isRead: e.target.value }))}
              >
                <option value="">全部状态</option>
                <option value="false">未读</option>
                <option value="true">已读</option>
              </select>

              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />

              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            {(filters.search || filters.type || filters.isRead || filters.startDate || filters.endDate) && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  找到 <span className="font-semibold text-blue-600">{pagination.total}</span> 条结果
                </span>
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                >
                  <XMarkIcon className="w-4 h-4" />
                  清除筛选
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 批量操作栏 */}
      {notifications.length > 0 && (
        <div className="bg-white border-b border-gray-200 px-6 py-2">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.length === notifications.length && notifications.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">全选</span>
            </label>
            {selectedIds.length > 0 && (
              <span className="text-sm text-gray-600">
                已选择 <span className="font-semibold text-blue-600">{selectedIds.length}</span> 条
              </span>
            )}
          </div>
        </div>
      )}

      {/* 通知列表 */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4 text-sm">加载中...</p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center py-12">
              <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无通知</h3>
              <p className="text-gray-500">没有找到符合条件的通知消息</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`
                  group relative bg-white rounded-lg p-4 border transition-all cursor-pointer hover:shadow-md
                  ${notification.is_read
                    ? 'border-gray-200 hover:border-gray-300'
                    : 'border-l-4 border-l-blue-500 border-t border-r border-b border-gray-200 bg-blue-50/30'
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  {/* 复选框 */}
                  <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(notification.id)}
                      onChange={(e) => handleSelectOne(notification.id, e)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>

                  {/* 图标 */}
                  <div className={`p-3 rounded-lg shrink-0 ${getColorClass(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-semibold ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                            NEW
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                          {getTypeName(notification.type)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(notification.created_at).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <button
                          onClick={(e) => deleteNotification(notification.id, e)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="删除"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-2">
                      {notification.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 分页控件 */}
      {pagination.totalPages > 1 && (
        <div className="bg-white border-t border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              显示第 <span className="font-semibold">{(pagination.page - 1) * pagination.pageSize + 1}</span> 到 <span className="font-semibold">{Math.min(pagination.page * pagination.pageSize, pagination.total)}</span> 条，
              共 <span className="font-semibold text-blue-600">{pagination.total}</span> 条
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
              >
                首页
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
              >
                上一页
              </button>
              <div className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold text-sm">
                {pagination.page} / {pagination.totalPages}
              </div>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
              >
                下一页
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.totalPages }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
              >
                末页
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 详情模态框 */}
      {showModal && selectedNotification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
            {/* 模态框头部 */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getColorClass(selectedNotification.type)}`}>
                  {getIcon(selectedNotification.type)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{getTypeName(selectedNotification.type)}</h3>
                  <p className="text-sm text-gray-500">{new Date(selectedNotification.created_at).toLocaleString('zh-CN')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 模态框内容 */}
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedNotification.title}</h2>
              <div className="bg-gray-50 p-4 rounded-lg text-gray-700 leading-relaxed">
                {selectedNotification.content}
              </div>

              {selectedNotification.related_id && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>关联ID: {selectedNotification.related_id}</span>
                </div>
              )}
            </div>

            {/* 模态框底部 */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => deleteNotification(selectedNotification.id)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <TrashIcon className="w-4 h-4" />
                删除
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
