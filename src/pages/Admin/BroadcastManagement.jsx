import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { getApiUrl } from '../../utils/apiConfig'
import { Table, Button, Modal, Form, Input, Select, Tag, message, Card, Space, Tooltip, DatePicker } from 'antd'
import {
  SoundOutlined,
  PlusOutlined,
  UserOutlined,
  TeamOutlined,
  ApartmentOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  NotificationOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs' // Antd v5 uses dayjs
import { formatDate, getBeijingDate } from '../../utils/date'
import './BroadcastManagement.css'

const { Option } = Select
const { TextArea } = Input
const { RangePicker } = DatePicker

import Breadcrumb from '../../components/Breadcrumb'

const BroadcastManagement = () => {
  const [broadcasts, setBroadcasts] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  // 筛选状态
  const [quickFilter, setQuickFilter] = useState('') // 'today', 'yesterday', ...
  const [dateRange, setDateRange] = useState(null) // Antd RangePicker value (dayjs array)
  // 实际查询参数
  const [queryParams, setQueryParams] = useState({
    startDate: undefined,
    endDate: undefined
  })

  // 保存已选联系人到localStorage
  const [savedRecipients, setSavedRecipients] = useState([])

  const token = localStorage.getItem('token')

  useEffect(() => {
    loadBroadcasts()
    loadDepartments()
    loadEmployees()
  }, [queryParams]) // Reload when queryParams change

  const loadBroadcasts = async () => {
    setLoading(true)
    try {
      const params = {}
      if (queryParams.startDate) params.startDate = queryParams.startDate
      if (queryParams.endDate) params.endDate = queryParams.endDate

      console.log('Loading broadcasts with params:', params) // Debug log

      const response = await axios.get(getApiUrl('/api/broadcasts/created'), {
        headers: { 'Authorization': `Bearer ${token}` },
        params
      })
      if (response.data.success) {
        setBroadcasts(response.data.data)
      }
    } catch (error) {
      console.error('加载广播列表失败:', error)
      message.error('加载广播列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 快速筛选处理
  const handleQuickFilter = (type) => {
    console.log('Quick filter clicked:', type) // Debug log
    setQuickFilter(type)
    setDateRange(null) // Clear manual picker

    if (!type) { // 全部
      setQueryParams({ startDate: undefined, endDate: undefined })
      return
    }

    // Helper from utils/date
    const getFormattedDate = (date) => formatDate(date, false);
    let startStr, endStr;

    if (type === 'today') {
      const d = getBeijingDate();
      const dateStr = getFormattedDate(d);
      startStr = `${dateStr} 00:00:00`;
      endStr = `${dateStr} 23:59:59`;
    } else if (type === 'yesterday') {
      const d = getBeijingDate();
      d.setDate(d.getDate() - 1);
      const dateStr = getFormattedDate(d);
      startStr = `${dateStr} 00:00:00`;
      endStr = `${dateStr} 23:59:59`;
    } else if (type === 'last3days') {
      const start = getBeijingDate();
      start.setDate(start.getDate() - 2);
      const end = getBeijingDate();
      startStr = `${getFormattedDate(start)} 00:00:00`;
      endStr = `${getFormattedDate(end)} 23:59:59`;
    } else if (type === 'last7days') {
      const start = getBeijingDate();
      start.setDate(start.getDate() - 6);
      const end = getBeijingDate();
      startStr = `${getFormattedDate(start)} 00:00:00`;
      endStr = `${getFormattedDate(end)} 23:59:59`;
    }

    console.log('Setting query params:', { startDate: startStr, endDate: endStr }) // Debug log
    setQueryParams({ startDate: startStr, endDate: endStr })
  }

  // 日期选择器处理
  const handleRangePickerChange = (dates) => {
    console.log('Range picker changed:', dates) // Debug log
    setDateRange(dates)
    setQuickFilter('') // Clear quick filter button state

    if (dates && dates.length === 2) {
      const startStr = dates[0].format('YYYY-MM-DD 00:00:00')
      const endStr = dates[1].format('YYYY-MM-DD 23:59:59')
      console.log('Setting query params from picker:', { startDate: startStr, endDate: endStr }) // Debug log
      setQueryParams({ startDate: startStr, endDate: endStr })
    } else {
      setQueryParams({ startDate: undefined, endDate: undefined })
    }
  }

  // ... (rest of loads)

  // ... (handleSubmit)

  // ... (options definition)

  // ... (columns definition)



  const loadDepartments = async () => {
    try {
      const response = await axios.get(getApiUrl('/api/departments'), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (Array.isArray(response.data)) {
        setDepartments(response.data)
      }
    } catch (error) {
      console.error('加载部门失败:', error)
    }
  }

  const loadEmployees = async () => {
    try {
      const response = await axios.get(getApiUrl('/api/employees'), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (Array.isArray(response.data)) {
        setEmployees(response.data)
      }
    } catch (error) {
      console.error('加载员工失败:', error)
    }
  }

  const handleSubmit = async (values) => {
    setSubmitting(true)
    try {
      const payload = {
        ...values,
        targetDepartments: values.targetType === 'department' ? JSON.stringify(values.targetDepartments) : null,
        targetRoles: values.targetType === 'role' ? JSON.stringify(values.targetRoles) : null,
        targetUsers: values.targetType === 'individual' ? JSON.stringify(values.targetUsers) : null
      }

      const response = await axios.post(getApiUrl('/api/broadcasts'), payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.data.success) {
        message.success(`广播发送成功！已发送给 ${response.data.data.recipientCount} 人`)
        setModalVisible(false)
        form.resetFields()
        loadBroadcasts()
      }
    } catch (error) {
      console.error('发送广播失败:', error)
      message.error(error.response?.data?.message || '发送失败')
    } finally {
      setSubmitting(false)
    }
  }

  const typeOptions = [
    { value: 'info', label: '信息', icon: <InfoCircleOutlined style={{ color: '#1890ff' }} /> },
    { value: 'warning', label: '警告', icon: <WarningOutlined style={{ color: '#faad14' }} /> },
    { value: 'success', label: '成功', icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> },
    { value: 'error', label: '错误', icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> },
    { value: 'announcement', label: '公告', icon: <NotificationOutlined style={{ color: '#722ed1' }} /> }
  ]

  const priorityOptions = [
    { value: 'low', label: '低', color: 'default' },
    { value: 'normal', label: '普通', color: 'blue' },
    { value: 'high', label: '高', color: 'orange' },
    { value: 'urgent', label: '紧急', color: 'red' }
  ]

  const targetTypeOptions = [
    { value: 'all', label: '全体员工', icon: <TeamOutlined /> },
    { value: 'department', label: '指定部门', icon: <ApartmentOutlined /> },
    { value: 'role', label: '指定角色', icon: <UserOutlined /> },
    { value: 'individual', label: '指定个人', icon: <UserOutlined /> }
  ]

  const roleOptions = ['超级管理员', '部门管理员', '普通员工']

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space>
          {typeOptions.find(t => t.value === record.type)?.icon}
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const option = typeOptions.find(t => t.value === type)
        return <Tag>{option?.label || type}</Tag>
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const option = priorityOptions.find(p => p.value === priority)
        return <Tag color={option?.color}>{option?.label || priority}</Tag>
      }
    },
    {
      title: '目标',
      dataIndex: 'target_type',
      key: 'target_type',
      render: (type) => targetTypeOptions.find(t => t.value === type)?.label || type
    },
    {
      title: '接收/已读',
      key: 'stats',
      render: (_, record) => (
        <Tooltip title={`接收: ${record.recipient_count} / 已读: ${record.read_count}`}>
          <Tag color="blue">{record.read_count} / {record.recipient_count}</Tag>
        </Tooltip>
      )
    },
    {
      title: '发送时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString('zh-CN')
    }
  ]

  return (
    <div className="p-6">
      <div className="mb-4">
      </div>

      <div className="mb-4 bg-white p-4 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
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
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            发送广播
          </Button>
        }
        bordered={false}
      >
        <Table
          columns={columns}
          dataSource={broadcasts}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条`,
            showSizeChanger: true,
            showQuickJumper: true,
            position: ['bottomRight']
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <SoundOutlined />
            <span>发送系统广播</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: 'info',
            priority: 'normal',
            targetType: 'all'
          }}
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入广播标题' }]}
          >
            <Input placeholder="请输入广播标题" maxLength={50} showCount />
          </Form.Item>

          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入广播内容' }]}
          >
            <TextArea placeholder="请输入广播内容" rows={4} maxLength={500} showCount />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="type" label="类型">
              <Select>
                {typeOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    <Space>
                      {option.icon}
                      {option.label}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="priority" label="优先级">
              <Select>
                {priorityOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    <Tag color={option.color}>{option.label}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="targetType" label="发送目标">
            <Select onChange={() => {
              // Reset dependent fields when target type changes
              form.setFieldsValue({
                targetDepartments: [],
                targetRoles: [],
                targetUsers: []
              })
            }}>
              {targetTypeOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <Space>
                    {option.icon}
                    {option.label}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.targetType !== currentValues.targetType}
          >
            {({ getFieldValue }) => {
              const targetType = getFieldValue('targetType')

              if (targetType === 'department') {
                return (
                  <Form.Item
                    name="targetDepartments"
                    label="选择部门"
                    rules={[{ required: true, message: '请选择部门' }]}
                  >
                    <Select mode="multiple" placeholder="请选择部门" optionFilterProp="children">
                      {departments.map(dept => (
                        <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                )
              }

              if (targetType === 'role') {
                return (
                  <Form.Item
                    name="targetRoles"
                    label="选择角色"
                    rules={[{ required: true, message: '请选择角色' }]}
                  >
                    <Select mode="multiple" placeholder="请选择角色">
                      {roleOptions.map(role => (
                        <Option key={role} value={role}>{role}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                )
              }

              if (targetType === 'individual') {
                return (
                  <Form.Item
                    name="targetUsers"
                    label="选择员工"
                    rules={[{ required: true, message: '请选择员工' }]}
                  >
                    <Select
                      mode="multiple"
                      placeholder="请选择员工"
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      {employees.map(emp => (
                        <Option key={emp.user_id} value={emp.user_id}>
                          {emp.real_name} ({emp.username})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                )
              }

              return null
            }}
          </Form.Item>

          <Form.Item className="flex justify-end mb-0">
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                发送广播
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default BroadcastManagement
