import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Calendar, 
  FileText, 
  Trash2, 
  Search, 
  Filter, 
  X, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Eye,
  CheckCheck,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';

// Shadcn UI Components
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

export default function MyNotificationsOptimized({ unreadCount: propUnreadCount, setUnreadCount: propSetUnreadCount }) {
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
    { id: 'all', label: '全部通知', icon: Bell },
    { id: 'unread', label: '未读消息', icon: AlertCircle, badge: unreadCount },
    { id: 'system', label: '系统通知', icon: Bell },
    { id: 'approval', label: '审批通知', icon: FileText },
    { id: 'attendance', label: '考勤通知', icon: Clock },
    { id: 'exam', label: '考试通知', icon: CheckCircle }
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

  // 模拟加载通知
  const loadNotifications = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟通知数据
      const mockNotifications = [
        {
          id: 1,
          title: '系统维护通知',
          content: '系统将于今晚00:00-02:00进行例行维护，请提前做好相关准备。',
          created_at: '2023-05-15T14:30:00',
          type: 'system',
          is_read: false,
          related_id: null
        },
        {
          id: 2,
          title: '考勤异常提醒',
          content: '您今天上午的考勤记录存在异常，请及时处理。',
          created_at: '2023-05-15T09:15:00',
          type: 'attendance_abnormal',
          is_read: true,
          related_id: 'ATT001'
        },
        {
          id: 3,
          title: '审批通过',
          content: '您提交的请假申请已通过审批。',
          created_at: '2023-05-14T16:45:00',
          type: 'leave_approval',
          is_read: true,
          related_id: 'LEAVE001'
        },
        {
          id: 4,
          title: '新版本更新',
          content: '系统已更新至v2.1.0版本，新增多项功能和优化。',
          created_at: '2023-05-14T10:00:00',
          type: 'system',
          is_read: false,
          related_id: null
        },
        {
          id: 5,
          title: '考试成绩发布',
          content: '您的月度考核成绩已发布，请查看。',
          created_at: '2023-05-13T15:30:00',
          type: 'exam_result',
          is_read: true,
          related_id: 'EXAM001'
        }
      ];

      setNotifications(mockNotifications);
      setPagination(prev => ({
        ...prev,
        total: mockNotifications.length,
        totalPages: Math.ceil(mockNotifications.length / prev.pageSize)
      }));
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
    }
  }, [userId, pagination.page, filters, activeTab]);

  const loadUnreadCount = async () => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      setUnreadCount(2); // 模拟未读数量
    } catch (error) {
      console.error('加载未读数量失败:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ));
      loadUnreadCount();
      if (selectedNotification?.id === id) {
        setSelectedNotification(prev => ({ ...prev, is_read: true }));
      }
      toast.success('标记为已读');
    } catch (error) {
      console.error('标记已读失败:', error);
      toast.error('操作失败');
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
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
      setNotifications(prev => 
        prev.map(n => 
          selectedIds.includes(n.id) ? { ...n, is_read: true } : n
        )
      );
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
      setNotifications(prev => prev.filter(n => n.id !== id));
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
      setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
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
      case 'clock_reminder': return <Clock className="h-5 w-5" />;
      case 'leave_approval': return <FileText className="h-5 w-5" />;
      case 'overtime_approval': return <Clock className="h-5 w-5" />;
      case 'makeup_approval': return <Clock className="h-5 w-5" />;
      case 'schedule_change': return <Calendar className="h-5 w-5" />;
      case 'attendance_abnormal': return <AlertCircle className="h-5 w-5" />;
      case 'exam_notification': return <FileText className="h-5 w-5" />;
      case 'exam_result': return <CheckCircle className="h-5 w-5" />;
      case 'system': return <Bell className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const getColorClass = (type) => {
    switch (type) {
      case 'clock_reminder': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'leave_approval': return 'bg-green-100 text-green-600 border-green-200';
      case 'overtime_approval': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'makeup_approval': return 'bg-cyan-100 text-cyan-600 border-cyan-200';
      case 'schedule_change': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'attendance_abnormal': return 'bg-red-100 text-red-600 border-red-200';
      case 'exam_notification': return 'bg-indigo-100 text-indigo-600 border-indigo-200';
      case 'exam_result': return 'bg-teal-100 text-teal-600 border-teal-200';
      case 'system': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col bg-gray-50"
    >
      {/* 头部区域 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Bell className="h-6 w-6 text-white" />
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
                <Button onClick={markSelectedAsRead} variant="default">
                  <Check className="mr-2 h-4 w-4" />
                  标记已读 ({selectedIds.length})
                </Button>
                <Button onClick={deleteSelected} variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除 ({selectedIds.length})
                </Button>
              </>
            )}
            <Button 
              onClick={markAllAsRead} 
              variant="outline"
              disabled={unreadCount === 0}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              全部已读
            </Button>
            <Button onClick={loadNotifications}>
              <RefreshCw className="mr-2 h-4 w-4" />
              刷新
            </Button>
          </div>
        </div>

        {/* Tab导航 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              全部通知
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              未读消息
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              系统通知
            </TabsTrigger>
            <TabsTrigger value="approval" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              审批通知
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              考勤通知
            </TabsTrigger>
            <TabsTrigger value="exam" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              考试通知
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 搜索和筛选区域 */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-3">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="搜索通知标题或内容..."
              className="pl-10 pr-4 py-2 text-sm"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          {/* 快速日期筛选 */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setQuickDateFilter('today')}
            >
              今天
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setQuickDateFilter('week')}
            >
              本周
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setQuickDateFilter('month')}
            >
              本月
            </Button>
          </div>

          {/* 高级筛选按钮 */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            筛选
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* 高级筛选面板 */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-gray-200"
          >
            <div className="grid grid-cols-4 gap-3">
              <Select onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))} value={filters.type}>
                <SelectTrigger>
                  <SelectValue placeholder="全部类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部类型</SelectItem>
                  <SelectItem value="leave_approval">请假审批</SelectItem>
                  <SelectItem value="overtime_approval">加班审批</SelectItem>
                  <SelectItem value="makeup_approval">补卡审批</SelectItem>
                  <SelectItem value="schedule_change">排班变更</SelectItem>
                  <SelectItem value="attendance_abnormal">考勤异常</SelectItem>
                  <SelectItem value="clock_reminder">打卡提醒</SelectItem>
                  <SelectItem value="exam_notification">考试通知</SelectItem>
                  <SelectItem value="exam_result">考试成绩</SelectItem>
                  <SelectItem value="system">系统通知</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => setFilters(prev => ({ ...prev, isRead: value }))} value={filters.isRead}>
                <SelectTrigger>
                  <SelectValue placeholder="全部状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部状态</SelectItem>
                  <SelectItem value="false">未读</SelectItem>
                  <SelectItem value="true">已读</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />

              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            {(filters.search || filters.type || filters.isRead || filters.startDate || filters.endDate) && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  找到 <span className="font-semibold text-blue-600">{pagination.total}</span> 条结果
                </span>
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  清除筛选
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* 批量操作栏 */}
      {notifications.length > 0 && (
        <div className="bg-white border-b border-gray-200 px-6 py-2">
          <div className="flex items-center gap-4">
            <Label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedIds.length === notifications.length && notifications.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-700">全选</span>
            </Label>
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
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无通知</h3>
              <p className="text-gray-500">没有找到符合条件的通知消息</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notification => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleNotificationClick(notification)}
                className={`
                  group relative bg-white rounded-lg p-4 border transition-all cursor-pointer hover:shadow-md
                  ${notification.is_read
                    ? 'border-gray-200 hover:border-gray-300'
                    : 'border-l-4 border-l-blue-500 border-t border-r border-b border-gray-200 bg-blue-50/30 shadow-sm'
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  {/* 复选框 */}
                  <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(notification.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedIds(prev => [...prev, notification.id]);
                        } else {
                          setSelectedIds(prev => prev.filter(id => id !== notification.id));
                        }
                      }}
                    />
                  </div>

                  {/* 图标 */}
                  <div className={`p-3 rounded-lg shrink-0 border ${getColorClass(notification.type)}`}>
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
                          <Badge variant="destructive">
                            NEW
                          </Badge>
                        )}
                        <Badge variant="secondary">
                          {getTypeName(notification.type)}
                        </Badge>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => deleteNotification(notification.id, e)}
                          className="h-8 w-8 opacity-0 group-hover:opacity-100"
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-2">
                      {notification.content}
                    </p>
                  </div>
                </div>
              </motion.div>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                disabled={pagination.page === 1}
              >
                首页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
              >
                上一页
              </Button>
              <div className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold text-sm">
                {pagination.page} / {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
              >
                下一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.totalPages }))}
                disabled={pagination.page === pagination.totalPages}
              >
                末页
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 详情模态框 */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        {selectedNotification && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${getColorClass(selectedNotification.type)}`}>
                  {getIcon(selectedNotification.type)}
                </div>
                <div>
                  <DialogTitle className="text-lg">{getTypeName(selectedNotification.type)}</DialogTitle>
                  <DialogDescription>
                    {new Date(selectedNotification.created_at).toLocaleString('zh-CN')}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="py-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedNotification.title}</h3>
              <div className="bg-gray-50 p-4 rounded-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedNotification.content}
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>创建时间: {new Date(selectedNotification.created_at).toLocaleString('zh-CN')}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Bell className="h-4 w-4" />
                  <span>类型: {getTypeName(selectedNotification.type)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Eye className="h-4 w-4" />
                  <span>状态: {selectedNotification.is_read ? '已读' : '未读'}</span>
                </div>
                {selectedNotification.related_id && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>关联ID: {selectedNotification.related_id}</span>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => deleteNotification(selectedNotification.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </Button>
              <Button onClick={() => setShowModal(false)}>
                关闭
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </motion.div>
  );
}