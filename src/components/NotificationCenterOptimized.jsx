// [SHADCN-REPLACED]
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';

// Shadcn UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';

const NotificationCenterOptimized = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: '系统维护通知',
      content: '系统将于今晚00:00-02:00进行例行维护，请提前做好相关准备。',
      time: '2023-05-15 14:30',
      type: 'system',
      read: false,
    },
    {
      id: 2,
      title: '考勤异常提醒',
      content: '您今天上午的考勤记录存在异常，请及时处理。',
      time: '2023-05-15 09:15',
      type: 'warning',
      read: true,
    },
    {
      id: 3,
      title: '审批通过',
      content: '您提交的请假申请已通过审批。',
      time: '2023-05-14 16:45',
      type: 'success',
      read: true,
    },
    {
      id: 4,
      title: '新版本更新',
      content: '系统已更新至v2.1.0版本，新增多项功能和优化。',
      time: '2023-05-14 10:00',
      type: 'system',
      read: false,
    },
  ]);

  const getIconByType = (type) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getColorByType = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      read: true
    })));
    toast.success('所有通知已标记为已读');
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    ));
    toast.success('通知已标记为已读');
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
    toast.success('通知已删除');
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const refreshNotifications = () => {
    // 模拟刷新操作
    console.log('Refreshing notifications...');
    toast.info('通知列表已刷新');
  };

  const clearAllNotifications = () => {
    if (window.confirm('确定要清空所有通知吗？')) {
      setNotifications([]);
      toast.success('所有通知已清空');
    }
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };



  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6"
    >
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">消息通知中心</CardTitle>
            <CardDescription>查看和管理系统通知</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={markAllAsRead}>
              标记全部已读
            </Button>
            <Button onClick={refreshNotifications}>
              刷新
            </Button>
            <Button variant="destructive" onClick={clearAllNotifications}>
              清空所有
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="space-y-4">
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                    !notification.read
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="mt-1">
                      {getIconByType(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold truncate">
                          {notification.title}
                        </h3>
                        <div className="flex space-x-2 ml-2">
                          {!notification.read && (
                            <Badge variant="destructive">未读</Badge>
                          )}
                          <Badge className={getColorByType(notification.type)}>
                            {notification.type === 'system'
                              ? '系统'
                              : notification.type === 'warning'
                                ? '警告'
                                : '成功'}
                          </Badge>
                        </div>
                      </div>
                      <p className="mt-2 text-gray-600">
                        {notification.content}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                        <span>{notification.time}</span>
                        <div className="flex space-x-2">
                          {!notification.read && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                            >
                              标记已读
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            删除
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NotificationCenterOptimized;
