import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'sonner';
import { getApiUrl } from '../../utils/apiConfig'
import {
  CalendarIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

export default function MySchedule() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [employee, setEmployee] = useState(null)
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

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
      // 确保使用正确的日期格式（避免时区问题）
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
        // 确保日期格式正确，避免时区问题
        const formattedSchedules = response.data.data.map(schedule => ({
          ...schedule,
          schedule_date: schedule.schedule_date.split('T')[0] // 确保只取日期部分
        }))
        setSchedules(formattedSchedules)
      }
    } catch (error) {
      console.error('获取排班数据失败:', error)
      toast.error('获取排班数据失败')
    } finally {
      setLoading(false)
    }
  }

  const goToCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  // 渲染日历视图
  const renderCalendarView = () => {
    // 确保使用正确的时区处理月份
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
      // 确保使用正确的日期格式进行比较
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      return schedules.find(s => s.schedule_date === dateStr)
    }

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* 月份选择器 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/30">
          <div className="flex items-center gap-4">
             <div className="relative">
                <div
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => {
                    setPickerYear(year);
                    setShowMonthPicker(!showMonthPicker);
                  }}
                >
                   <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                     {year}年 {month + 1}月
                     <ChevronDownIcon className={`w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-transform duration-200 ${showMonthPicker ? 'rotate-180' : ''}`} />
                   </h3>
                </div>

                {/* Custom Month Picker Popover */}
                {showMonthPicker && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMonthPicker(false)} />
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-20 p-4 animate-in fade-in zoom-in-95 duration-200">
                       <div className="flex items-center justify-between mb-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); setPickerYear(pickerYear - 1); }}
                            className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900"
                          >
                            <ChevronLeftIcon className="w-5 h-5" />
                          </button>
                          <span className="font-bold text-gray-800 text-lg">{pickerYear}年</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setPickerYear(pickerYear + 1); }}
                            className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900"
                          >
                            <ChevronRightIcon className="w-5 h-5" />
                          </button>
                       </div>
                       <div className="grid grid-cols-4 gap-2">
                          {Array.from({ length: 12 }, (_, i) => (
                             <button
                               key={i}
                               onClick={() => {
                                 setSelectedMonth(new Date(pickerYear, i));
                                 setShowMonthPicker(false);
                               }}
                               className={`
                                 py-2 rounded-lg text-sm font-medium transition-colors
                                 ${year === pickerYear && month === i
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                 }
                                 ${new Date().getFullYear() === pickerYear && new Date().getMonth() === i && !(year === pickerYear && month === i)
                                    ? 'text-blue-600 bg-blue-50'
                                    : ''
                                 }
                               `}
                             >
                               {i + 1}月
                             </button>
                          ))}
                       </div>
                    </div>
                  </>
                )}
             </div>
             <button
               onClick={goToCurrentMonth}
               className="text-sm px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center gap-1.5 shadow-sm"
               title="回到今天"
             >
               <CalendarDaysIcon className="w-4 h-4" />
               本月
             </button>
          </div>
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            <button
              onClick={() => setSelectedMonth(new Date(year, month - 1))}
              className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span className="w-px h-4 bg-gray-200 mx-1"></span>
            <button
              onClick={() => setSelectedMonth(new Date(year, month + 1))}
              className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 日历容器 */}
        <div className="">
          {/* 星期标题 */}
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
            {['日', '一', '二', '三', '四', '五', '六'].map((day, idx) => (
              <div key={day} className={`text-center font-medium text-gray-500 py-3 text-sm ${idx === 0 || idx === 6 ? 'text-orange-500' : ''}`}>
                {day}
              </div>
            ))}
          </div>

          {/* 日历格子 */}
          <div className="grid grid-cols-7 auto-rows-[120px] divide-x divide-y divide-gray-100 border-l border-gray-100">
            {days.map((day, index) => {
              // 计算边框样式，避免最左边和最底部的冗余
              // 使用 divide-x divide-y 已经处理了大部分内部边框
              // 这里主要是处理空白格和对齐

              if (!day) {
                return <div key={`empty-${index}`} className="bg-gray-50/20" />
              }

              const schedule = getScheduleForDay(day)
              const dateObj = new Date(year, month, day);
              const isToday = new Date().toDateString() === dateObj.toDateString();
              const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

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
                    group relative p-2 transition-all cursor-pointer flex flex-col justify-between hover:z-10
                    ${!schedule ? (isToday ? 'bg-blue-50' : 'bg-white hover:bg-gray-50') : 'hover:brightness-95'}
                  `}
                  style={{
                    backgroundColor: schedule && !schedule.is_rest_day && schedule.color ? schedule.color : undefined,
                    color: schedule && !schedule.is_rest_day ? 'white' : undefined
                  }}
                >
                  {/* 日期数字 */}
                    <div className="flex items-center justify-between">
                    <div className={`
                        w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold transition-colors
                        ${isToday
                           ? (schedule ? 'bg-white text-blue-600 shadow-sm' : 'bg-blue-600 text-white shadow-sm')
                           : (schedule ? 'text-white/90' : (isWeekend ? 'text-gray-400' : 'text-gray-700'))
                        }
                    `}>
                        {day}
                    </div>
                     {isToday && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${schedule ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'}`}>
                           今天
                        </span>
                     )}
                    </div>

                  {schedule && (
                    <div className="w-full mt-1 space-y-1">
                      {schedule.is_rest_day ? (
                         <div className="px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-xs font-semibold text-center border border-gray-200">
                            休息
                         </div>
                      ) : schedule.shift_name ? (
                        <>
                          <div
                              className="px-2 py-1.5 rounded-md text-xs font-bold text-center shadow-sm truncate bg-white"
                              style={{
                                  color: '#111827', // Gray-900 (Black)
                              }}
                          >
                            {schedule.shift_name}
                          </div>
                          <div className="text-[10px] text-center font-medium mt-0.5 text-white/90">
                            {schedule.start_time?.substring(0, 5)} - {schedule.end_time?.substring(0, 5)}
                          </div>
                        </>
                      ) : (
                         <span className="block h-1 w-1 bg-gray-300 rounded-full mx-auto" />
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
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 pb-20">
          {/* 页面标题 */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg shadow-md shadow-blue-500/20 text-white">
                    <CalendarIcon className="w-6 h-6" />
                </div>
                我的排班
              </h1>
              <p className="text-sm text-gray-500 mt-1 ml-1">查看您的工作安排和考勤计划</p>
            </div>
          </div>

          {/* 日历视图 */}
          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-20 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4 text-sm font-medium">加载排班数据...</p>
            </div>
          ) : (
            renderCalendarView()
          )}

          {/* 详情模态框 */}
          {renderDetailModal()}
        </div>
      </div>
    </div>
  )
}
