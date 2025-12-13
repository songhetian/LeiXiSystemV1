import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'sonner';
import { getApiUrl } from '../../utils/apiConfig'
import { motion } from 'framer-motion'
import { DatePicker, TimePicker, Input } from 'antd';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/zh_CN';

export default function LeaveApply() {
  const [formData, setFormData] = useState({
    leave_type: 'annual',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    reason: '',
    attachments: [],
    use_conversion: false,
    conversion_days: 0
  })
  const [balance, setBalance] = useState(null)
  const [conversionBalance, setConversionBalance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [employee, setEmployee] = useState(null)
  const [user, setUser] = useState(null)
  const [approver, setApprover] = useState(null)

  // Helper to handle date change
  const handleDateChange = (date, dateString, field) => {
    setFormData(prev => {
      const updates = { ...prev, [field]: dateString };
      // If start_date changes, auto-set end_date to the same date
      if (field === 'start_date') {
        updates.end_date = dateString;
        // 默认设置时间为上午9点到下午6点
        if (!prev.start_time) {
          updates.start_time = '09:00';
        }
        if (!prev.end_time) {
          updates.end_time = '18:00';
        }
      }
      return updates;
    });
  };

  // 快捷选择今天
  const selectToday = () => {
    const today = dayjs();
    const dateString = today.format('YYYY-MM-DD');
    setFormData(prev => ({
      ...prev,
      start_date: dateString,
      end_date: dateString,
      start_time: '09:00',
      end_time: '18:00'
    }));
  };

  // 快捷选择明天
  const selectTomorrow = () => {
    const tomorrow = dayjs().add(1, 'day');
    const dateString = tomorrow.format('YYYY-MM-DD');
    setFormData(prev => ({
      ...prev,
      start_date: dateString,
      end_date: dateString,
      start_time: '09:00',
      end_time: '18:00'
    }));
  };

  // 前端验证函数
  const validateLeaveApplication = () => {
    const errors = [];

    // 检查必填字段
    if (!formData.start_date) {
      errors.push('请选择开始日期');
    }
    if (!formData.end_date) {
      errors.push('请选择结束日期');
    }
    if (!formData.start_time) {
      errors.push('请选择开始时间');
    }
    if (!formData.end_time) {
      errors.push('请选择结束时间');
    }
    if (!formData.reason.trim()) {
      errors.push('请输入请假原因');
    }

    // 检查时间逻辑
    if (formData.start_date && formData.end_date && formData.start_time && formData.end_time) {
      const startDate = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDate = new Date(`${formData.end_date}T${formData.end_time}`);
      const now = new Date();

      // 不能选择过去的时间（除非是今天）
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedStartDate = new Date(formData.start_date);
      selectedStartDate.setHours(0, 0, 0, 0);

      if (selectedStartDate < today) {
        errors.push('开始日期不能早于今天');
      }

      // 结束时间必须晚于开始时间
      if (endDate <= startDate) {
        errors.push('结束时间必须晚于开始时间');
      }

      // 不能选择超过一年的请假
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      if (endDate > oneYearLater) {
        errors.push('请假时间不能超过一年');
      }
    }

    return errors;
  };

  // Helper to handle time change
  const handleTimeChange = (time, timeString, field) => {
    setFormData(prev => ({ ...prev, [field]: timeString }));
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      setUser(userData)
      fetchEmployeeInfo(userData.id)
      fetchApprover(userData.id)
    }
  }, [])

  const fetchEmployeeInfo = async (userId) => {
    try {
      const response = await axios.get(getApiUrl(`/api/employees/by-user/${userId}`))
      if (response.data.success && response.data.data) {
        setEmployee(response.data.data)
        fetchBalance(response.data.data.id)
      } else {
        toast.error('未找到员工信息')
      }
    } catch (error) {
      console.error('获取员工信息失败:', error)
      toast.error('获取员工信息失败')
    }
  }

  const fetchApprover = async (userId) => {
    try {
      const response = await axios.get(getApiUrl(`/api/users/${userId}/approver`))
      if (response.data.success) {
        setApprover(response.data.data)
      }
    } catch (error) {
      console.error('获取审批人失败:', error)
    }
  }

  const fetchBalance = async (employeeId) => {
    try {
      // 获取基础假期余额
      const response = await axios.get(getApiUrl('/api/vacation/balance'), {
        params: { employee_id: employeeId }
      })
      if (response.data.success) {
        setBalance(response.data.data)
      }

      // 获取转换假期余额
      const conversionResponse = await axios.get(getApiUrl(`/api/vacation/conversion-balance/${employeeId}`))
      if (conversionResponse.data.success) {
        setConversionBalance(conversionResponse.data.data)
      }
    } catch (error) {
      console.error('获取请假余额失败:', error)
    }
  }

  const calculateDays = () => {
    if (!formData.start_date || !formData.end_date) return 0
    const start = new Date(formData.start_date)
    const end = new Date(formData.end_date)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 前端验证
    const errors = validateLeaveApplication();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setLoading(true);
    try {
      const employeeId = employee.id;
      const userId = user.id;

      const response = await axios.post(getApiUrl('/api/leave/apply'), {
        employee_id: employeeId,
        user_id: userId,
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        start_time: formData.start_time,
        end_date: formData.end_date,
        end_time: formData.end_time,
        days: calculateDays(),
        reason: formData.reason,
        use_conversion: formData.use_conversion,
        conversion_days: formData.conversion_days
      });

      if (response.data.success) {
        toast.success('请假申请提交成功');
        // 重置表单
        setFormData({
          leave_type: 'annual',
          start_date: '',
          end_date: '',
          start_time: '',
          end_time: '',
          reason: '',
          attachments: [],
          use_conversion: false,
          conversion_days: 0
        });
        fetchBalance(employee.id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  // 监听日期和复选框变化，自动更新转换天数
  useEffect(() => {
    if (formData.use_conversion && conversionBalance) {
      const days = calculateDays()
      if (days > 0) {
        const maxDays = Math.min(days, conversionBalance.remaining_days)
        setFormData(prev => ({
          ...prev,
          conversion_days: maxDays
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          conversion_days: 0
        }))
      }
    }
  }, [formData.start_date, formData.end_date, formData.use_conversion, conversionBalance])

  const leaveTypes = [
    { value: 'annual', label: '年假', icon: '🏖️', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { value: 'sick', label: '病假', icon: '🤒', color: 'bg-red-50 text-red-600 border-red-200' },
    { value: 'personal', label: '事假', icon: '📋', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
    { value: 'other', label: '其他', icon: '📝', color: 'bg-gray-50 text-gray-600 border-gray-200' }
  ]

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">请假申请</h1>
        <p className="text-gray-500 mt-2">提交您的请假申请，系统将自动通知审批人</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        {/* 左侧：申请表单 */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 请假类型选择 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">选择请假类型</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {leaveTypes.map((type) => (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, leave_type: type.value }))}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                      formData.leave_type === type.value
                        ? `${type.color} ring-2 ring-offset-2 ring-blue-100`
                        : 'border-gray-100 hover:border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    <span className="text-3xl">{type.icon}</span>
                    <span className="font-medium">{type.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* 转换假期余额卡片 */}
            {conversionBalance && conversionBalance.remaining_days > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-purple-600">✨</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">转换假期余额</h3>
                      <p className="text-sm text-gray-500">可用 {Math.floor(conversionBalance.remaining_days)} 天</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.use_conversion}
                      onChange={(e) => setFormData(prev => ({ ...prev, use_conversion: e.target.checked }))}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {formData.use_conversion && (
                  <div className="bg-white/60 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">抵扣天数</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max={Math.min(calculateDays(), conversionBalance.remaining_days)}
                        step="0.5"
                        value={formData.conversion_days}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          const maxDays = Math.min(calculateDays(), conversionBalance.remaining_days)
                          setFormData(prev => ({ ...prev, conversion_days: Math.min(value, maxDays) }))
                        }}
                        className="block w-full rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-gray-500 font-medium">天</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* 日期和原因 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
              {/* 快捷选择按钮 */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={selectToday}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  今天
                </button>
                <button
                  type="button"
                  onClick={selectTomorrow}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  明天
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">开始时间</label>
                  <div className="flex gap-2">
                    <DatePicker
                      className="flex-1 h-[42px] rounded-xl border-gray-200 shadow-sm hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
                      onChange={(date, dateString) => handleDateChange(date, dateString, 'start_date')}
                      locale={locale}
                      placeholder="选择开始日期"
                      value={formData.start_date ? dayjs(formData.start_date) : null}
                      disabledDate={(current) => {
                        // 不能选择今天之前的日期
                        return current && current < dayjs().startOf('day');
                      }}
                      format="YYYY-MM-DD"
                      allowClear
                    />
                    <TimePicker
                      className="w-32 h-[42px] rounded-xl border-gray-200 shadow-sm hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
                      onChange={(time, timeString) => handleTimeChange(time, timeString, 'start_time')}
                      format="HH:mm"
                      placeholder="时间"
                      value={formData.start_time ? dayjs(formData.start_time, 'HH:mm') : null}
                      minuteStep={30}
                      allowClear
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">结束时间</label>
                  <div className="flex gap-2">
                    <DatePicker
                      className="flex-1 h-[42px] rounded-xl border-gray-200 shadow-sm hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
                      onChange={(date, dateString) => handleDateChange(date, dateString, 'end_date')}
                      locale={locale}
                      placeholder="选择结束日期"
                      value={formData.end_date ? dayjs(formData.end_date) : null}
                      disabledDate={(current) => {
                        // 不能选择今天之前的日期
                        return current && current < dayjs().startOf('day');
                      }}
                      format="YYYY-MM-DD"
                      allowClear
                    />
                    <TimePicker
                      className="w-32 h-[42px] rounded-xl border-gray-200 shadow-sm hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
                      onChange={(time, timeString) => handleTimeChange(time, timeString, 'end_time')}
                      format="HH:mm"
                      placeholder="时间"
                      value={formData.end_time ? dayjs(formData.end_time, 'HH:mm') : null}
                      minuteStep={30}
                      allowClear
                    />
                  </div>
                </div>
              </div>

              {formData.start_date && formData.end_date && (
                <div className="p-4 bg-blue-50 rounded-xl flex items-center justify-between">
                  <span className="text-blue-700 font-medium">共计请假时长</span>
                  <span className="text-2xl font-bold text-blue-600">{calculateDays()} <span className="text-sm font-normal text-blue-500">天</span></span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">请假原因</label>
                <Input.TextArea
                  rows={4}
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="请详细说明请假原因..."
                  className="rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
                  showCount
                  maxLength={200}
                />
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-blue-300 transform hover:-translate-y-0.5"
              >
                {loading ? '提交中...' : '提交申请'}
              </button>
            </div>
          </form>
        </div>

        {/* 右侧：审批流程预览 */}
        <div className="w-full md:w-80">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">审批流程</h3>

            <div className="relative pl-4 border-l-2 border-gray-100 space-y-8">
              {/* 提交申请 */}
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div>
                <h4 className="font-medium text-gray-900">提交申请</h4>
                <p className="text-sm text-gray-500 mt-1">{user?.real_name} (您)</p>
                <p className="text-xs text-gray-400 mt-0.5">即将提交</p>
              </div>

              {/* 部门审批 */}
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-gray-200 border-4 border-white"></div>
                <h4 className="font-medium text-gray-900">部门审批</h4>
                {approver ? (
                  <>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                        {approver.real_name.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-600">{approver.real_name}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{approver.position || '部门主管'}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">部门主管</p>
                )}
              </div>

              {/* 完成 */}
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-gray-200 border-4 border-white"></div>
                <h4 className="font-medium text-gray-900">完成</h4>
                <p className="text-sm text-gray-500 mt-1">抄送相关人员</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-900 mb-3">注意事项</h4>
              <ul className="text-xs text-gray-500 space-y-2">
                <li className="flex gap-2">
                  <span className="text-blue-500">•</span>
                  请假需提前申请，紧急情况请及时联系主管
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500">•</span>
                  病假需提供医院证明
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500">•</span>
                  年假需在年度内使用完毕
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
