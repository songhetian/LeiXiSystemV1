// [SHADCN-REPLACED]
import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { getApiUrl } from '../../utils/apiConfig'
import { toast } from 'react-toastify'

// 导入 shadcn UI 组件
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs"
import { Avatar, AvatarFallback } from "../../components/ui/avatar"
import { ScrollArea } from "../../components/ui/scroll-area"
import { Label } from "../../components/ui/label"
import { Switch } from "../../components/ui/switch"
import { Separator } from "../../components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip"
const BroadcastManagement = () => {
  const [broadcasts, setBroadcasts] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info',
    priority: 'normal',
    targetType: 'all',
    targetDepartments: [],
    targetRoles: [],
    targetUsers: []
  })
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
      toast.error('加载广播列表失败')
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

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        priority: formData.priority,
        targetType: formData.targetType,
        targetDepartments: formData.targetType === 'department' ? JSON.stringify(formData.targetDepartments) : null,
        targetRoles: formData.targetType === 'role' ? JSON.stringify(formData.targetRoles) : null,
        targetUsers: formData.targetType === 'individual' ? JSON.stringify(formData.targetUsers) : null
      }

      const response = await axios.post(getApiUrl('/api/broadcasts'), payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.data.success) {
        toast.success(`广播发送成功！已发送给 ${response.data.data.recipientCount} 人`)
        setModalVisible(false)
        setFormData({
          title: '',
          content: '',
          type: 'info',
          priority: 'normal',
          targetType: 'all',
          targetDepartments: [],
          targetRoles: [],
          targetUsers: []
        })
        loadBroadcasts()
      }
    } catch (error) {
      console.error('发送广播失败:', error)
      toast.error(error.response?.data?.message || '发送失败')
    } finally {
      setSubmitting(false)
    }
  }
  // 处理发送广播（广播模式）
  const handleSendBroadcast = async () => {
    if (!broadcastContent.trim() || selectedRecipients.length === 0) {
      toast.error('请填写广播内容并选择接收人')
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
        toast.success(`广播发送成功！已发送给 ${response.data.data.recipientCount} 人`)
        // 重置表单
        setBroadcastTitle('')
        setBroadcastContent('')
        setSelectedRecipients([])
        loadBroadcasts()
      }
    } catch (error) {
      console.error('发送广播失败:', error)
      toast.error(error.response?.data?.message || '发送失败')
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
    { value: 'info', label: '信息', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="#1890ff">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg> },
    { value: 'warning', label: '警告', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="#faad14">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg> },
    { value: 'success', label: '成功', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="#52c41a">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg> },
    { value: 'error', label: '错误', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="#ff4d4f">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg> },
    { value: 'announcement', label: '公告', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="#722ed1">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
      </svg> }
  ]

  const priorityOptions = [
    { value: 'low', label: '低', color: 'secondary' },
    { value: 'normal', label: '普通', color: 'default' },
    { value: 'high', label: '高', color: 'warning' },
    { value: 'urgent', label: '紧急', color: 'destructive' }
  ]

  const targetTypeOptions = [
    { value: 'all', label: '全体员工', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
      </svg> },
    { value: 'department', label: '指定部门', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
      </svg> },
    { value: 'role', label: '指定角色', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg> },
    { value: 'individual', label: '指定个人', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg> }
  ]

  const roleOptions = ['超级管理员', '部门管理员', '普通员工']
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div className="flex items-center gap-2">
          {typeOptions.find(t => t.value === record.type)?.icon}
          <span style={{ fontWeight: 500 }}>{text}</span>
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const option = typeOptions.find(t => t.value === type)
        return <Badge variant="secondary">{option?.label || type}</Badge>
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const option = priorityOptions.find(p => p.value === priority)
        return <Badge variant={option?.color}>{option?.label || priority}</Badge>
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary">{record.read_count} / {record.recipient_count}</Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>接收: {record.recipient_count} / 已读: {record.read_count}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">系统广播管理</CardTitle>
          <Button onClick={() => setModalVisible(true)}>
            发送广播
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="management">广播管理</TabsTrigger>
              <TabsTrigger value="broadcast">发送广播</TabsTrigger>
            </TabsList>
            <TabsContent value="management">
              {/* 广播管理表格将在这里实现 */}
              <div className="text-center py-8 text-muted-foreground">
                广播管理功能待实现
              </div>
            </TabsContent>

            <TabsContent value="broadcast">
              <div className="flex gap-5 h-[70vh]">
                {/* 左侧联系人列表 */}
                <div className="w-80 border rounded-lg flex flex-col">
                  {/* 搜索区域 */}
                  <div className="p-3 border-b">
                    {/* 类型选择按钮 */}
                    <div className="flex gap-2 mb-3">
                      <Button
                        variant={searchType === 'department' ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setSearchType('department')}
                      >
                        部门
                      </Button>
                      <Button
                        variant={searchType === 'individual' ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setSearchType('individual')}
                      >
                        个人
                      </Button>
                      <Button
                        variant={searchType === 'all' ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setSearchType('all')}
                      >
                        全体
                      </Button>
                    </div>

                    {/* 搜索框 */}
                    <div style={{ marginBottom: '12px' }}>
                      <Input
                        type="text"
                        placeholder={`搜索${searchType === 'department' ? '部门' : searchType === 'individual' ? '个人' : '全体'}...`}
                        value={searchContact}
                        onChange={(e) => setSearchContact(e.target.value)}
                      />

                      {/* 部门搜索框 - 仅在搜索个人时显示 */}
                      {searchType === 'individual' && (
                        <Input
                          type="text"
                          placeholder="按部门筛选..."
                          value={searchDepartment}
                          onChange={(e) => setSearchDepartment(e.target.value)}
                          className="mt-2"
                        />
                      )}
                    </div>
                  </div>
                </div>
                {/* 常用联系人 */}                {savedRecipients.length > 0 && (
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-2.21-.895-4.21-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 12a5.983 5.983 0 01-.757 2.829 1 1 0 11-1.415-1.414A3.987 3.987 0 0013 12a3.987 3.987 0 00-.172-1.415 1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              发送系统广播
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                placeholder="请输入广播标题"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">内容</Label>
              <Textarea
                id="content"
                placeholder="请输入广播内容"
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                rows={4}
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">类型</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({...formData, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          {option.icon}
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">优先级</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({...formData, priority: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择优先级" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <Badge variant={option.color}>{option.label}</Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetType">发送目标</Label>
              <Select
                value={formData.targetType}
                onValueChange={(value) => {
                  // Reset dependent fields when target type changes
                  setFormData({
                    ...formData,
                    targetType: value,
                    targetDepartments: [],
                    targetRoles: [],
                    targetUsers: []
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择发送目标" />
                </SelectTrigger>
                <SelectContent>
                  {targetTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.targetType === 'department' && (
              <div className="space-y-2">
                <Label htmlFor="targetDepartments">选择部门</Label>
                <Select
                  value={formData.targetDepartments}
                  onValueChange={(value) => setFormData({...formData, targetDepartments: [...formData.targetDepartments, value]})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择部门" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.targetType === 'role' && (
              <div className="space-y-2">
                <Label htmlFor="targetRoles">选择角色</Label>
                <Select
                  value={formData.targetRoles}
                  onValueChange={(value) => setFormData({...formData, targetRoles: [...formData.targetRoles, value]})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.targetType === 'individual' && (
              <div className="space-y-2">
                <Label htmlFor="targetUsers">选择员工</Label>
                <Select
                  value={formData.targetUsers}
                  onValueChange={(value) => setFormData({...formData, targetUsers: [...formData.targetUsers, value]})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择员工" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.user_id} value={emp.user_id}>
                        {emp.real_name} ({emp.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalVisible(false)}>取消</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? '发送中...' : '发送广播'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BroadcastManagement
