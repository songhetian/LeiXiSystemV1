import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { getApiUrl } from '../../utils/apiConfig'


export default function LeaveApply() {
  const [formData, setFormData] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
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
        fetchBalance(response.data.data.id)
      } else {
        toast.error('未找到员工信息')
      }
    } catch (error) {
      console.error('获取员工信息失败:', error)
      toast.error('获取员工信息失败')
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
    e.preventDefault()

    if (!employee) {
      toast.error('员工信息未加载')
      return
    }

    const days = calculateDays()
    if (days <= 0) {
      toast.error('请选择有效的日期范围')
      return
    }

    // 检查余额
    if (formData.leave_type === 'annual' && balance) {
      // If using converted leave, check combined balance or logic
      // For now, basic check. The backend will handle complex deduction logic.
      if (!formData.use_converted_leave && days > balance.annual_leave_remaining) {
        toast.error(`年假余额不足，剩余 ${balance.annual_leave_remaining} 天`)
        return
      }
    }

    if (formData.leave_type === 'sick' && balance && days > balance.sick_leave_remaining) {
      toast.error(`病假余额不足，剩余 ${balance.sick_leave_remaining} 天`)
      return
    }

    setLoading(true)
    try {
      const payload = {
        employee_id: employee.id,
        user_id: employee.user_id,
        ...formData,
        days
      }

      console.log('=== Frontend Submit Debug ===')
      console.log('formData:', formData)
      console.log('payload:', payload)
      console.log('============================')

      const response = await axios.post(getApiUrl('/api/leave/apply'), payload)

      if (response.data.success) {
        toast.success('请假申请提交成功')
        // 重置表单
        setFormData({
          leave_type: 'annual',
          start_date: '',
          end_date: '',
          reason: '',
          attachments: [],
          use_conversion: false,
          conversion_days: 0
        })
        fetchBalance(employee.id)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '提交失败')
    } finally {
      setLoading(false)
    }

  }

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
    { value: 'annual', label: '年假', icon: '🏖️' },
    { value: 'sick', label: '病假', icon: '🤒' },
    { value: 'personal', label: '事假', icon: '📋' },
    { value: 'other', label: '其他', icon: '📝' }
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 头部 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">请假申请</h1>
        <p className="text-gray-600 mt-1">提交您的请假申请</p>
      </div>

      {/* 请假余额 */}
      {conversionBalance && conversionBalance.remaining_days > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">转换假期余额</h2>
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 overflow-hidden">
            <div className="p-4 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-purple-600">
                  ✨
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">使用转换假期</h3>
                  <p className="text-sm text-gray-500">
                    可用余额: <span className="font-medium text-purple-600">{Math.floor(conversionBalance.remaining_days)}</span> 天
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.use_conversion || false}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      use_conversion: e.target.checked
                    }))
                  }}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {formData.use_conversion && (
              <div className="p-4 bg-white/50">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      抵扣天数
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max={Math.min(calculateDays(), conversionBalance.remaining_days)}
                        step="0.5"
                        value={formData.conversion_days}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          const maxDays = Math.min(calculateDays(), conversionBalance.remaining_days)
                          setFormData(prev => ({
                            ...prev,
                            conversion_days: Math.min(value, maxDays)
                          }))
                        }}
                        className="block w-full rounded-lg border-gray-300 pl-3 pr-12 focus:border-purple-500 focus:ring-purple-500 sm:text-sm py-2"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">天</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 pt-6">
                  </div>
                </div>
              </div>
            )}

            {!formData.use_conversion && (
               <div className="px-6 py-4">
                  <div className="text-sm text-gray-600">
                    已转换 {Math.floor(conversionBalance.total_converted_days)} 天 · 已使用 {Math.floor(conversionBalance.used_days)} 天
                  </div>
               </div>
            )}
          </div>
        </div>
      )}

      {/* 申请表单 */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          {/* 请假类型 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              请假类型 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {leaveTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, leave_type: type.value }))}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${formData.leave_type === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>


          </div>

          {/* 日期范围 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                开始日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => {
                  const newStartDate = e.target.value
                  setFormData(prev => ({
                    ...prev,
                    start_date: newStartDate,
                    // 如果结束日期为空或小于新的开始日期，自动更新结束日期
                    end_date: (!prev.end_date || prev.end_date < newStartDate) ? newStartDate : prev.end_date
                  }))
                }}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                结束日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                min={formData.start_date} // 限制最小日期为开始日期
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 请假天数 */}
          {formData.start_date && formData.end_date && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">请假天数：</span>
                <span className="text-2xl font-bold text-blue-600">{calculateDays()} 天</span>
              </div>
            </div>
          )}

          {/* 请假原因 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              请假原因 <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="请详细说明请假原因..."
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 附件上传（病假证明等） */}
          {formData.leave_type === 'sick' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                病假证明
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="text-gray-500 mb-2">点击或拖拽文件到此处上传</div>
                <div className="text-sm text-gray-400">支持 PDF、JPG、PNG 格式</div>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    // 处理文件上传
                  }}
                />
              </div>
            </div>
          )}

          {/* 提交按钮 */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '提交中...' : '提交申请'}
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>

      {/* 注意事项 */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">📌 注意事项</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 请假需提前申请，紧急情况请及时联系主管</li>
          <li>• 病假需提供医院证明</li>
          <li>• 年假需在年度内使用完毕</li>
          <li>• 请假期间请保持通讯畅通</li>
        </ul>
      </div>
    </div>
  )
}
