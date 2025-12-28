/**
 * Displays a statistical analysis page of each departments of
 */

import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'sonner';
import { getCurrentUser, isSystemAdmin } from '../../utils/auth'
import { getApiUrl } from '../../utils/apiConfig'
import { formatDate, formatDateTime } from '../../utils/date'
import { Table, Button, Input, Select, DatePicker, Space, Modal } from 'antd'
import { SearchOutlined, ExportOutlined } from '@ant-design/icons'


export default function DepartmentStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState('')

  // Date Selection Mode: 'month' or 'custom'
  const [dateMode, setDateMode] = useState('month')
  const [selectedMonth, setSelectedMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  })
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  // Search
  const [keyword, setKeyword] = useState('')

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  })

  // Details Modal State
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedEmployeeForDetails, setSelectedEmployeeForDetails] = useState(null)
  const [employeeDetails, setEmployeeDetails] = useState([])
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    fetchDepartments()
  }, [])

  useEffect(() => {
    if (selectedDepartment) {
      fetchDepartmentStats()
    }
  }, [selectedDepartment, selectedMonth, customDateRange, dateMode, pagination.page, pagination.limit])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedDepartment) {
        setPagination(prev => ({ ...prev, page: 1 }))
        fetchDepartmentStats()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [keyword])

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

      const response = await axios.get(getApiUrl('/api/departments/list'), { headers })
      if (response.data.success) {
        const activeDepts = response.data.data.filter(d => d.status === 'active')

        setDepartments(activeDepts)
        if (activeDepts.length > 0) {
          setSelectedDepartment(activeDepts[0].id)
        } else {
          toast.warning('没有可用的部门，请联系管理员配置部门权限')
        }
      }
    } catch (error) {
      console.error('获取部门列表失败:', error)
      toast.error('获取部门列表失败')
    }
  }

  const fetchDepartmentStats = async () => {
    setLoading(true)
    try {
      const params = {
        department_id: selectedDepartment,
        page: pagination.page,
        limit: pagination.limit,
        keyword: keyword
      }

      if (dateMode === 'month') {
        params.year = selectedMonth.year
        params.month = selectedMonth.month
      } else {
        params.start_date = customDateRange.start
        params.end_date = customDateRange.end
      }

      const response = await axios.get(getApiUrl('/api/attendance/department-stats'), {
        params
      })

      if (response.data.success) {
        setStats(response.data.data)
        if (response.data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: response.data.pagination.total
          }))
        }
      }
    } catch (error) {
      console.error('获取部门统计失败:', error)
      // toast.error('获取部门统计失败') // Prevent spamming toasts on search
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployeeDetails = async (employee) => {
    setSelectedEmployeeForDetails(employee)
    setShowDetailsModal(true)
    setDetailsLoading(true)
    setEmployeeDetails([])

    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      let startDate, endDate
      if (dateMode === 'month') {
        startDate = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}-01`
        endDate = new Date(selectedMonth.year, selectedMonth.month, 0).toISOString().split('T')[0]
      } else {
        startDate = customDateRange.start
        endDate = customDateRange.end
      }

      const response = await axios.get(getApiUrl('/api/attendance/records'), {
        params: {
          employee_id: employee.user_id, // Using user_id from stats as employee_id for records API
          start_date: startDate,
          end_date: endDate
        },
        headers
      })

      if (response.data.success) {
        setEmployeeDetails(response.data.data)
      }
    } catch (error) {
      console.error('获取详情失败:', error)
      toast.error('获取详情失败')
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleMonthChange = (year, month) => {
    setSelectedMonth({ year, month })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePrevMonth = () => {
    const newMonth = selectedMonth.month - 1
    if (newMonth < 1) {
      handleMonthChange(selectedMonth.year - 1, 12)
    } else {
      handleMonthChange(selectedMonth.year, newMonth)
    }
  }

  const handleNextMonth = () => {
    const newMonth = selectedMonth.month + 1
    if (newMonth > 12) {
      handleMonthChange(selectedMonth.year + 1, 1)
    } else {
      handleMonthChange(selectedMonth.year, newMonth)
    }
  }

  const handleThisMonth = () => {
    const now = new Date()
    handleMonthChange(now.getFullYear(), now.getMonth() + 1)
  }

  const handleExport = () => {
    let url = getApiUrl(`/api/export/department/${selectedDepartment}`)
    if (dateMode === 'month') {
      const month = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}`
      url += `?month=${month}`
    } else {
      url += `?start_date=${customDateRange.start}&end_date=${customDateRange.end}`
    }

    if (keyword) {
        url += `&keyword=${encodeURIComponent(keyword)}`
    }

    window.open(url, '_blank')
    toast.success('正在导出...')
  }

  const isCurrentMonth = () => {
    const now = new Date()
    return selectedMonth.year === now.getFullYear() && selectedMonth.month === now.getMonth() + 1
  }

  const columns = [
    {
      title: '工号',
      dataIndex: 'employee_no',
      key: 'employee_no',
      align: 'center',
      width: 120
    },
    {
      title: '姓名',
      dataIndex: 'real_name',
      key: 'real_name',
      align: 'center',
      width: 120
    },
    {
      title: '出勤天数',
      dataIndex: 'attendance_days',
      key: 'attendance_days',
      align: 'center',
      width: 100
    },
    {
      title: '出勤率',
      dataIndex: 'attendance_rate',
      key: 'attendance_rate',
      align: 'center',
      width: 100,
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
          value >= 95 ? 'bg-green-50 text-green-700 border border-green-200' :
          value >= 85 ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {value}%
        </span>
      )
    },
    {
      title: '迟到',
      dataIndex: 'late_count',
      key: 'late_count',
      align: 'center',
      width: 80,
      render: (value) => value > 0 ? value : '-'
    },
    {
      title: '早退',
      dataIndex: 'early_count',
      key: 'early_count',
      align: 'center',
      width: 80,
      render: (value) => value > 0 ? value : '-'
    },
    {
      title: '缺勤',
      dataIndex: 'absent_count',
      key: 'absent_count',
      align: 'center',
      width: 80,
      render: (value) => value > 0 ? value : '-'
    },
    {
      title: '请假',
      dataIndex: 'leave_days',
      key: 'leave_days',
      align: 'center',
      width: 80,
      render: (value) => value > 0 ? value : '-'
    },
    {
      title: '工作时长',
      dataIndex: 'total_work_hours',
      key: 'total_work_hours',
      align: 'center',
      width: 100,
      render: (value) => `${value}h`
    }
  ]

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        {/* 头部 */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">部门考勤统计</h1>
        </div>

        {/* 筛选器 */}
        <div className="border-b border-gray-100 pb-6 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* 部门选择 */}
            <Select
              value={selectedDepartment}
              onChange={(value) => {
                setSelectedDepartment(value)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              style={{ width: 180 }}
              placeholder="选择部门"
            >
              {departments.map((dept) => (
                <Select.Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Select.Option>
              ))}
            </Select>

            {/* 统计模式选择 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setDateMode('month')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  dateMode === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                按月统计
              </button>
              <button
                onClick={() => setDateMode('custom')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  dateMode === 'custom' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                自定义日期
              </button>
            </div>

            {/* 日期选择 */}
            {dateMode === 'month' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <DatePicker.MonthPicker
                  placeholder={`${selectedMonth.year}年${selectedMonth.month}月`}
                  onChange={(date) => {
                    if (date) {
                      handleMonthChange(date.year(), date.month() + 1)
                    }
                  }}
                  format="YYYY年MM月"
                  style={{ width: 140 }}
                />
                <button
                  onClick={handleNextMonth}
                  className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={handleThisMonth}
                  disabled={isCurrentMonth()}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  本月
                </button>
              </div>
            ) : (
              <DatePicker.RangePicker
                placeholder={customDateRange.start && customDateRange.end ? [customDateRange.start, customDateRange.end] : ['开始日期', '结束日期']}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setCustomDateRange({
                      start: dates[0].format('YYYY-MM-DD'),
                      end: dates[1].format('YYYY-MM-DD')
                    })
                  }
                }}
                format="YYYY-MM-DD"
              />
            )}

            {/* 搜索框 */}
            <Input
              placeholder="搜索姓名或工号..."
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
              style={{ width: 200 }}
            />

            {/* 导出按钮 */}
            <Button
              type="primary"
              icon={<ExportOutlined />}
              onClick={handleExport}
              disabled={!stats}
              className="bg-green-600 hover:bg-green-700 border-none"
            >
              导出报表
            </Button>
          </div>
        </div>
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          加载中...
        </div>
      ) : !stats ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          请选择部门查看统计数据
        </div>
      ) : (
        <>
          {/* 部门概览 - 优化样式 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-blue-600 font-medium mb-1">总人数</div>
                  <div className="text-3xl font-bold text-blue-900">
                    {stats.summary.total_employees}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">人</div>
                </div>
                <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-green-600 font-medium mb-1">出勤率</div>
                  <div className="text-3xl font-bold text-green-900">
                    {stats.summary.attendance_rate}%
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    工作日 {stats.summary.work_days} 天
                  </div>
                </div>
                <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-red-600 font-medium mb-1">迟到次数</div>
                  <div className="text-3xl font-bold text-red-900">
                    {stats.summary.total_late_count}
                  </div>
                  <div className="text-xs text-red-600 mt-1">次</div>
                </div>
                <div className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-orange-600 font-medium mb-1">早退次数</div>
                  <div className="text-3xl font-bold text-orange-900">
                    {stats.summary.total_early_count}
                  </div>
                  <div className="text-xs text-orange-600 mt-1">次</div>
                </div>
                <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* 员工考勤列表 */}
          <Table
            columns={columns}
            dataSource={stats?.employees || []}
            rowKey="user_id"
            loading={loading}
            onRow={(record) => ({
              onClick: () => fetchEmployeeDetails(record),
              className: 'cursor-pointer hover:bg-gray-50/50'
            })}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (page, pageSize) => {
                setPagination({ page, limit: pageSize })
              }
            }}
            scroll={{ x: 'max-content' }}
            locale={{
              emptyText: (
                <div className="py-12 text-center text-gray-400">
                  <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">暂无数据</h3>
                  <p className="mt-1 text-xs text-gray-500">该部门在此时间段内没有考勤记录。</p>
                </div>
              )
            }}
          />
        </>
      )}

      {/* Details Modal */}
      <Modal
        title={`${selectedEmployeeForDetails?.real_name} - 考勤明细`}
        open={showDetailsModal}
        onCancel={() => setShowDetailsModal(false)}
        footer={null}
        width={700}
        centered
      >
        {detailsLoading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : (
          <Table
            columns={[
              {
                title: '日期',
                dataIndex: 'record_date',
                key: 'record_date',
                align: 'center',
                render: (value) => formatDate(value)
              },
              {
                title: '班次',
                dataIndex: 'shift_name',
                key: 'shift_name',
                align: 'center'
              },
              {
                title: '上班打卡',
                dataIndex: 'clock_in_time',
                key: 'clock_in_time',
                align: 'center',
                render: (value) => value ? formatDateTime(value).split(' ')[1] : '-'
              },
              {
                title: '下班打卡',
                dataIndex: 'clock_out_time',
                key: 'clock_out_time',
                align: 'center',
                render: (value) => value ? formatDateTime(value).split(' ')[1] : '-'
              },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                align: 'center',
                render: (value) => (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                    value === 'normal' ? 'bg-green-50 text-green-700 border border-green-200' :
                    value === 'late' ? 'bg-red-50 text-red-700 border border-red-200' :
                    value === 'early' || value === 'early_leave' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                    value === 'leave' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                    value === 'rest' || value === 'off' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    'bg-gray-50 text-gray-700 border border-gray-200'
                  }`}>
                    {
                      value === 'normal' ? '正常' :
                      value === 'late' ? '迟到' :
                      value === 'early' || value === 'early_leave' ? '早退' :
                      value === 'leave' ? '请假' :
                      value === 'rest' || value === 'off' ? '休息' :
                      value === 'absent' ? '缺勤' :
                      value
                    }
                  </span>
                )
              }
            ]}
            dataSource={employeeDetails}
            rowKey={(record, idx) => idx}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              size: 'small'
            }}
            size="small"
            tableLayout="fixed"
            scroll={{ y: 400 }}
          />
        )}
      </Modal>
      </div>
    </div>
  )
}
