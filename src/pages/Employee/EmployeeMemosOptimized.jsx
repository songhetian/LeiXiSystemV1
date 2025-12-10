import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion } from 'framer-motion'

// Shadcn UI Components
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Badge } from '../../components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table'
import { MotionCard } from '../../components/ui/motion-card'
import { MotionTable, MotionTableBody, MotionTableCell, MotionTableHead, MotionTableHeader, MotionTableRow } from '../../components/ui/motion-table'

// Icons
import { 
  Inbox,
  Send,
  Users,
  User,
  Circle,
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
  Filter,
  Eye,
  Plus,
  X
} from 'lucide-react'

import { getApiUrl } from '../../utils/apiConfig'
import { wsManager } from '../../services/websocket'

// 从JWT token中解码获取用户信息
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Token解码失败:', error)
    return null
  }
}

const EmployeeMemosOptimized = () => {
  const [memos, setMemos] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRecipientsModal, setShowRecipientsModal] = useState(false)
  const [currentMemo, setCurrentMemo] = useState(null)
  const [recipients, setRecipients] = useState([])

  // 部门和员工列表
  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])

  // 模态框状态
  const [modalConfig, setModalConfig] = useState({
    show: false,
    title: '',
    message: '',
    type: 'info' // info, success, error, confirm
  })

  // 表单数据
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    sendMode: 'department',
    targetDepartmentId: '',
    targetUserId: ''
  })

  // 分页
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  })

  const token = localStorage.getItem('token')

  // 处理WebSocket新备忘录事件
  const handleNewMemo = (memo) => {
    console.log('收到新备忘录:', memo)
    // 重新加载备忘录列表以显示新备忘录
    loadMemos()
  }

  // 组件挂载时添加WebSocket事件监听器
  useEffect(() => {
    // 注册事件监听器
    wsManager.on('memo', handleNewMemo)

    // 清理函数 - 组件卸载时移除监听器
    return () => {
      wsManager.off('memo', handleNewMemo)
    }
  }, [])

  // 从JWT token中获取用户信息
  const userInfo = useMemo(() => {
    if (!token) return null
    return decodeToken(token)
  }, [token])

  const userDepartmentId = userInfo?.department_id

  // 显示模态框
  const showModal = (title, message, type = 'info') => {
    setModalConfig({ show: true, title, message, type })
  }

  // 关闭模态框
  const closeModal = () => {
    setModalConfig({ show: false, title: '', message: '', type: 'info' })
  }

  useEffect(() => {
    loadMemos()
    loadDepartments()
  }, [pagination.page])

  useEffect(() => {
    if (formData.sendMode === 'individual' && formData.targetDepartmentId) {
      loadEmployees(formData.targetDepartmentId)
    }
  }, [formData.targetDepartmentId, formData.sendMode])

  const loadMemos = async () => {
    setLoading(true)
    try {
      const response = await axios.get(getApiUrl('/api/memos/department/created'), {
        params: {
          page: pagination.page,
          pageSize: pagination.pageSize
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.data.success) {
        setMemos(response.data.data)
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total
        }))
      }
    } catch (error) {
      console.error('加载备忘录失败:', error)
      console.error('错误详情:', error.response?.data)
      showModal('加载失败', error.response?.data?.message || '加载备忘录失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      console.log('开始加载部门列表...')
      const response = await axios.get(getApiUrl('/api/departments'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      console.log('部门API响应:', response.data)

      // API直接返回数组，不是 {success: true, data: []}
      if (Array.isArray(response.data)) {
        setDepartments(response.data)
        console.log('部门列表加载成功:', response.data)
      } else if (response.data.success && response.data.data) {
        setDepartments(response.data.data)
        console.log('部门列表加载成功:', response.data.data)
      } else {
        console.warn('部门数据格式异常:', response.data)
        setDepartments([])
      }
    } catch (error) {
      console.error('加载部门列表失败:', error)
      console.error('错误详情:', error.response?.data)
      setDepartments([])
    }
  }

  const loadEmployees = async (departmentId) => {
    if (!departmentId) {
      setEmployees([])
      return
    }

    try {
      const response = await axios.get(getApiUrl('/api/employees'), {
        params: { department_id: departmentId },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      // 检查响应数据结构
      if (Array.isArray(response.data)) {
        setEmployees(response.data)
      } else if (response.data.success) {
        setEmployees(response.data.data || [])
      } else {
        setEmployees([])
      }
    } catch (error) {
      console.error('加载员工列表失败:', error)
      console.error('错误详情:', error.response?.data)
      setEmployees([])
    }
  }

  const handleCreate = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      sendMode: 'department',
      targetDepartmentId: userDepartmentId || '',
      targetUserId: ''
    })
    setShowCreateModal(true)
  }

  const handleSend = async () => {
    if (!formData.title || !formData.content) {
      showModal('提示', '标题和内容不能为空', 'error')
      return
    }

    if (formData.sendMode === 'department' && !formData.targetDepartmentId) {
      showModal('提示', '请选择目标部门', 'error')
      return
    }

    if (formData.sendMode === 'individual' && !formData.targetUserId) {
      showModal('提示', '请选择目标员工', 'error')
      return
    }

    try {
      // 确保内容使用UTF-8编码并清理首尾空格
      const requestData = {
        ...formData,
        title: formData.title.trim(),
        content: formData.content.trim()
      };

      await axios.post(getApiUrl('/api/memos/department'), requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8'
        }
      })
      showModal('成功', '备忘录发送成功', 'success')
      setShowCreateModal(false)
      loadMemos()
    } catch (error) {
      console.error('发送失败:', error)
      showModal('发送失败', error.response?.data?.message || '发送失败', 'error')
    }
  }

  const handleViewRecipients = async (memo) => {
    try {
      const response = await axios.get(
        getApiUrl(`/api/memos/department/${memo.id}/recipients`),
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        setCurrentMemo(response.data.data.memo)
        setRecipients(response.data.data.recipients)
        setShowRecipientsModal(true)
      }
    } catch (error) {
      console.error('加载接收者列表失败:', error)
      showModal('加载失败', error.response?.data?.message || '加载失败', 'error')
    }
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    }
    return colors[priority] || colors.normal
  }

  const getPriorityText = (priority) => {
    const texts = {
      low: '低',
      normal: '普通',
      high: '高',
      urgent: '紧急'
    }
    return texts[priority] || '普通'
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">员工备忘录管理</h1>
            <p className="text-gray-600 mt-1">管理员工备忘录的创建和查看</p>
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            发送备忘录
          </Button>
        </div>
      </div>

      {/* 备忘录列表 */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      ) : memos.length === 0 ? (
        <MotionCard className="text-center py-12">
          <Inbox className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">暂无备忘录</h3>
          <p className="text-gray-500 mb-4">点击上方"发送备忘录"按钮创建第一条备忘录</p>
        </MotionCard>
      ) : (
        <>
          <MotionCard>
            <MotionTable>
              <MotionTableHeader>
                <MotionTableRow>
                  <MotionTableHead>标题</MotionTableHead>
                  <MotionTableHead>发送对象</MotionTableHead>
                  <MotionTableHead>优先级</MotionTableHead>
                  <MotionTableHead>阅读情况</MotionTableHead>
                  <MotionTableHead>创建时间</MotionTableHead>
                  <MotionTableHead>操作</MotionTableHead>
                </MotionTableRow>
              </MotionTableHeader>
              <MotionTableBody>
                {memos.map((memo, index) => (
                  <MotionTableRow 
                    key={memo.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <MotionTableCell>
                      <div className="font-medium text-gray-900">{memo.title}</div>
                    </MotionTableCell>
                    <MotionTableCell>
                      {memo.target_user_name ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">{memo.target_user_name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-500" />
                          <span className="text-sm">{memo.department_name}</span>
                        </div>
                      )}
                    </MotionTableCell>
                    <MotionTableCell>
                      <Badge className={getPriorityColor(memo.priority)}>
                        {getPriorityText(memo.priority)}
                      </Badge>
                    </MotionTableCell>
                    <MotionTableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 font-semibold">{memo.read_count}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">{memo.total_recipients}</span>
                        <span className="text-gray-400 text-sm">
                          ({memo.total_recipients > 0
                            ? Math.round((memo.read_count / memo.total_recipients) * 100)
                            : 0}%)
                        </span>
                      </div>
                    </MotionTableCell>
                    <MotionTableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{new Date(memo.created_at).toLocaleString()}</span>
                      </div>
                    </MotionTableCell>
                    <MotionTableCell>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewRecipients(memo)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        查看详情
                      </Button>
                    </MotionTableCell>
                  </MotionTableRow>
                ))}
              </MotionTableBody>
            </MotionTable>
          </MotionCard>

          {/* 分页 */}
          {pagination.total > pagination.pageSize && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                共 {pagination.total} 条记录
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  variant="outline"
                  size="sm"
                >
                  上一页
                </Button>
                <span className="text-sm text-gray-600">
                  第 {pagination.page} 页 / 共 {Math.ceil(pagination.total / pagination.pageSize)} 页
                </span>
                <Button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                  variant="outline"
                  size="sm"
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 创建备忘录模态框 */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              发送备忘录
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">标题 *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入标题"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">优先级</label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择优先级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低</SelectItem>
                  <SelectItem value="normal">普通</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="urgent">紧急</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">发送模式 *</label>
              <div className="flex gap-2">
                <Button
                  variant={formData.sendMode === 'department' ? 'default' : 'outline'}
                  onClick={() => setFormData({
                    ...formData,
                    sendMode: 'department',
                    targetUserId: ''
                  })}
                  className="flex-1"
                >
                  整个部门
                </Button>
                <Button
                  variant={formData.sendMode === 'individual' ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, sendMode: 'individual' })}
                  className="flex-1"
                >
                  指定员工
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">目标部门 *</label>
              <Select 
                value={formData.targetDepartmentId} 
                onValueChange={(value) => setFormData({
                  ...formData,
                  targetDepartmentId: value,
                  targetUserId: ''
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择部门" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">请选择部门</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {departments.length === 0 && (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  暂无可用部门
                </div>
              )}
            </div>

            {formData.sendMode === 'individual' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">目标员工 *</label>
                <Select
                  value={formData.targetUserId}
                  onValueChange={(value) => setFormData({ ...formData, targetUserId: value })}
                  disabled={!formData.targetDepartmentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!formData.targetDepartmentId ? '请先选择部门' : '请选择员工'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      {!formData.targetDepartmentId ? '请先选择部门' : '请选择员工'}
                    </SelectItem>
                    {employees.map(emp => (
                      <SelectItem key={emp.user_id} value={emp.user_id}>
                        {emp.real_name} ({emp.employee_no})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!formData.targetDepartmentId && (
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    请先选择目标部门
                  </div>
                )}
                {formData.targetDepartmentId && employees.length === 0 && (
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    该部门暂无可用员工
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">内容 *</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="请输入内容..."
                className="min-h-[200px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button onClick={handleSend}>
              发送
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 接收者列表模态框 */}
      <Dialog open={showRecipientsModal} onOpenChange={setShowRecipientsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentMemo?.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <h4 className="text-lg font-semibold mb-3">备忘录内容</h4>
              <MotionCard className="prose max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentMemo?.content}
                </ReactMarkdown>
              </MotionCard>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3">接收者列表 ({recipients.length}人)</h4>
              <div className="flex gap-4 mb-4">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  已读：{recipients.filter(r => r.is_read).length}人
                </div>
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                  未读：{recipients.filter(r => !r.is_read).length}人
                </div>
              </div>

              <MotionTable>
                <MotionTableHeader>
                  <MotionTableRow>
                    <MotionTableHead>姓名</MotionTableHead>
                    <MotionTableHead>部门</MotionTableHead>
                    <MotionTableHead>状态</MotionTableHead>
                    <MotionTableHead>阅读时间</MotionTableHead>
                  </MotionTableRow>
                </MotionTableHeader>
                <MotionTableBody>
                  {recipients.map((recipient, index) => (
                    <MotionTableRow 
                      key={recipient.user_id}
                      className={recipient.is_read ? 'bg-green-50' : 'bg-red-50'}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                    >
                      <MotionTableCell>{recipient.real_name}</MotionTableCell>
                      <MotionTableCell>{recipient.department_name}</MotionTableCell>
                      <MotionTableCell>
                        {recipient.is_read ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>已读</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600">
                            <Circle className="w-4 h-4" />
                            <span>未读</span>
                          </div>
                        )}
                      </MotionTableCell>
                      <MotionTableCell>
                        {recipient.read_at
                          ? new Date(recipient.read_at).toLocaleString()
                          : '-'}
                      </MotionTableCell>
                    </MotionTableRow>
                  ))}
                </MotionTableBody>
              </MotionTable>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecipientsModal(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 通用消息模态框 */}
      <Dialog open={modalConfig.show} onOpenChange={closeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${
              modalConfig.type === 'success' ? 'text-green-600' :
              modalConfig.type === 'error' ? 'text-red-600' :
              'text-blue-600'
            }`}>
              {modalConfig.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {modalConfig.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {modalConfig.type === 'info' && <Info className="w-5 h-5" />}
              {modalConfig.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>{modalConfig.message}</p>
          </div>
          <DialogFooter>
            <Button onClick={closeModal}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EmployeeMemosOptimized