import { useState, useEffect } from 'react'
import { formatDateOnly } from '../../utils/dateUtils'
import axios from 'axios'
import { toast } from 'react-toastify'
import { getApiUrl } from '../../utils/apiConfig'


export default function LeaveRecords({ onNavigate }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  const [employee, setEmployee] = useState(null)
  const [user, setUser] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelRecordId, setCancelRecordId] = useState(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      setUser(userData)
      fetchEmployeeInfo(userData.id)
    }
  }, [])

  useEffect(() => {
    if (employee) {
      fetchRecords()
    }
  }, [pagination.page, pagination.limit, statusFilter, employee])

  const fetchEmployeeInfo = async (userId) => {
    try {
      const response = await axios.get(getApiUrl(`/api/employees/by-user/${userId}`))
      if (response.data.success && response.data.data) {
        setEmployee(response.data.data)
      } else {
        toast.error('未找到员工信息')
      }
    } catch (error) {
      console.error('获取员工信息失败:', error)
      toast.error('获取员工信息失败')
    }
  }

  const fetchRecords = async () => {
    if (!employee) return

    setLoading(true)
    try {
      const response = await axios.get(getApiUrl('/api/leave/records'), {
        params: {
          employee_id: employee.id,
          status: statusFilter,
          page: pagination.page,
          limit: pagination.limit
        }
      })

      if (response.data.success) {
        setRecords(response.data.data)
        setPagination(prev => ({ ...prev, ...response.data.pagination }))
      }
    } catch (error) {
      toast.error('获取请假记录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelClick = (id) => {
    setCancelRecordId(id)
    setShowCancelModal(true)
  }

  const handleCancelConfirm = async () => {
    if (!cancelRecordId) return

    try {
      const response = await axios.post(getApiUrl(`/api/leave/records/${cancelRecordId}/cancel`))
      if (response.data.success) {
        toast.success('请假申请已撤销')
        setShowCancelModal(false)
        setCancelRecordId(null)
        fetchRecords()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '撤销失败')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: '待审批', color: 'bg-yellow-100 text-yellow-800' },
      approved: { text: '已通过', color: 'bg-green-100 text-green-800' },
      rejected: { text: '已拒绝', color: 'bg-red-100 text-red-800' },
      cancelled: { text: '已撤销', color: 'bg-gray-100 text-gray-800' }
    }
    const badge = badges[status] || badges.pending
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    )
  }

  const getLeaveTypeLabel = (type) => {
    const types = {
      annual: '年假',
      sick: '病假',
      personal: '事假',
      other: '其他'
    }
    return types[type] || type
  }



  return (
    <div className="p-6">
      {/* 头部 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">请假记录</h1>
          <p className="text-gray-600 mt-1">查看您的请假申请历史</p>
        </div>
        <button
          onClick={() => onNavigate && onNavigate('attendance-leave-apply')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          + 新建请假
        </button>
      </div>

      {/* 状态筛选 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-2">
          {[
            { value: 'all', label: '全部' },
            { value: 'pending', label: '待审批' },
            { value: 'approved', label: '已通过' },
            { value: 'rejected', label: '已拒绝' },
            { value: 'cancelled', label: '已撤销' }
          ].map((status) => (
            <button
              key={status.value}
              onClick={() => {
                setStatusFilter(status.value)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${statusFilter === status.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* 记录列表 - 卡片布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-8 text-center text-gray-500">加载中...</div>
        ) : records.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500">暂无请假记录</div>
        ) : (
          records.map((record) => (
            <div key={record.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-5 border border-gray-100">
              {/* 卡片头部 */}
              <div className="flex items-start justify-between mb-3">
                <span className="text-xl font-bold text-gray-800">
                  {getLeaveTypeLabel(record.leave_type)}
                </span>
                {getStatusBadge(record.status)}
              </div>

              {/* 卡片内容 */}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <span>{formatDateOnly(record.start_date)} 至 {formatDateOnly(record.end_date)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span>⏱️</span>
                  <span className="font-medium text-blue-600">{record.days} 天</span>
                  {record.used_conversion_days > 0 && (
                    <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      含转换假期 {record.used_conversion_days} 天
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-2">
                  <span className="mt-0.5">📝</span>
                  <span className="flex-1 line-clamp-2">{record.reason}</span>
                </div>

                {record.approver_name && (
                  <div className="flex items-center gap-2">
                    <span>👤</span>
                    <span>{record.approver_name}</span>
                  </div>
                )}

                {record.approved_at && (
                  <div className="flex items-center gap-2">
                    <span>🕐</span>
                    <span>{formatDateOnly(record.approved_at)}</span>
                  </div>
                )}

                {record.approval_note && (
                  <div className="flex items-start gap-2 pt-2 border-t">
                    <span className="mt-0.5">💬</span>
                    <span className="flex-1 text-gray-700">{record.approval_note}</span>
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              {record.status === 'pending' && (
                <div className="mt-4 pt-3 border-t">
                  <button
                    onClick={() => handleCancelClick(record.id)}
                    className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                  >
                    撤销申请
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 分页 */}
      {pagination.total > 0 && (
        <div className="bg-white rounded-lg shadow mt-4 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700">
                共 {pagination.total} 条记录
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">每页显示</label>
                <select
                  value={pagination.limit}
                  onChange={(e) => setPagination({ ...pagination, limit: parseInt(e.target.value), page: 1 })}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="10">10条</option>
                  <option value="20">20条</option>
                  <option value="50">50条</option>
                  <option value="100">100条</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                第 {pagination.page} / {Math.ceil(pagination.total / pagination.limit)} 页
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
      )}

      {/* 撤销确认模态框 */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">确认撤销</h3>
            <p className="text-gray-600 mb-6">确定要撤销这个请假申请吗？撤销后将无法恢复。</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setCancelRecordId(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCancelConfirm}
                className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                确认撤销
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
