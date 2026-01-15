import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Badge, Space, Typography, Modal, Button, Tooltip, Empty, List, Avatar } from 'antd';
import { 
  SyncOutlined, 
  TeamOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  InfoCircleOutlined,
  UserOutlined,
  WarningOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { apiGet } from '../../utils/apiClient';
import { getImageUrl } from '../../utils/fileUtils';
import { wsManager } from '../../services/websocket';

const { Text } = Typography;

const RealtimeAttendanceCard = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await apiGet('/api/admin/realtime-attendance');
      if (response.success) {
        setData(response.data);
        
        // 自检逻辑：如果当前用户在列表中且显示离线，但本地 Socket 是连着的
        const myId = String(localStorage.getItem('userId'));
        const allEmployees = response.data.flatMap(d => d.employees);
        const me = allEmployees.find(e => String(e.id) === myId);
        
        if (me && !me.isOnline && wsManager.isConnected()) {
            console.warn('检测到离线状态偏差，正在尝试自动重连识别...');
            wsManager.socket?.emit('ping'); // 触发后端的补录逻辑
        }
      }
    } catch (error) {
      console.error('Fetch realtime attendance failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    setIsSocketConnected(wsManager.isConnected());
    
    // 监听 Socket 状态
    const handleConnect = () => setIsSocketConnected(true);
    const handleDisconnect = () => setIsSocketConnected(false);
    
    wsManager.on('connected', handleConnect);
    wsManager.on('disconnected', handleDisconnect);

    const timer = setInterval(fetchAttendance, 60000); // 缩短为 1 分钟刷新一次
    return () => {
        clearInterval(timer);
        wsManager.off('connected', handleConnect);
        wsManager.off('disconnected', handleDisconnect);
    };
  }, []);

  const showDetail = (dept) => {
    setSelectedDept(dept);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: '部门名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <span className="font-bold">{text}</span>
          {!record.hasSchedulePlan && (
            <Tooltip title="该部门今日尚未上传排班计划">
              <WarningOutlined className="text-amber-500" />
            </Tooltip>
          )}
        </Space>
      )
    },
    {
      title: '考勤概览 (在岗/应到)',
      key: 'stats',
      render: (_, record) => {
        if (!record.hasSchedulePlan) {
          return <Text type="secondary">暂无排班</Text>;
        }
        const onDuty = record.onDutyCount;
        const totalDuty = record.onDutyCount + record.absentCount;
        const percentage = totalDuty > 0 ? (onDuty / totalDuty * 100).toFixed(0) : 0;
        return (
          <Space size="large">
            <span>
              <Badge status="success" /> {onDuty} / {totalDuty}
            </span>
            <Tag color={parseFloat(percentage) >= 90 ? 'green' : (parseFloat(percentage) >= 60 ? 'orange' : 'red')}>
              {percentage}%
            </Tag>
          </Space>
        );
      }
    },
    {
      title: '实时在线',
      dataIndex: 'onlineCount',
      key: 'onlineCount',
      align: 'center',
      render: (count) => (
        <span className="text-green-600 font-bold text-lg">
          {count}
        </span>
      )
    },
    {
      title: '缺勤人数',
      dataIndex: 'absentCount',
      key: 'absentCount',
      align: 'center',
      render: (count) => (
        <span className={count > 0 ? "text-rose-500 font-bold" : "text-slate-300"}>
          {count}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => showDetail(record)}>
          详情列表
        </Button>
      )
    }
  ];

  const getEmployeeStatusUI = (status) => {
    switch (status) {
      case 'on_duty':
        return <Tag icon={<CheckCircleOutlined />} color="success">在岗</Tag>;
      case 'absent':
        return <Tag icon={<CloseCircleOutlined />} color="error">缺勤</Tag>;
      case 'resting_online':
        return <Tag icon={<ClockCircleOutlined />} color="processing">休息(在线)</Tag>;
      case 'off_duty':
        return <Tag color="default">休息</Tag>;
      default:
        return <Tag color="default">离线</Tag>;
    }
  };

  return (
    <>
      <Card 
        title={
          <div className="flex justify-between items-center w-full">
            <Space>
              <TeamOutlined /> 
              <span>部门实时考勤</span>
              <Tag color={isSocketConnected ? 'success' : 'error'} className="text-[10px] ml-2">
                {isSocketConnected ? '实时引擎已连接' : '实时引擎断开'}
              </Tag>
            </Space>
            <Button size="small" type="text" icon={<SyncOutlined spin={loading} />} onClick={fetchAttendance}>刷新</Button>
          </div>
        }
        bordered={false} 
        style={{ borderRadius: 16, height: '400px', display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}
      >
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id" 
          pagination={false} 
          size="small"
          loading={loading}
          locale={{ emptyText: <Empty description="暂无考勤数据" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        />
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{selectedDept?.name} - 实时考勤名单</span>
            {!selectedDept?.hasSchedulePlan && <Tag color="warning">暂无排班计划</Tag>}
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
        centered
      >
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          <List
            itemLayout="horizontal"
            dataSource={selectedDept?.employees || []}
            renderItem={emp => (
              <List.Item
                extra={getEmployeeStatusUI(emp.status)}
              >
                <List.Item.Meta
                  avatar={
                    <Badge dot status={emp.isOnline ? 'success' : 'default'} offset={[-4, 32]}>
                      <Avatar src={getImageUrl(emp.avatar)} icon={<UserOutlined />} />
                    </Badge>
                  }
                  title={
                    <Space>
                      <span className="font-bold">{emp.name}</span>
                      <Text type="secondary" className="text-xs">[{emp.shift}]</Text>
                    </Space>
                  }
                  description={
                    emp.reason ? (
                      <Text type="danger" className="text-xs"><InfoCircleOutlined /> {emp.reason}</Text>
                    ) : (
                      <div className="text-xs">
                        <span className="text-slate-400">实时状态: </span>
                        <span className={emp.isOnline ? "text-green-600 font-medium" : "text-slate-400"}>
                          {emp.isOnline ? '在线' : '离线'}
                        </span>
                      </div>
                    )
                  }
                />
              </List.Item>
            )}
          />
        </div>
        <div className="mt-4 p-3 bg-slate-50 rounded-lg flex justify-around text-xs">
          <Space><Badge status="success" /> 在岗: {selectedDept?.onDutyCount}</Space>
          <Space><Badge status="error" /> 缺勤: {selectedDept?.absentCount}</Space>
          <Space><Badge status="default" /> 在线总数: {selectedDept?.onlineCount}</Space>
        </div>
      </Modal>
    </>
  );
};

export default RealtimeAttendanceCard;