import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import SimpleMDE from 'react-simplemde-editor'
import 'easymde/dist/easymde.min.css'
import './EmployeeMemos.css'

import { getApiUrl } from '../../utils/apiConfig'

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

const EmployeeMemos = () => {
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
    try {
      const response = await axios.get(getApiUrl('/api/employees'), {
        params: { department_id: departmentId },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.data.success) {
        setEmployees(response.data.data)
      }
    } catch (error) {
      console.error('加载员工列表失败:', error)
      console.error('错误详情:', error.response?.data)
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
      await axios.post(getApiUrl('/api/memos/department'), formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
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
      low: '#95a5a6',
      normal: '#3498db',
      high: '#f39c12',
      urgent: '#e74c3c'
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
    <div className="employee-memos-container">
      <div className="page-header">
        <h2>员工备忘录管理</h2>
        <button className="btn-primary" onClick={handleCreate}>
          <i className="fas fa-paper-plane"></i> 发送备忘录
        </button>
      </div>

      {/* 备忘录列表 */}
      {loading ? (
        <div className="loading">加载中...</div>
      ) : memos.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-inbox"></i>
          <h3>暂无备忘录</h3>
          <p>点击上方"发送备忘录"按钮创建第一条备忘录</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="memos-table">
              <thead>
                <tr>
                  <th>标题</th>
                  <th>发送对象</th>
                  <th>优先级</th>
                  <th>阅读情况</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {memos.map(memo => (
                  <tr key={memo.id}>
                    <td>
                      <div className="memo-title-cell">{memo.title}</div>
                    </td>
                    <td>
                      {memo.target_user_name ? (
                        <span className="target-user">
                          <i className="fas fa-user"></i> {memo.target_user_name}
                        </span>
                      ) : (
                        <span className="target-department">
                          <i className="fas fa-users"></i> {memo.department_name}
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(memo.priority) }}
                      >
                        {getPriorityText(memo.priority)}
                      </span>
                    </td>
                    <td>
                      <div className="read-stats">
                        <span className="read-count">{memo.read_count}</span>
                        <span className="separator">/</span>
                        <span className="total-count">{memo.total_recipients}</span>
                        <span className="percentage">
                          ({memo.total_recipients > 0
                            ? Math.round((memo.read_count / memo.total_recipients) * 100)
                            : 0}%)
                        </span>
                      </div>
                    </td>
                    <td>{new Date(memo.created_at).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn-link"
                        onClick={() => handleViewRecipients(memo)}
                      >
                        <i className="fas fa-eye"></i> 查看详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {pagination.total > pagination.pageSize && (
            <div className="pagination">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              >
                上一页
              </button>
              <span>第 {pagination.page} 页 / 共 {Math.ceil(pagination.total / pagination.pageSize)} 页</span>
              <button
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {/* 创建备忘录模态框 */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>发送备忘录</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请输入标题"
                />
              </div>

              <div className="form-group">
                <label>优先级</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">低</option>
                  <option value="normal">普通</option>
                  <option value="high">高</option>
                  <option value="urgent">紧急</option>
                </select>
              </div>

              <div className="form-group">
                <label>发送模式 *</label>
                <div className="send-mode-toggle">
                  <button
                    type="button"
                    className={`toggle-btn ${formData.sendMode === 'department' ? 'active' : ''}`}
                    onClick={() => setFormData({
                      ...formData,
                      sendMode: 'department',
                      targetUserId: ''
                    })}
                  >
                    <i className="fas fa-users"></i>
                    <span>整个部门</span>
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${formData.sendMode === 'individual' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, sendMode: 'individual' })}
                  >
                    <i className="fas fa-user"></i>
                    <span>指定员工</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>
                  目标部门 *
                  {formData.sendMode === 'department' && (
                    <span style={{ fontWeight: 'normal', color: '#94a3b8', marginLeft: '8px' }}>
                      (将发送给该部门所有员工)
                    </span>
                  )}
                </label>
                <select
                  value={formData.targetDepartmentId}
                  onChange={(e) => setFormData({
                    ...formData,
                    targetDepartmentId: e.target.value,
                    targetUserId: ''
                  })}
                >
                  <option value="">请选择部门</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                {departments.length === 0 && (
                  <div className="form-hint">
                    <i className="fas fa-info-circle"></i>
                    暂无可用部门
                  </div>
                )}
              </div>

              {formData.sendMode === 'individual' && (
                <div className="form-group">
                  <label>目标员工 *</label>
                  <select
                    value={formData.targetUserId}
                    onChange={(e) => setFormData({ ...formData, targetUserId: e.target.value })}
                    disabled={!formData.targetDepartmentId}
                  >
                    <option value="">
                      {!formData.targetDepartmentId ? '请先选择部门' : '请选择员工'}
                    </option>
                    {employees.map(emp => (
                      <option key={emp.user_id} value={emp.user_id}>
                        {emp.real_name} ({emp.employee_no})
                      </option>
                    ))}
                  </select>
                  {!formData.targetDepartmentId && (
                    <div className="form-hint">
                      <i className="fas fa-info-circle"></i>
                      请先选择目标部门
                    </div>
                  )}
                  {formData.targetDepartmentId && employees.length === 0 && (
                    <div className="form-hint">
                      <i className="fas fa-exclamation-triangle"></i>
                      该部门暂无可用员工
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>内容（支持Markdown）*</label>
                <SimpleMDE
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  options={{
                    spellChecker: false,
                    placeholder: '请输入内容，支持Markdown格式...',
                    toolbar: ['bold', 'italic', 'heading', '|', 'quote', 'unordered-list', 'ordered-list', '|', 'link', 'image', '|', 'preview', 'side-by-side', 'fullscreen']
                  }}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>取消</button>
              <button className="btn-primary" onClick={handleSend}>
                <i className="fas fa-paper-plane"></i> 发送
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 接收者列表模态框 */}
      {showRecipientsModal && currentMemo && (
        <div className="modal-overlay" onClick={() => setShowRecipientsModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{currentMemo.title}</h3>
              <button className="close-btn" onClick={() => setShowRecipientsModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="memo-detail-section">
                <h4>备忘录内容</h4>
                <div className="memo-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {currentMemo.content}
                  </ReactMarkdown>
                </div>
              </div>

              <div className="recipients-section">
                <h4>接收者列表 ({recipients.length}人)</h4>
                <div className="recipients-stats">
                  <span className="stat-item read">
                    已读：{recipients.filter(r => r.is_read).length}人
                  </span>
                  <span className="stat-item unread">
                    未读：{recipients.filter(r => !r.is_read).length}人
                  </span>
                </div>

                <table className="recipients-table">
                  <thead>
                    <tr>
                      <th>姓名</th>
                      <th>部门</th>
                      <th>状态</th>
                      <th>阅读时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipients.map(recipient => (
                      <tr key={recipient.user_id} className={recipient.is_read ? 'read' : 'unread'}>
                        <td>{recipient.real_name}</td>
                        <td>{recipient.department_name}</td>
                        <td>
                          {recipient.is_read ? (
                            <span className="status-badge read">
                              <i className="fas fa-check-circle"></i> 已读
                            </span>
                          ) : (
                            <span className="status-badge unread">
                              <i className="fas fa-circle"></i> 未读
                            </span>
                          )}
                        </td>
                        <td>
                          {recipient.read_at
                            ? new Date(recipient.read_at).toLocaleString()
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowRecipientsModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* 通用消息模态框 */}
      {modalConfig.show && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
            <div className={`modal-header ${modalConfig.type}`}>
              <h3>
                {modalConfig.type === 'success' && <i className="fas fa-check-circle"></i>}
                {modalConfig.type === 'error' && <i className="fas fa-exclamation-circle"></i>}
                {modalConfig.type === 'info' && <i className="fas fa-info-circle"></i>}
                {' '}{modalConfig.title}
              </h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <p>{modalConfig.message}</p>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={closeModal}>确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeMemos
