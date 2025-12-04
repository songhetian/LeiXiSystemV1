import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { getApiUrl } from '../../utils/apiConfig'
import {
  CalendarIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

export default function MySchedule() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [employee, setEmployee] = useState(null)
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // 获取员工信息
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.id) {
      fetchEmployeeInfo(user.id)
    }
  }, [])

  // 当员工信息加载完成或月份变化时，获取排班数据
  useEffect(() => {
    if (employee) {
      fetchSchedules()
    }
  }, [employee, selectedMonth])

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

  const fetchSchedules = async () => {
    if (!employee) return

    setLoading(true)
    try {
      const year = selectedMonth.getFullYear()
      const month = selectedMonth.getMonth() + 1
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      const response = await axios.get(getApiUrl('/api/schedules'), {
        params: {
          employee_id: employee.id,
          start_date: startDate,
          end_date: endDate
        }
      })

      if (response.data.success) {
        setSchedules(response.data.data)
      }
    } catch (error) {
      console.error('获取排班数据失败:', error)
      toast.error('获取排班数据失败')
    } finally {
      setLoading(false)
    }
  }

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

    const getScheduleForDay = (day) => {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      return schedules.find(s => s.schedule_date === dateStr)
    }

    return (
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-md p-4">
        {/* 月份选择器 */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setSelectedMonth(new Date(year, month - 1))}
            className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-1 text-sm text-gray-600 transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            上月
          </button>
          <h3 className="text-lg font-bold text-gray-800">
            {year}年{month + 1}月
          </h3>
          <button
            onClick={() => setSelectedMonth(new Date(year, month + 1))}
            className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-1 text-sm text-gray-600 transition-colors"
          >
            下月
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>

        {/* 日历容器 - 添加左边框和上边框 */}
        <div className="border-t border-l border-gray-400">
          {/* 星期标题 */}
          <div className="grid grid-cols-7">
            {['日', '一', '二', '三', '四', '五', '六'].map(day => (
              <div key={day} className="text-center font-bold text-gray-800 py-2 text-sm bg-gray-100 border-r border-b border-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* 日历格子 */}
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              if (!day) {
                // 空白格子也要有边框和高度，保持网格结构
                return <div key={`empty-${index}`} className="h-24 border-r border-b border-gray-400 bg-gray-50/30" />
              }

              const schedule = getScheduleForDay(day)
              const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()

              return (
                <div
                  key={day}
                  onClick={() => {
                    if (schedule) {
                      setSelectedSchedule(schedule)
                      setShowDetailModal(true)
                    }
                  }}
                  className={`
                    h-24 p-1 transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden border-r border-b border-gray-400
                    ${isToday ? 'bg-blue-50/30' : ''}
                    ${schedule ? 'hover:bg-blue-50' : 'bg-white hover:bg-gray-50'}
                  `}
                  style={{
                    backgroundColor: schedule && schedule.shift_id && !schedule.is_rest_day
                      ? (schedule.color ? `${schedule.color}40` : '#e5e7eb') // 加深背景颜色 (透明度从 15 改为 40)
                      : undefined
                  }}
                >
                  {/* 日期数字 */}
                  <div className={`absolute top-1 left-1.5 text-lg font-bold ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
                    {day}
                    {isToday && <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1 rounded align-middle">今天</span>}
                  </div>

                  {schedule && (
                    <div className="w-full flex flex-col items-center justify-center z-10 mt-6">
                      {schedule.is_rest_day ? (
                        <>
                          <div className="text-sm font-bold truncate text-gray-500 mb-0.5">
                            休息
                          </div>
                          <div className="text-xs text-gray-400 font-medium">
                            00:00-00:00
                          </div>
                        </>
                      ) : schedule.shift_name ? (
                        <>
                          <div className="text-sm font-bold truncate text-gray-900 mb-0.5" style={{ color: schedule.color }}>
                            {schedule.shift_name}
                          </div>
                          <div className="text-xs text-gray-700 font-medium">
                            {schedule.start_time?.substring(0, 5)}-{schedule.end_time?.substring(0, 5)}
                          </div>
                        </>
                      ) : (
                        <div className="text-[10px] text-gray-300">
                          -
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // 渲染详情模态框
  const renderDetailModal = () => {
    if (!showDetailModal || !selectedSchedule) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white bg-opacity-98 rounded-2xl shadow-2xl max-w-md w-full">
          {/* 模态框头部 */}
          <div
            className="px-6 py-5 flex items-center justify-between text-white rounded-t-2xl"
            style={{ backgroundColor: selectedSchedule.color || '#3b82f6' }}
          >
            <div>
              <h3 className="text-2xl font-bold">排班详情</h3>
              <p className="text-base opacity-95 mt-1.5">{selectedSchedule.schedule_date}</p>
            </div>
            <button
              onClick={() => setShowDetailModal(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-25 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 模态框内容 */}
          <div className="p-6 space-y-5">
            {selectedSchedule.is_rest_day ? (
              <div className="bg-gray-50 bg-opacity-80 rounded-xl p-5">
                <div className="text-base text-gray-600 mb-2 font-medium">班次名称</div>
                <div className="text-xl font-bold text-gray-800">休息</div>
              </div>
            ) : selectedSchedule.shift_name ? (
              <>
                <div className="bg-gray-50 bg-opacity-80 rounded-xl p-5">
                  <div className="text-base text-gray-600 mb-2 font-medium">班次名称</div>
                  <div className="text-xl font-bold text-gray-800">{selectedSchedule.shift_name}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 bg-opacity-80 rounded-xl p-5">
                    <div className="text-base text-gray-600 mb-2 font-medium">上班时间</div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-6 h-6 text-green-600" />
                      <span className="text-xl font-bold text-gray-800">{selectedSchedule.start_time?.substring(0, 5)}</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 bg-opacity-80 rounded-xl p-5">
                    <div className="text-base text-gray-600 mb-2 font-medium">下班时间</div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-6 h-6 text-blue-600" />
                      <span className="text-xl font-bold text-gray-800">{selectedSchedule.end_time?.substring(0, 5)}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-7xl mb-4">📅</div>
                <div className="text-2xl font-bold text-gray-700">未排班</div>
                <div className="text-lg text-gray-600 mt-3">该日期暂无排班安排</div>
              </div>
            )}
          </div>

          {/* 模态框底部 */}
          <div className="px-6 py-4 bg-gray-50 bg-opacity-70 rounded-b-2xl flex justify-end">
            <button
              onClick={() => setShowDetailModal(false)}
              className="px-5 py-2.5 bg-gray-200 bg-opacity-90 text-gray-700 text-base font-medium rounded-lg hover:bg-gray-300 hover:shadow-md transition-all"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <CalendarIcon className="w-9 h-9 text-blue-600" />
          我的排班
        </h1>
        <p className="text-lg text-gray-600 mt-2">查看您的工作排班安排</p>
      </div>

      {/* 日历视图 */}
      {loading ? (
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-lg text-gray-600 mt-4 font-medium">加载中...</p>
        </div>
      ) : (
        renderCalendarView()
      )}

      {/* 详情模态框 */}
      {renderDetailModal()}
    </div>
  )
}
