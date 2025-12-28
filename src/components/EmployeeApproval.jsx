import React, { useState, useEffect } from 'react'
import { toast } from 'sonner';
import Modal from './Modal'
import { getApiUrl } from '../utils/apiConfig'
import { formatBeijingDate, getBeijingDateString, getLocalDateString } from '../utils/date'

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
        const userDate = formatBeijingDate(user.created_at)
        return userDate >= searchFilters.dateFrom
      })
    }

    if (searchFilters.dateTo) {
      filtered = filtered.filter(user => {
        const userDate = formatBeijingDate(user.created_at)
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* 页面标题 */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">员工审核</h1>
            <p className="text-sm text-gray-500 mt-1">管理员工注册申请，审核通过或拒绝</p>
          </div>
          {/* 状态切换 Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === 'pending'
                  ? 'bg-amber-100 text-amber-800 border-2 border-amber-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              待审核
            </button>
            <button
              onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === 'active'
                  ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              已通过
            </button>
            <button
              onClick={() => { setStatusFilter('rejected'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === 'rejected'
                  ? 'bg-rose-100 text-rose-800 border-2 border-rose-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              已拒绝
            </button>
          </div>
        </div>

      {/* 筛选区域 */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 mb-1.5 tracking-wide uppercase">搜索</label>
              <input
                type="text"
                placeholder="姓名 / 用户名 / 邮箱 / 手机号"
                value={searchFilters.keyword}
                onChange={(e) => setSearchFilters({ ...searchFilters, keyword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 text-sm rounded focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
              />
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-gray-600 mb-1.5 tracking-wide uppercase">部门</label>
              <select
                value={searchFilters.department}
                onChange={(e) => setSearchFilters({ ...searchFilters, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 text-sm rounded focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all bg-white"
              >
                <option value="">全部</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-gray-600 mb-1.5 tracking-wide uppercase">注册开始</label>
              <input
                type="date"
                value={searchFilters.dateFrom}
                onChange={(e) => setSearchFilters({ ...searchFilters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 text-sm rounded focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
              />
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-gray-600 mb-1.5 tracking-wide uppercase">注册结束</label>
              <input
                type="date"
                value={searchFilters.dateTo}
                onChange={(e) => setSearchFilters({ ...searchFilters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 text-sm rounded focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
              />
            </div>
            {(searchFilters.keyword || searchFilters.department || searchFilters.dateFrom || searchFilters.dateTo) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-200 rounded hover:border-gray-300 hover:bg-white transition-all"
              >
                清空筛选
              </button>
            )}
          </div>

          {/* 快捷时间选择按钮 */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">快捷选择：</span>
            <button
              onClick={() => {
                const today = getBeijingDateString()
                setSearchFilters({ ...searchFilters, dateFrom: today, dateTo: today })
              }}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                searchFilters.dateFrom === searchFilters.dateTo && searchFilters.dateFrom === getBeijingDateString()
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              今天
            </button>
            <button
              onClick={() => {
                const yesterday = new Date()
                yesterday.setDate(yesterday.getDate() - 1)
                const dateStr = getBeijingDateString(yesterday)
                setSearchFilters({ ...searchFilters, dateFrom: dateStr, dateTo: dateStr })
              }}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                (() => {
                  const yesterday = new Date()
                  yesterday.setDate(yesterday.getDate() - 1)
                  const dateStr = getBeijingDateString(yesterday)
                  return searchFilters.dateFrom === searchFilters.dateTo && searchFilters.dateFrom === dateStr
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                })()
              }`}
            >
              昨天
            </button>
            <button
              onClick={() => {
                const now = new Date()
                const threeDaysAgo = new Date(now)
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 2)
                setSearchFilters({
                  ...searchFilters,
                  dateFrom: getBeijingDateString(threeDaysAgo),
                  dateTo: getBeijingDateString(now)
                })
              }}
              className="px-3 py-1.5 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              近3天
            </button>
            <button
              onClick={() => {
                const now = new Date()
                const sevenDaysAgo = new Date(now)
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
                setSearchFilters({
                  ...searchFilters,
                  dateFrom: getBeijingDateString(sevenDaysAgo),
                  dateTo: getBeijingDateString(now)
                })
              }}
              className="px-3 py-1.5 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              近7天
            </button>
            <button
              onClick={() => {
                const now = new Date()
                const thirtyDaysAgo = new Date(now)
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
                setSearchFilters({
                  ...searchFilters,
                  dateFrom: getBeijingDateString(thirtyDaysAgo),
                  dateTo: getBeijingDateString(now)
                })
              }}
              className="px-3 py-1.5 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              近30天
            </button>
            <button
              onClick={() => {
                const now = new Date()
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                setSearchFilters({
                  ...searchFilters,
                  dateFrom: getBeijingDateString(firstDayOfMonth),
                  dateTo: getBeijingDateString(now)
                })
              }}
              className="px-3 py-1.5 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              本月
            </button>
            <button
              onClick={() => {
                const now = new Date()
                const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
                setSearchFilters({
                  ...searchFilters,
                  dateFrom: getBeijingDateString(firstDayLastMonth),
                  dateTo: getBeijingDateString(lastDayLastMonth)
                })
              }}
              className="px-3 py-1.5 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              上月
            </button>
          </div>
        </div>

        {/* 用户列表 */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase">用户信息</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 tracking-wide uppercase">部门</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 tracking-wide uppercase">联系方式</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 tracking-wide uppercase">注册时间</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 tracking-wide uppercase">状态</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 tracking-wide uppercase">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                          {user.real_name?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{user.real_name}</div>
                          <div className="text-xs text-gray-400 truncate mt-0.5">{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center text-sm text-gray-600">
                      {user.department_name || '-'}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="text-sm text-gray-600">
                        <div>{user.email || '-'}</div>
                        <div className="text-xs text-gray-400">{user.phone || '-'}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center text-sm text-gray-600">
                      {formatBeijingDate(user.created_at)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        user.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        user.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {user.status === 'pending' ? '待审核' :
                         user.status === 'active' ? '已通过' : '已拒绝'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleViewDetail(user)}
                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        {statusFilter === 'pending' ? '审核' : '查看'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-5 py-16 text-center">
                    <p className="text-gray-400 text-sm">
                      {statusFilter === 'pending' ? '暂无待审核用户' :
                       statusFilter === 'active' ? '暂无已通过用户' : '暂无已拒绝用户'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>每页</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value))}
                className="px-2.5 py-1.5 border border-gray-200 text-sm rounded focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all bg-white"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>条，共 {totalUsers} 条</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded disabled:text-gray-300 disabled:border-gray-100 disabled:cursor-not-allowed hover:bg-white hover:border-gray-300 transition-all"
              >
                首页
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded disabled:text-gray-300 disabled:border-gray-100 disabled:cursor-not-allowed hover:bg-white hover:border-gray-300 transition-all"
              >
                上一页
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 7) {
                    pageNum = i + 1
                  } else if (currentPage <= 4) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i
                  } else {
                    pageNum = currentPage - 3 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 text-sm border rounded transition-all ${currentPage === pageNum
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'border-gray-200 hover:bg-white hover:border-gray-300'
                        }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded disabled:text-gray-300 disabled:border-gray-100 disabled:cursor-not-allowed hover:bg-white hover:border-gray-300 transition-all"
              >
                下一页
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded disabled:text-gray-300 disabled:border-gray-100 disabled:cursor-not-allowed hover:bg-white hover:border-gray-300 transition-all"
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
                className="px-5 py-2 border border-gray-200 text-sm text-gray-700 hover:text-gray-900 rounded-lg hover:border-gray-300 hover:bg-white transition-all"
              >
                {statusFilter === 'active' || statusFilter === 'rejected' ? '关闭' : '取消'}
              </button>

              {statusFilter === 'pending' && (
                <>
                  <button
                    onClick={handleReject}
                    className="px-5 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors"
                  >
                    拒绝
                  </button>
                  <button
                    onClick={handleApprove}
                    className="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
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
