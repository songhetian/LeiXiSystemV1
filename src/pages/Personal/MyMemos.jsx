import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/apiClient'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './MyMemos.css'

import { wsManager } from '../../services/websocket'

const MyMemos = () => {
  const [memos, setMemos] = useState([])
  const [loading, setLoading] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [currentMemo, setCurrentMemo] = useState(null)
  const [editMode, setEditMode] = useState(false)

  // 表单数据
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal'
  })

  // 筛选条件
  const [filters, setFilters] = useState({
    isRead: '',
    priority: '',
    search: ''
  })

  // 分页
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    total: 0
  })

  const userId = localStorage.getItem('userId')

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

  // 移除SimpleMDE配置

  // 处理内容变化 - 使用useCallback避免重新创建
  const handleContentChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, content: e.target.value }))
  }, [])

  useEffect(() => {
    loadMemos()
  }, [pagination.page, filters])

  const loadMemos = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters
      }

      Object.keys(params).forEach(key =>
        (params[key] === '' || params[key] === undefined) && delete params[key]
      )

      const response = await apiGet('/api/memos/my-memos', {
        params
      })

      if (response.success) {
        setMemos(response.data)
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total
        }))
      }
    } catch (error) {
      console.error('加载备忘录失败:', error)
      alert(`加载备忘录失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setFormData({ title: '', content: '', priority: 'normal' })
    setEditMode(false)
    setShowEditor(true)
  }

  const handleEdit = (memo) => {
    if (memo.type === 'department') {
      alert('部门备忘录不允许修改')
      return
    }
    setFormData({
      title: memo.title,
      content: memo.content,
      priority: memo.priority
    })
    setCurrentMemo(memo)
    setEditMode(true)
    setShowEditor(true)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      alert('标题和内容不能为空')
      return
    }

    try {
      if (editMode) {
        await apiPut(
          `/api/memos/personal/${currentMemo.id}`,
          formData
        )
        alert('更新成功')
      } else {
        await apiPost(
          '/api/memos/personal',
          formData
        )
        alert('创建成功')
      }

      setShowEditor(false)
      loadMemos()
    } catch (error) {
      console.error('保存失败:', error)
      alert(error.message || '保存失败')
    }
  }

  const handleDelete = async (memo) => {
    if (memo.type === 'department') {
      alert('部门备忘录不允许删除')
      return
    }

    if (!window.confirm('确定要删除这条备忘录吗？')) return

    try {
      await apiDelete(`/api/memos/personal/${memo.id}`)
      alert('删除成功')
      loadMemos()
    } catch (error) {
      console.error('删除失败:', error)
      alert(error.message || '删除失败')
    }
  }

  const handleCardClick = async (memo) => {
    setCurrentMemo(memo)
    setShowDetail(true)

    // 标记为已读
    if (!memo.is_read) {
      try {
        await apiPut(`/api/memos/${memo.id}/read`, {})
        loadMemos()
      } catch (error) {
        console.error('标记已读失败:', error)
      }
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
    <div className="my-memos-container">
      <div className="page-header">
        <h2>我的备忘录</h2>
        <button className="btn-primary" onClick={handleCreate}>
          <i className="fas fa-plus"></i> 新建备忘录
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="filters-bar">
        <select
          value={filters.isRead}
          onChange={(e) => setFilters({ ...filters, isRead: e.target.value })}
        >
          <option value="">全部</option>
          <option value="0">未读</option>
          <option value="1">已读</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
        >
          <option value="">全部优先级</option>
          <option value="low">低</option>
          <option value="normal">普通</option>
          <option value="high">高</option>
          <option value="urgent">紧急</option>
        </select>

        <input
          type="text"
          placeholder="搜索标题或内容..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          onKeyPress={(e) => e.key === 'Enter' && loadMemos()}
        />
      </div>

      {/* 备忘录卡片列表 */}
      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <>
          <div className="memos-grid">
            {memos.map(memo => (
              <div
                key={memo.id}
                className={`memo-card ${!memo.is_read ? 'unread' : ''}`}
                onClick={() => handleCardClick(memo)}
              >
                {!memo.is_read && <div className="unread-badge">未读</div>}

                <div className="memo-card-header">
                  <h3>{memo.title}</h3>
                  <span
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(memo.priority) }}
                  >
                    {getPriorityText(memo.priority)}
                  </span>
                </div>

                <div className="memo-card-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {memo.content.substring(0, 150) + (memo.content.length > 150 ? '...' : '')}
                  </ReactMarkdown>
                </div>

                <div className="memo-card-footer">
                  <span className="memo-type">
                    <i className={`fas ${memo.type === 'personal' ? 'fa-user' : 'fa-users'}`}></i>
                    {memo.type === 'personal' ? '个人' : '部门'}
                  </span>
                  <span className="memo-date">
                    {new Date(memo.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
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

      {/* 编辑器模态框 */}
      {showEditor && (
        <div className="modal-overlay" onClick={() => setShowEditor(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editMode ? '编辑备忘录' : '新建备忘录'}</h3>
              <button className="close-btn" onClick={() => setShowEditor(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>标题</label>
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
                <label>内容</label>
                <textarea
                  value={formData.content}
                  onChange={handleContentChange}
                  placeholder="请输入内容..."
                  className="form-textarea"
                  rows="10"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditor(false)}>取消</button>
              <button className="btn-primary" onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 详情模态框 */}
      {showDetail && currentMemo && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{currentMemo.title}</h3>
              <button className="close-btn" onClick={() => setShowDetail(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="memo-detail-meta">
                <span
                  className="priority-badge"
                  style={{ backgroundColor: getPriorityColor(currentMemo.priority) }}
                >
                  {getPriorityText(currentMemo.priority)}
                </span>
                <span className="memo-type">
                  <i className={`fas ${currentMemo.type === 'personal' ? 'fa-user' : 'fa-users'}`}></i>
                  {currentMemo.type === 'personal' ? '个人备忘录' : '部门备忘录'}
                </span>
                {currentMemo.type === 'department' && currentMemo.creator_name && (
                  <span>创建者：{currentMemo.creator_name}</span>
                )}
                <span>创建时间：{new Date(currentMemo.created_at).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                {currentMemo.updated_at && currentMemo.updated_at !== currentMemo.created_at && (
                  <span>更新时间：{new Date(currentMemo.updated_at).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </div>

              <div className="memo-detail-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentMemo.content}
                </ReactMarkdown>
              </div>
            </div>

            <div className="modal-footer">
              {currentMemo.type === 'personal' && (
                <>
                  <button className="btn-danger" onClick={() => {
                    setShowDetail(false)
                    handleDelete(currentMemo)
                  }}>
                    删除
                  </button>
                  <button className="btn-primary" onClick={() => {
                    setShowDetail(false)
                    handleEdit(currentMemo)
                  }}>
                    编辑
                  </button>
                </>
              )}
              <button className="btn-secondary" onClick={() => setShowDetail(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyMemos
