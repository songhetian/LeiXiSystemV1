import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Table, Button, Modal, Form, Input, Select, Tag, message, Card, Space, Tooltip, DatePicker, Radio } from 'antd'
import {
  FileTextOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined
} from '@ant-design/icons'
import Breadcrumb from '../../components/Breadcrumb'
import { getApiUrl } from '../../utils/apiConfig'
import { wsManager } from '../../services/websocket'
import { formatDate, getBeijingDate } from '../../utils/date'
import './EmployeeMemos.css'

const { Option } = Select
const { TextArea } = Input
const { RangePicker } = DatePicker

const EmployeeMemos = () => {
  const [memos, setMemos] = useState([])
  const [loading, setLoading] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [recipientsModalVisible, setRecipientsModalVisible] = useState(false)
  const [currentMemo, setCurrentMemo] = useState(null)
  const [recipients, setRecipients] = useState([])
  const [submitting, setSubmitting] = useState(false)

  // Filter state
  const [quickFilter, setQuickFilter] = useState('')
  const [dateRange, setDateRange] = useState(null)

  // Form
  const [form] = Form.useForm()
  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])

  // Decoded token info
  const token = localStorage.getItem('token')
  const userInfo = useMemo(() => {
    if (!token) return null
    try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''))
        return JSON.parse(jsonPayload)
    } catch (e) { return null }
  }, [token])
  const userDepartmentId = userInfo?.department_id

  useEffect(() => {
    // WebSocket
    const handleNewMemo = () => loadMemos()
    wsManager.on('memo', handleNewMemo)
    return () => wsManager.off('memo', handleNewMemo)
  }, [])

  useEffect(() => {
    loadMemos()
    if (departments.length === 0) loadDepartments()
  }, [quickFilter, dateRange])

  // Watch create modal form values to load employees if needed
  const sendMode = Form.useWatch('sendMode', form)
  const targetDepartmentId = Form.useWatch('targetDepartmentId', form)

  useEffect(() => {
    if (sendMode === 'individual' && targetDepartmentId) {
      loadEmployees(targetDepartmentId)
    }
  }, [sendMode, targetDepartmentId])

  const loadMemos = async () => {
    setLoading(true)
    try {
      const params = { pageSize: 100 }

      // Date filter logic
      const getFormattedDate = (date) => formatDate(date, false);
      let startDate, endDate;

      if (quickFilter) {
        if (quickFilter === 'today') {
          const d = getBeijingDate();
          const dateStr = getFormattedDate(d);
          startDate = `${dateStr} 00:00:00`;
          endDate = `${dateStr} 23:59:59`;
        } else if (quickFilter === 'yesterday') {
          const d = getBeijingDate();
          d.setDate(d.getDate() - 1);
          const dateStr = getFormattedDate(d);
          startDate = `${dateStr} 00:00:00`;
          endDate = `${dateStr} 23:59:59`;
        } else if (quickFilter === 'last3days') {
          const start = getBeijingDate();
          start.setDate(start.getDate() - 2);
          const end = getBeijingDate();
          startDate = `${getFormattedDate(start)} 00:00:00`;
          endDate = `${getFormattedDate(end)} 23:59:59`;
        } else if (quickFilter === 'last7days') {
          const start = getBeijingDate();
          start.setDate(start.getDate() - 6);
          const end = getBeijingDate();
          startDate = `${getFormattedDate(start)} 00:00:00`;
          endDate = `${getFormattedDate(end)} 23:59:59`;
        }
      } else if (dateRange && dateRange.length === 2) {
        startDate = dateRange[0].format('YYYY-MM-DD 00:00:00');
        endDate = dateRange[1].format('YYYY-MM-DD 23:59:59');
      }

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axios.get(getApiUrl('/api/memos/department/created'), {
        params: { ...params, _t: Date.now() },
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.data.success) {
        setMemos(response.data.data)
      }
    } catch (error) {
      console.error('加载备忘录失败:', error)
      message.error('加载备忘录失败')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const response = await axios.get(getApiUrl('/api/departments'), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (Array.isArray(response.data)) {
        setDepartments(response.data)
      } else if (response.data.success && response.data.data) {
        setDepartments(response.data.data)
      }
    } catch (error) { console.error(error) }
  }

  const loadEmployees = async (deptId) => {
    try {
      const response = await axios.get(getApiUrl('/api/employees'), {
        params: { department_id: deptId },
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (Array.isArray(response.data)) {
        setEmployees(response.data)
      } else if (response.data.success) {
        setEmployees(response.data.data || [])
      }
    } catch (error) { console.error(error) }
  }

  const handleCreate = async (values) => {
    setSubmitting(true)
    try {
      const payload = {
        ...values,
        title: values.title.trim(),
        content: values.content.trim()
      }
      await axios.post(getApiUrl('/api/memos/department'), payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      message.success('备忘录发送成功')
      setCreateModalVisible(false)
      form.resetFields()
      loadMemos()
    } catch (error) {
      console.error(error)
      message.error(error.response?.data?.message || '发送失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewRecipients = async (memo) => {
    try {
      const response = await axios.get(getApiUrl(`/api/memos/department/${memo.id}/recipients`), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.data.success) {
        setCurrentMemo(response.data.data.memo)
        setRecipients(response.data.data.recipients)
        setRecipientsModalVisible(true)
      }
    } catch (error) {
      message.error('加载详情失败')
    }
  }

  const handleQuickFilter = (type) => {
    setQuickFilter(type)
    setDateRange(null)
  }

  const handleRangePickerChange = (dates) => {
    setDateRange(dates)
    if (dates) setQuickFilter('')
  }

  const priorityColors = {
    low: 'default',
    normal: 'blue',
    high: 'gold',
    urgent: 'volcano'
  }

  const priorityLabels = {
    low: '低',
    normal: '普通',
    high: '高',
    urgent: '紧急'
  }

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <span className="font-medium">{text}</span>
    },
    {
      title: '发送对象',
      key: 'target',
      render: (_, record) => {
        if (record.target_user_name) {
          return <Tag icon={<UserOutlined />}>{record.target_user_name}</Tag>
        }
        return <Tag icon={<TeamOutlined />} color="blue">{record.department_name}</Tag>
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (p) => <Tag color={priorityColors[p]}>{priorityLabels[p]}</Tag>
    },
    {
      title: '阅读情况',
      key: 'stats',
      render: (_, record) => (
        <Tooltip title={`已读: ${record.read_count} / 总数: ${record.total_recipients}`}>
          <Tag color={record.read_count === record.total_recipients ? 'success' : 'processing'}>
            {record.read_count} / {record.total_recipients}
          </Tag>
        </Tooltip>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewRecipients(record)}>
          详情
        </Button>
      )
    }
  ]

  const recipientsColumns = [
    { title: '姓名', dataIndex: 'real_name', key: 'name' },
    { title: '部门', dataIndex: 'department_name', key: 'dept' },
    {
      title: '状态',
      key: 'status',
      render: (_, r) => r.is_read ? <Tag icon={<CheckCircleOutlined />} color="success">已读</Tag> : <Tag icon={<ExclamationCircleOutlined />} color="warning">未读</Tag>
    },
    {
      title: '阅读时间',
      dataIndex: 'read_at',
      key: 'read_at',
      render: (t) => t ? new Date(t).toLocaleString('zh-CN') : '-'
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-4 bg-white p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4 relative z-10">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {[
              { id: '', label: '全部' },
              { id: 'today', label: '今天' },
              { id: 'yesterday', label: '昨天' },
              { id: 'last3days', label: '近三天' },
              { id: 'last7days', label: '近七天' },
            ].map((item) => (
              <Button
                key={item.id}
                type={quickFilter === item.id ? 'primary' : 'text'}
                size="small"
                onClick={() => handleQuickFilter(item.id)}
                className={`!rounded-md ${quickFilter !== item.id ? 'text-gray-500 hover:text-gray-700' : ''}`}
                style={{ fontSize: '12px', height: '28px' }}
              >
                {item.label}
              </Button>
            ))}
          </div>

          <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

          <RangePicker
            value={dateRange}
            onChange={handleRangePickerChange}
            placeholder={['开始日期', '结束日期']}
            className="w-64"
          />
      </div>

      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>员工备忘录管理</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            form.resetFields()
            setCreateModalVisible(true)
            // Pre-fill department
            if (userDepartmentId) {
                form.setFieldsValue({ targetDepartmentId: userDepartmentId, sendMode: 'department' })
            }
          }}>
            发送备忘录
          </Button>
        }
        bordered={false}
      >
        <Table
          columns={columns}
          dataSource={memos}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal
        title="发送备忘录"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} initialValues={{ priority: 'normal', sendMode: 'department' }}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="备忘录标题" />
          </Form.Item>

          <Form.Item name="priority" label="优先级">
             <Select>
               <Option value="low">低</Option>
               <Option value="normal">普通</Option>
               <Option value="high">高</Option>
               <Option value="urgent">紧急</Option>
             </Select>
          </Form.Item>

          <Form.Item name="sendMode" label="发送模式">
            <Radio.Group>
              <Radio.Button value="department">整个部门</Radio.Button>
              <Radio.Button value="individual">指定员工</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.sendMode !== curr.sendMode}
          >
            {({ getFieldValue }) => {
                const mode = getFieldValue('sendMode');
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="targetDepartmentId" label="目标部门" rules={[{ required: true, message: '请选择部门' }]}>
                            <Select placeholder="选择部门">
                                {departments.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
                            </Select>
                        </Form.Item>
                        {mode === 'individual' && (
                            <Form.Item name="targetUserId" label="目标员工" rules={[{ required: true, message: '请选择员工' }]}>
                                <Select placeholder="选择员工" showSearch optionFilterProp="children">
                                    {employees.map(e => <Option key={e.user_id} value={e.user_id}>{e.real_name} ({e.username})</Option>)}
                                </Select>
                            </Form.Item>
                        )}
                    </div>
                )
            }}
          </Form.Item>

          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <TextArea rows={4} placeholder="支持 Markdown 格式" />
          </Form.Item>

          <Form.Item className="flex justify-end mb-0">
             <Space>
               <Button onClick={() => setCreateModalVisible(false)}>取消</Button>
               <Button type="primary" htmlType="submit" loading={submitting}>发送</Button>
             </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
         title={currentMemo?.title}
         open={recipientsModalVisible}
         onCancel={() => setRecipientsModalVisible(false)}
         footer={[<Button key="close" onClick={() => setRecipientsModalVisible(false)}>关闭</Button>]}
         width={700}
      >
          {currentMemo && (
              <div className="mb-6 bg-gray-50 p-4 rounded-md">
                 <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-sm prose prose-sm max-w-none">
                    {currentMemo.content}
                 </ReactMarkdown>
              </div>
          )}
          <Table
            columns={recipientsColumns}
            dataSource={recipients}
            rowKey="user_id"
            pagination={{ pageSize: 5 }}
            size="small"
          />
      </Modal>
    </div>
  )
}

export default EmployeeMemos
