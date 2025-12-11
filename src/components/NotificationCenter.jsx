// [SHADCN-REPLACED]
import React from 'react';

// 导入 shadcn UI 组件
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const NotificationCenter = () => {
  const notifications = [
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
  ];

  const getIconByType = (type) => {
    switch (type) {
      case 'warning':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        );
    }
  };

  const getColorByType = (type) => {
    switch (type) {
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      default:
        return 'primary';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'warning':
        return '警告';
      case 'success':
        return '成功';
      default:
        return '系统';
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>消息通知中心</CardTitle>
          <CardDescription>查看和管理系统通知</CardDescription>
          <div className="flex gap-2">
            <Button variant="outline">标记全部已读</Button>
            <Button>刷新</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map(item => (
              <div
                key={item.id}
                className={`p-4 rounded-lg border ${!item.read ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getIconByType(item.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{item.title}</h3>
                      {!item.read && <Badge variant="destructive">未读</Badge>}
                      <Badge variant={getColorByType(item.type)}>{getTypeLabel(item.type)}</Badge>
                    </div>
                    <p className="text-gray-700 mb-2">{item.content}</p>
                    <p className="text-gray-400 text-sm">{item.time}</p>
                  </div>
                  <Button variant="ghost" size="sm">查看详情</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCenter;
