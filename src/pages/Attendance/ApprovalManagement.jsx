import React, { useState, useEffect } from 'react'
import { apiGet, apiPost } from '../../utils/apiClient'
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion'

export default function ApprovalManagement() {
  const [activeTab, setActiveTab] = useState('leave')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [approvalNote, setApprovalNote] = useState('')
  const [viewMode, setViewMode] = useState('card') // card, list
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null) // { record, approved }
  const [currentUser, setCurrentUser] = useState(null)

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  })
  const [filters, setFilters] = useState({
    status: 'pending',
    start_date: '',
    end_date: ''
  })

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setCurrentUser(JSON.parse(userStr))
    }
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [activeTab, pagination.page, pagination.limit, filters])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      let endpoint = ''
      switch (activeTab) {
        case 'leave':
          endpoint = '/api/attendance/leave/records'
          break
        case 'overtime':
          endpoint = '/api/attendance/overtime/records'
          break
        case 'makeup':
          endpoint = '/api/attendance/makeup/records'
          break
      }

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      }

      const response = await apiGet(endpoint, { params })

      if (response.success) {
        setRecords(response.data || [])
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || 0
        }))
      } else {
        setRecords([])
        setPagination(prev => ({ ...prev, total: 0 }))
        toast.error(response.message || '获取记录失败')
      }
    } catch (error) {
      console.error('获取记录错误:', error)
      if (error.response && error.response.status !== 404) {
        toast.error('获取记录失败')
      }
      setRecords([])
      setPagination(prev => ({ ...prev, total: 0 }))
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = (record) => {
    setSelectedRecord(record)
    setApprovalNote('')
    setShowModal(true)
  }

  const handleSubmitApproval = async (approved) => {
    if (!selectedRecord) return

    try {
      let endpoint = ''
      switch (activeTab) {
        case 'leave':
          endpoint = `/api/attendance/leave/${selectedRecord.id}/approve`
          break
        case 'overtime':
          endpoint = `/api/attendance/overtime/${selectedRecord.id}/approve`
          break
        case 'makeup':
          endpoint = `/api/attendance/makeup/${selectedRecord.id}/approve`
          break
      }

      const response = await apiPost(endpoint, {
        approved,
        approval_note: approvalNote
      })

      if (response.success) {
        toast.success(approved ? '✅ 审批通过' : '❌ 审批驳回')
        setShowModal(false)
        fetchRecords()
      }
    } catch (error) {
      toast.error(error.message || '审批失败')
    }
  }

  const handleQuickApproval = (record, approved) => {
    setConfirmAction({ record, approved })
    setShowConfirmModal(true)
  }

  const executeQuickApproval = async () => {
    if (!confirmAction) return

    const { record, approved } = confirmAction

    try {
      let endpoint = ''
      switch (activeTab) {
        case 'leave':
          endpoint = `/api/attendance/leave/${record.id}/approve`
          break
        case 'overtime':
          endpoint = `/api/attendance/overtime/${record.id}/approve`
          break
        case 'makeup':
          endpoint = `/api/attendance/makeup/${record.id}/approve`
          break
      }

      const response = await apiPost(endpoint, {
        approved,
        approval_note: ''
      })

      if (response.success) {
        toast.success(approved ? '✅ 审批通过' : '❌ 审批驳回')
        setShowConfirmModal(false)
        setConfirmAction(null)
        fetchRecords()
      }
    } catch (error) {
      toast.error(error.message || '审批失败')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: '待审批', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      approved: { text: '已通过', color: 'bg-green-100 text-green-800 border-green-200' },
      rejected: { text: '已驳回', color: 'bg-red-100 text-red-800 border-red-200' },
      cancelled: { text: '已取消', color: 'bg-gray-100 text-gray-600 border-gray-200' }
    }
    const badge = badges[status] || badges.pending
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}>
        {badge.text}
      </span>
    )
  }

  const getLeaveTypeName = (type) => {
    const types = {
      sick: '病假',
      annual: '年假',
      personal: '事假',
      maternity: '产假',
      compensatory: '调休',
      other: '其他'
    }
    return types[type] || type
  }

  const renderCard = (record) => {
    const isPending = record.status === 'pending'
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
              {record.employee_name ? record.employee_name.charAt(0) : '?'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{record.employee_name || `员工 #${record.employee_id}`}</h3>
              <p className="text-xs text-gray-500">{record.created_at?.substring(0, 16).replace('T', ' ')}</p>
            </div>
          </div>
          {getStatusBadge(record.status)}
        </div>

        <div className="space-y-3 mb-4">
          {activeTab === 'leave' && (
            <>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-20 text-gray-400">请假类型</span>
                <span className="font-medium text-gray-800">{getLeaveTypeName(record.leave_type)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-20 text-gray-400">时间范围</span>
                <span>{record.start_date?.substring(0, 10)} 至 {record.end_date?.substring(0, 10)}</span>
                <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium">{record.days}天</span>
              </div>
            </>
          )}
          {activeTab === 'overtime' && (
            <>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-20 text-gray-400">加班日期</span>
                <span className="font-medium text-gray-800">{record.overtime_date}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-20 text-gray-400">时间范围</span>
                <span>{record.start_time?.substring(11, 16)} - {record.end_time?.substring(11, 16)}</span>
                <span className="ml-2 px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded text-xs font-medium">{record.hours}小时</span>
              </div>
            </>
          )}
          {activeTab === 'makeup' && (
            <>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-20 text-gray-400">补卡日期</span>
                <span className="font-medium text-gray-800">{record.record_date}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-20 text-gray-400">补卡时间</span>
                <span>{record.clock_time?.substring(11, 16)}</span>
                <span className="ml-2 px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded text-xs font-medium">
                  {record.clock_type === 'in' ? '上班卡' : '下班卡'}
                </span>
              </div>
            </>
          )}
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            <span className="text-gray-400 mr-2">原因:</span>
            {record.reason}
          </div>
        </div>

        {isPending && (
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => handleQuickApproval(record, true)}
              className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              通过
            </button>
            <button
              onClick={() => handleQuickApproval(record, false)}
              className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              驳回
            </button>
            <button
              onClick={() => handleApprove(record)}
              className="px-4 bg-gray-50 text-gray-600 hover:bg-gray-100 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              详情
            </button>
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50 flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">审批管理</h1>
          <p className="text-gray-500 mt-2">
            {currentUser?.is_department_manager ? '管理您部门的考勤申请' : '管理所有考勤申请'}
          </p>
        </div>
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          <button
            onClick={() => setViewMode('card')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'card' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            卡片视图
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'list' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            列表视图
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-8">
        {['leave', 'overtime', 'makeup'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 text-sm font-medium transition-all relative ${
              activeTab === tab ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'leave' && '请假申请'}
            {tab === 'overtime' && '加班申请'}
            {tab === 'makeup' && '补卡申请'}
            {activeTab === tab && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">状态</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="pending">待审批</option>
            <option value="approved">已通过</option>
            <option value="rejected">已驳回</option>
            <option value="all">全部</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">开始日期</label>
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            className="w-full border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">结束日期</label>
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            className="w-full border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setFilters({ status: 'pending', start_date: '', end_date: '' })}
          className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-medium transition-colors"
        >
          重置
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-medium text-gray-900">暂无申请记录</h3>
          <p className="text-gray-500 mt-1">当前没有需要处理的审批申请</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {records.map((record) => (
              <React.Fragment key={record.id}>
                {renderCard(record)}
              </React.Fragment>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请人</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型/时间</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">详情</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mr-3">
                        {record.employee_name ? record.employee_name.charAt(0) : '?'}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{record.employee_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {activeTab === 'leave' && getLeaveTypeName(record.leave_type)}
                      {activeTab === 'overtime' && '加班'}
                      {activeTab === 'makeup' && (record.clock_type === 'in' ? '上班补卡' : '下班补卡')}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {activeTab === 'leave' && `${record.start_date?.substring(5)} - ${record.end_date?.substring(5)}`}
                      {activeTab === 'overtime' && record.overtime_date}
                      {activeTab === 'makeup' && record.record_date}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">{record.reason}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getStatusBadge(record.status)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    {record.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleQuickApproval(record, true)}
                          className="text-green-600 hover:text-green-900"
                        >
                          通过
                        </button>
                        <button
                          onClick={() => handleQuickApproval(record, false)}
                          className="text-red-600 hover:text-red-900"
                        >
                          驳回
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-sm text-gray-600 flex items-center">
            第 {pagination.page} 页 / 共 {Math.ceil(pagination.total / pagination.limit)} 页
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page * pagination.limit >= pagination.total}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">审批详情</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">申请人</span>
                  <span className="font-medium text-gray-900">{selectedRecord.employee_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">申请时间</span>
                  <span className="font-medium text-gray-900">{selectedRecord.created_at?.substring(0, 16).replace('T', ' ')}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-gray-500 text-sm mb-1">申请原因</p>
                  <p className="text-gray-900">{selectedRecord.reason}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">审批意见</label>
                <textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  className="w-full border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="请输入审批意见（可选）..."
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleSubmitApproval(false)}
                className="flex-1 px-4 py-2.5 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors"
              >
                驳回
              </button>
              <button
                onClick={() => handleSubmitApproval(true)}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all"
              >
                通过
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              confirmAction.approved ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              <span className="text-3xl">{confirmAction.approved ? '✓' : '✕'}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              确认{confirmAction.approved ? '通过' : '驳回'}?
            </h3>
            <p className="text-gray-500 mb-6">
              您确定要{confirmAction.approved ? '通过' : '驳回'} {confirmAction.record.employee_name} 的申请吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={executeQuickApproval}
                className={`flex-1 px-4 py-2.5 text-white font-medium rounded-xl shadow-lg transition-all ${
                  confirmAction.approved
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-200'
                    : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                }`}
              >
                确认
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
