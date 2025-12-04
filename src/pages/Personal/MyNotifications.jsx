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
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function MyNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

  useEffect(() => {
    if (userId) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [userId, pagination.page, filters]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const params = {
        userId,
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: filters.search || undefined,
        type: filters.type || undefined,
        isRead: filters.isRead || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      };

      // 移除 undefined 参数
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await axios.get(getApiUrl('/api/notifications'), { params });

      if (response.data && response.data.success) {
        setNotifications(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          totalPages: Math.ceil((response.data.pagination?.total || 0) / prev.pageSize)
        }));
      }
    } catch (error) {
      console.error('加载通知失败:', error);
      toast.error('加载通知失败');
    } finally {
      setLoading(false);
    }
  };

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

      // 更新本地状态
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

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    setShowModal(true);
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'clock_reminder': return <ClockIcon className="w-6 h-6" />;
      case 'leave_approval': return <DocumentTextIcon className="w-6 h-6" />;
      case 'overtime_approval': return <ClockIcon className="w-6 h-6" />;
      case 'makeup_approval': return <ClockIcon className="w-6 h-6" />;
      case 'schedule_change': return <CalendarIcon className="w-6 h-6" />;
      case 'attendance_abnormal': return <ExclamationCircleIcon className="w-6 h-6" />;
      case 'exam_notification': return <DocumentTextIcon className="w-6 h-6" />;
      case 'exam_result': return <CheckCircleIcon className="w-6 h-6" />;
      case 'system': return <BellIcon className="w-6 h-6" />;
      default: return <BellIcon className="w-6 h-6" />;
    }
  };

  const getColorClass = (type) => {
    switch (type) {
      case 'clock_reminder': return 'bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600';
      case 'leave_approval': return 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-600';
      case 'overtime_approval': return 'bg-gradient-to-br from-purple-100 to-violet-100 text-purple-600';
      case 'makeup_approval': return 'bg-gradient-to-br from-cyan-100 to-sky-100 text-cyan-600';
      case 'schedule_change': return 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600';
      case 'attendance_abnormal': return 'bg-gradient-to-br from-red-100 to-rose-100 text-red-600';
      case 'exam_notification': return 'bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600';
      case 'exam_result': return 'bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-600';
      case 'system': return 'bg-gradient-to-br from-gray-100 to-slate-100 text-gray-600';
      default: return 'bg-gradient-to-br from-gray-100 to-slate-100 text-gray-600';
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
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* 头部区域 */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <BellIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">我的通知</h1>
              <p className="text-gray-600 mt-1 text-lg">
                您有 <span className="text-blue-600 font-bold text-xl">{unreadCount}</span> 条未读消息
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <CheckCircleIcon className="w-5 h-5" />
              全部已读
            </button>
            <button
              onClick={loadNotifications}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2 font-medium shadow-lg shadow-blue-200"
            >
              <ClockIcon className="w-5 h-5" />
              刷新
            </button>
          </div>
        </div>
      </div>

      {/* 筛选区域 */}
      <div className="px-8 py-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-700">
              <FunnelIcon className="w-5 h-5" />
              <span className="font-semibold text-lg">筛选条件</span>
            </div>
            {(filters.search || filters.type || filters.isRead || filters.startDate || filters.endDate) && (
              <button
                onClick={clearFilters}
                className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <XMarkIcon className="w-4 h-4" />
                清除筛选
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* 搜索框 */}
            <div className="lg:col-span-2 relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索通知标题或内容..."
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            {/* 类型筛选 */}
            <select
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all text-base font-medium"
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="">📋 全部类型</option>
              <option value="leave_approval">📝 请假审批</option>
              <option value="schedule_change">📅 排班变更</option>
              <option value="exam_notification">📚 考试通知</option>
              <option value="exam_result">🎓 考试成绩</option>
              <option value="clock_reminder">⏰ 打卡提醒</option>
              <option value="overtime_approval">🌙 加班审批</option>
              <option value="makeup_approval">🔄 补卡审批</option>
              <option value="attendance_abnormal">⚠️ 考勤异常</option>
              <option value="system">🔔 系统通知</option>
            </select>

            {/* 状态筛选 */}
            <select
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all text-base font-medium"
              value={filters.isRead}
              onChange={(e) => setFilters(prev => ({ ...prev, isRead: e.target.value }))}
            >
              <option value="">📊 全部状态</option>
              <option value="false">🔴 未读</option>
              <option value="true">✅ 已读</option>
            </select>

            {/* 日期范围 */}
            <div className="flex gap-2">
              <input
                type="date"
                placeholder="开始日期"
                className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
              <input
                type="date"
                placeholder="结束日期"
                className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          {/* 筛选统计 */}
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
            <span>共找到 <span className="font-bold text-blue-600">{pagination.total}</span> 条通知</span>
            {filters.isRead === 'false' && <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">仅显示未读</span>}
            {filters.type && <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">{getTypeName(filters.type)}</span>}
          </div>
        </div>
      </div>

      {/* 通知列表 */}
      <div className="flex-1 overflow-auto px-8 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-6 text-lg font-medium">加载中...</p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200 px-12">
              <BellIcon className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">暂无通知</h3>
              <p className="text-gray-500 text-lg">没有找到符合条件的通知消息</p>
              {(filters.search || filters.type || filters.isRead || filters.startDate || filters.endDate) && (
                <button
                  onClick={clearFilters}
                  className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  清除筛选条件
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`
                  group relative bg-white rounded-2xl p-5 border-2 transition-all cursor-pointer hover:shadow-xl hover:-translate-y-0.5
                  ${notification.is_read
                    ? 'border-gray-100 hover:border-gray-200'
                    : 'border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 hover:border-blue-300'
                  }
                `}
              >
                <div className="flex items-start gap-5">
                  {/* 图标 */}
                  <div className={`p-4 rounded-2xl shrink-0 shadow-md ${getColorClass(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2 gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-bold text-lg ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <span className="px-2.5 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-sm animate-pulse">
                            NEW
                          </span>
                        )}
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-semibold rounded-full">
                          {getTypeName(notification.type)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 whitespace-nowrap font-medium">
                          {new Date(notification.created_at).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <button
                          onClick={(e) => deleteNotification(notification.id, e)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          title="删除"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-600 line-clamp-2 text-base leading-relaxed">
                      {notification.content}
                    </p>

                    {/* 底部信息 */}
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>{new Date(notification.created_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                      {notification.is_read && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>已读</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 分页控件 */}
      {pagination.totalPages > 1 && (
        <div className="bg-white border-t border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              显示第 <span className="font-bold text-gray-900">{(pagination.page - 1) * pagination.pageSize + 1}</span> 到 <span className="font-bold text-gray-900">{Math.min(pagination.page * pagination.pageSize, pagination.total)}</span> 条，
              共 <span className="font-bold text-blue-600">{pagination.total}</span> 条通知
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                首页
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                上一页
              </button>
              <div className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg">
                {pagination.page} / {pagination.totalPages}
              </div>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                下一页
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.totalPages }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
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
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* 模态框头部 */}
            <div className={`px-6 py-4 flex items-center justify-between ${getColorClass(selectedNotification.type).replace('text-', 'bg-').replace('100', '50')}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-white/50`}>
                  {getIcon(selectedNotification.type)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{getTypeName(selectedNotification.type)}</h3>
                  <p className="text-sm text-gray-600">{new Date(selectedNotification.created_at).toLocaleString('zh-CN')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* 模态框内容 */}
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedNotification.title}</h2>
              <div className="prose prose-blue max-w-none text-gray-600 bg-gray-50 p-4 rounded-xl">
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
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => deleteNotification(selectedNotification.id)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <TrashIcon className="w-5 h-5" />
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
