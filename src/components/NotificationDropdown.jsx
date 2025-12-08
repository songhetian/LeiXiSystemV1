import React, { useState, useEffect, useRef } from 'react';
import { BellIcon, CheckCircleIcon, ExclamationCircleIcon, ClockIcon, DocumentTextIcon, CalendarIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { getApiUrl } from '../utils/apiConfig';
import { toast } from 'react-toastify';

const NotificationDropdown = ({ onClose, onNavigate, onUpdateUnread }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const userId = JSON.parse(localStorage.getItem('user') || '{}').id;

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();

    // Click outside handler
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await axios.get(getApiUrl('/api/notifications'), {
        params: {
          userId,
          page: 1,
          limit: 5, // Only show latest 5
        }
      });

      if (response.data && response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await axios.get(getApiUrl(`/api/notifications/unread-count?userId=${userId}`));
      setUnreadCount(response.data.count);
      if (onUpdateUnread) {
        onUpdateUnread(response.data.count);
      }
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(getApiUrl('/api/notifications/read-all'), { userId });
      // Update local state immediately
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      if (onUpdateUnread) {
        onUpdateUnread(0);
      }
      toast.success('全部已读');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('操作失败');
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(getApiUrl(`/api/notifications/${id}/read`));
      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, is_read: 1 } : n
      ));
      loadUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    // Navigate to full page or show detail?
    // For now, let's navigate to the full page with the notification ID if possible,
    // or just close and let user view it there.
    // The requirement is "popup style", usually clicking an item goes to detail.
    // Since we don't have a direct "detail page" other than the modal in MyNotifications,
    // we can navigate to MyNotifications.
    onNavigate('my-notifications');
    onClose();
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

  return (
    <div
      ref={dropdownRef}
      className="absolute top-12 right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in-down"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-800">通知中心</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={markAllAsRead}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline disabled:opacity-50 disabled:no-underline"
          disabled={unreadCount === 0}
        >
          全部已读
        </button>
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            加载中...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <BellIcon className="w-12 h-12 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">暂无新通知</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`
                  p-4 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3
                  ${!notification.is_read ? 'bg-blue-50/30' : ''}
                `}
              >
                <div className={`p-2 rounded-lg h-fit shrink-0 ${getColorClass(notification.type)}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm font-medium truncate pr-2 ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(notification.created_at).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {notification.content}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="shrink-0 self-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-100 bg-gray-50/50">
        <button
          onClick={() => {
            onNavigate('my-notifications');
            onClose();
          }}
          className="w-full py-2 text-center text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors rounded-lg hover:bg-white"
        >
          查看全部通知
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
