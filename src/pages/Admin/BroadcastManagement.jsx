import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { getApiUrl } from '../../utils/apiConfig'
import './BroadcastManagement.css'

const BroadcastManagement = () => {
  const [broadcasts, setBroadcasts] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info',
    priority: 'normal',
    targetType: 'all',
    targetDepartments: [],
    targetRoles: [],
    targetUsers: [],
    expiresAt: ''
  })

  const token = localStorage.getItem('token')

  useEffect(() => {
    loadBroadcasts()
    loadDepartments()
    loadEmployees()
  }, [])

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
      showToast('加载失败', 'error')
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title || !formData.content) {
      showToast('请填写标题和内容', 'error')
      return
    }

    try {
      const payload = {
        ...formData,
        targetDepartments: formData.targetType === 'department' ? JSON.stringify(formData.targetDepartments) : null,
        targetRoles: formData.targetType === 'role' ? JSON.stringify(formData.targetRoles) : null,
        targetUsers: formData.targetType === 'individual' ? JSON.stringify(formData.targetUsers) : null
      }

      const response = await axios.post(getApiUrl('/api/broadcasts'), payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.data.success) {
        showToast(`广播发送成功！已发送给 ${response.data.data.recipientCount} 人`, 'success')
        setShowModal(false)
        resetForm()
        loadBroadcasts()
      }
    } catch (error) {
      console.error('发送广播失败:', error)
      showToast(error.response?.data?.message || '发送失败', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'info',
      priority: 'normal',
      targetType: 'all',
      targetDepartments: [],
      targetRoles: [],
      targetUsers: [],
      expiresAt: ''
    })
  }

  const showToast = (message, type = 'info') => {
    // 简单的提示实现
    alert(message)
  }

  const typeOptions = [
    { value: 'info', label: '信息', icon: '📢' },
    { value: 'warning', label: '警告', icon: '⚠️' },
    { value: 'success', label: '成功', icon: '✅' },
    { value: 'error', label: '错误', icon: '❌' },
    { value: 'announcement', label: '公告', icon: '📣' }
  ]

  const priorityOptions = [
    { value: 'low', label: '低' },
    { value: 'normal', label: '普通' },
    { value: 'high', label: '高' },
    { value: 'urgent', label: '紧急' }
  ]

  const targetTypeOptions = [
    { value: 'all', label: '全体员工' },
    { value: 'department', label: '指定部门' },
    { value: 'role', label: '指定角色' },
    { value: 'individual', label: '指定个人' }
  ]

  const roleOptions = ['超级管理员', '部门管理员', '普通员工']

  return (
    <div className="broadcast-management">
      <div className="page-header">
        <h2>📣 系统广播管理</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + 发送广播
        </button>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <div className="broadcasts-list">
          {broadcasts.length === 0 ? (
            <div className="empty-state">
              <p>暂无广播记录</p>
            </div>
          ) : (
            <table className="broadcasts-table">
              <thead>
                <tr>
                  <th>标题</th>
                  <th>类型</th>
                  <th>优先级</th>
                  <th>目标</th>
                  <th>接收人数</th>
                  <th>已读人数</th>
                  <th>发送时间</th>
                </tr>
              </thead>
              <tbody>
                {broadcasts.map(broadcast => (
                  <tr key={broadcast.id}>
                    <td>{broadcast.title}</td>
                    <td>
                      <span className={`type-badge type-${broadcast.type}`}>
                        {typeOptions.find(t => t.value === broadcast.type)?.label}
                      </span>
                    </td>
                    <td>
                      <span className={`priority-badge priority-${broadcast.priority}`}>
                        {priorityOptions.find(p => p.value === broadcast.priority)?.label}
                      </span>
                    </td>
                    <td>{targetTypeOptions.find(t => t.value === broadcast.target_type)?.label}</td>
                    <td>{broadcast.recipient_count}</td>
                    <td>{broadcast.read_count}</td>
                    <td>{new Date(broadcast.created_at).toLocaleString('zh-CN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>发送系统广播</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>标题 *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="请输入广播标题"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>内容 *</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    placeholder="请输入广播内容"
                    rows="4"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>类型</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      {typeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>优先级</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    >
                      {priorityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>发送目标</label>
                  <select
                    value={formData.targetType}
                    onChange={(e) => setFormData({...formData, targetType: e.target.value})}
                  >
                    {targetTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.targetType === 'department' && (
                  <div className="form-group">
                    <label>选择部门</label>
                    <select
                      multiple
                      value={formData.targetDepartments}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value))
                        setFormData({...formData, targetDepartments: selected})
                      }}
                      size="5"
                    >
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    <small>按住Ctrl可多选</small>
                  </div>
                )}

                {formData.targetType === 'role' && (
                  <div className="form-group">
                    <label>选择角色</label>
                    <select
                      multiple
                      value={formData.targetRoles}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value)
                        setFormData({...formData, targetRoles: selected})
                      }}
                      size="3"
                    >
                      {roleOptions.map(role => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <small>按住Ctrl可多选</small>
                  </div>
                )}

                {formData.targetType === 'individual' && (
                  <div className="form-group">
                    <label>选择员工</label>
                    <select
                      multiple
                      value={formData.targetUsers}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value))
                        setFormData({...formData, targetUsers: selected})
                      }}
                      size="8"
                    >
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.real_name} ({emp.username})
                        </option>
                      ))}
                    </select>
                    <small>按住Ctrl可多选</small>
                  </div>
                )}

                <div className="form-group">
                  <label>过期时间（可选）</label>
                  <input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                  />
                  <small>留空表示永不过期</small>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  发送广播
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BroadcastManagement
