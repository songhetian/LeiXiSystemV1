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
  RiseOutlined
} from '@ant-design/icons';
import api from '../../api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import Breadcrumb from '../../components/Breadcrumb';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Title, Text } = Typography;

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
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#111827' }}>
          您好，{stats?.user?.real_name || '用户'} 👋
        </Title>
        <Text type="secondary" style={{ fontSize: 15 }}>
          欢迎回到雷犀客服管理系统。今天是 {dayjs().format('YYYY年MM月DD日')}，{dayjs().format('dddd')}
        </Text>
      </div>

      {loading ? (
        <Skeleton active />
      ) : (
        <>
          {/* 顶层统计项 */}
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} hoverable style={{ borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <Statistic
                  title={<Text strong type="secondary"><BellOutlined /> 待办任务</Text>}
                  value={stats?.pendingCount || 0}
                  valueStyle={{ color: '#f5222d', fontWeight: 800, fontSize: 32 }}
                  suffix="项"
                />
                <Button type="link" onClick={() => onNavigate('my-todo')} style={{ padding: 0, marginTop: 8 }}>
                  进入待办中心 <ArrowRightOutlined />
                </Button>
              </Card>
            </Col>
            
            {stats?.adminStats && (
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} hoverable style={{ borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                  <Statistic
                    title={<Text strong type="secondary"><UserOutlined /> 全公司员工</Text>}
                    value={stats.adminStats.totalEmployees}
                    valueStyle={{ color: '#111827', fontWeight: 800, fontSize: 32 }}
                  />
                  <div className="text-xs text-gray-400 mt-2">今日在线: {stats.adminStats.todayClockIn} 人</div>
                </Card>
              </Col>
            )}

            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} hoverable style={{ borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <Statistic
                  title={<Text strong type="secondary"><ClockCircleOutlined /> 今日打卡</Text>}
                  value={stats?.personalStats?.todayClock?.clock_in ? '已签到' : '未签到'}
                  valueStyle={{ color: stats?.personalStats?.todayClock?.clock_in ? '#52c41a' : '#faad14', fontWeight: 800, fontSize: 24 }}
                />
                <Button type="link" onClick={() => onNavigate('attendance-home')} style={{ padding: 0, marginTop: 8 }}>
                  {stats?.personalStats?.todayClock?.clock_in ? '查看打卡记录' : '立即去打卡'} <ArrowRightOutlined />
                </Button>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} hoverable style={{ borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <Statistic
                  title={<Text strong type="secondary"><RiseOutlined /> 本月异常</Text>}
                  value={stats?.personalStats?.monthAbsents || 0}
                  valueStyle={{ color: '#cf1322', fontWeight: 800, fontSize: 32 }}
                  suffix="次"
                />
                <Button type="link" onClick={() => onNavigate('attendance-home')} style={{ padding: 0, marginTop: 8 }}>
                  查看考勤详情 <ArrowRightOutlined />
                </Button>
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            {/* 左侧：快捷操作 */}
            <Col xs={24} lg={12}>
              <Card 
                title={<Title level={5} style={{ margin: 0 }}>快捷入口</Title>}
                bordered={false}
                style={{ borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', height: '100%' }}
              >
                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div 
                    className="p-8 bg-blue-50 rounded-3xl cursor-pointer hover:bg-blue-100 transition-all hover:scale-[1.02] text-center"
                    onClick={() => onNavigate('reimbursement-apply')}
                  >
                    <WalletOutlined style={{ fontSize: 32 }} className="text-blue-600 mb-3" />
                    <div className="text-lg font-bold text-blue-900">申请报销</div>
                    <div className="text-xs text-blue-400 mt-1">快速提交费用报销</div>
                  </div>
                  <div 
                    className="p-8 bg-purple-50 rounded-3xl cursor-pointer hover:bg-purple-100 transition-all hover:scale-[1.02] text-center"
                    onClick={() => onNavigate('attendance-leave-apply')}
                  >
                    <CalendarOutlined style={{ fontSize: 32 }} className="text-purple-600 mb-3" />
                    <div className="text-lg font-bold text-purple-900">请假申请</div>
                    <div className="text-xs text-purple-400 mt-1">在线提交请假流程</div>
                  </div>
                  <div 
                    className="p-8 bg-orange-50 rounded-3xl cursor-pointer hover:bg-orange-100 transition-all hover:scale-[1.02] text-center"
                    onClick={() => onNavigate('my-exams')}
                  >
                    <RocketOutlined style={{ fontSize: 32 }} className="text-orange-600 mb-3" />
                    <div className="text-lg font-bold text-orange-900">参加考试</div>
                    <div className="text-xs text-orange-400 mt-1">查看待完成考核</div>
                  </div>
                  <div 
                    className="p-8 bg-green-50 rounded-3xl cursor-pointer hover:bg-green-100 transition-all hover:scale-[1.02] text-center"
                    onClick={() => onNavigate('knowledge-articles')}
                  >
                    <CheckCircleOutlined style={{ fontSize: 32 }} className="text-green-600 mb-3" />
                    <div className="text-lg font-bold text-green-900">知识库</div>
                    <div className="text-xs text-green-400 mt-1">查阅业务标准话术</div>
                  </div>
                </div>
              </Card>
            </Col>

            {/* 右侧：最新通知 */}
            <Col xs={24} lg={12}>
              <Card 
                title={<Title level={5} style={{ margin: 0 }}>最新通知</Title>}
                bordered={false}
                style={{ borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', height: '100%' }}
              >
                <List
                  itemLayout="horizontal"
                  dataSource={notifications}
                  locale={{ emptyText: <Empty description="暂无通知" /> }}
                  renderItem={item => (
                    <List.Item style={{ padding: '20px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <List.Item.Meta
                        avatar={<Avatar icon={<BellOutlined />} style={{ backgroundColor: item.is_read ? '#f5f5f5' : '#f0f7ff', color: item.is_read ? '#bfbfbf' : '#1890ff' }} />}
                        title={<Text strong style={{ fontSize: 15, color: item.is_read ? '#8c8c8c' : '#111827' }}>{item.title}</Text>}
                        description={
                          <Space direction="vertical" size={0} style={{ width: '100%' }}>
                            <Text type="secondary" ellipsis style={{ maxWidth: '100%', fontSize: 13 }}>{item.content}</Text>
                            <Space>
                              <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(item.created_at).fromNow()}</Text>
                              {!item.is_read && <Tag color="red" style={{ fontSize: 10, borderRadius: 4, lineHeight: '16px' }}>未读</Tag>}
                            </Space>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
                <Button 
                  type="link" 
                  block 
                  style={{ marginTop: 16 }} 
                  onClick={() => onNavigate('my-notifications')}
                >
                  查看全部通知
                </Button>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;