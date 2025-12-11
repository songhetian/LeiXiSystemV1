// [SHADCN-REPLACED]
import { useState, useEffect } from 'react'
import { formatDate, formatBeijingDate, getBeijingDate } from '../../utils/date'
import axios from 'axios'
import { motion } from 'framer-motion'
import { getApiUrl } from '../../utils/apiConfig'

// Shadcn UI Components
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Badge } from '../../components/ui/badge'
import { Calendar } from '../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs'
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
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  AlertCircle as ExclamationCircleIcon,
  BarChart as ChartBarIcon,
  Download as DocumentArrowDownIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

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
      // 使用Shadcn UI Toast组件替代react-toastify
      // toast.error('获取员工信息失败')
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
      // 使用Shadcn UI Toast组件替代react-toastify
      // toast.error('获取考勤记录失败')
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
    // 使用Shadcn UI Toast组件替代react-toastify
    // toast.success('导出成功')
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
      <MotionCard
        className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-4 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">总天数</div>
            <div className="text-2xl font-bold mt-1">{stats.total_days}</div>
          </div>
          <CalendarIcon className="w-8 h-8 opacity-50" />
        </div>
      </MotionCard>

      <MotionCard
        className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-4 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">正常</div>
            <div className="text-2xl font-bold mt-1">{stats.normal_count}</div>
          </div>
          <CheckCircleIcon className="w-8 h-8 opacity-50" />
        </div>
        <div className="text-xs mt-1 opacity-90">出勤率 {stats.attendance_rate}%</div>
      </MotionCard>

      <MotionCard
        className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-4 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">迟到</div>
            <div className="text-2xl font-bold mt-1">{stats.late_count}</div>
          </div>
          <ExclamationCircleIcon className="w-8 h-8 opacity-50" />
        </div>
      </MotionCard>

      <MotionCard
        className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-4 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">早退</div>
            <div className="text-2xl font-bold mt-1">{stats.early_count}</div>
          </div>
          <ExclamationCircleIcon className="w-8 h-8 opacity-50" />
        </div>
      </MotionCard>

      <MotionCard
        className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg shadow-lg p-4 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">缺勤</div>
            <div className="text-2xl font-bold mt-1">{stats.absent_count}</div>
          </div>
          <XCircleIcon className="w-8 h-8 opacity-50" />
        </div>
      </MotionCard>

      <MotionCard
        className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-lg p-4 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">请假</div>
            <div className="text-2xl font-bold mt-1">{stats.leave_count}</div>
          </div>
          <ClockIcon className="w-8 h-8 opacity-50" />
        </div>
      </MotionCard>

      <MotionCard
        className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-4 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">加班</div>
            <div className="text-2xl font-bold mt-1">{stats.overtime_count || 0}</div>
          </div>
          <ClockIcon className="w-8 h-8 opacity-50" />
        </div>
      </MotionCard>

      <MotionCard
        className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-4 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">工时</div>
            <div className="text-2xl font-bold mt-1">{stats.avg_work_hours}</div>
          </div>
          <ClockIcon className="w-8 h-8 opacity-50" />
        </div>
        <div className="text-xs mt-1 opacity-90">小时/天</div>
      </MotionCard>
    </div>
  )

  // 渲染日历视图
  const renderCalendarView = () => {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-center mb-4">
            {selectedMonth.getFullYear()}年{selectedMonth.getMonth() + 1}月
          </h3>
          <div className="flex justify-center">
            <Button
              onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
              variant="outline"
              size="sm"
              className="mr-2"
            >
              ← 上月
            </Button>
            <Button
              onClick={() => setSelectedMonth(new Date())}
              variant="outline"
              size="sm"
            >
              今天
            </Button>
            <Button
              onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
              variant="outline"
              size="sm"
              className="ml-2"
            >
              下月 →
            </Button>
          </div>
        </div>

        <Calendar
          mode="single"
          selected={selectedMonth}
          onSelect={(date) => {
            if (date) {
              setSelectedMonth(date);
            }
          }}
          className="rounded-md border"
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
            day_range_end: "day-range-end",
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
          }}
        />
      </div>
    );
  }

  // 渲染时间轴视图
  const renderTimelineView = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="space-y-4">
        {records.map((record, index) => (
          <motion.div
            key={record.id}
            className="relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
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
              <MotionCard className="flex-1 bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
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
              </MotionCard>
            </div>
          </motion.div>
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
          <MotionTable className="w-full">
            <MotionTableHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <MotionTableRow>
                <MotionTableHead className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  日期
                </MotionTableHead>
                <MotionTableHead className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  类型
                </MotionTableHead>
                <MotionTableHead className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  时间/详情
                </MotionTableHead>
                <MotionTableHead className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  时长
                </MotionTableHead>
                <MotionTableHead className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  状态
                </MotionTableHead>
                <MotionTableHead className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  备注
                </MotionTableHead>
              </MotionTableRow>
            </MotionTableHeader>
            <MotionTableBody className="divide-y divide-gray-200">
              {records.map((record) => (
                <MotionTableRow
                  key={record.id}
                  className={`
                    hover:bg-gray-50 transition-colors
                    ${record.status === 'late' || record.status === 'early' || record.status === 'early_leave' ? 'bg-red-50' : ''}
                    ${record.status === 'absent' ? 'bg-gray-100' : ''}
                    ${record.type === 'leave' ? 'bg-blue-50' : ''}
                    ${record.type === 'overtime' ? 'bg-purple-50' : ''}
                  `}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(0,0,0,0.02)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <MotionTableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(record.record_date)}
                        </div>
                      </div>
                    </div>
                  </MotionTableCell>
                  <MotionTableCell className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      record.type === 'attendance' ? 'bg-gray-100 text-gray-800' :
                      record.type === 'leave' ? 'bg-blue-100 text-blue-800' :
                      record.type === 'overtime' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {record.type === 'attendance' ? '考勤' :
                       record.type === 'leave' ? '请假' :
                       record.type === 'overtime' ? '加班' : '未知'}
                    </span>
                  </MotionTableCell>
                  <MotionTableCell className="px-6 py-4 whitespace-nowrap">
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
                  </MotionTableCell>
                  <MotionTableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {record.type === 'leave' ? `${record.days}天` :
                         record.work_hours ? `${record.work_hours}h` : '--'}
                      </span>
                    </div>
                  </MotionTableCell>
                  <MotionTableCell className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(record.status)}
                  </MotionTableCell>
                  <MotionTableCell className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {record.remark || '--'}
                  </MotionTableCell>
                </MotionTableRow>
              ))}
            </MotionTableBody>
          </MotionTable>

          {/* 分页 */}
          {pagination.total > 0 && (
            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700">
                  共 <span className="font-semibold">{pagination.total}</span> 条记录
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">每页显示</label>
                  <Select value={pagination.limit.toString()} onValueChange={(value) => setPagination({ ...pagination, limit: parseInt(value), page: 1 })}>
                    <SelectTrigger className="border rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10条</SelectItem>
                      <SelectItem value="20">20条</SelectItem>
                      <SelectItem value="50">50条</SelectItem>
                      <SelectItem value="100">100条</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  第 {pagination.page} / {Math.ceil(pagination.total / pagination.limit)} 页
                </span>
                <Button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  variant="outline"
                  size="sm"
                >
                  上一页
                </Button>
                <Button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
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
    </div>
  )

  // 渲染详情模态框
  const renderDetailModal = () => {
    if (!showDetailModal || !selectedRecord) return null

    return (
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg -m-6 mb-6">
            <div>
              <DialogTitle className="text-xl font-bold">打卡详情</DialogTitle>
              <DialogDescription className="text-sm opacity-90 mt-1 text-white">
                {formatDate(selectedRecord.record_date)}
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* 模态框内容 */}
          <div className="space-y-6">
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
          <DialogFooter className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t -mx-6 -mb-6 mt-6 rounded-b-lg">
            <Button onClick={() => setShowDetailModal(false)} variant="outline">
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
          <Button
            onClick={exportRecords}
            className="flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            导出记录
          </Button>
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
          <Button
            key={tab.id}
            onClick={() => handleStatusFilter(tab.id)}
            variant={filters.status === tab.id ? "default" : "outline"}
            size="sm"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.status === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {tab.name}
          </Button>
        ))}
      </div>

      {/* 筛选器和视图切换 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end justify-between">
          {/* 左侧筛选 */}
          <div className="flex flex-wrap gap-4 items-end">
            {/* 快捷筛选 */}
            <div className="flex gap-2">
              <Button
                onClick={() => handleQuickFilter('today')}
                variant="outline"
                className={`px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors ${
                  filters.start_date === new Date().toISOString().split('T')[0] ? 'bg-blue-50 border-blue-500' : ''
                }`}
              >
                今天
              </Button>
              <Button
                onClick={() => handleQuickFilter('week')}
                variant="outline"
              >
                本周
              </Button>
              <Button
                onClick={() => handleQuickFilter('month')}
                variant="outline"
              >
                本月
              </Button>
              <Button
                onClick={() => handleQuickFilter('all')}
                variant="outline"
              >
                全部
              </Button>
            </div>

            {/* 日期范围 */}
            <div className="flex gap-2 items-center">
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">至</span>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 状态筛选 */}
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 w-[180px]">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="normal">正常</SelectItem>
                <SelectItem value="late">迟到</SelectItem>
                <SelectItem value="early">早退</SelectItem>
                <SelectItem value="absent">缺勤</SelectItem>
                <SelectItem value="leave">请假</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 右侧视图切换 */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <Button
              onClick={() => setViewMode('list')}
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              列表视图
            </Button>
            <Button
              onClick={() => {
                setViewMode('calendar')
                // 切换到日历视图时，如果没有选择月份，默认为当前月份
                if (!selectedMonth) {
                  setSelectedMonth(new Date())
                }
              }}
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewMode === 'calendar' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              日历视图
            </Button>
            <Button
              onClick={() => setViewMode('timeline')}
              variant={viewMode === 'timeline' ? 'default' : 'ghost'}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewMode === 'timeline' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              时间轴
            </Button>
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
