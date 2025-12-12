import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { DatePicker, TimePicker, DateTimePicker } from '@/components/ui/date-picker'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import axios from 'axios'
import { toast } from 'sonner'
import { getCurrentUser, isSystemAdmin } from '../../utils/auth'
import { getApiUrl } from '../../utils/apiConfig'

// 辅助函数：获取星期几
const getWeekday = (date) => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[date.getDay()]
}

export default function ScheduleManagement() {
  const [schedules, setSchedules] = useState([])
  const [employees, setEmployees] = useState([])
  const [shifts, setShifts] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedMonth, setSelectedMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  })

  // 辅助函数：获取每月天数
  const getDaysInMonth = () => {
    return new Date(selectedMonth.year, selectedMonth.month, 0).getDate()
  }

  const [showBatchModal, setShowBatchModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [scheduleModalData, setScheduleModalData] = useState({
    employee: null,
    date: null,
    dateStr: '',
    existing: null
  })
  const [batchData, setBatchData] = useState({
    employee_ids: [],
    shift_id: '',
    start_date: '',
    end_date: ''
  })

  // 班次颜色样式生成器
  const getShiftStyle = (color) => {
    if (!color) return {}

    // 计算颜色亮度的辅助函数
    const getContrastColor = (hexColor) => {
      // 移除 # 号
      const hex = hexColor.replace('#', '')

      // 解析 RGB
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)

      // 计算亮度 (YIQ 公式)
      const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000

      // 如果亮度高（浅色），返回深色文字；否则返回浅色文字
      // 这里我们使用稍微柔和一点的黑白色
      return yiq >= 128 ? '#1f2937' : '#ffffff'
    }

    return {
      backgroundColor: color, // 使用实色背景，或者可以使用 `${color}CC` 增加一点透明度
      color: getContrastColor(color), // 自动计算对比色文字
      borderColor: color,
      fontWeight: '500',
      textShadow: '0 1px 2px rgba(0,0,0,0.1)' // 增加一点文字阴影提高可读性
    }
  }

  useEffect(() => {
    fetchDepartments()
    fetchShifts()
  }, [])

  useEffect(() => {
    if (selectedDepartment) {
      fetchShifts() // 重新获取班次（包含部门班次）
      fetchEmployees()
      fetchSchedules()
    }
  }, [selectedDepartment, selectedMonth])

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const response = await axios.get(getApiUrl('/api/departments/list'), { headers })
      if (response.data.success) {
        const activeDepts = response.data.data.filter(d => d.status === 'active')

        setDepartments(activeDepts)
        if (activeDepts.length > 0) {
          setSelectedDepartment(activeDepts[0].id)
        } else {
          toast.warning('没有可用的部门，请联系管理员配置部门权限')
        }
      } else {
        console.error('获取部门列表失败:', response.data.message)
        setDepartments([])
      }
    } catch (error) {
      console.error('获取部门列表失败:', error)
      toast.error('获取部门列表失败，请刷新页面重试')
      setDepartments([])
    }
  }

  const fetchShifts = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      // 获取全公司通用班次（department_id 为 null）
      const globalResponse = await axios.get(getApiUrl('/api/shifts'), {
        params: { department_id: 'null', is_active: 1, limit: 100 },
        headers
      })

      // 获取当前部门的班次
      let deptShifts = []
      if (selectedDepartment) {
        const deptResponse = await axios.get(getApiUrl('/api/shifts'), {
          params: { department_id: selectedDepartment, is_active: 1, limit: 100 },
          headers
        })
        if (deptResponse.data.success) {
          deptShifts = deptResponse.data.data
        }
      }

      // 合并全公司通用班次和部门班次，并去重
      const globalShifts = globalResponse.data.success ? globalResponse.data.data : []
      const allShifts = [...globalShifts, ...deptShifts]

      // 根据 ID 去重
      const uniqueShifts = allShifts.filter((shift, index, self) =>
        index === self.findIndex((s) => s.id === shift.id)
      )

      setShifts(uniqueShifts)
    } catch (error) {
      console.error('获取班次列表失败:', error)
    }
  }

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const response = await axios.get(getApiUrl('/api/employees'), { headers })
      if (response.data) {
        // 根据选中的部门筛选员工
        const deptEmployees = response.data.filter(
          e => e.department_id == selectedDepartment && e.status === 'active'
        )
        setEmployees(deptEmployees)
      }
    } catch (error) {
      console.error('获取员工列表失败:', error)
    }
  }

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const startDate = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}-01`
      // 修复月末日期计算问题
      const lastDay = new Date(selectedMonth.year, selectedMonth.month, 0).getDate()
      const endDate = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const response = await axios.get(getApiUrl('/api/schedules'), {
        params: {
          department_id: selectedDepartment,
          start_date: startDate,
          end_date: endDate
        },
        headers
      })

      if (response.data.success) {
        // 创建新数组，确保 React 检测到变化
        const newSchedules = [...response.data.data]
        setSchedules(newSchedules)
      }
    } catch (error) {
      console.error('获取排班数据失败:', error)
      toast.error('获取排班数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePrevMonth = () => {
    setSelectedMonth(prev => {
      const newMonth = prev.month - 1
      if (newMonth < 1) {
        return { year: prev.year - 1, month: 12 }
      }
      return { ...prev, month: newMonth }
    })
  }

  const handleNextMonth = () => {
    setSelectedMonth(prev => {
      const newMonth = prev.month + 1
      if (newMonth > 12) {
        return { year: prev.year + 1, month: 1 }
      }
      return { ...prev, month: newMonth }
    })
  }

  const handleMonthChange = (year, month) => {
    setSelectedMonth({ year, month })
  }

  const handleThisMonth = () => {
    const now = new Date()
    handleMonthChange(now.getFullYear(), now.getMonth() + 1)
  }

  const isCurrentMonth = () => {
    const now = new Date()
    return selectedMonth.year === now.getFullYear() && selectedMonth.month === now.getMonth() + 1
  }

  const handleCellClick = (employee, date) => {
    const dateStr = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}-${String(date).padStart(2, '0')}`

    // 查找现有排班（使用最新的 schedules 状态）
    // 兼容多种日期格式：纯日期字符串、Date对象、ISO字符串
    const existing = schedules.find(s => {
      if (s.employee_id !== employee.id) return false

      // 提取日期部分进行比较
      let scheduleDate = s.schedule_date
      if (scheduleDate instanceof Date) {
        scheduleDate = scheduleDate.toISOString().split('T')[0]
      } else if (typeof scheduleDate === 'string') {
        scheduleDate = scheduleDate.split('T')[0]
      }

      return scheduleDate === dateStr
    })

    // 打开模态框，确保使用最新数据
    setScheduleModalData({
      employee,
      date,
      dateStr,
      existing,
      selectedShiftId: existing?.shift_id?.toString() || ''
    })
    setShowScheduleModal(true)
  }

  const handleScheduleSubmit = async () => {
    if (submitting) return // 防止重复提交

    const { employee, dateStr, existing, selectedShiftId } = scheduleModalData
    const is_rest_day = selectedShiftId === ''

    // 将 shift_id 转换为数字（如果不为空）
    const shift_id = selectedShiftId ? parseInt(selectedShiftId) : null

    const requestData = {
      employee_id: employee.id,
      shift_id,
      schedule_date: dateStr,
      is_rest_day
    }

    setSubmitting(true)
    try {
      if (existing) {
        // 更新
        await axios.put(getApiUrl(`/api/schedules/${existing.id}`), {
          shift_id,
          is_rest_day
        })
      } else {
        // 创建
        const response = await axios.post(getApiUrl('/api/schedules'), {
          employee_id: employee.id,
          shift_id,
          schedule_date: dateStr,
          is_rest_day
        })
      }

      // 立即刷新排班数据（等待完成）
      await fetchSchedules()

      // 关闭模态框
      setShowScheduleModal(false)

      // 显示成功提示
      toast.success('排班设置成功')
    } catch (error) {
      console.error('排班设置失败:', error)
      toast.error(error.response?.data?.message || '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBatchSchedule = () => {
    setBatchData({
      employee_ids: [],
      shift_id: '',
      start_date: '',
      end_date: ''
    })
    setShowBatchModal(true)
  }

  // 下载导入模板
  const handleDownloadTemplate = () => {
    const month = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}`
    window.open(getApiUrl(`/api/schedules/template?department_id=${selectedDepartment}&month=${month}`), '_blank')
    toast.success('正在下载模板...')
  }

  // 导入Excel
  const handleImportExcel = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('department_id', selectedDepartment)
    formData.append('year', selectedMonth.year)
    formData.append('month', selectedMonth.month)

    try {
      const response = await axios.post(`${API_BASE_URL}/api/schedules/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.data.success) {
        toast.success(`导入成功！共导入 ${response.data.count} 条排班记录`)
        fetchSchedules()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '导入失败')
    }

    // 清空文件选择
    e.target.value = ''
  }

  // 导出Excel
  const handleExportExcel = () => {
    const month = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}`
    window.open(getApiUrl(`/api/schedules/export?department_id=${selectedDepartment}&month=${month}`), '_blank')
    toast.success('正在导出...')
  }

  const handleBatchSubmit = async (e) => {
    e.preventDefault()

    if (batchData.employee_ids.length === 0) {
      toast.error('请选择员工')
      return
    }

    try {
      const startDate = new Date(batchData.start_date)
      const endDate = new Date(batchData.end_date)
      const schedules = []

      // 生成日期范围内的所有排班
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]
        batchData.employee_ids.forEach(emp_id => {
          schedules.push({
            employee_id: emp_id,
            shift_id: batchData.shift_id || null,
            schedule_date: dateStr,
            is_rest_day: !batchData.shift_id
          })
        })
      }

      const response = await axios.post(getApiUrl('/api/schedules/batch'), { schedules })
      if (response.data.success) {
        toast.success(response.data.message)
        setShowBatchModal(false)
        fetchSchedules()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '批量排班失败')
    }
  }

  // 获取员工某天的排班
  const getSchedule = (employeeId, date) => {
    const dateStr = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}-${String(date).padStart(2, '0')}`

    // 兼容多种日期格式进行比较
    const schedule = schedules.find(s => {
      if (s.employee_id !== employeeId) return false

      // 提取日期部分进行比较
      let scheduleDate = s.schedule_date
      if (scheduleDate instanceof Date) {
        scheduleDate = scheduleDate.toISOString().split('T')[0]
      } else if (typeof scheduleDate === 'string') {
        scheduleDate = scheduleDate.split('T')[0]
      }

      const match = scheduleDate === dateStr

      // 详细调试日志
      if (date === 13 && employeeId === employees[0]?.id) {  // 调试今天的日期
      }

      return match
    })

    return schedule
  }

  const daysInMonth = getDaysInMonth()

  return (
    <div className="p-4">
      {/* 头部 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">排班管理</h1>
          <p className="text-gray-600 text-sm">管理员工的工作排班</p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={handleDownloadTemplate}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-sm"
            title="下载Excel导入模板"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            下载模板
          </button>
          <Label className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            导入Excel
            <Input  type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              className="hidden"
            />
          </Label>
          <Button onClick={handleExportExcel} size="sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            导出Excel
          </Button>
          <Button onClick={handleBatchSchedule} size="sm">
            批量排班
          </Button>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="bg-white rounded-lg shadow p-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* 部门选择 */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              选择部门
            </Label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
            >
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* 月份选择 - 与部门统计相同的样式 */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              选择月份
            </Label>
            <div className="flex items-stretch gap-2">
              {/* 上一月按钮 */}
              <button
                onClick={handlePrevMonth}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center"
                title="上个月"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* 日期选择区域 */}
              <div className="flex-1 flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-2xl">📅</span>
                  <select
                    value={selectedMonth.year}
                    onChange={(e) => handleMonthChange(parseInt(e.target.value), selectedMonth.month)}
                    className="bg-transparent border-none text-xl font-bold text-gray-800 focus:outline-none focus:ring-0 cursor-pointer pr-1"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <span className="text-xl font-bold text-gray-700">年</span>

                  <select
                    value={selectedMonth.month}
                    onChange={(e) => handleMonthChange(selectedMonth.year, parseInt(e.target.value))}
                    className="bg-transparent border-none text-xl font-bold text-gray-800 focus:outline-none focus:ring-0 cursor-pointer pr-1"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  <span className="text-xl font-bold text-gray-700">月</span>
                </div>

                {/* 本月按钮 - 始终显示 */}
                <button
                  onClick={handleThisMonth}
                  disabled={isCurrentMonth()}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    isCurrentMonth()
                      ? 'bg-blue-500 text-white cursor-default shadow-md'
                      : 'bg-white text-blue-600 border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400'
                  }`}
                  title={isCurrentMonth() ? '当前月份' : '返回本月'}
                >
                  {isCurrentMonth() ? '✓ 本月' : '回到本月'}
                </button>
              </div>

              {/* 下一月按钮 */}
              <button
                onClick={handleNextMonth}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center"
                title="下个月"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 排班日历 */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <div className="p-6 text-center text-gray-500 text-sm">加载中...</div>
        ) : employees.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">该部门暂无员工</div>
        ) : (
          <Table className="w-full text-xs">
            <TableHeader className="bg-gray-50 sticky top-0">
              <TableRow>
                <TableHead className="px-3 py-2 text-left font-medium text-gray-700 border-r">
                  员工
                </TableHead>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const date = new Date(selectedMonth.year, selectedMonth.month - 1, day);
                  const weekday = getWeekday(date);
                  return (
                    <TableHead key={day} className="px-1.5 py-2 text-center font-medium text-gray-700 border-r bg-gray-50">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-xs font-semibold text-gray-500">{weekday}</span>
                        <span className="text-sm font-bold text-gray-800">{day}</span>
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id} className="border-t hover:bg-gray-50">
                  <TableCell className="px-3 py-2 font-medium text-gray-800 border-r whitespace-nowrap">
                    {employee.real_name}
                  </TableCell>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const schedule = getSchedule(employee.id, day)
                    const shiftStyle = schedule?.color ? getShiftStyle(schedule.color) : {}

                    return (
                      <TableCell key={day}
                        onClick={() => handleCellClick(employee, day)}
                        className={`px-1.5 py-2 text-center border-r cursor-pointer transition-all ${
                          schedule
                            ? 'hover:opacity-80 font-medium'
                            : 'hover:bg-blue-50'
                        }`}
                        style={schedule && schedule.color ? getShiftStyle(schedule.color) : {}}
                      >
                        {schedule?.shift_name || '-'}
                        {/* 如果是休息日且有请假记录，显示红点 */}
                        {(schedule?.is_rest_day == 1 || schedule?.is_rest_day === true) && (
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 单个排班模态框 */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">设置排班</h2>

            <div className="space-y-4">
              {/* 员工信息 */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">员工</div>
                <div className="text-lg font-semibold text-gray-800">
                  {scheduleModalData.employee?.real_name}
                </div>
              </div>

              {/* 日期信息 */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">日期</div>
                <div className="text-lg font-semibold text-gray-800">
                  {scheduleModalData.dateStr}
                </div>
              </div>

              {/* 选择班次 */}
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  选择班次 <span className="text-red-500">*</span>
                </Label>
                <select
                  value={scheduleModalData.selectedShiftId}
                  onChange={(e) => setScheduleModalData({
                    ...scheduleModalData,
                    selectedShiftId: e.target.value
                  })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {/* 未排班选项 */}
                  <option value="">未排班</option>

                  {/* 全公司通用班次 */}
                  {shifts.filter(s => !s.department_id).length > 0 && (
                    <optgroup label="━━ 全公司通用班次 ━━">
                      {shifts.filter(s => !s.department_id).map((shift) => (
                        <option key={shift.id} value={shift.id}>
                          {shift.name} ({shift.start_time} - {shift.end_time})
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {/* 部门专属班次 - 按部门分组 */}
                  {(() => {
                    const deptShifts = shifts.filter(s => s.department_id)
                    if (deptShifts.length === 0) return null

                    // 按部门分组
                    const deptGroups = {}
                    deptShifts.forEach(shift => {
                      const deptKey = shift.department_name || `部门${shift.department_id}`
                      if (!deptGroups[deptKey]) {
                        deptGroups[deptKey] = []
                      }
                      deptGroups[deptKey].push(shift)
                    })

                    // 为每个部门创建一个 optgroup
                    return Object.keys(deptGroups).map(deptName => (
                      <optgroup key={deptName} label={`━━ ${deptName} ━━`}>
                        {deptGroups[deptName].map(shift => (
                          <option key={shift.id} value={shift.id}>
                            {shift.name}
                            {shift.department_name && !shift.name.includes(shift.department_name) ? ` (${shift.department_name})` : ''}
                            {' '}({shift.start_time} - {shift.end_time})
                          </option>
                        ))}
                      </optgroup>
                    ))
                  })()}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleScheduleSubmit} disabled={submitting}>
                {submitting ? '保存中...' : '确定'}
              </Button>
              <Button onClick={() => setShowScheduleModal(false)} disabled={submitting}>
                取消
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 批量排班模态框 */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">批量排班</h2>

            <form onSubmit={handleBatchSubmit}>
              <div className="space-y-4">
                {/* 选择员工 */}
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    选择员工 <span className="text-red-500">*</span>
                  </Label>
                  <div className="border rounded p-3 max-h-40 overflow-y-auto">
                    {employees.map((emp) => (
                      <Label key={emp.id} className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          checked={batchData.employee_ids.includes(emp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBatchData({
                                ...batchData,
                                employee_ids: [...batchData.employee_ids, emp.id]
                              })
                            } else {
                              setBatchData({
                                ...batchData,
                                employee_ids: batchData.employee_ids.filter(id => id !== emp.id)
                              })
                            }
                          }}
                        />
                        <span>{emp.real_name}</span>
                      </Label>
                    ))}
                  </div>
                </div>

                {/* 选择班次 */}
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    选择班次
                  </Label>
                  <select
                    value={batchData.shift_id}
                    onChange={(e) => setBatchData({ ...batchData, shift_id: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    {/* 未排班选项 */}
                    <option value="">未排班</option>
                    {/* 全公司通用班次 */}
                    {shifts.filter(s => !s.department_id).length > 0 && (
                      <optgroup label="━━ 全公司通用班次 ━━">
                        {shifts.filter(s => !s.department_id).map((shift) => (
                          <option key={shift.id} value={shift.id}>
                            {shift.name} ({shift.start_time} - {shift.end_time})
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {/* 部门专属班次 */}
                    {shifts.filter(s => s.department_id).length > 0 && (
                      <optgroup label="━━ 部门专属班次 ━━">
                        {shifts.filter(s => s.department_id).map((shift) => (
                          <option key={shift.id} value={shift.id}>
                            {shift.name}
                            {shift.department_name && !shift.name.includes(shift.department_name) ? ` (${shift.department_name})` : ''}
                            {' '}({shift.start_time} - {shift.end_time})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* 日期范围 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      开始日期 <span className="text-red-500">*</span>
                    </Label>
                    <input
                      type="date"
                      required
                      value={batchData.start_date}
                      onChange={(e) => setBatchData({ ...batchData, start_date: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      结束日期 <span className="text-red-500">*</span>
                    </Label>
                    <input
                      type="date"
                      required
                      value={batchData.end_date}
                      onChange={(e) => setBatchData({ ...batchData, end_date: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition-colors"
                >
                  确定
                </button>
                <Button type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded transition-colors"
                >
                  取消
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
