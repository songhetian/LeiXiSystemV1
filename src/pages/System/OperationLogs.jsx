import React, { useState, useEffect } from 'react';
import { Table, Input, Select, DatePicker, Button, Space, Tag, Card, Typography, Tooltip, Empty, Descriptions } from 'antd';
import { SearchOutlined, ReloadOutlined, InfoCircleOutlined, HistoryOutlined, SafetyOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons';
import api from '../../api';
import dayjs from 'dayjs';
import Breadcrumb from '../../components/Breadcrumb';
import useUserStore from '../../store/userStore';
import DataTableSkeleton from '../../components/DataTableSkeleton';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const OperationLogs = () => {
  const [filters, setFilters] = useState({
    username: '',
    module: undefined,
    status: undefined,
    dateRange: null
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const { userMap } = useUserStore();

  const modules = [
    { label: '用户管理', value: 'user' },
    { label: '考勤管理', value: 'attendance' },
    { label: '资产管理', value: 'assets' },
    { label: '薪资管理', value: 'salary' },
    { label: '即时通讯', value: 'messaging' },
    { label: '审批流', value: 'approval' },
    { label: '系统设置', value: 'system' }
  ];

  const moduleMap = {
    'user': { label: '用户管理', color: 'blue' },
    'attendance': { label: '考勤管理', color: 'cyan' },
    'assets': { label: '资产管理', color: 'purple' },
    'salary': { label: '薪资管理', color: 'gold' },
    'messaging': { label: '即时通讯', color: 'green' },
    'approval': { label: '审批流', color: 'orange' },
    'system': { label: '系统设置', color: 'red' }
  };

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
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      align: 'center',
      render: date => (
        <div className="flex flex-col items-center">
          <span className="text-gray-700 font-medium">
            {dayjs(date).format('YYYY-MM-DD')}
          </span>
          <span className="text-gray-400 text-xs">
            {dayjs(date).format('HH:mm:ss')}
          </span>
        </div>
      )
    },
    {
      title: '操作人',
      key: 'user',
      width: 140,
      align: 'center',
      render: (_, record) => (
        <div className="flex items-center justify-center gap-2">
          <div className="w-7 h-7 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-xs font-bold border border-blue-100">
            {(record.latest_real_name || record.real_name || '系')[0]}
          </div>
          <Text strong className="text-slate-700 text-sm">
            {record.latest_real_name || record.real_name || '系统服务'}
          </Text>
        </div>
      )
    },
    {
      title: '功能模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      align: 'center',
      render: m => {
        const config = moduleMap[m] || { label: m, color: 'default' };
        return (
          <Tag
            color={config.color}
            className="px-2 py-0 border-0 rounded font-medium text-[11px]"
          >
            {config.label}
          </Tag>
        );
      }
    },
    {
      title: '操作动作',
      dataIndex: 'action',
      key: 'action',
      align: 'center',
      render: text => {
        let displayAction = text;
        // 尝试替换 ID 为用户名
        // 1. 匹配 "至 39" -> "至 张三"
        displayAction = displayAction.replace(/至 (\d+)/g, (match, id) => {
          return userMap[id] ? `至 ${userMap[id]}` : match;
        });
        // 2. 匹配 "(目标ID: 39)" 或 "[目标ID: 39]" -> "[目标: 张三]"
        displayAction = displayAction.replace(/[\(\[]目标ID: (\d+)[\)\]]/g, (match, id) => {
          return userMap[id] ? `[目标: ${userMap[id]}]` : match;
        });
        // 3. 匹配 "用户ID 37" 或 "ID 37" -> "张三"
        displayAction = displayAction.replace(/(?:用户)?ID (\d+)/g, (match, id) => {
          return userMap[id] ? userMap[id] : match;
        });

        return (
          <Text className="text-gray-600 font-medium tracking-tight whitespace-normal break-all">
            {displayAction}
          </Text>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center',
      render: s => (
        <div className="flex items-center justify-center">
          <div
            className={`w-2 h-2 rounded-full mr-2 ${s ? 'bg-green-500' : 'bg-red-500'}`}
          ></div>
          <span className={`text-xs font-bold ${s ? 'text-green-600' : 'text-red-600'}`}>
            {s ? '成功' : '失败'}
          </span>
        </div>
      )
    },
    {
      title: '操作说明',
      key: 'detail',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Tooltip
          placement="left"
          title={
            <div className="p-2 space-y-2 text-xs">
              <div className="flex justify-between border-b border-white/20 pb-1">
                <span className="text-gray-400">请求方法</span>
                <span className="font-mono">{record.method}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-gray-400">请求地址</span>
                <span className="font-mono bg-black/20 p-1 rounded break-all">
                  {record.url}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/20 pt-1">
                <span className="text-gray-400">IP地址</span>
                <span className="font-mono">{record.ip || 'Local'}</span>
              </div>
              {record.params && (
                <div className="flex flex-col gap-1 border-t border-white/20 pt-1">
                  <span className="text-gray-400">业务参数</span>
                  <pre className="m-0 max-h-40 overflow-auto bg-black/20 p-2 rounded text-[10px]">
                    {typeof record.params === 'string'
                      ? record.params
                      : JSON.stringify(record.params, null, 2)}
                  </pre>
                </div>
              )}
              {record.error_msg && (
                <div className="mt-2 text-red-300 font-bold border-t border-red-500/30 pt-1">
                  Error: {record.error_msg}
                </div>
              )}
            </div>
          }
          overlayInnerStyle={{ background: '#1e293b', borderRadius: '12px' }}
          overlayStyle={{ maxWidth: '400px' }}
        >
          <Button
            type="text"
            shape="circle"
            icon={<InfoCircleOutlined className="text-gray-400 hover:text-blue-500" />}
          />
        </Tooltip>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      <Breadcrumb items={['首页', '系统设置', '操作日志']} className="mb-6" />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* 顶部标题栏 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
          <div>
            <Title level={2} className="!mb-1 tracking-tight">
              系统操作日志
            </Title>
            <p className="text-gray-500 font-medium">
              记录并审计系统内的关键操作行为，保障全链路数据安全
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip title="刷新数据">
              <Button
                icon={<ReloadOutlined spin={loading} />}
                onClick={fetchLogs}
                className="rounded-xl h-11 w-11 flex items-center justify-center border-gray-200"
              />
            </Tooltip>
          </div>
        </div>

        {loading && logs.length === 0 ? (
          <DataTableSkeleton rows={10} />
        ) : (
          <>
            {/* 搜索统计区 */}
            <Card
              bordered={false}
              className="shadow-sm border border-gray-100 rounded-2xl overflow-hidden"
              bodyStyle={{ padding: '20px 24px' }}
            >
              {/* ... 保持原有搜索内容 ... */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                  <Text type="secondary" className="text-xs font-bold whitespace-nowrap uppercase tracking-wider">
                    <UserOutlined /> 操作人
                  </Text>
                  <Input
                    placeholder="姓名/用户名"
                    allowClear
                    value={filters.username}
                    onChange={e => setFilters({ ...filters, username: e.target.value })}
                    className="h-10 w-44 rounded-xl shadow-sm border-gray-100"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Text type="secondary" className="text-xs font-bold whitespace-nowrap uppercase tracking-wider">
                    <SafetyOutlined /> 归属模块
                  </Text>
                  <Select
                    placeholder="选择模块"
                    allowClear
                    options={modules}
                    value={filters.module}
                    onChange={val => setFilters({ ...filters, module: val })}
                    className="w-40 h-10 custom-select-rs"
                    style={{ borderRadius: '10px' }}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Text type="secondary" className="text-xs font-bold whitespace-nowrap uppercase tracking-wider">
                    <HistoryOutlined /> 时间
                  </Text>
                  <RangePicker
                    value={filters.dateRange}
                    onChange={dates => setFilters({ ...filters, dateRange: dates })}
                    className="h-10 w-64 rounded-xl border-gray-100"
                  />
                </div>

                <div className="flex gap-2 ml-auto">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      setFilters({ username: '', module: undefined, status: undefined, dateRange: null });
                      setPagination({ current: 1, pageSize: 10 });
                    }}
                    className="h-10 px-4 rounded-xl border-gray-200 text-gray-500 font-medium"
                  >
                    重置
                  </Button>
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={() => {
                      setPagination({ ...pagination, current: 1 });
                      fetchLogs();
                    }}
                    className="h-10 px-8 rounded-xl shadow-lg shadow-blue-100 border-0 font-bold"
                  >
                    搜索
                  </Button>
                </div>
              </div>
            </Card>

            {/* 列表区 */}
            <Card
              bordered={false}
              className="shadow-sm border border-gray-100 rounded-2xl overflow-hidden"
              bodyStyle={{ padding: 0 }}
            >
              <Table
                columns={columns}
                dataSource={logs}
                rowKey="id"
                loading={loading}
                className="custom-audit-table"
                pagination={{
                  ...pagination,
                  total,
                  showTotal: (total) => (
                    <span className="text-gray-400 mr-4 font-medium">
                      共 {total} 条审计记录
                    </span>
                  ),
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  position: ['bottomCenter'],
                  className: 'my-6 custom-pagination',
                  onChange: (page, pageSize) => {
                    setPagination({ current: page, pageSize });
                  }
                }}
                locale={{
                  emptyText: (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无操作日志" />
                  )
                }}
              />
            </Card>
          </>
        )}
      </div>

      <style jsx="true">{`
				.custom-audit-table .ant-table-thead > tr > th {
					background: #fcfcfc;
					font-weight: 700;
					color: #64748b;
					text-transform: uppercase;
					font-size: 12px;
					letter-spacing: 0.025em;
					padding-top: 20px;
					padding-bottom: 20px;
					border-bottom: 2px solid #f8fafc;
				}
				.custom-audit-table .ant-table-tbody > tr > td {
					padding-top: 16px;
					padding-bottom: 16px;
				}
				.custom-audit-table .ant-table-tbody > tr:hover > td {
					background: #f8fafc !important;
				}
				.ant-table-wrapper .ant-table-pagination.ant-table-pagination-center {
					justify-content: center;
				}
        .custom-pagination .ant-pagination-item {
          border-radius: 8px;
          border-color: #f1f5f9;
        }
        .custom-pagination .ant-pagination-item-active {
          background: #3b82f6;
          border-color: #3b82f6;
        }
        .custom-pagination .ant-pagination-item-active a {
          color: white !important;
        }
        .custom-pagination .ant-pagination-prev .ant-pagination-item-link,
        .custom-pagination .ant-pagination-next .ant-pagination-item-link {
          border-radius: 8px;
          border-color: #f1f5f9;
        }
			`}</style>
    </div>
  );
};

export default OperationLogs;
