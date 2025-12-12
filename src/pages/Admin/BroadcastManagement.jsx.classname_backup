import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { getApiUrl } from '../../utils/apiConfig'
import { Table, Button, Modal, Form, Input, Select, Tag, message, Card, Space, Tooltip, Tabs } from 'antd'
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
  NotificationOutlined
} from '@ant-design/icons'
import './BroadcastManagement.css'

const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs

const BroadcastManagement = () => {
  const [broadcasts, setBroadcasts] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  // 新增状态用于广播模式
  const [activeTab, setActiveTab] = useState('management') // 'management' 管理模式, 'broadcast' 广播模式
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastContent, setBroadcastContent] = useState('')
  const [selectedRecipients, setSelectedRecipients] = useState([])
  const [searchContact, setSearchContact] = useState('')
  const [searchType, setSearchType] = useState('') // 搜索类型：部门/个人/全体
  const [searchDepartment, setSearchDepartment] = useState('') // 部门搜索
  const [viewableDepartments, setViewableDepartments] = useState([])
  const [viewableEmployees, setViewableEmployees] = useState([])
  const [savedRecipients, setSavedRecipients] = useState(() => {
    const saved = localStorage.getItem('broadcastRecipients');
    return saved ? JSON.parse(saved) : [];
  })
  const [contacts, setContacts] = useState([])

  const token = localStorage.getItem('token')

  // 保存已选联系人到localStorage
  useEffect(() => {
    localStorage.setItem('broadcastRecipients', JSON.stringify(savedRecipients));
  }, [savedRecipients])

  useEffect(() => {
    loadBroadcasts()
    loadDepartments()
    loadEmployees()
    loadViewableData()
  }, [])

  // 加载用户可见的数据
  const loadViewableData = async () => {
    try {
      // 这里应该从JWT中获取用户可见的部门和员工数据
      // 简化实现，直接使用所有部门和员工数据
      const deptResponse = await axios.get(getApiUrl('/api/departments'), {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const empResponse = await axios.get(getApiUrl('/api/employees'), {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (Array.isArray(deptResponse.data)) {
        setViewableDepartments(deptResponse.data)
      }

      if (Array.isArray(empResponse.data)) {
        setViewableEmployees(empResponse.data)
        // 构建联系人数据
        buildContacts(deptResponse.data, empResponse.data)
      }
    } catch (error) {
      console.error('加载可见数据失败:', error)
    }
  }

  // 构建联系人数据
  const buildContacts = (depts, emps) => {
    const contactList = []

    // 添加部门
    depts.forEach(dept => {
      // 获取该部门的员工数量
      const deptEmployees = emps.filter(emp => emp.department_id === dept.id)
      contactList.push({
        id: dept.id,
        name: dept.name,
        type: 'department',
        avatar: dept.name.substring(0, 1),
        members: deptEmployees.length,
        employees: deptEmployees
      })
    })

    // 添加个人
    emps.forEach(emp => {
      const dept = depts.find(d => d.id === emp.department_id)
      contactList.push({
        id: emp.id,
        name: emp.real_name,
        type: 'individual',
        avatar: emp.real_name.substring(0, 1),
        department: dept ? dept.name : ''
      })
    })

    // 添加全体成员
    const totalMembers = emps.length
    if (totalMembers > 0) {
      contactList.push({
        id: 999,
        name: '全体成员',
        type: 'all',
        avatar: '全',
        members: totalMembers,
        departments: depts.map(d => d.name)
      })
    }

    setContacts(contactList)
  }

  // 根据搜索类型和关键词过滤联系人
  const filteredContacts = useMemo(() => {
    if (!searchType) return []

    let result = contacts.filter(contact => contact.type === searchType)

    // 如果有搜索关键词，进行过滤
    if (searchContact.trim()) {
      result = result.filter(contact =>
        contact.name.toLowerCase().includes(searchContact.toLowerCase())
      )
    }

    // 如果是个人搜索，并且有部门筛选
    if (searchType === 'individual' && searchDepartment.trim()) {
      result = result.filter(contact =>
        contact.department.toLowerCase().includes(searchDepartment.toLowerCase())
      )
    }

    return result
  }, [contacts, searchContact, searchType, searchDepartment])

  const loadBroadcasts = async () => {
    setLoading(true)
    try {
      const response = await axios.get(getApiUrl('/api/broadcasts/created'), {
        headers: { 'Authorization': `Bearer ${token}` }
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

  // 处理发送广播（广播模式）
  const handleSendBroadcast = async () => {
    if (!broadcastContent.trim() || selectedRecipients.length === 0) {
      message.error('请填写广播内容并选择接收人')
      return
    }

    try {
      setSubmitting(true)

      // 构造发送数据
      let targetType = ''
      let targetData = null

      if (selectedRecipients.some(r => r.type === 'all')) {
        targetType = 'all'
      } else if (selectedRecipients.some(r => r.type === 'department')) {
        targetType = 'department'
        targetData = selectedRecipients.filter(r => r.type === 'department').map(r => r.id)
      } else {
        targetType = 'individual'
        targetData = selectedRecipients.filter(r => r.type === 'individual').map(r => r.id)
      }

      const payload = {
        title: broadcastTitle || '广播消息',
        content: broadcastContent,
        type: 'info',
        priority: 'normal',
        targetType: targetType,
        [`target${targetType.charAt(0).toUpperCase() + targetType.slice(1)}s`]: JSON.stringify(targetData)
      }

      const response = await axios.post(getApiUrl('/api/broadcasts'), payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.data.success) {
        message.success(`广播发送成功！已发送给 ${response.data.data.recipientCount} 人`)
        // 重置表单
        setBroadcastTitle('')
        setBroadcastContent('')
        setSelectedRecipients([])
        loadBroadcasts()
      }
    } catch (error) {
      console.error('发送广播失败:', error)
      message.error(error.response?.data?.message || '发送失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 切换联系人选择
  const toggleRecipient = (contact) => {
    setSelectedRecipients(prev => {
      const isSelected = prev.some(r => r.id === contact.id)
      if (isSelected) {
        return prev.filter(r => r.id !== contact.id)
      } else {
        return [...prev, contact]
      }
    })
  }

  // 添加到已保存联系人
  const addToSavedRecipients = (contact) => {
    setSavedRecipients(prev => {
      const isAlreadySaved = prev.some(r => r.id === contact.id)
      if (!isAlreadySaved) {
        return [...prev, contact]
      }
      return prev
    })
  }

  // 从已保存联系人中移除
  const removeFromSavedRecipients = (contactId) => {
    setSavedRecipients(prev => prev.filter(r => r.id !== contactId))
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
      <Card
        title={
          <Space>
            <SoundOutlined />
            <span>系统广播管理</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            发送广播
          </Button>
        }
        bordered={false}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="广播管理" key="management">
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
          </TabPane>

          <TabPane tab="发送广播" key="broadcast">
            <div style={{ display: 'flex', gap: '20px', height: '70vh' }}>
              {/* 左侧联系人列表 */}
              <div style={{
                width: '300px',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* 搜索区域 */}
                <div style={{ padding: '12px', borderBottom: '1px solid #d9d9d9' }}>
                  {/* 类型选择按钮 */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button
                      onClick={() => setSearchType('department')}
                      style={{
                        flex: 1,
                        padding: '8px 4px',
                        backgroundColor: searchType === 'department' ? '#07c160' : '#f0f0f0',
                        color: searchType === 'department' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '6px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onMouseOver={(e) => e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'}
                      onMouseOut={(e) => e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}
                    >
                      部门
                    </button>
                    <button
                      onClick={() => setSearchType('individual')}
                      style={{
                        flex: 1,
                        padding: '8px 4px',
                        backgroundColor: searchType === 'individual' ? '#07c160' : '#f0f0f0',
                        color: searchType === 'individual' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '6px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onMouseOver={(e) => e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'}
                      onMouseOut={(e) => e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}
                    >
                      个人
                    </button>
                    <button
                      onClick={() => setSearchType('all')}
                      style={{
                        flex: 1,
                        padding: '8px 4px',
                        backgroundColor: searchType === 'all' ? '#07c160' : '#f0f0f0',
                        color: searchType === 'all' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '6px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onMouseOver={(e) => e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'}
                      onMouseOut={(e) => e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}
                    >
                      全体
                    </button>
                  </div>

                  {/* 搜索框 */}
                  <div style={{ marginBottom: '12px' }}>
                    <input
                      type="text"
                      placeholder={`搜索${searchType === 'department' ? '部门' : searchType === 'individual' ? '个人' : '全体'}...`}
                      value={searchContact}
                      onChange={(e) => setSearchContact(e.target.value)}
                      className="form-group"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />

                    {/* 部门搜索框 - 仅在搜索个人时显示 */}
                    {searchType === 'individual' && (
                      <input
                        type="text"
                        placeholder="按部门筛选..."
                        value={searchDepartment}
                        onChange={(e) => setSearchDepartment(e.target.value)}
                        className="form-group"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d9d9d9',
                          borderRadius: '6px',
                          fontSize: '14px',
                          marginTop: '8px'
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* 常用联系人 */}
                {savedRecipients.length > 0 && (
                  <div style={{ padding: '0 12px 12px 12px', borderBottom: '1px solid #d9d9d9' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>常用联系人</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {savedRecipients.map(recipient => (
                        <div
                          key={`saved-${recipient.id}`}
                          onClick={() => toggleRecipient(recipient)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: selectedRecipients.some(r => r.id === recipient.id) ? '#07c160' : '#f0f0f0',
                            color: selectedRecipients.some(r => r.id === recipient.id) ? 'white' : '#333',
                            borderRadius: '16px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        >
                          {recipient.name}
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromSavedRecipients(recipient.id);
                            }}
                            style={{
                              cursor: 'pointer',
                              color: selectedRecipients.some(r => r.id === recipient.id) ? 'white' : '#ff4d4f'
                            }}
                          >
                            ×
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 联系人列表 */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '12px'
                }}>
                  {searchType ? (
                    filteredContacts.length > 0 ? (
                      filteredContacts.map((contact) => (
                        <div
                          key={contact.id}
                          onClick={() => toggleRecipient(contact)}
                          onDoubleClick={() => addToSavedRecipients(contact)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px',
                            gap: '12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0',
                            backgroundColor: selectedRecipients.some(r => r.id === contact.id) ? '#e5e5e5' : 'transparent'
                          }}
                        >
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '6px',
                            backgroundColor: '#d9d9d9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: '500',
                            color: '#fff'
                          }}>
                            {contact.avatar}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '15px',
                              fontWeight: '500',
                              color: '#000',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {contact.name}
                            </div>
                            <div style={{
                              fontSize: '13px',
                              color: '#999',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {contact.type === 'department'
                                ? `${contact.members}名成员`
                                : contact.type === 'individual'
                                  ? contact.department
                                  : `${contact.members}名成员`}
                            </div>
                          </div>
                          <div style={{
                            padding: '4px 8px',
                            backgroundColor: selectedRecipients.some(r => r.id === contact.id) ? '#07c160' : '#f0f0f0',
                            color: selectedRecipients.some(r => r.id === contact.id) ? 'white' : '#333',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                          }}>
                            {selectedRecipients.some(r => r.id === contact.id) ? '已选' : '选择'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                        无匹配的{searchType === 'department' ? '部门' : searchType === 'individual' ? '个人' : '全体'}信息
                      </div>
                    )
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                      请选择搜索类型
                    </div>
                  )}
                </div>
              </div>

              {/* 右侧广播发送区域 */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #d9d9d9',
                borderRadius: '6px'
              }}>
                {/* 已选联系人 */}
                <div style={{
                  padding: '12px',
                  borderBottom: '1px solid #d9d9d9',
                  maxHeight: '100px',
                  overflowY: 'auto'
                }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {selectedRecipients.map(recipient => (
                      <div
                        key={recipient.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          backgroundColor: '#e0e0e0',
                          padding: '4px 12px',
                          borderRadius: '16px',
                          fontSize: '12px'
                        }}
                      >
                        {recipient.name}
                        <span
                          onClick={() => toggleRecipient(recipient)}
                          style={{
                            marginLeft: '6px',
                            cursor: 'pointer',
                            color: '#ff4d4f'
                          }}
                        >
                          ×
                        </span>
                      </div>
                    ))}
                  </div>
                  {selectedRecipients.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>
                      发送给: {selectedRecipients.map(r => r.name).join(', ')}
                    </div>
                  )}
                </div>

                {/* 广播内容输入 */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px' }}>
                    <Input
                      placeholder="请输入广播标题"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      style={{ marginBottom: '12px' }}
                    />
                    <TextArea
                      placeholder="请输入广播内容..."
                      value={broadcastContent}
                      onChange={(e) => setBroadcastContent(e.target.value)}
                      rows={6}
                      style={{ marginBottom: '12px' }}
                    />
                  </div>

                  {/* 发送按钮 */}
                  <div style={{
                    padding: '12px',
                    borderTop: '1px solid #d9d9d9',
                    display: 'flex',
                    justifyContent: 'flex-end'
                  }}>
                    <Button
                      type="primary"
                      onClick={handleSendBroadcast}
                      loading={submitting}
                      disabled={!broadcastContent.trim() || selectedRecipients.length === 0}
                    >
                      发送广播
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabPane>
        </Tabs>
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
