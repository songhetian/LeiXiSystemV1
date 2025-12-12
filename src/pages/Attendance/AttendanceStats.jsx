import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import axios from 'axios'
import { toast } from 'sonner'
import { getApiUrl } from '../../utils/apiConfig'


export default function AttendanceStats() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  })
  const [employee, setEmployee] = useState(null)
  const [user, setUser] = useState(null)

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
    }
  }

  useEffect(() => {
    if (employee) {
      fetchMonthlyReport()
    }
  }, [selectedMonth, employee])

  const fetchMonthlyReport = async () => {
    if (!employee) return
    setLoading(true)
    try {
      const response = await axios.get(getApiUrl('/api/attendance/monthly-report'), {
        params: {
          employee_id: employee.id,
          year: selectedMonth.year,
          month: selectedMonth.month
        }
      })
      if (response.data.success) {
        setReport(response.data.data)
      }
    } catch (error) {
      toast.error('获取考勤报表失败')
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

  const calculateAttendanceRate = () => {
    if (!report) return 0
    const workDays = 22
    const actualDays = report.attendance.clock_in_days
    return ((actualDays / workDays) * 100).toFixed(1)
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="mb-3">
        <h1 className="text-xl font-bold text-gray-800">我的考勤统计</h1>
        <p className="text-sm text-gray-600">查看个人考勤数据</p>
      </div>

      <div className="bg-white rounded-lg shadow p-2.5 mb-3">
        <div className="flex items-center justify-between">
          <Button onClick={handlePrevMonth} size="sm">← 上月</Button>
          <div className="font-semibold text-sm">{selectedMonth.year}年 {selectedMonth.month}月</div>
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                if (employee) {
                  const startDate = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}-01`
                  const endDate = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}-31`
                  window.open(getApiUrl(`/api/export/attendance/${employee.id}?startDate=${startDate}&endDate=${endDate}`), '_blank')
                }
              }}
              className="px-2.5 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              📥 导出
            </button>
            <Button onClick={handleNextMonth} size="sm">下月 →</Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500 text-sm">加载中...</div>
      ) : !report ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500 text-sm">暂无数据</div>
      ) : (
        <>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-3 mb-3 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs opacity-90 mb-0.5">本月出勤率</div>
                <div className="text-2xl font-bold">{calculateAttendanceRate()}%</div>
              </div>
              <div className="text-right text-xs opacity-90">
                <div>打卡 {report.attendance.clock_in_days} 天</div>
                <div>工作日 22 天</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <div className="bg-white rounded-lg shadow p-2.5">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-gray-600">正常</span>
                <span className="text-base">✅</span>
              </div>
              <div className="text-lg font-bold text-green-600">{report.attendance.normal_days}</div>
              <div className="text-xs text-gray-500">天</div>
            </div>
            <div className="bg-white rounded-lg shadow p-2.5">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-gray-600">迟到</span>
                <span className="text-base">⏰</span>
              </div>
              <div className="text-lg font-bold text-red-600">{report.attendance.late_days}</div>
              <div className="text-xs text-gray-500">次</div>
            </div>
            <div className="bg-white rounded-lg shadow p-2.5">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-gray-600">早退</span>
                <span className="text-base">🏃</span>
              </div>
              <div className="text-lg font-bold text-orange-600">{report.attendance.early_days}</div>
              <div className="text-xs text-gray-500">次</div>
            </div>
            <div className="bg-white rounded-lg shadow p-2.5">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-gray-600">缺勤</span>
                <span className="text-base">❌</span>
              </div>
              <div className="text-lg font-bold text-gray-600">{report.attendance.absent_days}</div>
              <div className="text-xs text-gray-500">天</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div className="bg-white rounded-lg shadow p-3">
              <h3 className="text-sm font-semibold mb-2 text-gray-700">工作时长</h3>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">总时长</span>
                  <span className="text-base font-bold text-blue-600">{report.attendance.total_work_hours.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">日均</span>
                  <span className="text-base font-bold text-green-600">
                    {report.attendance.clock_in_days > 0 ? (report.attendance.total_work_hours / report.attendance.clock_in_days).toFixed(1) : 0}h
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-3">
              <h3 className="text-sm font-semibold mb-2 text-gray-700">请假统计</h3>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                {[
                  { key: 'annual', label: '年假', icon: '🏖️' },
                  { key: 'sick', label: '病假', icon: '🤒' },
                  { key: 'personal', label: '事假', icon: '📋' }
                ].map((type) => (
                  <div key={type.key}>
                    <div className="text-base">{type.icon}</div>
                    <div className="text-xs text-gray-600">{type.label}</div>
                    <div className="text-sm font-bold text-gray-800">{report.leave[type.key] || 0}天</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-3">
              <h3 className="text-sm font-semibold mb-2 text-gray-700">加班统计</h3>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">加班次数</span>
                  <span className="text-base font-bold text-purple-600">{report.overtime.count}次</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">加班时长</span>
                  <span className="text-base font-bold text-purple-600">{report.overtime.total_hours.toFixed(1)}h</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
