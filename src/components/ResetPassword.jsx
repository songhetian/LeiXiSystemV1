import React, { useState, useEffect } from 'react'
import { toast } from 'sonner';
import Modal from './Modal'
import { getApiUrl } from '../utils/apiConfig'

function ResetPassword() {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchFilters, setSearchFilters] = useState({
    keyword: '',
    department: ''
  })
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    fetchEmployees()
    fetchDepartments()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl('/api/employees'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setEmployees(data)
        } else {
          console.error('API returned non-array:', data)
          setEmployees([])
        }
      }
    } catch (error) {
      console.error('获取员工列表失败:', error)
      toast.error('获取员工列表失败')
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl('/api/departments'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (Array.isArray(data)) {
        setDepartments(data.filter(d => d.status === 'active'))
      }
    } catch (error) {
      console.error('获取部门列表失败')
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('请输入新密码')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }

    if (newPassword.length < 6) {
      toast.error('密码长度至少6位')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')

      const response = await fetch(getApiUrl(`/api/users/${selectedEmployee.id}/reset-password`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword })
      })

      if (response.ok) {
        toast.success('密码重置成功')
        setIsModalOpen(false)
        setNewPassword('')
        setConfirmPassword('')
        setSelectedEmployee(null)
      } else {
        const data = await response.json()
        toast.error(data.message || '密码重置失败')
      }
    } catch (error) {
      console.error('密码重置失败:', error)
      toast.error('密码重置失败')
    } finally {
      setLoading(false)
    }
  }

  // [ResetPassword-v4] 终极过滤逻辑
  const displayEmployeesList = (() => {
    const source = Array.isArray(employees) ? employees : [];
    const filtered = source.filter(emp => {
      const matchKeyword = !searchFilters.keyword ||
        (emp.real_name?.toLowerCase().includes(searchFilters.keyword.toLowerCase())) ||
        (emp.username?.toLowerCase().includes(searchFilters.keyword.toLowerCase())) ||
        (emp.employee_no?.toLowerCase().includes(searchFilters.keyword.toLowerCase()));

      const matchDepartment = !searchFilters.department ||
        emp.department_id === parseInt(searchFilters.department);

      return matchKeyword && matchDepartment;
    });
    return Array.isArray(filtered) ? filtered : [];
  })();

  // 更新总页数
  useEffect(() => {
    const count = displayEmployeesList.length;
    setTotalPages(Math.ceil(count / pageSize));
  }, [displayEmployeesList, pageSize]);

  // 获取当前页数据
  const getCurrentPageData = () => {
    // 使用 Array.from 确保绝对安全，并重命名变量规避缓存冲突
    const safeList = Array.from(displayEmployeesList || []);
    const startIndex = (currentPage - 1) * pageSize;
    return safeList.slice(startIndex, startIndex + pageSize);
  };

  // 分页控制
  const handlePageChange = (page) => setCurrentPage(page)
  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const handleSearchChange = (field, value) => {
    setSearchFilters(prev => ({ ...prev, [field]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchFilters({
      keyword: '',
      department: ''
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">加载中...</div>
      </div>
    )
  }

  const totalCount = displayEmployeesList.length

  return (
    <div className="p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* 页面标题 */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">重置密码</h1>
            <p className="text-sm text-gray-500 mt-1">为员工重置登录密码</p>
          </div>
        </div>

        {/* 筛选区域 */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 mb-1.5 tracking-wide uppercase">搜索</label>
              <input
                type="text"
                placeholder="姓名 / 用户名 / 工号"
                value={searchFilters.keyword}
                onChange={(e) => handleSearchChange('keyword', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 text-sm rounded focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
              />
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-gray-600 mb-1.5 tracking-wide uppercase">部门</label>
              <select
                value={searchFilters.department}
                onChange={(e) => handleSearchChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 text-sm rounded focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all bg-white"
              >
                <option value="">全部</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            {(searchFilters.keyword || searchFilters.department) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-200 rounded hover:border-gray-300 hover:bg-white transition-all"
              >
                清空筛选
              </button>
            )}
          </div>
        </div>

        {/* 员工列表 */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase">工号</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase">姓名</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase">用户名</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide uppercase">部门</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 tracking-wide uppercase">状态</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 tracking-wide uppercase">操作</th>
              </tr>
            </thead>
            <tbody>
              {totalCount > 0 ? (
                getCurrentPageData().map((employee) => (
                  <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 text-sm text-gray-600">{employee.employee_no || '-'}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                          {employee.real_name?.charAt(0) || 'U'}
                        </div>
                        <div className="text-sm font-medium text-gray-900">{employee.real_name}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{employee.username || '-'}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {departments.find(d => d.id === employee.department_id)?.name || '-'}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        employee.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                        employee.status === 'resigned' ? 'bg-rose-100 text-rose-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {employee.status === 'active' ? '在职' :
                         employee.status === 'resigned' ? '离职' : '停用'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedEmployee(employee)
                          setIsModalOpen(true)
                        }}
                        className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        重置密码
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-5 py-16 text-center">
                    <p className="text-gray-400 text-sm">暂无员工数据</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalCount > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>每页</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                className="px-2.5 py-1.5 border border-gray-200 text-sm rounded focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all bg-white"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>条，共 {totalCount} 条</span>
            </div>

            {totalPages > 1 && (
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
                        className={`px-3 py-1.5 text-sm border rounded transition-all ${
                          currentPage === pageNum
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
              </div>
            )}
          </div>
        )}
      </div>

      {/* 重置密码模态框 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setNewPassword('')
          setConfirmPassword('')
          setSelectedEmployee(null)
        }}
        title="重置密码"
      >
        {selectedEmployee && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm">
                <span className="text-gray-600">员工：</span>
                <span className="font-medium text-gray-900">{selectedEmployee.real_name}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新密码
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码（至少6位）"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                确认密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setNewPassword('')
                  setConfirmPassword('')
                  setSelectedEmployee(null)
                }}
                className="px-5 py-2 border border-gray-200 text-sm text-gray-700 hover:text-gray-900 rounded-lg hover:border-gray-300 hover:bg-white transition-all"
              >
                取消
              </button>
              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="px-5 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '重置中...' : '确认重置'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ResetPassword
