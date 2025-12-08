import React, { useState, useEffect } from 'react'
import { Card, Table, Select, Button, message, Tag, Space, Typography } from 'antd'
import { BellOutlined, SaveOutlined } from '@ant-design/icons'
import { getApiUrl } from '../utils/apiConfig'
import { apiGet, apiPut } from '../utils/apiClient'

const { Title, Text } = Typography
const { Option } = Select

const NotificationSettings = () => {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState([])
  const [roles, setRoles] = useState([])
  const [saving, setSaving] = useState(false)

  // 事件类型映射
  const eventTypeMap = {
    'leave_apply': '请假申请',
    'leave_approval': '请假审批通过',
    'leave_rejection': '请假审批拒绝',
    'exam_publish': '考试发布',
    'exam_result': '考试结果发布'
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [settingsRes, rolesRes] = await Promise.all([
        apiGet('/api/notification-settings'),
        apiGet('/api/notification-settings/roles')
      ])

      if (settingsRes.success) {
        setSettings(settingsRes.data)
      }
      if (rolesRes.success) {
        // 添加特殊角色 "申请人" 和 "考生"
        setRoles(['申请人', '考生', ...rolesRes.data])
      }
    } catch (error) {
      console.error('获取数据失败:', error)
      message.error('获取配置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (eventType, newRoles) => {
    const newSettings = [...settings]
    const index = newSettings.findIndex(s => s.event_type === eventType)

    if (index > -1) {
      newSettings[index].target_roles = newRoles
      setSettings(newSettings)
    } else {
      newSettings.push({
        event_type: eventType,
        target_roles: newRoles
      })
      setSettings(newSettings)
    }
  }

  const handleSave = async (record) => {
    setSaving(true)
    try {
      await apiPut(`/api/notification-settings/${record.event_type}`, {
        targetRoles: record.target_roles
      })
      message.success('保存成功')
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      title: '事件类型',
      dataIndex: 'event_type',
      key: 'event_type',
      render: (text) => (
        <Space>
          <BellOutlined style={{ color: '#1890ff' }} />
          <Text strong>{eventTypeMap[text] || text}</Text>
        </Space>
      )
    },
    {
      title: '接收通知角色',
      dataIndex: 'target_roles',
      key: 'target_roles',
      width: '50%',
      render: (targetRoles, record) => (
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="请选择接收角色"
          value={typeof targetRoles === 'string' ? JSON.parse(targetRoles) : targetRoles}
          onChange={(value) => handleRoleChange(record.event_type, value)}
        >
          {roles.map(role => (
            <Option key={role} value={role}>{role}</Option>
          ))}
        </Select>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => handleSave(record)}
          loading={saving}
        >
          保存
        </Button>
      )
    }
  ]

  // 确保所有定义的事件类型都显示，即使数据库中没有记录
  const displayData = Object.keys(eventTypeMap).map(type => {
    const existing = settings.find(s => s.event_type === type)
    return existing || { event_type: type, target_roles: [] }
  })

  return (
    <div className="p-6">
      <Card title={<Title level={4}>通知设置</Title>} bordered={false}>
        <div className="mb-4 text-gray-500">
          配置各类系统事件触发时，哪些角色的用户会收到通知弹窗。
        </div>
        <Table
          columns={columns}
          dataSource={displayData}
          rowKey="event_type"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  )
}

export default NotificationSettings
