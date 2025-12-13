import React, { useState, useEffect } from 'react'
import { toast } from 'sonner';
import Modal from './Modal'
import { getApiUrl } from '../utils/apiConfig'

function EmployeeApproval() {
  const [pendingUsers, setPendingUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [approvalNote, setApprovalNote] = useState('')

  // 搜索条件
  const [searchFilters, setSearchFilters] = useState({
    keyword: '',
    department: '',
    dateFrom: '',
    dateTo: ''
  })

  // 分页
  const [statusFilter, setStatusFilter] = useState('pending')
  const [totalUsers, setTotalUsers] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    fetchPendingUsers()
    fetchDepartments()
  }, [])

  useEffect(() => {
    fetchPendingUsers()
  }, [currentPage, pageSize, statusFilter])

  // 本地过滤仅用于关键词和日期，部门和状态由后端处理
  useEffect(() => {
    filterUsers()
  }, [searchFilters, pendingUsers])

  const fetchPendingUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        status: statusFilter
      })

      const response = await fetch(getApiUrl(`/api/users-pending?${queryParams}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()

      if (data.data) {
        setPendingUsers(data.data)
        setFilteredUsers(data.data)
        setTotalUsers(data.total)
        setTotalPages(data.totalPages)
      } else {
        // 兼容旧格式（如果后端未更新）
        setPendingUsers(Array.isArray(data) ? data : [])
        setFilteredUsers(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      toast.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token')
      // 移除 forManagement=true，使用正常的部门权限过滤
      const response = await fetch(getApiUrl('/api/departments'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setDepartments(data.filter(d => d.status === 'active'))
    } catch (error) {
      console.error('获取部门列表失败')
    }
  }

  const filterUsers = () => {
    let filtered = [...pendingUsers]

    // 关键词搜索
    if (searchFilters.keyword) {
      const keyword = searchFilters.keyword.toLowerCase()
      filtered = filtered.filter(user =>
        user.real_name?.toLowerCase().includes(keyword) ||
        user.username?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.phone?.includes(keyword)
      )
    }

    // 部门筛选
    if (searchFilters.department) {
      filtered = filtered.filter(user => user.department_id === parseInt(searchFilters.department))
    }

    // 日期筛选
    if (searchFilters.dateFrom) {
      filtered = filtered.filter(user => {
        const userDate = new Date(user.created_at).toISOString().split('T')[0]
        return userDate >= searchFilters.dateFrom
      })
    }

    if (searchFilters.dateTo) {
      filtered = filtered.filter(user => {
        const userDate = new Date(user.created_at).toISOString().split('T')[0]
        return userDate <= searchFilters.dateTo
      })
    }

    setFilteredUsers(filtered)
    setTotalPages(Math.ceil(filtered.length / pageSize))
    setCurrentPage(1)
  }


  const handleViewDetail = (user) => {
    setSelectedUser(user)
    setApprovalNote(user.approval_note || '')
    setIsDetailModalOpen(true)
  }

  const handleApprove = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(getApiUrl(`/api/users/${selectedUser.id}/approve`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: approvalNote })
      })

      if (response.ok) {
        toast.success('审核通过')
        setIsDetailModalOpen(false)
        fetchPendingUsers()
      } else {
        toast.error('审核失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleReject = async () => {
    if (!selectedUser) return
    if (!approvalNote.trim()) {
      toast.error('请填写拒绝原因')
      return
    }

    try {
      const response = await fetch(getApiUrl(`/api/users/${selectedUser.id}/reject`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: approvalNote })
      })

      if (response.ok) {
        toast.success('已拒绝')
        setIsDetailModalOpen(false)
        fetchPendingUsers()
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const clearFilters = () => {
    setSearchFilters({
      keyword: '',
      department: '',
      dateFrom: '',
      dateTo: ''
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-primary-600 text-xl">加载中...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="bg-white rounded-xl shadow-md p-6">
        {/* 头部 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">员工审核</h1>

        {/* 状态切换 Tabs */}
        <div className="flex space-x-2">
          <button
            onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === 'pending'
                ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            待审核
          </button>
          <button
            onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === 'active'
                ? 'bg-green-100 text-green-800 border-2 border-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            已通过
          </button>
          <button
            onClick={() => { setStatusFilter('rejected'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === 'rejected'
                ? 'bg-red-100 text-red-800 border-2 border-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            已拒绝
          </button>
        </div>
      </div>

      {/* 筛选区域 */}
      {statusFilter === 'pending' && (
        <p className="text-gray-500 text-sm mt-1">
              共 {filteredUsers.length} 个待审核用户
            </p>
        )}
        {/* 搜索筛选区域 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <input
            type="text"
            placeholder="搜索姓名、用户名、邮箱、手机号..."
            value={searchFilters.keyword}
            onChange={(e) => setSearchFilters({ ...searchFilters, keyword: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />

          <select
            value={searchFilters.department}
            onChange={(e) => setSearchFilters({ ...searchFilters, department: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">全部部门</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>

          <input
            type="date"
            value={searchFilters.dateFrom}
            onChange={(e) => setSearchFilters({ ...searchFilters, dateFrom: e.target.value })}
            placeholder="开始日期"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
            onFocus={(e) => e.target.showPicker && e.target.showPicker()}
          />

          <input
            type="date"
            value={searchFilters.dateTo}
            onChange={(e) => setSearchFilters({ ...searchFilters, dateTo: e.target.value })}
            placeholder="结束日期"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
            onFocus={(e) => e.target.showPicker && e.target.showPicker()}
          />
        </div>

        {/* 清除筛选按钮 */}
        {(searchFilters.keyword || searchFilters.department || searchFilters.dateFrom || searchFilters.dateTo) && (
          <div className="mb-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              清除筛选
            </button>
          </div>
        )}

        {/* 用户列表 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-50 border-b border-primary-100">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-semibold text-primary-700 uppercase tracking-wider">用户信息</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-primary-700 uppercase tracking-wider">部门</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-primary-700 uppercase tracking-wider">联系方式</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-primary-700 uppercase tracking-wider">注册时间</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-primary-700 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <tr key={user.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-primary-50/30'} hover:bg-primary-100/50 transition-colors`}>
                    <td className="px-6 py-4 text-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.real_name}</div>
                        <div className="text-xs text-gray-500">{user.username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      {user.department_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm text-gray-600">
                        <div>{user.email || '-'}</div>
                        <div className="text-xs">{user.phone || '-'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleViewDetail(user)}
                        className={`px-4 py-1.5 rounded-lg transition-colors text-sm text-white ${
                          statusFilter === 'pending' ? 'bg-primary-500 hover:bg-primary-600' :
                          statusFilter === 'active' ? 'bg-green-500 hover:bg-green-600' :
                          'bg-red-500 hover:bg-red-600'
                        }`}
                      >
                        {statusFilter === 'pending' ? '审核' : '查看'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    {statusFilter === 'pending' ? '暂无待审核用户' :
                     statusFilter === 'active' ? '暂无已通过用户' : '暂无已拒绝用户'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">每页显示</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-600">条</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                首页
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                上一页
              </button>

              <span className="px-4 py-1 text-sm text-gray-600">
                第 {currentPage} / {totalPages} 页
              </span>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                下一页
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                末页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 审核详情模态框 */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={statusFilter === 'rejected' ? '拒绝详情' : statusFilter === 'active' ? '通过详情' : '审核用户'}
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">姓名：</span>
                  <span className="text-sm text-gray-900">{selectedUser.real_name}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">用户名：</span>
                  <span className="text-sm text-gray-900">{selectedUser.username}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">邮箱：</span>
                  <span className="text-sm text-gray-900">{selectedUser.email || '-'}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">手机：</span>
                  <span className="text-sm text-gray-900">{selectedUser.phone || '-'}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">部门：</span>
                  <span className="text-sm text-gray-900">{selectedUser.department_name || '-'}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">注册时间：</span>
                  <span className="text-sm text-gray-900">
                    {new Date(selectedUser.created_at).toLocaleString('zh-CN')}
                  </span>
                </div>
              </div>
            </div>

            {/* 显示拒绝原因（仅在已拒绝状态下） */}
            {statusFilter === 'rejected' && selectedUser.approval_note && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  拒绝原因
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                  {selectedUser.approval_note}
                </div>
              </div>
            )}

            {/* 显示审批备注输入框（仅在待审核状态下） */}
            {statusFilter === 'pending' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  审核备注
                </label>
                <textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  rows="3"
                  placeholder="请填写审核意见（拒绝时必填）"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {statusFilter === 'active' || statusFilter === 'rejected' ? '关闭' : '取消'}
              </button>

              {statusFilter === 'pending' && (
                <>
                  <button
                    onClick={handleReject}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    拒绝
                  </button>
                  <button
                    onClick={handleApprove}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    通过
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default EmployeeApproval
