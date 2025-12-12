import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { getApiUrl } from '../../utils/apiConfig';
import {
  SpeakerWaveIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function BroadcastList() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    type: '',
    isRead: ''
  });

  const [quickFilter, setQuickFilter] = useState('');

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });

  const [selectedBroadcast, setSelectedBroadcast] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadBroadcasts();
  }, [pagination.page, pagination.pageSize, filters, quickFilter]);

  const setQuickDateFilter = (days) => {
    setQuickFilter(days);
    setFilters({
      type: '',
      isRead: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const loadBroadcasts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('未登录');
        return;
      }

      const params = {
        page: pagination.page,
        limit: pagination.pageSize,
        type: filters.type || undefined,
        isRead: filters.isRead || undefined,
        quickFilter: quickFilter || undefined
      };

      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await axios.get(getApiUrl('/api/broadcasts/my-broadcasts'), {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        let broadcastData = (response.data.data || []).map(item => ({
          ...item,
          is_read: item.is_read === 1 || item.is_read === true
        }));

        broadcastData.sort((a, b) => {
          if (a.is_read !== b.is_read) {
            return a.is_read ? 1 : -1;
          }
          return new Date(b.created_at) - new Date(a.created_at);
        });

        setBroadcasts(broadcastData);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.totalPages || 0
        }));
      }
    } catch (error) {
      console.error('加载广播失败:', error);
      toast.error('加载广播失败');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.put(getApiUrl(`/api/broadcasts/${id}/read`), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBroadcasts(prev => prev.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ));

      if (selectedBroadcast?.id === id) {
        setSelectedBroadcast(prev => ({ ...prev, is_read: true }));
      }
    } catch (error) {
      console.error('标记已读失败:', error);
      toast.error('操作失败');
    }
  };

  const handleBroadcastClick = (broadcast) => {
    setSelectedBroadcast(broadcast);
    setShowModal(true);
    if (!broadcast.is_read) {
      markAsRead(broadcast.id);
    }
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      isRead: ''
    });
    setQuickFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'info': return <SpeakerWaveIcon className="w-5 h-5" />;
      case 'warning': return <ExclamationCircleIcon className="w-5 h-5" />;
      case 'error': return <ExclamationCircleIcon className="w-5 h-5" />;
      case 'announcement': return <SpeakerWaveIcon className="w-5 h-5" />;
      case 'success': return <CheckCircleIcon className="w-5 h-5" />;
      default: return <SpeakerWaveIcon className="w-5 h-5" />;
    }
  };

  const getColorClass = (type) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-700';
      case 'warning': return 'bg-orange-100 text-orange-700';
      case 'error': return 'bg-red-100 text-red-700';
      case 'announcement': return 'bg-purple-100 text-purple-700';
      case 'success': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeName = (type) => {
    const names = {
      'info': '系统广播',
      'warning': '重要提醒',
      'error': '紧急通知',
      'announcement': '公告',
      'success': '成功通知'
    };
    return names[type] || '系统通知';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <SpeakerWaveIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">系统广播</h1>
                <p className="text-sm text-gray-600">查看所有系统广播消息</p>
              </div>
            </div>
            <button
              onClick={loadBroadcasts}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 font-medium"
            >
              <ArrowPathIcon className="w-5 h-5" />
              刷新
            </button>
          </div>
        </div>
      </div>

      {/* 快捷筛选 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">快速筛选:</span>
              <button
                onClick={() => setQuickDateFilter('')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  quickFilter === ''
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setQuickDateFilter('today')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  quickFilter === 'today'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                今天
              </button>
              <button
                onClick={() => setQuickDateFilter('yesterday')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  quickFilter === 'yesterday'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                昨天
              </button>
              <button
                onClick={() => setQuickDateFilter('last3days')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  quickFilter === 'last3days'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                近三天
              </button>
              <button
                onClick={() => setQuickDateFilter('last7days')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  quickFilter === 'last7days'
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                近七天
              </button>
            </div>

            {(filters.type || filters.isRead || quickFilter) && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1 text-sm font-medium"
              >
                <XMarkIcon className="w-4 h-4" />
                清除筛选
              </button>
            )}
          </div>
        </div>
      </div>

           {/* 筛选选项 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <select
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                value={filters.type}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, type: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                <option value="">全部类型</option>
                <option value="info">系统广播</option>
                <option value="warning">重要提醒</option>
                <option value="error">紧急通知</option>
                <option value="announcement">公告</option>
                <option value="success">成功通知</option>
              </select>
            </div>

            <div className="flex-1">
              <select
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                value={filters.isRead}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, isRead: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                <option value="">全部状态</option>
                <option value="false">未读</option>
                <option value="true">已读</option>
              </select>
            </div>

            {(filters.type || filters.isRead || quickFilter) && (
              <div className="text-sm text-gray-600 whitespace-nowrap">
                找到 <span className="font-semibold text-blue-600">{pagination.total}</span> 条
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mb-4"></div>
            <p className="text-gray-600">正在加载...</p>
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="flex items-center justify-center h-full p-4">
            <div className="text-center">
              <SpeakerWaveIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">暂无广播消息</h3>
              <p className="text-gray-600">
                {filters.type || filters.isRead || quickFilter
                  ? "没有找到符合条件的广播消息"
                  : "目前没有任何广播消息"}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-28">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">内容</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-44">发送时间</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {broadcasts.map(broadcast => (
                    <tr
                      key={broadcast.id}
                      onClick={() => handleBroadcastClick(broadcast)}
                      className={`cursor-pointer transition-colors ${
                        broadcast.is_read
                          ? 'bg-white hover:bg-gray-50'
                          : 'bg-blue-50 hover:bg-blue-100'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          broadcast.is_read
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {broadcast.is_read ? '已读' : '未读'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorClass(broadcast.type)}`}>
                          {getTypeName(broadcast.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm font-medium ${broadcast.is_read ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                          {broadcast.title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 line-clamp-2 max-w-md">
                          {broadcast.content}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(broadcast.created_at).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {pagination.total > 0 && (
              <div className="bg-white border-t border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    共 <span className="font-semibold text-blue-600">{pagination.total}</span> 条，
                    第 <span className="font-semibold">{(pagination.page - 1) * pagination.pageSize + 1}</span> -
                    <span className="font-semibold">{Math.min(pagination.page * pagination.pageSize, pagination.total)}</span> 条
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                      disabled={pagination.page === 1}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      首页
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page === 1}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      上一页
                    </button>

                    <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg">
                      <input
                        type="number"
                        min="1"
                        max={pagination.totalPages}
                        value={pagination.page}
                        onChange={(e) => {
                          const page = parseInt(e.target.value);
                          if (page >= 1 && page <= pagination.totalPages) {
                            setPagination(prev => ({ ...prev, page }));
                          }
                        }}
                        className="w-12 bg-white text-center text-sm border border-gray-300 rounded px-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">/ {pagination.totalPages}</span>
                    </div>

                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      下一页
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.totalPages }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      尾页
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">每页:</span>
                    <select
                      value={pagination.pageSize}
                      onChange={(e) => {
                        setPagination(prev => ({ ...prev, pageSize: parseInt(e.target.value), page: 1 }));
                      }}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="10">10条</option>
                      <option value="20">20条</option>
                      <option value="50">50条</option>
                      <option value="100">100条</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 详情模态框 */}
      {showModal && selectedBroadcast && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getColorClass(selectedBroadcast.type)}`}>
                  {getIcon(selectedBroadcast.type)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{getTypeName(selectedBroadcast.type)}</h3>
                  <div className="flex items-center text-xs text-gray-500 mt-0.5">
                    <ClockIcon className="h-3.5 w-3.5 mr-1" />
                    <span>{new Date(selectedBroadcast.created_at).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedBroadcast.title}</h2>
              <div className="bg-gray-50 p-4 rounded-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedBroadcast.content}
              </div>

              <div className="mt-6">
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  selectedBroadcast.is_read
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedBroadcast.is_read ? '已读' : '未读'}
                </span>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
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
