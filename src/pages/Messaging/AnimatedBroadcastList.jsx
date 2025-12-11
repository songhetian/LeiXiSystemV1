// [SHADCN-REPLACED]
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getApiUrl } from '../../utils/apiConfig';
import {
  SpeakerWaveIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BellIcon,
  ClockIcon,
  UserIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

// 导入 Shadcn UI 组件
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';

// 导入动画组件
import { motion, AnimatePresence } from 'framer-motion';
import { MotionCard } from '../../components/ui/motion-card';

export default function AnimatedBroadcastList() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // 筛选状态
  const [filters, setFilters] = useState({
    type: '',
    isRead: ''
  });

  // 快捷筛选状态
  const [quickFilter, setQuickFilter] = useState('');

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
  }, [pagination.page, filters, quickFilter]);

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

        // 排序：未读优先，然后按时间倒序
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

  const handleBroadcastClick = (broadcast) => {
    setSelectedBroadcast(broadcast);
    setShowModal(true);
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

  const getBgColorClass = (type) => {
    switch (type) {
      case 'info': return 'bg-blue-50 border-blue-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'announcement': return 'bg-purple-50 border-purple-200';
      case 'success': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
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

  // 动画变体
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 头部区域 - 带动画效果 */}
      <motion.div
        className="bg-white border-b border-gray-200 shadow-sm"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <motion.div
                className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SpeakerWaveIcon className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <motion.h1
                  className="text-3xl font-bold text-gray-900"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  系统广播
                </motion.h1>
                <motion.p
                  className="text-gray-600 mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  查看所有系统广播消息
                </motion.p>
              </div>
            </div>
            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                onClick={loadBroadcasts}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 text-sm font-medium shadow-md flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                刷新
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* 快捷筛选按钮区域 */}
      <motion.div
        className="bg-white border-b border-gray-200 shadow-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-gray-700 font-medium">快速筛选:</span>
            {[
              { label: '全部', value: '' },
              { label: '今天', value: 'today' },
              { label: '昨天', value: 'yesterday' },
              { label: '近三天', value: 'last3days' },
              { label: '近七天', value: 'last7days' }
            ].map((item, index) => (
              <motion.div
                key={item.value}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Button
                  onClick={() => setQuickDateFilter(item.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    quickFilter === item.value
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.label}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 筛选区域 */}
      <motion.div
        className="bg-white border-b border-gray-200 shadow-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FunnelIcon className="w-4 h-4" />
                筛选选项
                {showFilters ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
              </Button>

              {(filters.type || filters.isRead) && (
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <span className="text-sm text-gray-600">
                    已应用 {Object.values(filters).filter(Boolean).length} 个筛选条件
                  </span>
                </motion.div>
              )}
            </div>

            {(filters.type || filters.isRead || quickFilter) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Button
                  onClick={clearFilters}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1 text-sm font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <XMarkIcon className="w-4 h-4" />
                  清除筛选
                </Button>
              </motion.div>
            )}
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">广播类型</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
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
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">阅读状态</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
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
                    </motion.div>
                  </div>

                  {(filters.type || filters.isRead || quickFilter) && (
                    <motion.div
                      className="mt-4 flex items-center justify-between"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <span className="text-sm text-gray-600">
                        找到 <span className="font-semibold text-blue-600">{pagination.total}</span> 条结果
                      </span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"
            ></motion.div>
            <p className="text-gray-600 text-lg">正在加载广播消息...</p>
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="flex items-center justify-center h-full p-4">
            <MotionCard className="max-w-2xl w-full">
              <CardContent className="p-12 text-center">
                <motion.div
                  className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-blue-50"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <SpeakerWaveIcon className="h-12 w-12 text-blue-400" />
                </motion.div>
                <CardHeader className="p-0 mt-6">
                  <CardTitle className="text-2xl">暂无广播消息</CardTitle>
                  <CardDescription className="mt-2">
                    {filters.type || filters.isRead || quickFilter
                      ? "没有找到符合条件的广播消息"
                      : "目前没有任何广播消息"}
                  </CardDescription>
                </CardHeader>
                <motion.div
                  className="mt-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    onClick={loadBroadcasts}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    重新加载
                  </Button>
                </motion.div>
              </CardContent>
            </MotionCard>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <motion.div
              className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                  {broadcasts.map((broadcast, index) => (
                    <MotionCard
                      key={broadcast.id}
                      onClick={() => handleBroadcastClick(broadcast)}
                      className={`
                        relative cursor-pointer
                        ${broadcast.is_read
                          ? 'border-gray-200 hover:border-gray-300'
                          : `border-l-4 ${getBgColorClass(broadcast.type).split(' ')[1]} ${getBgColorClass(broadcast.type).split(' ')[0]} shadow-md`
                        }
                      `}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -5 }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className={`p-3 rounded-xl ${getColorClass(broadcast.type)}`}>
                            {getIcon(broadcast.type)}
                          </div>
                          <div className="flex items-center gap-2">
                            {!broadcast.is_read && (
                              <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                              >
                                <Badge className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                                  NEW
                                </Badge>
                              </motion.div>
                            )}
                            <Badge variant="outline" className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                              {getTypeName(broadcast.type)}
                            </Badge>
                          </div>
                        </div>

                        <CardHeader className="p-0 mt-4">
                          <CardTitle className={`text-lg ${broadcast.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                            {broadcast.title}
                          </CardTitle>
                        </CardHeader>

                        <p className="mt-3 text-gray-600 text-sm line-clamp-3">
                          {broadcast.content}
                        </p>

                        <div className="mt-6 flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-500">
                            <ClockIcon className="h-4 w-4 mr-1.5" />
                            <span>
                              {new Date(broadcast.created_at).toLocaleDateString('zh-CN', {
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          <div className="flex items-center text-sm text-gray-500">
                            <EyeIcon className="h-4 w-4 mr-1.5" />
                            <span>
                              {broadcast.is_read ? '已读' : '未读'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </MotionCard>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {pagination.total > 0 && (
              <motion.div
                className="bg-white border-t border-gray-200 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-gray-700 text-sm">
                    显示第 <span className="font-semibold">{(pagination.page - 1) * pagination.pageSize + 1}</span> 到 <span className="font-semibold">{Math.min(pagination.page * pagination.pageSize, pagination.total)}</span> 条，
                    共 <span className="font-semibold text-blue-600">{pagination.total}</span> 条
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center gap-2"
                      whileHover={{ scale: !pagination.page === 1 ? 1.05 : 1 }}
                      whileTap={{ scale: !pagination.page === 1 ? 0.95 : 1 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      上一页
                    </Button>

                    <div className="flex items-center bg-gray-100 rounded-lg px-2 py-1">
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
                        className="w-12 bg-transparent text-center text-sm focus:outline-none"
                      />
                      <span className="text-gray-500 text-sm mx-1">/</span>
                      <span className="text-gray-700 text-sm">{pagination.totalPages}</span>
                    </div>

                    <Button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center gap-2"
                      whileHover={{ scale: !(pagination.page === pagination.totalPages) ? 1.05 : 1 }}
                      whileTap={{ scale: !(pagination.page === pagination.totalPages) ? 0.95 : 1 }}
                    >
                      下一页
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 text-sm">每页显示:</span>
                    <select
                      value={pagination.pageSize}
                      onChange={(e) => {
                        setPagination(prev => ({ ...prev, pageSize: parseInt(e.target.value), page: 1 }));
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="10">10条</option>
                      <option value="20">20条</option>
                      <option value="50">50条</option>
                      <option value="100">100条</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* 详情模态框 */}
      <AnimatePresence>
        {showModal && selectedBroadcast && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <DialogHeader className={`${getBgColorClass(selectedBroadcast.type)} px-6 py-5`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${getColorClass(selectedBroadcast.type)}`}>
                      {getIcon(selectedBroadcast.type)}
                    </div>
                    <div>
                      <DialogTitle className="text-xl text-gray-900">{getTypeName(selectedBroadcast.type)}</DialogTitle>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <UserIcon className="h-4 w-4 mr-1.5" />
                        <span>来自系统</span>
                        <ClockIcon className="h-4 w-4 ml-3 mr-1.5" />
                        <span>{new Date(selectedBroadcast.created_at).toLocaleString('zh-CN')}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-500" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="p-8 overflow-y-auto max-h-[60vh]">
                <motion.h2
                  className="text-2xl font-bold text-gray-900 mb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {selectedBroadcast.title}
                </motion.h2>
                <motion.div
                  className="prose prose-lg max-w-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="bg-gray-50 p-6 rounded-xl text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedBroadcast.content}
                  </div>
                </motion.div>

                <motion.div
                  className="mt-8 flex items-center justify-between"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center">
                    <Badge
                      className={`
                        px-3 py-1.5 rounded-full text-sm font-medium
                        ${selectedBroadcast.is_read
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                        }
                      `}
                    >
                      {selectedBroadcast.is_read ? '已读' : '未读'}
                    </Badge>
                  </div>
                </motion.div>
              </div>

              <DialogFooter className="px-8 py-5 bg-gray-50 border-t border-gray-200">
                <Button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  关闭
                </Button>
              </DialogFooter>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
