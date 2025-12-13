import { useState, useEffect } from 'react'
import { formatDate, formatBeijingDate, getBeijingDate } from '../../utils/date'
import axios from 'axios'
import { toast } from 'sonner';
import { getApiUrl } from '../../utils/apiConfig'

import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ChartBarIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'


export default function AttendanceRecordsOptimized() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState('list') // list, calendar, timeline
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    status: 'all'
  })
  const [stats, setStats] = useState({
    total_days: 0,
    late_count: 0,
    early_count: 0,
    normal_count: 0,
    absent_count: 0,
    leave_count: 0,
    avg_work_hours: 0,
    attendance_rate: 0
  })
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [employee, setEmployee] = useState(null)
  const [user, setUser] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      setUser(userData)
      fetchEmployeeInfo(userData.id)
    }
  }, [])

  const fetchEmployeeInfo = async (userId) => {
    try {
      const response = await axios.get(getApiUrl(`/api/employees/by-user/${userId}`))
      if (response.data.success && response.data.data) {
        setEmployee(response.data.data)
      }
    } catch (error) {
      console.error('获取员工信息失败:', error)
      toast.error('获取员工信息失败')
    }
  }

  useEffect(() => {
    if (employee) {
      fetchRecords()
    }
  }, [pagination.page, pagination.limit, filters, selectedMonth, viewMode, employee])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      // 获取用户信息
      const user = JSON.parse(localStorage.getItem('user'))

      // 构建查询参数
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        employee_id: employee?.id || user.employee_id
      }

      // 添加过滤条件
      if (filters.start_date) {
        params.start_date = filters.start_date
      }
      if (filters.end_date) {
        params.end_date = filters.end_date
      }
      if (filters.status && filters.status !== 'all') {
        params.status = filters.status
      }

      const response = await axios.get(getApiUrl('/api/attendance/records'), { params })

      if (response.data.success) {
        // 确保日期格式正确，避免时区问题
        const formattedRecords = response.data.data.map(record => ({
          ...record,
          record_date: formatBeijingDate(record.record_date) // 确保使用北京时间日期
        }))

        setRecords(formattedRecords)
        setPagination({
          ...pagination,
          total: response.data.total
        })

        // 使用后端返回的统计数据
        if (response.data.stats) {
          setStats(response.data.stats)
        } else {
          // 如果后端没有返回统计数据，则使用前端计算
          calculateStats(formattedRecords)
        }
      }
    } catch (error) {
      console.error('获取考勤记录失败:', error)
      toast.error('获取考勤记录失败')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data) => {
    const stats = data.reduce((acc, record) => {
      acc.total_days++
      if (record.status === 'late') acc.late_count++
      if (record.status === 'early') acc.early_count++
      if (record.status === 'early_leave') acc.early_count++
      if (record.status === 'normal') acc.normal_count++
      if (record.status === 'absent') acc.absent_count++
      if (record.status === 'leave') acc.leave_count++
      if (record.work_hours) acc.total_work_hours += parseFloat(record.work_hours)
      return acc
    }, {
      total_days: 0,
      late_count: 0,
      early_count: 0,
      normal_count: 0,
      absent_count: 0,
      leave_count: 0,
      total_work_hours: 0
    })

    stats.avg_work_hours = stats.total_days > 0
      ? (stats.total_work_hours / stats.total_days).toFixed(1)
      : 0
    stats.attendance_rate = stats.total_days > 0
      ? ((stats.normal_count / stats.total_days) * 100).toFixed(1)
      : 0

    setStats(stats)
  }

  const handleQuickFilter = (type) => {
    const today = new Date()
    let start_date, end_date

    switch (type) {
      case 'today':
        start_date = end_date = formatBeijingDate(today)
        break
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay() + 1)
        start_date = formatBeijingDate(weekStart)
        end_date = formatBeijingDate(today)
        break
      case 'month':
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        start_date = formatBeijingDate(firstDay)
        end_date = formatBeijingDate(today)
        break
      default:
        start_date = end_date = ''
    }

    setFilters({ ...filters, start_date, end_date })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleStatusFilter = (status) => {
    setFilters(prev => ({ ...prev, status }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const exportRecords = () => {
    // 导出为CSV
    const headers = ['日期', '上班打卡', '下班打卡', '工作时长', '状态', '备注']
    const csvData = records.map(record => [
      record.record_date,
      formatDateTime(record.clock_in_time),
      formatDateTime(record.clock_out_time),
      record.work_hours || '--',
      getStatusText(record.status),
      record.remark || '--'
    ])

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `考勤记录_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('导出成功')
  }

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '--:--'
    // 使用统一的时间处理函数
    const date = new Date(dateTimeStr)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const getStatusText = (status) => {
    const statusMap = {
      normal: '正常',
      late: '迟到',
      early: '早退',
      early_leave: '早退',
      absent: '缺勤',
      leave: '请假',
      overtime: '加班'
    }
    return statusMap[status] || '未知'
  }

  const getStatusBadge = (status) => {
    const badges = {
      normal: { text: '正常', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      late: { text: '迟到', color: 'bg-red-100 text-red-800', icon: ExclamationCircleIcon },
      early: { text: '早退', color: 'bg-orange-100 text-orange-800', icon: ExclamationCircleIcon },
      early_leave: { text: '早退', color: 'bg-orange-100 text-orange-800', icon: ExclamationCircleIcon },
      absent: { text: '缺勤', color: 'bg-gray-100 text-gray-800', icon: XCircleIcon },
      leave: { text: '请假', color: 'bg-blue-100 text-blue-800', icon: ClockIcon },
      overtime: { text: '加班', color: 'bg-purple-100 text-purple-800', icon: ClockIcon }
    }
    const badge = badges[status] || badges.normal
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    )
  }

  const getStatusColor = (record) => {
    // 统一处理早退状态
    if (record.status === 'early' || record.status === 'early_leave') return 'bg-orange-500'
    if (record.status === 'late') return 'bg-red-500'
    if (record.status === 'absent') return 'bg-gray-500'
    if (record.status === 'normal') return 'bg-green-500'
    if (record.status === 'leave') return 'bg-blue-500'
    if (record.status === 'overtime') return 'bg-purple-500'
    return 'bg-gray-300'
  }

  const getHighlightClass = (record) => {
    // 统一处理早退状态
    return `${record.status === 'late' || record.status === 'early' || record.status === 'early_leave' ? 'bg-red-50' : ''}`
  }

  // 渲染统计卡片
  const renderStatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">总天数</div>
            <div className="text-2xl font-bold mt-1">{stats.total_days}</div>
          </div>
          <CalendarIcon className="w-8 h-8 opacity-50" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">正常</div>
            <div className="text-2xl font-bold mt-1">{stats.normal_count}</div>
          </div>
          <CheckCircleIcon className="w-8 h-8 opacity-50" />
        </div>
        <div className="text-xs mt-1 opacity-90">出勤率 {stats.attendance_rate}%</div>
      </div>

      <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">迟到</div>
            <div className="text-2xl font-bold mt-1">{stats.late_count}</div>
          </div>
          <ExclamationCircleIcon className="w-8 h-8 opacity-50" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">早退</div>
            <div className="text-2xl font-bold mt-1">{stats.early_count}</div>
          </div>
          <ExclamationCircleIcon className="w-8 h-8 opacity-50" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg shadow-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">缺勤</div>
            <div className="text-2xl font-bold mt-1">{stats.absent_count}</div>
          </div>
          <XCircleIcon className="w-8 h-8 opacity-50" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">请假</div>
            <div className="text-2xl font-bold mt-1">{stats.leave_count}</div>
          </div>
          <ClockIcon className="w-8 h-8 opacity-50" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">加班</div>
            <div className="text-2xl font-bold mt-1">{stats.overtime_count || 0}</div>
          </div>
          <ClockIcon className="w-8 h-8 opacity-50" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">工时</div>
            <div className="text-2xl font-bold mt-1">{stats.avg_work_hours}</div>
          </div>
          <ClockIcon className="w-8 h-8 opacity-50" />
        </div>
        <div className="text-xs mt-1 opacity-90">小时/天</div>
      </div>
    </div>
  )

  // 渲染日历视图
  const renderCalendarView = () => {
    const year = selectedMonth.getFullYear()
    const month = selectedMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const days = []
    // 填充空白天数
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }
    // 填充实际天数
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    const getRecordForDay = (day) => {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      return records.find(r => {
        if (!r.record_date) return false

        let recordDate
        if (typeof r.record_date === 'string') {
          // 如果是字符串，直接提取日期部分（YYYY-MM-DD 或 ISO �格）
          // 不要转换为 Date 对象，避免时区问题
          recordDate = r.record_date.split('T')[0].split(' ')[0]
        } else {
          // 如果不是字符串（可能是 Date 对象），先转换为字符串再处理
          // 注意：这种情况不应该发生，因为后端返回的应该是字符串
          console.warn('record_date is not a string:', r.record_date, typeof r.record_date)
          recordDate = String(r.record_date).split('T')[0].split(' ')[0]
        }

        return recordDate === dateStr
      })
    }

    return (
      <div className="bg-white rounded-lg shadow p-6">
        {/* 月份选择器 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setSelectedMonth(new Date(year, month - 1))}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            ← 上月
          </button>
          <h3 className="text-xl font-bold">
            {year}年{month + 1}月
          </h3>
          <button
            onClick={() => setSelectedMonth(new Date(year, month + 1))}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            下月 →
          </button>
        </div>

        {/* 星期标题 */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* 日历格子 */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }

            const record = getRecordForDay(day)
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()

            return (
              <div
                key={day}
                onClick={() => {
                  if (record) {
                    setSelectedRecord(record)
                    setShowDetailModal(true)
                  }
                }}
                className={`
                  aspect-square border rounded-lg p-2 hover:shadow-md transition-shadow cursor-pointer
                  ${isToday ? 'border-blue-500 border-2' : 'border-gray-200'}
                  ${record ? 'bg-white hover:bg-blue-50' : 'bg-gray-50'}
                `}
              >
                <div className="text-sm font-semibold mb-1">{day}</div>
                {record && (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-600">
                      ↑ {formatDateTime(record.clock_in_time)}
                    </div>
                    <div className="text-xs text-gray-600">
                      ↓ {formatDateTime(record.clock_out_time)}
                    </div>
                    <div className="flex justify-center mt-1">
                      {getStatusBadge(record.status)}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // 渲染时间轴视图
  const renderTimelineView = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="space-y-4">
        {records.map((record, index) => (
          <div key={record.id} className="relative">
            {/* 时间轴线 */}
            {index < records.length - 1 && (
              <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200" />
            )}

            <div className="flex gap-4">
              {/* 日期圆点 */}
              <div className="flex-shrink-0">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center font-bold text-white
                  ${record.status === 'normal' ? 'bg-green-500' :
                    record.status === 'late' ? 'bg-red-500' :
                    record.status === 'early' || record.status === 'early_leave' ? 'bg-orange-500' :
                    record.status === 'leave' ? 'bg-blue-500' :
                    record.status === 'overtime' ? 'bg-purple-500' : 'bg-gray-500'}
                `}>
                  {new Date(record.record_date).getDate()}
                </div>
              </div>

              {/* 记录卡片 */}
              <div className="flex-1 bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                      <div className="font-semibold text-lg text-gray-800">{formatDate(record.record_date)}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {record.type === 'leave' ? (
                        <span>请假天数: {record.days}天</span>
                      ) : (
                        <span>工作时长: {record.work_hours ? `${record.work_hours}小时` : '未完成'}</span>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(record.status)}
                </div>

                {record.type === 'leave' ? (
                  <div className="bg-white rounded p-3 border border-blue-100">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">类型:</span>
                        <span className="ml-2 font-medium text-gray-800">{record.leave_type}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">时间:</span>
                        <span className="ml-2 font-medium text-gray-800">{record.start_date} 至 {record.end_date}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {/* 上班打卡 */}
                    <div className="flex items-center gap-3 bg-white rounded p-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xl">↑</span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">上班打卡</div>
                        <div className="font-semibold text-gray-800">
                          {formatDateTime(record.clock_in_time)}
                        </div>
                        {record.clock_in_location && (
                          <div className="text-xs text-gray-500 mt-1">
                            📍 {record.clock_in_location}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 下班打卡 */}
                    <div className="flex items-center gap-3 bg-white rounded p-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-xl">↓</span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">下班打卡</div>
                        <div className="font-semibold text-gray-800">
                          {formatDateTime(record.clock_out_time)}
                        </div>
                        {record.clock_out_location && (
                          <div className="text-xs text-gray-500 mt-1">
                            📍 {record.clock_out_location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {record.remark && (
                  <div className="mt-3 p-2 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-gray-700">
                    💬 {record.remark}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // 渲染列表视图
  const renderListView = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {loading ? (
        <div className="p-8 text-center text-gray-500">加载中...</div>
      ) : records.length === 0 ? (
        <div className="p-8 text-center text-gray-500">暂无打卡记录</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    日期
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    时间/详情
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    时长
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    备注
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((record) => (
                  <tr
                    key={record.id}
                    className={`
                      hover:bg-gray-50 transition-colors
                      ${record.status === 'late' || record.status === 'early' || record.status === 'early_leave' ? 'bg-red-50' : ''}
                      ${record.status === 'absent' ? 'bg-gray-100' : ''}
                      ${record.type === 'leave' ? 'bg-blue-50' : ''}
                      ${record.type === 'overtime' ? 'bg-purple-50' : ''}
                    `}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(record.record_date)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        record.type === 'attendance' ? 'bg-gray-100 text-gray-800' :
                        record.type === 'leave' ? 'bg-blue-100 text-blue-800' :
                        record.type === 'overtime' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {record.type === 'attendance' ? '考勤' :
                         record.type === 'leave' ? '请假' :
                         record.type === 'overtime' ? '加班' : '未知'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.type === 'leave' ? (
                        <div className="text-sm text-gray-900">
                          {record.leave_type} ({record.days}天)
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-green-600 bg-green-50 px-1 rounded">上</span>
                            <span className="text-sm text-gray-900">{formatDateTime(record.clock_in_time)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-blue-600 bg-blue-50 px-1 rounded">下</span>
                            <span className="text-sm text-gray-900">{formatDateTime(record.clock_out_time)}</span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {record.type === 'leave' ? `${record.days}天` :
                           record.work_hours ? `${record.work_hours}h` : '--'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {record.remark || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {pagination.total > 0 && (
            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700">
                  共 <span className="font-semibold">{pagination.total}</span> 条记录
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">每页显示</label>
                  <select
                    value={pagination.limit}
                    onChange={(e) => setPagination({ ...pagination, limit: parseInt(e.target.value), page: 1 })}
                    className="border rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
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
                  className="px-4 py-2 border rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                  className="px-4 py-2 border rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )

  // 渲染详情模态框
  const renderDetailModal = () => {
    if (!showDetailModal || !selectedRecord) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* 模态框头部 */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">打卡详情</h3>
              <p className="text-sm opacity-90 mt-1">{formatDate(selectedRecord.record_date)}</p>
            </div>
            <button
              onClick={() => setShowDetailModal(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 模态框内容 */}
          <div className="p-6 space-y-6">
            {/* 状态卡片 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600">考勤状态</div>
                <div className="mt-2">{getStatusBadge(selectedRecord.status)}</div>
              </div>
              {selectedRecord.work_hours && (
                <div className="text-right">
                  <div className="text-sm text-gray-600">工作时长</div>
                  <div className="text-2xl font-bold text-gray-800 mt-1">
                    {selectedRecord.work_hours} <span className="text-sm font-normal">小时</span>
                  </div>
                </div>
              )}
            </div>

            {/* 打卡信息 */}
            {selectedRecord.type === 'leave' ? (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h4 className="font-semibold text-blue-800 mb-2">请假详情</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-blue-600">开始时间</div>
                    <div className="font-medium">{selectedRecord.start_date}</div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-600">结束时间</div>
                    <div className="font-medium">{selectedRecord.end_date}</div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-600">请假类型</div>
                    <div className="font-medium">{selectedRecord.leave_type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-600">天数</div>
                    <div className="font-medium">{selectedRecord.days}天</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 上班打卡 */}
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-2xl">↑</span>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">上班打卡</div>
                      <div className="text-xl font-bold text-gray-800">
                        {formatDateTime(selectedRecord.clock_in_time)}
                      </div>
                    </div>
                  </div>
                  {selectedRecord.clock_in_location && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{selectedRecord.clock_in_location}</span>
                    </div>
                  )}
                </div>

                {/* 下班打卡 */}
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-2xl">↓</span>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">下班打卡</div>
                      <div className="text-xl font-bold text-gray-800">
                        {formatDateTime(selectedRecord.clock_out_time)}
                      </div>
                    </div>
                  </div>
                  {selectedRecord.clock_out_location && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{selectedRecord.clock_out_location}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 备注信息 */}
            {selectedRecord.remark && (
              <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <div>
                    <div className="font-semibold text-gray-800 mb-1">备注</div>
                    <div className="text-gray-700">{selectedRecord.remark}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 详细信息 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">详细信息</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">记录ID：</span>
                  <span className="text-gray-800 font-medium">{selectedRecord.id}</span>
                </div>
                <div>
                  <span className="text-gray-600">日期：</span>
                  <span className="text-gray-800 font-medium">{selectedRecord.record_date}</span>
                </div>
                {selectedRecord.overtime_hours > 0 && (
                  <div>
                    <span className="text-gray-600">加班时长：</span>
                    <span className="text-gray-800 font-medium">{selectedRecord.overtime_hours}小时</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 模态框底部 */}
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
            <button
              onClick={() => setShowDetailModal(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 头部 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">打卡记录</h1>
            <p className="text-gray-600 mt-1">查看您的考勤打卡历史记录</p>
          </div>
          <button
            onClick={exportRecords}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            导出记录
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      {renderStatsCards()}

      {/* 状态筛选按钮 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { id: 'all', name: '全部' },
          { id: 'normal', name: '正常' },
          { id: 'late', name: '迟到' },
          { id: 'early', name: '早退' },
          { id: 'absent', name: '缺勤' },
          { id: 'leave', name: '请假' },
          { id: 'overtime', name: '加班' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.status === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* 筛选器和视图切换 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end justify-between">
          {/* 左侧筛选 */}
          <div className="flex flex-wrap gap-4 items-end">
            {/* 快捷筛选 */}
            <div className="flex gap-2">
              <button
                onClick={() => handleQuickFilter('today')}
                className={`px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors ${
                  filters.start_date === new Date().toISOString().split('T')[0] ? 'bg-blue-50 border-blue-500' : ''
                }`}
              >
                今天
              </button>
              <button
                onClick={() => handleQuickFilter('week')}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                本周
              </button>
              <button
                onClick={() => handleQuickFilter('month')}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                本月
              </button>
              <button
                onClick={() => handleQuickFilter('all')}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                全部
              </button>
            </div>

            {/* 日期范围 */}
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">至</span>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 状态筛选 */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部状态</option>
              <option value="normal">正常</option>
              <option value="late">迟到</option>
              <option value="early">早退</option>
              <option value="absent">缺勤</option>
              <option value="leave">请假</option>
            </select>
          </div>

          {/* 右侧视图切换 */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              列表视图
            </button>
            <button
              onClick={() => {
                setViewMode('calendar')
                // 切换到日历视图时，如果没有选择月份，默认为当前月份
                if (!selectedMonth) {
                  setSelectedMonth(new Date())
                }
              }}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewMode === 'calendar' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              日历视图
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewMode === 'timeline' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              时间轴
            </button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      {viewMode === 'list' && renderListView()}
      {viewMode === 'calendar' && renderCalendarView()}
      {viewMode === 'timeline' && renderTimelineView()}

      {/* 详情模态框 */}
      {renderDetailModal()}
    </div>
  )
}
