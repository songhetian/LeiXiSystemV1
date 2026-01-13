/**
 * 系统首页工作台
 */
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, List, Avatar, Tag, Button, Empty, Skeleton, Typography, Space } from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  CalendarOutlined,
  WalletOutlined,
  BellOutlined,
  ArrowRightOutlined,
  RiseOutlined,
  CalendarFilled,
  NotificationFilled,
  CarryOutFilled,
  TeamOutlined as EmployeesIcon
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import Breadcrumb from '../../components/Breadcrumb';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Title, Text } = Typography;

const StatCard = ({ title, value, suffix, icon, color, onClick, description, delay = 0, valueColor }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className="h-full"
  >
    <Card
      bordered={false}
      hoverable
      className="h-full overflow-hidden relative group"
      style={{
        borderRadius: 24,
        boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
        background: 'white',
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
      bodyStyle={{ padding: '24px' }}
    >
      <div className="flex justify-between items-start relative z-10">
        <div className="flex-1">
          <div className="text-gray-400 font-extrabold text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            {title}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-[900] tracking-tight transition-all group-hover:scale-105 origin-left inline-block" style={{ color: valueColor || '#111827' }}>
              {value}
            </span>
            {suffix && <span className="text-xs font-bold text-gray-400 ml-0.5">{suffix}</span>}
          </div>
          {description && (
            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
              <span className="text-[11px] text-gray-400 font-medium">{description}</span>
              {onClick && <ArrowRightOutlined className="text-[10px] text-gray-300 group-hover:text-blue-500 transition-colors" />}
            </div>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner transition-transform group-hover:rotate-12"
          style={{ background: `${color}10`, color: color }}
        >
          {icon}
        </div>
      </div>
      {/* Background decoration */}
      <div className="absolute -right-6 -bottom-6 opacity-[0.04] pointer-events-none group-hover:scale-110 transition-transform duration-500">
        {React.cloneElement(icon, { style: { fontSize: 90 } })}
      </div>
    </Card>
  </motion.div>
);

const EntryCard = ({ title, desc, icon, color, onClick, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className="h-full"
  >
    <div
      className={`p-8 rounded-[32px] cursor-pointer transition-all hover:shadow-xl hover:shadow-${color}/10 flex flex-col items-center justify-center text-center h-full border border-white group`}
      style={{
        backgroundColor: `${color}08`,
        backdropFilter: 'blur(10px)',
      }}
      onClick={onClick}
    >
      <div
        className="w-16 h-16 rounded-[22px] flex items-center justify-center mb-5 shadow-sm transition-all group-hover:scale-110 group-hover:rotate-6"
        style={{ backgroundColor: 'white', color: color, boxShadow: `0 8px 20px ${color}15` }}
      >
        {React.cloneElement(icon, { style: { fontSize: 30 } })}
      </div>
      <div className="text-lg font-bold text-gray-800 mb-1.5">{title}</div>
      <div className="text-xs text-gray-400 font-medium leading-relaxed">{desc}</div>
    </div>
  </motion.div>
);

const getGreeting = () => {
  const hour = dayjs().hour();
  if (hour < 6) return '凌晨好';
  if (hour < 11) return '早上好';
  if (hour < 13) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
};

const Dashboard = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const userId = localStorage.getItem('userId') || JSON.parse(localStorage.getItem('user'))?.id;
    if (!userId) return;

    try {
      const response = await api.get('/notifications', {
        params: { userId, pageSize: 5 }
      });
      if (response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (error) {
      console.error('Fetch notifications failed:', error);
    }
  };

  const fetchStats = async () => {
    const userId = localStorage.getItem('userId') || JSON.parse(localStorage.getItem('user'))?.id;

    if (!userId) {
      console.warn('Dashboard: No userId found, skipping stats fetch');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/dashboard/stats', {
        params: { user_id: userId }
      });
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Fetch dashboard stats failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      <div className="mb-6">
        <Breadcrumb items={['首页', '控制面板']} />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: 32 }}
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
            {getGreeting()}，{stats?.user?.real_name || '用户'} 👋
          </Title>
        </div>
        <Text type="secondary" style={{ fontSize: 16, display: 'block', marginLeft: '22px' }}>
          欢迎回到雷犀客服管理系统。今天是 <span className="text-blue-600 font-medium">{dayjs().format('YYYY年MM月DD日')}</span>，{dayjs().format('dddd')}
        </Text>
      </motion.div>

      {loading ? (
        <Skeleton active />
      ) : (
        <>
          {/* 顶层统计项 */}
          <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="待办任务"
                icon={<CarryOutFilled />}
                value={stats?.pendingCount || 0}
                suffix="项"
                color="#f5222d"
                valueColor="#f5222d"
                description="需要立即处理的事项"
                delay={0.1}
                onClick={() => onNavigate('my-todo')}
              />
            </Col>

            {stats?.adminStats && (
              <Col xs={24} sm={12} lg={6}>
                <StatCard
                  title="全公司员工"
                  icon={<EmployeesIcon />}
                  value={stats.adminStats.totalEmployees}
                  suffix="人"
                  color="#1890ff"
                  description={`今日在线 ${stats.adminStats.todayClockIn} 人`}
                  delay={0.2}
                />
              </Col>
            )}

            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="今日打卡状态"
                icon={<ClockCircleOutlined />}
                value={stats?.personalStats?.todayClock?.clock_in ? '已签到' : '未签到'}
                color={stats?.personalStats?.todayClock?.clock_in ? '#52c41a' : '#faad14'}
                valueColor={stats?.personalStats?.todayClock?.clock_in ? '#52c41a' : '#faad14'}
                description={stats?.personalStats?.todayClock?.clock_in ? `打卡时间 ${dayjs(stats.personalStats.todayClock.clock_in).format('HH:mm')}` : '尚未完成今日签到'}
                delay={0.3}
                onClick={() => onNavigate('attendance-home')}
              />
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="本月考勤异常"
                icon={<RiseOutlined />}
                value={stats?.personalStats?.monthAbsents || 0}
                suffix="次"
                color="#722ed1"
                valueColor="#cf1322"
                description="包含迟到、早退、缺卡"
                delay={0.4}
                onClick={() => onNavigate('attendance-home')}
              />
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            {/* 左侧：快捷操作 */}
            <Col xs={24} lg={14}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="h-full"
              >
                <Card
                  title={
                    <div className="flex items-center gap-2 py-1">
                      <div className="w-1 h-4 bg-orange-400 rounded-full" />
                      <span className="font-bold text-gray-800">快捷入口</span>
                    </div>
                  }
                  bordered={false}
                  className="h-full"
                  style={{ borderRadius: 32, boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}
                >
                  <div className="grid grid-cols-2 gap-6 mt-4">
                    <EntryCard
                      title="申请报销"
                      desc="快速提交费用报销流程"
                      icon={<WalletOutlined />}
                      color="#3b82f6"
                      onClick={() => onNavigate('reimbursement-apply')}
                      delay={0.6}
                    />
                    <EntryCard
                      title="请假申请"
                      desc="在线提交人事请假流程"
                      icon={<CalendarOutlined />}
                      color="#a855f7"
                      onClick={() => onNavigate('attendance-leave-apply')}
                      delay={0.7}
                    />
                    <EntryCard
                      title="参加考试"
                      desc="查阅并完成待办考核"
                      icon={<RocketOutlined />}
                      color="#f97316"
                      onClick={() => onNavigate('my-exams')}
                      delay={0.8}
                    />
                    <EntryCard
                      title="知识库"
                      desc="查阅标准客服业务话术"
                      icon={<CheckCircleOutlined />}
                      color="#10b981"
                      onClick={() => onNavigate('knowledge-articles')}
                      delay={0.9}
                    />
                  </div>
                </Card>
              </motion.div>
            </Col>

            {/* 右侧：最新通知 */}
            <Col xs={24} lg={10}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="h-full"
              >
                <Card
                  title={
                    <div className="flex items-center gap-2 py-1">
                      <div className="w-1 h-4 bg-blue-500 rounded-full" />
                      <span className="font-bold text-gray-800">最新通知</span>
                    </div>
                  }
                  extra={
                    <Button
                      type="link"
                      size="small"
                      onClick={() => onNavigate('my-notifications')}
                      className="text-blue-500 font-bold hover:text-blue-600"
                    >
                      查看全部 <ArrowRightOutlined className="text-[10px]" />
                    </Button>
                  }
                  bordered={false}
                  className="h-full"
                  style={{ borderRadius: 32, boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}
                >
                  <List
                    itemLayout="horizontal"
                    dataSource={notifications}
                    className="notifications-list-custom"
                    locale={{ emptyText: <Empty description="暂无通知" style={{ padding: '40px 0' }} /> }}
                    renderItem={(item, index) => (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + (index * 0.1) }}
                      >
                        <List.Item className="hover:bg-gray-50/80 transition-colors p-4 rounded-2xl border-none mb-1 group cursor-pointer">
                          <List.Item.Meta
                            avatar={
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${item.is_read ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-500 shadow-sm'}`}>
                                <NotificationFilled className={item.is_read ? '' : 'animate-pulse'} />
                              </div>
                            }
                            title={
                              <div className="flex items-center justify-between">
                                <Text strong className={`text-[14px] ${item.is_read ? 'text-gray-400' : 'text-gray-800'}`}>
                                  {item.title}
                                </Text>
                                {!item.is_read && <div className="w-2 h-2 bg-red-500 rounded-full" />}
                              </div>
                            }
                            description={
                              <div className="flex flex-col gap-1 mt-0.5">
                                <Text type="secondary" ellipsis className="text-[12px] max-w-full">
                                  {item.content}
                                </Text>
                                <Text className="text-[11px] text-gray-300 font-medium">
                                  {dayjs(item.created_at).fromNow()}
                                </Text>
                              </div>
                            }
                          />
                        </List.Item>
                      </motion.div>
                    )}
                  />
                </Card>
              </motion.div>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;