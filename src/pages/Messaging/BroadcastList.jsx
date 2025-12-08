import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getApiUrl } from '../../utils/apiConfig';
import {
  SpeakerWaveIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { Pagination } from 'antd';

export default function BroadcastList() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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

  const [selectedBroadcast, setSelectedBroadcast] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadBroadcasts();
  }, [pagination.page, filters]);

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
        search: filters.search || undefined,
        type: filters.type || undefined,
        isRead: filters.isRead || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      };

      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await axios.get(getApiUrl('/api/broadcasts/my-broadcasts'), {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        const broadcastData = (response.data.data || []).map(item => ({
          ...item,
          // 确保 is_read 是布尔值
          is_read: item.is_read === 1 || item.is_read === true
        }));

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
      search: '',
      type: '',
      isRead: '',
      startDate: '',
      endDate: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'info': return <SpeakerWaveIcon className="w-5 h-5" />;
      case 'warning': return <ExclamationCircleIcon className="w-5 h-5" />;
      case 'error': return <ExclamationCircleIcon className="w-5 h-5" />;
      case 'announcement': return <SpeakerWaveIcon className="w-5 h-5" />;
      case 'success': return <CheckCircleIcon className="w-5 h-5" />;
      default: return <BellIcon className="w-5 h-5" />;
    }
  };

  const getColorClass = (type) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-600';
      case 'warning': return 'bg-yellow-100 text-yellow-600';
      case 'error': return 'bg-red-100 text-red-600';
      case 'announcement': return 'bg-purple-100 text-purple-600';
      case 'success': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
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
    <div className="h-full flex flex-col bg-gray-50">
      {/* 头部区域 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <SpeakerWaveIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">系统广播</h1>
              <p className="text-sm text-gray-600 mt-0.5">
                查看所有系统广播消息
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadBroadcasts}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              刷新
            </button>
          </div>
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
              placeholder="搜索广播标题或内容..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
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
                <option value="info">系统广播</option>
                <option value="warning">重要提醒</option>
                <option value="error">紧急通知</option>
                <option value="announcement">公告</option>
                <option value="success">成功通知</option>
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

      {/* 广播列表 */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4 text-sm">加载中...</p>
            </div>
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center py-12">
              <SpeakerWaveIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无广播</h3>
              <p className="text-gray-500">没有找到符合条件的广播消息</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {broadcasts.map(broadcast => (
              <div
                key={broadcast.id}
                onClick={() => handleBroadcastClick(broadcast)}
                className={`
                  group relative bg-white rounded-lg p-4 border transition-all cursor-pointer hover:shadow-md
                  ${broadcast.is_read
                    ? 'border-gray-200 hover:border-gray-300'
                    : 'border-l-4 border-l-blue-500 border-t border-r border-b border-gray-200 bg-blue-50/30'
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  {/* 图标 */}
                  <div className={`p-3 rounded-lg shrink-0 ${getColorClass(broadcast.type)}`}>
                    {getIcon(broadcast.type)}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-semibold ${broadcast.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                          {broadcast.title}
                        </h3>
                        {!broadcast.is_read && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                            NEW
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                          {getTypeName(broadcast.type)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(broadcast.created_at).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-2">
                      {broadcast.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 分页控件 */}
      {pagination.total > 0 && (
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
          <Pagination
            current={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={(page, pageSize) => {
              setPagination(prev => ({ ...prev, page, pageSize }));
            }}
            showTotal={(total) => `共 ${total} 条`}
            showSizeChanger
            showQuickJumper
          />
        </div>
      )}

      {/* 详情模态框 */}
      {showModal && selectedBroadcast && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
            {/* 模态框头部 */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getColorClass(selectedBroadcast.type)}`}>
                  {getIcon(selectedBroadcast.type)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{getTypeName(selectedBroadcast.type)}</h3>
                  <p className="text-sm text-gray-500">{new Date(selectedBroadcast.created_at).toLocaleString('zh-CN')}</p>
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedBroadcast.title}</h2>
              <div className="bg-gray-50 p-4 rounded-lg text-gray-700 leading-relaxed">
                {selectedBroadcast.content}
              </div>
            </div>

            {/* 模态框底部 */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-200">
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
