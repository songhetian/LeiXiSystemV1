import React, { useState, useEffect, useMemo } from 'react'
import { getBeijingDate, formatBeijingDate, getBeijingDateString, getLocalDateString } from '../utils/date'
import { toast } from 'sonner'
import { getApiUrl } from '../utils/apiConfig'

function EmployeeChanges() {
  const [changes, setChanges] = useState([])
  const [filter, setFilter] = useState('all')
  const [departments, setDepartments] = useState([])
  const [positions, setPositions] = useState([])
  const [searchFilteredPositions, setSearchFilteredPositions] = useState([])

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  // 搜索条件
  const [searchFilters, setSearchFilters] = useState({
    keyword: '',
    department: '',
    position: '',
    dateFrom: '',
    dateTo: ''
  })

  useEffect(() => {
    fetchChanges()
    fetchDepartments()
    fetchPositions()
  }, [filter])

  const fetchChanges = async () => {
    try {
      const token = localStorage.getItem('token')
      const url = filter === 'all'
        ? getApiUrl('/api/employee-changes')
        : getApiUrl(`/api/employee-changes?type=${filter}`)

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        toast.error('获取变动记录失败')
        return
      }

      const data = await response.json()
      setChanges(data)
    } catch (error) {
      toast.error('获取变动记录失败')
    }
  }

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl('/api/departments'), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setDepartments(data.filter(d => d.status === 'active'))
    } catch (error) {
      console.error('获取部门列表失败')
    }
  }

  const fetchPositions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl('/api/positions?limit=1000'), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setPositions(data.filter(p => p.status === 'active'))
    } catch (error) {
      setPositions([])
    }
  }

  // 根据部门筛选职位
  useEffect(() => {
    if (searchFilters.department) {
      const filtered = positions.filter(p =>
        !p.department_id || p.department_id === parseInt(searchFilters.department)
      )
      setSearchFilteredPositions(filtered)
    } else {
      setSearchFilteredPositions(positions)
    }
  }, [searchFilters.department, positions])

  const handleSearchDepartmentChange = (departmentId) => {
    setSearchFilters(prev => ({
      ...prev,
      department: departmentId,
      position: ''
    }))
  }

  const handleCustomDateChange = (field, value) => {
    if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return
    setSearchFilters(prev => ({ ...prev, [field]: value }))
  }

  // 过滤后的数据和统计
  const { filteredChanges, stats } = useMemo(() => {
    let filtered = [...changes]

    if (searchFilters.keyword) {
      const keyword = searchFilters.keyword.toLowerCase()
      filtered = filtered.filter(change =>
        change.real_name?.toLowerCase().includes(keyword) ||
        change.employee_no?.toLowerCase().includes(keyword)
      )
    }

    if (searchFilters.department) {
      filtered = filtered.filter(change =>
        change.new_department_id === parseInt(searchFilters.department) ||
        change.old_department_id === parseInt(searchFilters.department)
      )
    }

    if (searchFilters.position) {
      filtered = filtered.filter(change =>
        change.new_position === searchFilters.position ||
        change.old_position === searchFilters.position
      )
    }

    if (searchFilters.dateFrom) {
      filtered = filtered.filter(change => {
        if (!change.change_date) return false
        const changeDate = formatBeijingDate(change.change_date)
        return changeDate >= searchFilters.dateFrom
      })
    }

    if (searchFilters.dateTo) {
      filtered = filtered.filter(change => {
        if (!change.change_date) return false
        const changeDate = formatBeijingDate(change.change_date)
        return changeDate <= searchFilters.dateTo
      })
    }

    // 计算统计
    const now = getBeijingDate()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const stats = {
      hire: filtered.filter(c => 
        c.change_type === 'hire' && 
        getBeijingDate(c.change_date).getMonth() === currentMonth &&
        getBeijingDate(c.change_date).getFullYear() === currentYear
      ).length,
      leave: filtered.filter(c => 
        ['resign', 'terminate'].includes(c.change_type) &&
        getBeijingDate(c.change_date).getMonth() === currentMonth &&
        getBeijingDate(c.change_date).getFullYear() === currentYear
      ).length,
      transfer: filtered.filter(c => 
        c.change_type === 'transfer' &&
        getBeijingDate(c.change_date).getMonth() === currentMonth &&
        getBeijingDate(c.change_date).getFullYear() === currentYear
      ).length,
      promotion: filtered.filter(c => 
        c.change_type === 'promotion' &&
        getBeijingDate(c.change_date).getMonth() === currentMonth &&
        getBeijingDate(c.change_date).getFullYear() === currentYear
      ).length,
      total: filtered.length
    }

    return { filteredChanges: filtered, stats }
  }, [searchFilters, changes])

  const totalPages = Math.ceil(filteredChanges.length / pageSize)

  // 重置页码当筛选变化时
  useEffect(() => {
    setCurrentPage(1)
  }, [searchFilters, filter])

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredChanges.slice(startIndex, startIndex + pageSize)
  }

  const handlePageChange = (page) => setCurrentPage(page)
  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchFilters({
      keyword: '',
      department: '',
      position: '',
      dateFrom: '',
      dateTo: ''
    })
  }

  const getChangeTypeText = (type) => ({
    hire: '入职',
    transfer: '调动',
    promotion: '晋升',
    resign: '辞职',
    terminate: '离职'
  }[type] || type)

  const getChangeTypeConfig = (type) => ({
    hire: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    transfer: { bg: 'bg-blue-100', text: 'text-blue-800' },
    promotion: { bg: 'bg-violet-100', text: 'text-violet-800' },
    resign: { bg: 'bg-amber-100', text: 'text-amber-800' },
    terminate: { bg: 'bg-rose-100', text: 'text-rose-800' }
  }[type] || { bg: 'bg-gray-100', text: 'text-gray-800' })

  return (
    <div className="p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* 页面标题 */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">员工变动记录</h1>
            <p className="text-sm text-gray-500 mt-1">追踪员工入职、调动、晋升、离职等变动信息</p>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-emerald-100">
              <div className="text-xs font-medium text-gray-500 mb-1">本月入职</div>
              <div className="text-2xl font-bold text-emerald-600">{stats.hire}</div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-rose-100">
              <div className="text-xs font-medium text-gray-500 mb-1">本月离职</div>
              <div className="text-2xl font-bold text-rose-600">{stats.leave}</div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <div className="text-xs font-medium text-gray-500 mb-1">本月调动</div>
              <div className="text-2xl font-bold text-blue-600">{stats.transfer}</div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-violet-100">
              <div className="text-xs font-medium text-gray-500 mb-1">本月晋升</div>
              <div className="text-2xl font-bold text-violet-600">{stats.promotion}</div>
            </div>
          </div>
        </div>

      {/* 筛选区域 */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-48">
              <label className="block text-xs font-medium text-gray-600 mb-1.5 tracking-wide uppercase">搜索</label>
              <input
                type="text"
                placeholder="姓名 / 工号"
                value={searchFilters.keyword}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, keyword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 text-sm rounded focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
              />
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-gray-600 mb-1.5 tracking-wide uppercase">部门</label>
              <select
                value={searchFilters.department}
                onChange={(e) => handleSearchDepartmentChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 text-sm rounded focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all bg-white"
              >
                <option value="">全部</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-gray-600 mb-1.5 tracking-wide uppercase">职位</label>
              <select
                value={searchFilters.position}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, position: e.target.value }))}
                disabled={!searchFilters.department}
                className="w-full px-3 py-2 border border-gray-200 text-sm rounded focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">全部</option>
                {searchFilteredPositions.map(pos => (
                  <option key={pos.id} value={pos.name}>{pos.name}</option>
                ))}
              </select>
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-gray-600 mb-1.5 tracking-wide uppercase">类型</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 text-sm rounded focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all bg-white"
              >
                <option value="all">全部</option>
                <option value="hire">入职</option>
                <option value="transfer">调动</option>
                <option value="promotion">晋升</option>
                <option value="resign">辞职</option>
                <option value="terminate">离职</option>
              </select>
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-gray-600 mb-1.5 tracking-wide uppercase">开始日期</label>
              <input
                type="date"
                value={searchFilters.dateFrom}
                onChange={(e) => handleCustomDateChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 text-sm rounded focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
              />
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-gray-600 mb-1.5 tracking-wide uppercase">结束日期</label>
              <input
                type="date"
                value={searchFilters.dateTo}
                onChange={(e) => handleCustomDateChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 text-sm rounded focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
              />
            </div>
            {(searchFilters.keyword || searchFilters.department || searchFilters.position || filter !== 'all' || searchFilters.dateFrom || searchFilters.dateTo) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-200 rounded hover:border-gray-300 hover:bg-white transition-all"
              >
                清空筛选
              </button>
            )}
          </div>

          {/* 快捷时间选择按钮 */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">快捷选择：</span>
            <button
              onClick={() => {
                const today = getBeijingDateString()
                setSearchFilters({ ...searchFilters, dateFrom: today, dateTo: today })
              }}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                searchFilters.dateFrom === searchFilters.dateTo && searchFilters.dateFrom === getBeijingDateString()
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              今天
            </button>
            <button
              onClick={() => {
                const yesterday = new Date()
                yesterday.setDate(yesterday.getDate() - 1)
                const dateStr = getBeijingDateString(yesterday)
                setSearchFilters({ ...searchFilters, dateFrom: dateStr, dateTo: dateStr })
              }}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                (() => {
                  const yesterday = new Date()
                  yesterday.setDate(yesterday.getDate() - 1)
                  const dateStr = getBeijingDateString(yesterday)
                  return searchFilters.dateFrom === searchFilters.dateTo && searchFilters.dateFrom === dateStr
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                })()
              }`}
            >
              昨天
            </button>
            <button
              onClick={() => {
                const now = new Date()
                const threeDaysAgo = new Date(now)
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 2)
                setSearchFilters({
                  ...searchFilters,
                  dateFrom: getBeijingDateString(threeDaysAgo),
                  dateTo: getBeijingDateString(now)
                })
              }}
              className="px-3 py-1.5 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              近3天
            </button>
            <button
              onClick={() => {
                const now = new Date()
                const sevenDaysAgo = new Date(now)
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
                setSearchFilters({
                  ...searchFilters,
                  dateFrom: getBeijingDateString(sevenDaysAgo),
                  dateTo: getBeijingDateString(now)
                })
              }}
              className="px-3 py-1.5 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              近7天
            </button>
            <button
              onClick={() => {
                const now = new Date()
                const thirtyDaysAgo = new Date(now)
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
                setSearchFilters({
                  ...searchFilters,
                  dateFrom: getBeijingDateString(thirtyDaysAgo),
                  dateTo: getBeijingDateString(now)
                })
              }}
              className="px-3 py-1.5 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              近30天
            </button>
            <button
              onClick={() => {
                const now = new Date()
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                setSearchFilters({
                  ...searchFilters,
                  dateFrom: getBeijingDateString(firstDayOfMonth),
                  dateTo: getBeijingDateString(now)
                })
              }}
              className="px-3 py-1.5 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              本月
            </button>
            <button
              onClick={() => {
                const now = new Date()
                const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
                setSearchFilters({
                  ...searchFilters,
                  dateFrom: getBeijingDateString(firstDayLastMonth),
                  dateTo: getBeijingDateString(lastDayLastMonth)
                })
              }}
              className="px-3 py-1.5 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              上月
            </button>
          </div>
        </div>

      {/* 数据列表 */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase">日期</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase">员工信息</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 tracking-wide uppercase">变动类型</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase">变动内容</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase">变动原因</th>
              </tr>
            </thead>
            <tbody>
              {filteredChanges.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-16 text-center">
                    <p className="text-gray-400 text-sm">{changes.length === 0 ? '暂无变动记录' : '没有符合条件的记录'}</p>
                  </td>
                </tr>
              ) : (
                getCurrentPageData().map((change, index) => {
                  const config = getChangeTypeConfig(change.change_type)
                  return (
                    <tr key={change.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-gray-900">{formatBeijingDate(change.change_date)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                            {change.real_name?.charAt(0) || '员'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{change.real_name}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{change.employee_no}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
                          {getChangeTypeText(change.change_type)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-gray-700">
                          {change.change_type === 'hire' && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">部门</span>
                                <span className={`font-medium ${config.text}`}>{change.new_department_name || '-'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">职位</span>
                                <span className={`font-medium ${config.text}`}>{change.new_position || '-'}</span>
                              </div>
                            </div>
                          )}
                          {change.change_type === 'transfer' && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-600">{change.old_department_name || '-'}</span>
                              <span className="text-gray-400 mx-1">→</span>
                              <span className={`font-medium ${config.text}`}>{change.new_department_name || '-'}</span>
                            </div>
                          )}
                          {change.change_type === 'promotion' && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-600">{change.old_position || '-'}</span>
                              <span className="text-gray-400 mx-1">→</span>
                              <span className={`font-medium ${config.text}`}>{change.new_position || '-'}</span>
                            </div>
                          )}
                          {['resign', 'terminate'].includes(change.change_type) && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">部门</span>
                                <span className={`font-medium ${config.text}`}>{change.old_department_name || '-'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">职位</span>
                                <span className={`font-medium ${config.text}`}>{change.old_position || '-'}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {change.reason || <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

      {/* 分页组件 */}
        {filteredChanges.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>每页</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-2.5 py-1.5 border border-gray-200 text-sm rounded focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all bg-white"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>条，共 {filteredChanges.length} 条</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded disabled:text-gray-300 disabled:border-gray-100 disabled:cursor-not-allowed hover:bg-white hover:border-gray-300 transition-all"
              >
                首页
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded disabled:text-gray-300 disabled:border-gray-100 disabled:cursor-not-allowed hover:bg-white hover:border-gray-300 transition-all"
              >
                上一页
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 7) {
                    pageNum = i + 1
                  } else if (currentPage <= 4) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i
                  } else {
                    pageNum = currentPage - 3 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1.5 text-sm border rounded transition-all ${currentPage === pageNum
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'border-gray-200 hover:bg-white hover:border-gray-300'
                        }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded disabled:text-gray-300 disabled:border-gray-100 disabled:cursor-not-allowed hover:bg-white hover:border-gray-300 transition-all"
              >
                下一页
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded disabled:text-gray-300 disabled:border-gray-100 disabled:cursor-not-allowed hover:bg-white hover:border-gray-300 transition-all"
              >
                末页
              </button>

              <span className="text-sm text-gray-500 ml-2">
                {currentPage} / {totalPages}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmployeeChanges
