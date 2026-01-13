/**
 * 系统操作日志页面
 */
import React, { useState, useEffect } from 'react';
import { Table, Input, Select, DatePicker, Button, Space, Tag, Card, Typography, Tooltip } from 'antd';
import { SearchOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import api from '../../api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const OperationLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  
  const [filters, setFilters] = useState({
    username: '',
    module: undefined,
    status: undefined,
    dateRange: null
  });

  const modules = [
    { label: '用户管理', value: 'user' },
    { label: '权限管理', value: 'permission' },
    { label: '考勤管理', value: 'attendance' },
    { label: '假期管理', value: 'vacation' },
    { label: '报销管理', value: 'reimbursement' },
    { label: '财务资产', value: 'finance' },
    { label: '审批流配置', value: 'workflow' },
    { label: '信息系统', value: 'messaging' },
    { label: '质检管理', value: 'quality' },
    { label: '知识库', value: 'knowledge' },
    { label: '考核系统', value: 'assessment' },
    { label: '系统设置', value: 'system' }
  ];

  // 模块中文映射对象
  const moduleMap = modules.reduce((acc, curr) => {
    acc[curr.value] = curr.label;
    return acc;
  }, {});

  useEffect(() => {
    fetchLogs();
  }, [pagination.current, pagination.pageSize]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        username: filters.username,
        module: filters.module,
        status: filters.status,
        start_date: filters.dateRange?.[0]?.format('YYYY-MM-DD'),
        end_date: filters.dateRange?.[1]?.format('YYYY-MM-DD')
      };
      
      const response = await api.get('/system/logs', { params });
      if (response.data.success) {
        setLogs(response.data.data);
        setTotal(response.data.total);
      }
    } catch (error) {
      console.error('获取日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      align: 'center',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作人',
      key: 'user',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Text strong className="text-slate-700">
          {record.latest_real_name || record.real_name || '系统服务'}
        </Text>
      )
    },
    {
      title: '所属模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      align: 'center',
      render: (m) => (
        <Tag color="default" className="bg-slate-100 border-slate-200 text-slate-600 px-2 py-0.5 rounded">
          {moduleMap[m] || m}
        </Tag>
      )
    },
    {
      title: '操作动作',
      dataIndex: 'action',
      key: 'action',
      align: 'center',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (s) => (
        <Tag color={s ? 'success' : 'error'}>
          {s ? '成功' : '失败'}
        </Tag>
      )
    },
    {
      title: '详情',
      key: 'detail',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Tooltip title={
          <div>
            <div>Method: {record.method}</div>
            <div>URL: {record.url}</div>
            <div>IP: {record.ip}</div>
            {record.params && <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>Params: {record.params}</div>}
            {record.error_msg && <div style={{ color: '#ff4d4f' }}>Error: {record.error_msg}</div>}
          </div>
        }>
          <Button type="text" icon={<InfoCircleOutlined />} />
        </Tooltip>
      )
    }
  ];

  return (
    <div className="p-8">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>系统操作日志</h1>
        <p style={{ color: '#888', marginTop: 4 }}>记录并审计系统内的关键操作行为，保障数据安全</p>
      </div>

      <Card bordered={false} style={{ borderRadius: 16, marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Space wrap size="large">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500">操作人</label>
            <Input 
              placeholder="姓名/用户名" 
              allowClear 
              onChange={e => setFilters({...filters, username: e.target.value})}
              style={{ width: 180 }}
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500">模块</label>
            <Select 
              placeholder="全部模块" 
              allowClear 
              options={modules}
              onChange={val => setFilters({...filters, module: val})}
              style={{ width: 150 }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500">时间范围</label>
            <RangePicker 
              onChange={dates => setFilters({...filters, dateRange: dates})}
              style={{ width: 260 }}
            />
          </div>

          <Button 
            type="primary" 
            icon={<SearchOutlined />} 
            onClick={() => {
              setPagination({...pagination, current: 1});
              fetchLogs();
            }}
            style={{ marginTop: 20, height: 38, borderRadius: 8, backgroundColor: '#1890ff' }}
          >
            搜索
          </Button>
          
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => {
              setFilters({ username: '', module: undefined, status: undefined, dateRange: null });
              setPagination({ current: 1, pageSize: 20 });
            }}
            style={{ marginTop: 20, height: 38, borderRadius: 8 }}
          >
            重置
          </Button>
        </Space>
      </Card>

      <div style={{ background: 'white', borderRadius: 16, padding: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Table 
          columns={columns} 
          dataSource={logs} 
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            total,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, size) => setPagination({ current: page, pageSize: size })
          }}
        />
      </div>
    </div>
  );
};

export default OperationLogs;
