import { useState, useEffect } from 'react'
import { formatDate, getBeijingDate, formatBeijingDate } from '../../utils/date'
import axios from 'axios'
import { toast } from 'sonner';
import { getApiUrl } from '../../utils/apiConfig'

export default function AttendanceHome({ onNavigate }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [todayRecord, setTodayRecord] = useState(null)
  const [loading, setLoading] = useState(false)
  const [employee, setEmployee] = useState(null)
  const [user, setUser] = useState(null)
  const [todaySchedule, setTodaySchedule] = useState(null)
  const [shifts, setShifts] = useState([])
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [selectedShift, setSelectedShift] = useState(null)
  const [showTimeoutModal, setShowTimeoutModal] = useState(false)
  const [timeoutMessage, setTimeoutMessage] = useState('')
  const [refreshKey, setRefreshKey] = useState(0) // 用于强制刷新
  const [attendanceRules, setAttendanceRules] = useState(null) // 考勤规则
  const [restShiftId, setRestShiftId] = useState(null) // 休息班次ID

  // 导航函数
  const navigate = (tab) => {
    if (onNavigate) {
      onNavigate(tab)
    }
  }

  // 获取当前登录用户信息
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      setUser(userData)
      // 获取员工信息
      fetchEmployeeInfo(userData.id)
    }
  }, [])

  // 获取员工信息
  const fetchEmployeeInfo = async (userId) => {
    try {
      const response = await axios.get(getApiUrl(`/api/employees/by-user/${userId}`))
      if (response.data.success && response.data.data) {
        setEmployee(response.data.data)
      } else {
        toast.error('未找到员工信息，请联系管理员')
      }
    } catch (error) {
      console.error('获取员工信息失败:', error)
      toast.error('获取员工信息失败')
    }
  }

  // 更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 获取考勤设置（只需获取一次）
  useEffect(() => {
    fetchAttendanceSettings()
    loadRestShift()
  }, [])

  // 获取今日打卡状态和排班信息
  useEffect(() => {
    if (employee) {
      fetchTodayRecord()
      fetchTodaySchedule()
      fetchShifts()
    }
  }, [employee])

  // 获取考勤设置
  const fetchAttendanceSettings = async () => {
    try {
      const response = await axios.get(getApiUrl('/api/attendance/settings'))
      if (response.data.success) {
        const settings = response.data.data
        // 转换为前端使用的格式
        setAttendanceRules({
          late_threshold: settings.late_minutes || 30,
          early_threshold: settings.early_leave_minutes || 30,
          clock_in_advance: settings.early_clock_in_minutes || 60,
          clock_out_delay: settings.late_clock_out_minutes || 120
        })
      }
    } catch (error) {
      console.error('获取考勤设置失败:', error)
      // 如果获取失败，使用默认规则
      setAttendanceRules({
        late_threshold: 30,
        early_threshold: 30,
        clock_in_advance: 60,
        clock_out_delay: 120
      })
    }
  }

  const loadRestShift = async () => {
    try {
      const response = await axios.get(getApiUrl('/api/shifts/rest'))
      if (response.data.success) {
        setRestShiftId(response.data.data.id)
      }
    } catch (error) {
      console.error('获取休息班次失败:', error)
    }
  }

  const fetchTodayRecord = async () => {
    if (!employee) return

    try {
      const response = await axios.get(getApiUrl('/api/attendance/today'), {
        params: { employee_id: employee.id }
      })
      if (response.data.success) {
        setTodayRecord(response.data.data)
      }
    } catch (error) {
      console.error('获取今日打卡状态失败:', error)
    }
  }

  // 获取今日排班信息
  const fetchTodaySchedule = async () => {
    if (!employee) {
      return
    }

    try {
      // 使用北京时间获取今日日期，避免时区问题
      const today = formatBeijingDate(); // 使用格式化后的日期字符串

      const response = await axios.get(getApiUrl('/api/schedules'), {
        params: {
          employee_id: employee.id,
          start_date: today,
          end_date: today
        }
      })

      if (response.data.success && response.data.data.length > 0) {
        const schedule = response.data.data[0]
        setTodaySchedule(schedule)
      } else {
        setTodaySchedule(null)
      }
    } catch (error) {
      console.error('获取今日排班信息失败:', error)
    }
  }

  // 获取班次列表
  const fetchShifts = async () => {
    try {
      const response = await axios.get(getApiUrl('/api/shifts'), {
        params: { limit: 100, is_active: 1 }
      })
      if (response.data.success) {
        setShifts(response.data.data)
      }
    } catch (error) {
      console.error('获取班次列表失败:', error)
    }
  }

  // 为自己选择班次排班
  const handleSelectShift = async () => {
    if (!selectedShift) {
      toast.error('请选择班次')
      return
    }

    if (!employee) {
      toast.error('员工信息未加载，请刷新页面')
      return
    }

    setLoading(true)

    try {
      // 使用北京时间获取今日日期，避免时区问题
      const today = formatBeijingDate(); // 使用格式化后的日期

      const response = await axios.post(getApiUrl('/api/schedules/self'), {
        employee_id: employee.id,
        user_id: user.id,
        schedule_date: today,
        shift_id: selectedShift
      })

      if (response.data.success) {
        toast.success('班次选择成功')
        setShowShiftModal(false)
        setSelectedShift(null)
        // 重新获取今日排班信息
        fetchTodaySchedule()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '班次选择失败')
    } finally {
      setLoading(false)
    }
  }

  // 上班打卡
  const handleClockIn = async (isMakeup = false) => {
    if (!employee) {
      toast.error('员工信息未加载，请刷新页面')
      return
    }

    // 移除补打卡检查，始终允许员工打卡
    // 原有的时间检查逻辑已移除，员工可以随时打卡
    // 系统会根据实际打卡时间自动判断状态

    setLoading(true)

    try {
      const response = await axios.post(getApiUrl('/api/attendance/clock-in'), {
        employee_id: employee.id,
        user_id: user.id
      })

      if (response.data.success) {
        toast.success(response.data.message)
        fetchTodayRecord()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '打卡失败')
    } finally {
      setLoading(false)
    }
  }

  const handleClockOut = async (isMakeup = false) => {
    if (!employee) {
      toast.error('员工信息未加载，请刷新页面')
      return
    }

    // 移除补打卡检查，始终允许员工打卡
    // 原有的时间检查逻辑已移除，员工可以随时打卡
    // 系统会根据实际打卡时间自动判断状态

    setLoading(true)

    try {
      const response = await axios.post(getApiUrl('/api/attendance/clock-out'), {
        employee_id: employee.id,
        user_id: user.id
      })

      if (response.data.success) {
        toast.success(response.data.message)
        fetchTodayRecord()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '打卡失败')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('zh-CN', { hour12: false })
  }

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '--:--'
    const date = new Date(dateTimeStr)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const getStatusBadge = (status) => {
    const badges = {
      normal: { text: '正常', color: 'bg-green-100 text-green-800' },
      late: { text: '迟到', color: 'bg-red-100 text-red-800' },
      early: { text: '早退', color: 'bg-orange-100 text-orange-800' },
      absent: { text: '缺勤', color: 'bg-gray-100 text-gray-800' },
      leave: { text: '请假', color: 'bg-blue-100 text-blue-800' }
    }
    const badge = badges[status] || badges.normal
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    )
  }

  // 检查是否在打卡时间范围内（上班）
  const checkClockInTime = () => {
    // 休息日不允许打卡
    if (todaySchedule && todaySchedule.shift_id == restShiftId) {
      return { allowed: false, message: '今日为休息日，无需打卡' }
    }
    // 无排班/无开始时间
    if (!todaySchedule || !todaySchedule.start_time) {
      return { allowed: false, message: '今日暂无排班信息，请先选择班次排班后再打卡' }
    }

    // 检查是否已到上班打卡时间
    const now = new Date();
    const [hours, minutes] = todaySchedule.start_time.split(':');
    const startDateTime = new Date();
    startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // 获取考勤设置中的上班打卡提前分钟数
    const earlyClockInMinutes = attendanceRules?.clock_in_advance || 60;
    const earlyClockInTime = new Date(startDateTime.getTime() - earlyClockInMinutes * 60000);

    if (now < earlyClockInTime) {
      const timeDiff = Math.ceil((earlyClockInTime - now) / 60000);
      return {
        allowed: false,
        message: `还未到上班打卡时间，需在上班前${earlyClockInMinutes}分钟内(${startDateTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}前${earlyClockInMinutes}分钟)才能打卡`
      };
    }

    return { allowed: true, message: '' }
  }

  // 检查是否在打卡时间范围内（下班）
  const checkClockOutTime = () => {
    // 休息日不允许打卡
    if (todaySchedule && todaySchedule.shift_id == restShiftId) {
      return { allowed: false, message: '今日为休息日，无需打卡' }
    }
    // 无排班/无结束时间
    if (!todaySchedule || !todaySchedule.end_time) {
      return { allowed: false, message: '今日暂无排班信息，请先选择班次排班后再打卡' }
    }

    // 检查是否已到下班打卡时间
    const now = new Date();
    const [hours, minutes] = todaySchedule.end_time.split(':');
    const endDateTime = new Date();
    endDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // 获取考勤设置中的下班打卡提前分钟数
    const earlyClockOutMinutes = attendanceRules?.clock_out_delay || 120;
    const earlyClockOutTime = new Date(endDateTime.getTime() - earlyClockOutMinutes * 60000);

    if (now < earlyClockOutTime) {
      const timeDiff = Math.ceil((earlyClockOutTime - now) / 60000);
      return {
        allowed: false,
        message: `还未到下班打卡时间，需在下班前${earlyClockOutMinutes}分钟内(${endDateTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}前${earlyClockOutMinutes}分钟)才能打卡`
      };
    }

    return { allowed: true, message: '' }
  }

  // 检查打卡状态
  const clockInCheck = checkClockInTime()
  const clockOutCheck = checkClockOutTime()
  const isRestDay = todaySchedule && todaySchedule.shift_id == restShiftId

  return (
    <div className="min-h-screen p-3 bg-gray-50">
     <div className="max-w-5xl mx-auto">
      {/* 头部 & 时间 - 紧凑布局 */}
      <div className="bg-white rounded-lg shadow-sm p-3 mb-3 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            考勤打卡
            {employee && <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{employee.employee_no}</span>}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
             {formatDate(currentTime)}
          </p>
        </div>
        <div className="text-right">
           <div className="text-2xl font-bold text-blue-600 font-mono tracking-wider">{formatTime(currentTime)}</div>
           <div className="text-xs text-gray-400">当前时间</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* 左侧：打卡主要操作区 (占2/3) */}
        <div className="lg:col-span-2 space-y-3">
          {/* 今日打卡状态 */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">今日状态</h2>
              {/* 排班信息或选择班次按钮 */}
              {todaySchedule && todaySchedule.shift_id ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                    {todaySchedule.shift_name || '休息'}
                  </span>
                  <span className="text-gray-400">
                    {todaySchedule.start_time} - {todaySchedule.end_time}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => setShowShiftModal(true)}
                  className="px-2 py-1 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded text-xs transition-colors flex items-center gap-1"
                >
                  <span>📅 排班</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {/* 上班打卡 */}
              <div className="bg-gray-50 rounded p-2 text-center">
                <div className="text-xs text-gray-400 mb-1">上班</div>
                <div className={`font-semibold ${todayRecord?.clock_in_time ? 'text-gray-800' : 'text-gray-400'}`}>
                  {formatDateTime(todayRecord?.clock_in_time)}
                </div>
                 {todayRecord?.status && ['late', 'leave'].includes(todayRecord.status) && (
                    <div className="mt-1">{getStatusBadge(todayRecord.status)}</div>
                 )}
              </div>

              {/* 下班打卡 */}
              <div className="bg-gray-50 rounded p-2 text-center">
                <div className="text-xs text-gray-400 mb-1">下班</div>
                <div className={`font-semibold ${todayRecord?.clock_out_time ? 'text-gray-800' : 'text-gray-400'}`}>
                  {formatDateTime(todayRecord?.clock_out_time)}
                </div>
                {todayRecord?.status && ['early_leave', 'leave'].includes(todayRecord.status) && (
                    <div className="mt-1">{getStatusBadge(todayRecord.status)}</div>
                 )}
              </div>

              {/* 工作时长 */}
              <div className="bg-gray-50 rounded p-2 text-center">
                <div className="text-xs text-gray-400 mb-1">工时</div>
                <div className="font-semibold text-gray-800">
                  {todayRecord?.work_hours ? `${todayRecord.work_hours}h` : '--'}
                </div>
                 {todayRecord?.status && todayRecord.status === 'normal' && (
                    <div className="mt-1">{getStatusBadge(todayRecord.status)}</div>
                 )}
              </div>
            </div>

            {/* 没有排班提示 */}
            {!todaySchedule && (
              <div className="bg-yellow-50 border border-yellow-100 rounded p-2 flex items-center gap-2 text-xs text-yellow-700 mb-3">
                  <span>⚠️ 暂无排班，请先排班</span>
              </div>
            )}

            {/* 休息日提示 */}
            {isRestDay && (
              <div className="bg-green-50 border border-green-100 rounded p-2 flex items-center gap-2 text-xs text-green-700 mb-3">
                <span>🛌 休息日，无需打卡</span>
              </div>
            )}

            {/* 打卡按钮区域 - 更紧凑 */}
            {!isRestDay && (
            <div className="grid grid-cols-2 gap-3">
              {/* 上班打卡按钮 */}
              <div>
                {todayRecord?.clock_in_time ? (
                  <button disabled className="w-full py-2 rounded bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed border border-gray-200">
                    已打上班卡
                  </button>
                ) : (
                  <button
                    onClick={handleClockIn}
                    disabled={loading || !clockInCheck.allowed}
                    className={`w-full py-2 rounded text-sm font-medium transition-colors shadow-sm ${
                      loading
                        ? 'bg-gray-100 text-gray-400'
                        : clockInCheck.allowed
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {loading ? '打卡中...' : '上班打卡'}
                  </button>
                )}
                 {!todayRecord?.clock_in_time && (
                    <div className="mt-1 text-center text-xs h-4">
                      {clockInCheck.message ? (
                        <span className={clockInCheck.allowed ? "text-green-600" : "text-gray-400"}>{clockInCheck.message}</span>
                      ) : (todaySchedule && <span className="text-green-600">可打卡 ({todaySchedule.start_time})</span>)}
                    </div>
                 )}
              </div>

              {/* 下班打卡按钮 */}
              <div>
                {todayRecord?.clock_out_time ? (
                  <button disabled className="w-full py-2 rounded bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed border border-gray-200">
                    已打下班卡
                  </button>
                ) : !todayRecord?.clock_in_time ? (
                  <button disabled className="w-full py-2 rounded bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed border border-gray-200">
                    请先上班打卡
                  </button>
                ) : (
                  <button
                    onClick={handleClockOut}
                    disabled={loading || !clockOutCheck.allowed}
                    className={`w-full py-2 rounded text-sm font-medium transition-colors shadow-sm ${
                      loading
                        ? 'bg-gray-100 text-gray-400'
                        : clockOutCheck.allowed
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {loading ? '打卡中...' : '下班打卡'}
                  </button>
                )}
                 {(!todayRecord?.clock_out_time && todayRecord?.clock_in_time) && (
                    <div className="mt-1 text-center text-xs h-4">
                      {clockOutCheck.message ? (
                        <span className={clockOutCheck.allowed ? "text-blue-600" : "text-gray-400"}>{clockOutCheck.message}</span>
                      ) : (todaySchedule && <span className="text-blue-600">可打卡 ({todaySchedule.end_time})</span>)}
                    </div>
                 )}
              </div>
            </div>
            )}
          </div>
        </div>

        {/* 右侧：快捷入口 (占1/3) */}
        <div className="space-y-3">
           {/* 快捷菜单 */}
           <div className="bg-white rounded-lg shadow-sm p-3">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">快捷功能</h2>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => navigate('attendance-records')} className="p-2 border border-gray-100 rounded hover:bg-gray-50 text-center transition-colors">
                  <div className="text-lg mb-1">📋</div>
                  <div className="text-xs text-gray-600">打卡记录</div>
                </button>
                <button onClick={() => navigate('attendance-leave-apply')} className="p-2 border border-gray-100 rounded hover:bg-gray-50 text-center transition-colors">
                  <div className="text-lg mb-1">🏖️</div>
                  <div className="text-xs text-gray-600">请假</div>
                </button>
                <button onClick={() => navigate('attendance-overtime-apply')} className="p-2 border border-gray-100 rounded hover:bg-gray-50 text-center transition-colors">
                  <div className="text-lg mb-1">⏰</div>
                  <div className="text-xs text-gray-600">加班</div>
                </button>
                 <button onClick={() => navigate('attendance-stats')} className="p-2 border border-gray-100 rounded hover:bg-gray-50 text-center transition-colors">
                  <div className="text-lg mb-1">📊</div>
                  <div className="text-xs text-gray-600">统计</div>
                </button>
              </div>
           </div>

           {/* 提示信息 */}
           {todayRecord?.status && ['late', 'early_leave'].includes(todayRecord.status) && (
              <div className={`rounded p-2 text-xs flex items-center gap-2 ${todayRecord.status === 'late' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                 <span>⚠️</span>
                 <span>{todayRecord.status === 'late' ? '您今天迟到了' : '您今天早退了'}</span>
              </div>
           )}
        </div>
      </div>

      {/* 测试功能按钮 - 仅用于开发测试 (更小巧且不易误触) */}
      <div className="mt-4 border-t border-gray-200 pt-4">
        <div className="flex items-center gap-4 justify-end">
            <span className="text-xs text-gray-400">开发测试:</span>
            <button
            onClick={async () => {
              if (!window.confirm('确定要删除今天的打卡记录吗？此操作不可恢复！')) return
              try {
                const today = formatBeijingDate()
                await axios.delete(getApiUrl('/api/attendance/today'), {
                  params: { employee_id: employee?.id, date: today }
                })
                toast.success('已删除打卡记录')
                fetchTodayRecord()
              } catch (error) {
                toast.error('删除失败')
              }
            }}
            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs transition-colors border border-red-100"
          >
            删除今日打卡
          </button>

          <button
            onClick={async () => {
              if (!window.confirm('确定要删除今天的班次安排吗？此操作不可恢复！')) return
              try {
                const today = formatBeijingDate();
                await axios.delete(getApiUrl('/api/schedules/today'), {
                  params: { employee_id: employee?.id, schedule_date: today }
                })
                toast.success('已删除今日班次')
                setTodaySchedule(null)
                fetchTodaySchedule()
              } catch (error) {
                toast.error('删除失败')
              }
            }}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs transition-colors border border-gray-200"
          >
            删除今日班次
          </button>
        </div>
      </div>

      {/* 选择班次模态框 */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">选择今日班次</h3>
                <button
                  onClick={() => {
                    setShowShiftModal(false)
                    setSelectedShift(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  请为今天选择一个班次，设置后即可正常打卡。
                </p>

                {shifts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>暂无可用班次</p>
                    <p className="text-sm mt-2">请联系管理员添加班次</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {shifts.map((shift) => (
                      <label
                        key={shift.id}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedShift === shift.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shift"
                          value={shift.id}
                          checked={selectedShift === shift.id}
                          onChange={() => setSelectedShift(shift.id)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{shift.name}</div>
                          <div className="text-sm text-gray-600">
                            {shift.start_time} - {shift.end_time}
                            {shift.department_name && (
                              <span className="ml-2 text-xs text-gray-500">
                                ({shift.department_name})
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowShiftModal(false)
                    setSelectedShift(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSelectShift}
                  disabled={!selectedShift || loading}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    !selectedShift || loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {loading ? '设置中...' : '确认'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
   </div>
  )
}
