// [SHADCN-REPLACED]
import { useState, useEffect } from 'react'
import { formatDate, getBeijingDate, formatBeijingDate } from '../../utils/date'
import axios from 'axios'
import { getApiUrl } from '../../utils/apiConfig'

// 导入 Shadcn UI 组件
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'

// 导入图标
import { Clock, User, Calendar, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'

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
        alert('未找到员工信息，请联系管理员')
      }
    } catch (error) {
      console.error('获取员工信息失败:', error)
      alert('获取员工信息失败')
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
      alert('请选择班次')
      return
    }

    if (!employee) {
      alert('员工信息未加载，请刷新页面')
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
        alert('班次选择成功')
        setShowShiftModal(false)
        setSelectedShift(null)
        // 重新获取今日排班信息
        fetchTodaySchedule()
      }
    } catch (error) {
      alert(error.response?.data?.message || '班次选择失败')
    } finally {
      setLoading(false)
    }
  }

  // 上班打卡
  const handleClockIn = async (isMakeup = false) => {
    if (!employee) {
      alert('员工信息未加载，请刷新页面')
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
        alert(response.data.message)
        fetchTodayRecord()
      }
    } catch (error) {
      alert(error.response?.data?.message || '打卡失败')
    } finally {
      setLoading(false)
    }
  }

  const handleClockOut = async (isMakeup = false) => {
    if (!employee) {
      alert('员工信息未加载，请刷新页面')
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
        alert(response.data.message)
        fetchTodayRecord()
      }
    } catch (error) {
      alert(error.response?.data?.message || '打卡失败')
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
      normal: { text: '正常', variant: 'default' },
      late: { text: '迟到', variant: 'destructive' },
      early: { text: '早退', variant: 'warning' },
      absent: { text: '缺勤', variant: 'secondary' },
      leave: { text: '请假', variant: 'outline' }
    }

    const badgeConfig = badges[status] || badges.normal
    return (
      <Badge variant={badgeConfig.variant}>
        {badgeConfig.text}
      </Badge>
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
    <motion.div
      className="min-h-screen p-6 bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* 头部 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">考勤打卡</h1>
        <p className="text-gray-600 mt-1">
          欢迎，{user?.real_name || user?.username || '加载中...'}
          {employee && <span className="text-sm text-gray-500 ml-2">({employee.employee_no})</span>}
        </p>
      </div>

      {/* 当前时间卡片 */}
      <motion.div
        className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-8 mb-6 text-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-center">
          <div className="text-5xl font-bold mb-2">{formatTime(currentTime)}</div>
          <div className="text-lg opacity-90">{formatDate(currentTime)}</div>
        </div>
      </motion.div>

      {/* 今日打卡状态 */}
      <motion.div
        className="bg-white rounded-lg shadow p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">今日打卡状态</h2>
          {/* 排班信息或选择班次按钮 */}
          {todaySchedule && todaySchedule.shift_id ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">今日班次：</span>
              <Badge variant="default">
                {todaySchedule.shift_name || '休息日'}
              </Badge>
              {todaySchedule.start_time && todaySchedule.end_time && (
                <span className="text-gray-500">
                  {todaySchedule.start_time} - {todaySchedule.end_time}
                </span>
              )}
            </div>
          ) : (
            <Button
              onClick={() => setShowShiftModal(true)}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              <span>选择班次排班</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 上班打卡 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                上班打卡
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {formatDateTime(todayRecord?.clock_in_time)}
              </div>
            </CardContent>
          </Card>

          {/* 下班打卡 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                下班打卡
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {formatDateTime(todayRecord?.clock_out_time)}
              </div>
            </CardContent>
          </Card>

          {/* 工作时长 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">工作时长</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {todayRecord?.work_hours ? `${todayRecord.work_hours}h` : '--'}
              </div>
              {todayRecord?.status && (
                <div className="mt-2">
                  {getStatusBadge(todayRecord.status)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 没有排班提示 */}
        {!todaySchedule && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-yellow-600 h-5 w-5 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900 mb-1">今日暂无排班信息</p>
                <p className="text-sm text-yellow-800">
                  请点击右上角"选择班次排班"按钮为自己安排今日班次，或联系管理员进行排班。
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* 休息日提示 */}
      {isRestDay && (
        <motion.div
          className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-start gap-2">
            <CheckCircle className="text-green-600 h-5 w-5 mt-0.5" />
            <div className="flex-1 text-sm text-green-800">今日为休息日，无需打卡</div>
          </div>
        </motion.div>
      )}

      {/* 打卡按钮 */}
      {!isRestDay && (
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {/* 上班打卡按钮 */}
        <div>
          {todayRecord?.clock_in_time ? (
            <Button
              disabled
              className="w-full py-4 px-6 rounded-lg font-semibold text-lg"
              variant="secondary"
            >
              已打上班卡
            </Button>
          ) : (
            <>
              <Button
                onClick={handleClockIn}
                disabled={loading || !clockInCheck.allowed}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg ${
                  loading
                    ? ''
                    : clockInCheck.allowed
                      ? 'bg-green-500 hover:bg-green-600'
                      : ''
                }`}
                variant={clockInCheck.allowed ? "default" : "secondary"}
              >
                {loading ? '打卡中...' : '✓ 上班打卡'}
              </Button>
              <div className="mt-2 text-center text-sm font-medium">
                {clockInCheck.message && (
                  <span className={clockInCheck.allowed ? "text-green-600" : "text-gray-500"}>
                    {clockInCheck.message}
                  </span>
                )}
                {!clockInCheck.message && todaySchedule && (
                  <span className="text-green-600">
                    ✓ 可以打卡（{todaySchedule.start_time} 班次）
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* 下班打卡按钮 */}
        <div>
          {todayRecord?.clock_out_time ? (
            <Button
              disabled
              className="w-full py-4 px-6 rounded-lg font-semibold text-lg"
              variant="secondary"
            >
              已打下班卡
            </Button>
          ) : !todayRecord?.clock_in_time ? (
            <>
              <Button
                disabled
                className="w-full py-4 px-6 rounded-lg font-semibold text-lg"
                variant="secondary"
              >
                请先打上班卡
              </Button>
              <div className="mt-2 text-center text-sm text-gray-500">
                需要先完成上班打卡
              </div>
            </>
          ) : (
            <>
              <Button
                onClick={handleClockOut}
                disabled={loading || !clockOutCheck.allowed}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg ${
                  loading
                    ? ''
                    : clockOutCheck.allowed
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : ''
                }`}
                variant={clockOutCheck.allowed ? "default" : "secondary"}
              >
                {loading ? '打卡中...' : '✓ 下班打卡'}
              </Button>
              <div className="mt-2 text-center text-sm font-medium">
                {clockOutCheck.message && (
                  <span className={clockOutCheck.allowed ? "text-blue-600" : "text-gray-500"}>
                    {clockOutCheck.message}
                  </span>
                )}
                {!clockOutCheck.message && todaySchedule && (
                  <span className="text-blue-600">
                    ✓ 可以打卡（{todaySchedule.end_time} 下班）
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
      )}

      {/* 提示信息 */}
      {todayRecord?.status === 'late' && (
        <motion.div
          className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center">
            <AlertTriangle className="text-red-600 mr-2 h-5 w-5" />
            <span className="text-red-800">您今天迟到了，请注意准时上班</span>
          </div>
        </motion.div>
      )}

      {todayRecord?.status === 'early_leave' && (
        <motion.div
          className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center">
            <AlertTriangle className="text-orange-600 mr-2 h-5 w-5" />
            <span className="text-orange-800">您今天早退了，请注意工作时间</span>
          </div>
        </motion.div>
      )}

      {/* 快捷入口 */}
      <motion.div
        className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => navigate('attendance-records')}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">📋</div>
            <div className="text-sm font-medium">打卡记录</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => navigate('attendance-leave-apply')}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">🏖️</div>
            <div className="text-sm font-medium">请假申请</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => navigate('attendance-overtime-apply')}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">⏰</div>
            <div className="text-sm font-medium">加班申请</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => navigate('attendance-stats')}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-medium">考勤统计</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 测试功能按钮 - 仅用于开发测试 */}
      <motion.div
        className="mt-6 bg-red-50 border-2 border-red-200 rounded-lg p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-red-600 text-lg">🔧</span>
          <h3 className="text-sm font-semibold text-red-800">测试功能（仅删除当天记录）</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={async () => {
              if (!window.confirm('确定要删除今天的打卡记录吗？此操作不可恢复！')) return
              try {
                const today = formatBeijingDate() // 使用统一的日期处理函数，避免时区问题
                await axios.delete(getApiUrl('/api/attendance/today'), {
                  params: { employee_id: employee?.id, date: today }
                })
                alert('今日打卡记录已删除')
                fetchTodayRecord()
              } catch (error) {
                alert('删除失败: ' + (error.response?.data?.message || error.message))
              }
            }}
            variant="destructive"
          >
            🗑️ 删除打卡记录
          </Button>

          <Button
            onClick={async () => {
              if (!window.confirm('确定要删除今天的班次安排吗？此操作不可恢复！')) return
              try {
                const today = formatBeijingDate(); // 使用统一的日期处理函数
                await axios.delete(getApiUrl('/api/schedules/today'), {
                  params: { employee_id: employee?.id, schedule_date: today }
                })
                alert('今日班次已删除')
                setTodaySchedule(null)
                fetchTodaySchedule()
              } catch (error) {
                alert('删除失败: ' + (error.response?.data?.message || error.message))
              }
            }}
            variant="destructive"
            className="bg-purple-500 hover:bg-purple-600"
          >
            🗑️ 删除班次
          </Button>
        </div>
        <p className="text-xs text-red-600 mt-2">⚠️ 警告：这些按钮仅用于测试，只会删除当天的记录</p>
      </motion.div>

      {/* 选择班次模态框 */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">选择今日班次</h3>
                <Button
                  onClick={() => {
                    setShowShiftModal(false)
                    setSelectedShift(null)
                  }}
                  variant="ghost"
                  size="sm"
                >
                  ✕
                </Button>
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
                <Button
                  onClick={() => {
                    setShowShiftModal(false)
                    setSelectedShift(null)
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  onClick={handleSelectShift}
                  disabled={!selectedShift || loading}
                  className="flex-1"
                >
                  {loading ? '设置中...' : '确认'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
