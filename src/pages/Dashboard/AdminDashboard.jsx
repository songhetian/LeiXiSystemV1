/**
 * 管理员专属数据看板
 */
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Skeleton, Typography, Space, Table, Tag, Empty } from 'antd';
import { 
  TeamOutlined, 
  SafetyCertificateOutlined, 
  AccountBookOutlined, 
  AuditOutlined,
  BarChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import api from '../../api';
import Breadcrumb from '../../components/Breadcrumb';

const { Title, Text } = Typography;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/dashboard/stats', {
        params: { user_id: localStorage.getItem('userId') }
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Fetch admin stats failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8"><Skeleton active /></div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <Breadcrumb items={['首页', '企业看板']} />
      </div>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 800 }}>企业管理看板 (Admin)</Title>
        <Text type="secondary">全局视角：监控公司人力资源、财务支出及系统安全状态</Text>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: 16 }}>
            <Statistic
              title={<Space><TeamOutlined /> 总用户数</Space>}
              value={data?.overview?.totalUsers}
              valueStyle={{ color: '#1890ff', fontWeight: 700 }}
            />
            <div className="mt-2 text-xs text-gray-400">待审核用户: <span className="text-orange-500 font-bold">{data?.overview?.pendingUsers}</span></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: 16 }}>
            <Statistic
              title={<Space><SafetyCertificateOutlined /> 今日考勤率</Space>}
              value={data?.overview?.totalUsers ? (data.overview.todayClocks / data.overview.totalUsers * 100).toFixed(1) : 0}
              suffix="%"
              valueStyle={{ color: '#52c41a', fontWeight: 700 }}
            />
            <div className="mt-2 text-xs text-gray-400">今日已打卡: {data?.overview?.todayClocks} 人</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: 16 }}>
            <Statistic
              title={<Space><AccountBookOutlined /> 本月报销支出</Space>}
              value={data?.overview?.monthReimbursement}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#cf1322', fontWeight: 700 }}
            />
            <div className="mt-2 text-xs text-gray-400">统计范围: 本月已通过单据</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: 16 }}>
            <Statistic
              title={<Space><AuditOutlined /> 今日操作日志</Space>}
              value={data?.overview?.todayLogs}
              valueStyle={{ color: '#722ed1', fontWeight: 700 }}
            />
            <div className="mt-2 text-xs text-gray-400">包含所有增删改行为</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* 部门人数分布 - 饼图 */}
        <Col xs={24} lg={12}>
          <Card 
            title={<Space><PieChartOutlined /> 部门人员分布</Space>} 
            bordered={false} 
            style={{ borderRadius: 16, height: '400px' }}
          >
            <div style={{ width: '100%', height: 300 }}>
              {data?.charts?.deptDistribution?.length > 0 ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={data?.charts?.deptDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data?.charts?.deptDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="暂无部门人员数据" style={{ marginTop: 60 }} />
              )}
            </div>
          </Card>
        </Col>

        {/* 报销费用分布 - 柱状图 */}
        <Col xs={24} lg={12}>
          <Card 
            title={<Space><BarChartOutlined /> 本月费用分类统计 (已通过)</Space>} 
            bordered={false} 
            style={{ borderRadius: 16, height: '400px' }}
          >
            <div style={{ width: '100%', height: 300 }}>
              {data?.charts?.reimbursementByType?.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={data?.charts?.reimbursementByType}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f5f5f5'}} />
                    <Bar dataKey="value" name="金额 (¥)" fill="#667eea" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="本月暂无已通过的报销数据" style={{ marginTop: 60 }} />
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
