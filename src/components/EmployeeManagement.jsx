import React, { useState, useEffect } from 'react'
import { toast } from 'sonner';
import Modal from './Modal'
import EmployeeDetail from './EmployeeDetail'
import EmployeeBatchOperations from './EmployeeBatchOperations'
import UserDepartmentModal from './UserDepartmentModal'  // 添加这一行
import { getApiUrl } from '../utils/apiConfig'

function EmployeeManagement() {
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [positions, setPositions] = useState([])
  const [roles, setRoles] = useState([])
  const [filteredPositions, setFilteredPositions] = useState([])
  const [searchFilteredPositions, setSearchFilteredPositions] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [editingEmp, setEditingEmp] = useState(null)
  const [viewingEmp, setViewingEmp] = useState(null)
  const [deletingEmp, setDeletingEmp] = useState(null)
  const [statusChangingEmp, setStatusChangingEmp] = useState(null)
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false)
  const [managerChangingEmp, setManagerChangingEmp] = useState(null)
  const [managerChangeValue, setManagerChangeValue] = useState(false)
  const [loading, setLoading] = useState(true)
  const [statusChangeData, setStatusChangeData] = useState({
    newStatus: '',
    changeDate: new Date().toISOString().split('T')[0],
    reason: ''
  })
  const [dbError, setDbError] = useState(false);
  const [dbErrorMessage, setDbErrorMessage] = useState('');

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)

  // 员工部门权限状态
  const [isUserDepartmentModalOpen, setIsUserDepartmentModalOpen] = useState(false);
  const [selectedUserForDepartment, setSelectedUserForDepartment] = useState(null);

  // 搜索条件
  const [searchFilters, setSearchFilters] = useState({
    keyword: '',
    department: '',
    position: '',
    status: 'active', // 默认显示在职员工
    rating: '',
    dateFrom: '',
    dateTo: ''
  })
  const [formData, setFormData] = useState({
    employee_no: '',
    real_name: '',
    email: '',
    phone: '',
    department_id: '',
    position: '',
    hire_date: new Date().toISOString().split('T')[0],
    rating: 3,
    status: 'active',
    avatar: '',
    emergency_contact: '',
    emergency_phone: '',
    address: '',
    education: '',
    skills: '',
    remark: '',
    role_id: '', // 修改为单个角色ID
    is_department_manager: false
  })
  const [validationErrors, setValidationErrors] = useState({})
  const [avatarPreview, setAvatarPreview] = useState('')

  useEffect(() => {
    fetchEmployees()
    fetchDepartments()
    fetchPositions()
    fetchRoles()
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

      // 检查响应状态
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json()
      setEmployees(data)
      setFilteredEmployees(data)
      setDbError(false);
      setDbErrorMessage('');
    } catch (error) {
      // 检查是否是连接错误
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        const errorMsg = '无法连接到后端服务器,请确保后端服务已启动 (npm run server)';
        toast.error(errorMsg, {
          autoClose: 5000
        })
        setDbError(true);
        setDbErrorMessage(errorMsg);
      } else {
        toast.error('获取员工列表失败')
        setDbError(true);
        setDbErrorMessage('获取员工列表失败');
      }
      console.error('获取员工列表失败:', error)
      // 在无法获取数据时显示友好的提示信息
      setEmployees([])
      setFilteredEmployees([])
    } finally {
      setLoading(false)
    }
  }

  // 搜索过滤
  useEffect(() => {
    let filtered = [...employees]

    // 关键词搜索（姓名、工号、邮箱、手机、职位）
    if (searchFilters.keyword) {
      const keyword = searchFilters.keyword.toLowerCase()
      filtered = filtered.filter(emp =>
        emp.real_name?.toLowerCase().includes(keyword) ||
        emp.employee_no?.toLowerCase().includes(keyword) ||
        emp.email?.toLowerCase().includes(keyword) ||
        emp.phone?.includes(keyword) ||
        emp.position?.toLowerCase().includes(keyword)
      )
    }

    // 部门筛选
    if (searchFilters.department) {
      filtered = filtered.filter(emp => emp.department_id === parseInt(searchFilters.department))
    }

    // 职位筛选
    if (searchFilters.position) {
      filtered = filtered.filter(emp => emp.position === searchFilters.position)
    }

    // 状态筛选
    if (searchFilters.status) {
      filtered = filtered.filter(emp => emp.status === searchFilters.status)
    }

    // 评级筛选
    if (searchFilters.rating) {
      filtered = filtered.filter(emp => emp.rating === parseInt(searchFilters.rating))
    }

    // 日期筛选（按入职日期）
    if (searchFilters.dateFrom) {
      filtered = filtered.filter(emp => {
        if (!emp.hire_date) return false
        const empDate = new Date(emp.hire_date).toISOString().split('T')[0]
        return empDate >= searchFilters.dateFrom
      })
    }

    if (searchFilters.dateTo) {
      filtered = filtered.filter(emp => {
        if (!emp.hire_date) return false
        const empDate = new Date(emp.hire_date).toISOString().split('T')[0]
        return empDate <= searchFilters.dateTo
      })
    }

    setFilteredEmployees(filtered)
    setTotalPages(Math.ceil(filtered.length / pageSize))
    setCurrentPage(1) // 筛选后重置到第一页
  }, [searchFilters, employees, pageSize])

  // 获取当前页的数据
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredEmployees.slice(startIndex, endIndex)
  }

  // 分页控制
  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const handleSearchChange = (field, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const clearFilters = () => {
    setSearchFilters({
      keyword: '',
      department: '',
      position: '',
      status: '',
      rating: '',
      dateFrom: '',
      dateTo: ''
    })
  }

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      // 使用带权限控制的部门列表接口
      const response = await fetch(getApiUrl('/api/departments/list'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      console.log('获取部门列表结果:', result);
      if (result.success) {
        setDepartments(result.data.filter(d => d.status === 'active'));
      } else {
        // 如果/api/departments/list不可用，回退到普通端点
        const fallbackResponse = await fetch(getApiUrl('/api/departments'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const fallbackData = await fallbackResponse.json();
        setDepartments(Array.isArray(fallbackData) ? fallbackData.filter(d => d.status === 'active') : []);
      }
    } catch (error) {
      console.error('获取部门列表失败:', error);
      // 出错时设置为空数组或默认值
      setDepartments([]);
    }
  };

  const fetchPositions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl('/api/positions?limit=1000'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('获取职位列表失败 - HTTP错误:', response.status, errorData)
        setPositions([])
        return
      }

      const result = await response.json()

      const data = result.success ? result.data : []
      setPositions(data.filter(p => p.status === 'active'))
    } catch (error) {
      console.error('获取职位列表失败 - 异常:', error)
      setPositions([])
    }
  }

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl('/api/roles'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()
      if (Array.isArray(result)) {
        setRoles(result)
      } else if (result.success && Array.isArray(result.data)) {
        setRoles(result.data)
      } else {
        setRoles([])
      }
    } catch (error) {
      console.error('获取角色列表失败', error)
      setRoles([])
    }
  }

  // 根据部门筛选职位（表单用）
  useEffect(() => {
    if (formData.department_id) {
      const filtered = positions.filter(p =>
        !p.department_id || p.department_id === parseInt(formData.department_id)
      )
      setFilteredPositions(filtered)
    } else {
      setFilteredPositions(positions)
    }
  }, [formData.department_id, positions])

  // 根据部门筛选职位（搜索筛选用）
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

  // 部门改变时清空职位选择（表单）
  const handleDepartmentChange = (departmentId) => {
    setFormData({
      ...formData,
      department_id: departmentId,
      position: '' // 清空职位
    })
  }

  // 部门改变时清空职位选择（搜索筛选）
  const handleSearchDepartmentChange = (departmentId) => {
    setSearchFilters({
      ...searchFilters,
      department: departmentId,
      position: '' // 清空职位
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // 表单校验
    const errors = {}
    if (!formData.real_name) errors.real_name = true
    if (!formData.phone) errors.phone = true
    if (!formData.department_id) errors.department_id = true
    if (!formData.position) errors.position = true

    setValidationErrors(errors)

    if (Object.keys(errors).length > 0) {
      toast.error('请填写必填项')
      return
    }

    try {
      const url = editingEmp
        ? getApiUrl(`/api/employees/${editingEmp.id}`)
        : getApiUrl('/api/employees')

      const response = await fetch(url, {
        method: editingEmp ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const result = await response.json()
        const userId = editingEmp ? editingEmp.user_id : result.id

        // 更新用户角色（单个角色）
        if (formData.role_id) {
          // 先获取当前角色
          const currentRolesRes = await fetch(getApiUrl(`/api/users/${userId}/roles`))
          const currentRoles = await currentRolesRes.json()

          // 删除所有现有角色
          for (const role of currentRoles) {
            await fetch(getApiUrl(`/api/users/${userId}/roles/${role.id}`), {
              method: 'DELETE'
            })
          }

          // 添加新角色
          await fetch(getApiUrl(`/api/users/${userId}/roles`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role_id: formData.role_id })
          })
        }

        // 更新部门主管标识
        if (userId) {
          await fetch(getApiUrl(`/api/users/${userId}/department-manager`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isDepartmentManager: formData.is_department_manager })
          })
        }

        toast.success(editingEmp ? '员工更新成功' : '员工创建成功')
        setIsModalOpen(false)
        fetchEmployees()
        resetForm()
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleEdit = async (emp) => {
    try {
      // 获取用户的角色信息
      const token = localStorage.getItem('token')
      const roleResponse = await fetch(getApiUrl(`/api/users/${emp.user_id}/roles`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const roleData = await roleResponse.json()
      const userRoles = roleData.success ? roleData.data : []

      setEditingEmp(emp)
      setFormData({
        employee_no: emp.employee_no || '',
        real_name: emp.real_name || '',
        email: emp.email || '',
        phone: emp.phone || '',
        department_id: emp.department_id || '',
        position: emp.position || '',
        hire_date: emp.hire_date ? emp.hire_date.split('T')[0] : '',
        rating: emp.rating || 3,
        status: emp.status || 'active',
        avatar: emp.avatar || '',
        emergency_contact: emp.emergency_contact || '',
        emergency_phone: emp.emergency_phone || '',
        address: emp.address || '',
        education: emp.education || '',
        skills: emp.skills || '',
        remark: emp.remark || '',
        role_id: userRoles.length > 0 ? userRoles[0].id : '',
        is_department_manager: emp.is_department_manager === 1 || emp.is_department_manager === true
      })
      setAvatarPreview(emp.avatar || '')
      setIsModalOpen(true)
    } catch (error) {
      console.error('获取员工角色信息失败:', error)
      toast.error('获取员工信息失败')
    }
  }

  const handleDeleteClick = (emp) => {
    setDeletingEmp(emp)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingEmp) return

    try {
      const response = await fetch(getApiUrl(`/api/employees/${deletingEmp.id}`), {
        method: 'DELETE'
      })
      if (response.ok) {
        toast.success('员工删除成功')
        setIsDeleteModalOpen(false)
        setDeletingEmp(null)
        fetchEmployees()
      } else {
        toast.error('删除失败')
      }
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const handleStatusClick = (emp) => {
    setStatusChangingEmp(emp)
    setStatusChangeData({
      newStatus: emp.status,
      changeDate: new Date().toISOString().split('T')[0],
      reason: ''
    })
    setIsStatusModalOpen(true)
  }

  const handleStatusChange = async () => {
    if (!statusChangingEmp) return

    try {
      // 1. 更新员工状态
      const response = await fetch(getApiUrl(`/api/employees/${statusChangingEmp.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...statusChangingEmp,
          status: statusChangeData.newStatus
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('状态更新失败:', errorData)
        toast.error('状态更新失败: ' + (errorData.error || '未知错误'))
        return
      }

      // 2. 记录变动到employee_changes表
      const changeType = statusChangeData.newStatus === 'resigned' ? 'resign' :
        statusChangeData.newStatus === 'inactive' ? 'terminate' : 'hire'

      const changeData = {
        employee_id: statusChangingEmp.id,
        user_id: statusChangingEmp.user_id,
        change_type: changeType,
        change_date: statusChangeData.changeDate,
        old_department_id: statusChangingEmp.department_id,
        new_department_id: statusChangingEmp.department_id,
        old_position: statusChangingEmp.position,
        new_position: statusChangingEmp.position,
        reason: statusChangeData.reason
      }


      const changeResponse = await fetch(getApiUrl('/api/employee-changes/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changeData)
      })

      if (!changeResponse.ok) {
        const errorData = await changeResponse.json()
        console.error('创建变动记录失败:', errorData)
        toast.warning('状态已更新，但变动记录创建失败')
      } else {
        const result = await changeResponse.json()
        toast.success('状态修改成功')
      }

      setIsStatusModalOpen(false)
      setStatusChangingEmp(null)
      fetchEmployees()
    } catch (error) {
      console.error('操作失败:', error)
      toast.error('操作失败: ' + error.message)
    }
  }

  const handleManagerClick = (emp) => {
    setManagerChangingEmp(emp)
    setManagerChangeValue(emp.is_department_manager === 1 || emp.is_department_manager === true)
    setIsManagerModalOpen(true)
  }

  const handleManagerChangeConfirm = async () => {
    if (!managerChangingEmp || !managerChangingEmp.user_id) {
      toast.error('无法获取用户ID')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl(`/api/users/${managerChangingEmp.user_id}/department-manager`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isDepartmentManager: managerChangeValue })
      })

      if (response.ok) {
        toast.success('部门主管状态更新成功')
        setIsManagerModalOpen(false)
        setManagerChangingEmp(null)
        fetchEmployees()
      } else {
        toast.error('更新失败')
      }
    } catch (error) {
      console.error('更新部门主管状态失败:', error)
      toast.error('更新失败')
    }
  }

  const handleViewDetail = (emp) => {
    setViewingEmp(emp)
    setIsDetailOpen(true)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        toast.error('请选择图片文件')
        return
      }

      // 验证文件大小（限制2MB）
      if (file.size > 2 * 1024 * 1024) {
        toast.error('图片大小不能超过2MB')
        return
      }

      // 读取文件并转换为Base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result
        setFormData({ ...formData, avatar: base64String })
        setAvatarPreview(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = () => {
    setFormData({ ...formData, avatar: '' })
    setAvatarPreview('')
  }

  const resetForm = () => {
    setFormData({
      employee_no: '',
      real_name: '',
      email: '',
      phone: '',
      department_id: '',
      position: '',
      hire_date: '',
      rating: 3,
      status: 'active',
      avatar: '',
      emergency_contact: '',
      emergency_phone: '',
      address: '',
      education: '',
      skills: '',
      remark: '',
      role_id: '',
      is_department_manager: false
    })
    setValidationErrors({})
    setAvatarPreview('')
  }

  const renderRating = (rating) => {
    return `${rating}星`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-primary-600 text-xl">加载中...</div>
      </div>
    )
  }

  if (dbError) {
    return (
      <div className="p-8 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">数据库连接问题</h2>
          <p className="text-yellow-700 mb-4">{dbErrorMessage}</p>
          <div className="bg-white p-4 rounded border text-left">
            <h3 className="font-medium mb-2">解决方案：</h3>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>确保已复制整个项目文件夹，而不仅仅是exe文件</li>
              <li>在项目根目录运行 <code className="bg-gray-100 px-1 rounded">npm run server</code> 启动后端服务</li>
              <li>检查.env文件中的数据库配置是否正确</li>
              <li>确认MySQL数据库服务正在运行</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // 处理员工部门权限管理
  const handleManageUserDepartments = (user) => {
    console.log('打开员工部门权限管理:', user);
    setSelectedUserForDepartment(user);
    setIsUserDepartmentModalOpen(true);
  };

  // 员工部门权限设置成功回调
  const handleUserDepartmentSuccess = () => {
    console.log('员工部门权限设置成功');
    toast.success('员工部门权限设置成功');
    // 刷新员工列表
    fetchEmployees();
  };

  return (
    <div className="p-8">
      <div className="bg-white rounded-xl shadow-md p-6">
        {/* 头部 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">员工管理</h2>
            <p className="text-gray-500 text-sm mt-1">共 {filteredEmployees.length} 名员工</p>
          </div>
          <div className="flex items-center gap-3">
            {/* 批量操作按钮组 */}
            <EmployeeBatchOperations onImportSuccess={fetchEmployees} />

            {/* 添加员工按钮 */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              <span>添加员工</span>
            </button>
          </div>
        </div>

        {/* 搜索筛选区 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-7 gap-3">
            <div>
              <input
                type="text"
                placeholder="姓名/工号/邮箱/手机"
                value={searchFilters.keyword}
                onChange={(e) => handleSearchChange('keyword', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <select
                value={searchFilters.department}
                onChange={(e) => handleSearchDepartmentChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                <option value="">全部部门</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={searchFilters.position}
                onChange={(e) => handleSearchChange('position', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                disabled={!searchFilters.department}
              >
                <option value="">全部职位</option>
                {searchFilteredPositions.map(pos => (
                  <option key={pos.id} value={pos.name}>{pos.name}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={searchFilters.status}
                onChange={(e) => handleSearchChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                <option value="">全部状态</option>
                <option value="active">在职</option>
                <option value="inactive">停用</option>
                <option value="resigned">离职</option>
              </select>
            </div>
            <div>
              <select
                value={searchFilters.rating}
                onChange={(e) => handleSearchChange('rating', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                <option value="">全部评级</option>
                <option value="5">5星</option>
                <option value="4">4星</option>
                <option value="3">3星</option>
                <option value="2">2星</option>
                <option value="1">1星</option>
              </select>
            </div>
            <div>
              <input
                type="date"
                value={searchFilters.dateFrom}
                onChange={(e) => handleSearchChange('dateFrom', e.target.value)}
                placeholder="开始日期"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm cursor-pointer"
                onFocus={(e) => e.target.showPicker && e.target.showPicker()}
              />
            </div>
            <div>
              <input
                type="date"
                value={searchFilters.dateTo}
                onChange={(e) => handleSearchChange('dateTo', e.target.value)}
                placeholder="结束日期"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm cursor-pointer"
                onFocus={(e) => e.target.showPicker && e.target.showPicker()}
              />
            </div>
          </div>
          {(searchFilters.keyword || searchFilters.department || searchFilters.position || searchFilters.status || searchFilters.rating || searchFilters.dateFrom || searchFilters.dateTo) && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                清除筛选
              </button>
            </div>
          )}
        </div>

        {/* 表格 - 优化紧凑布局 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-50 border-b border-primary-100">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider rounded-tl-lg">员工</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-primary-700 uppercase tracking-wider">登录账号</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-primary-700 uppercase tracking-wider">部门</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-primary-700 uppercase tracking-wider">职位</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-primary-700 uppercase tracking-wider">联系方式</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-primary-700 uppercase tracking-wider">评级</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-primary-700 uppercase tracking-wider">评级</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-primary-700 uppercase tracking-wider">部门主管</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-primary-700 uppercase tracking-wider">状态</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-primary-700 uppercase tracking-wider rounded-tr-lg">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-3 py-8 text-center text-gray-500">
                    {employees.length === 0 ? '暂无数据' : '没有符合条件的员工'}
                  </td>
                </tr>
              ) : (
                getCurrentPageData().map((emp, index) => (
                  <tr key={emp.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-primary-50/30'} hover:bg-primary-100/50 transition-colors`}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-600 cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all overflow-hidden flex-shrink-0"
                          onClick={() => handleViewDetail(emp)}
                          title="点击查看详情"
                        >
                          {emp.avatar ? (
                            <img src={emp.avatar} alt={emp.real_name} className="w-full h-full object-cover" />
                          ) : (
                            emp.real_name?.charAt(0) || '员'
                          )}
                        </div>
                        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handleViewDetail(emp)}>
                          <div className="text-sm font-medium text-gray-900 truncate hover:text-primary-600 transition-colors">{emp.real_name}</div>
                          <div className="text-xs text-gray-500 truncate">{emp.employee_no}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="text-sm text-gray-600 truncate">{emp.username || '-'}</div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="text-sm text-gray-600 truncate">{emp.department_name || '-'}</div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="text-sm text-gray-600 truncate">{emp.position || '-'}</div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="text-sm text-gray-600 truncate">{emp.phone || emp.email || '-'}</div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-sm text-gray-700 font-medium">{renderRating(emp.rating)}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-sm text-gray-700 font-medium">{renderRating(emp.rating)}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div
                        onClick={() => handleManagerClick(emp)}
                        className="cursor-pointer hover:bg-gray-100 rounded p-1 transition-colors inline-block"
                        title="点击修改部门主管状态"
                      >
                        {emp.is_department_manager ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            是
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            否
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center">
                        <span
                          onClick={() => handleStatusClick(emp)}
                          className={`px-2 py-0.5 rounded-full text-xs cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap ${emp.status === 'active' ? 'bg-green-100 text-green-700' :
                              emp.status === 'resigned' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                            }`}
                          title="点击修改状态"
                        >
                          {emp.status === 'active' ? '在职' : emp.status === 'resigned' ? '离职' : '停用'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleManageUserDepartments(emp)}
                          className="px-2 py-1 text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-sm"
                          title="部门权限"
                        >
                          部门权限
                        </button>
                        <button
                          onClick={() => handleEdit(emp)}
                          className="px-2 py-1 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                          title="编辑"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDeleteClick(emp)}
                          className="px-2 py-1 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-sm"
                          title="删除"
                        >
                          删除
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页组件 */}
        {filteredEmployees.length > 0 && (
          <div className="mt-4 flex items-center justify-between px-4">
            {/* 左侧：每页显示数量 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">每页显示</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600">条</span>
              <span className="text-sm text-gray-600 ml-4">
                共 {filteredEmployees.length} 条记录
              </span>
            </div>

            {/* 右侧：分页按钮 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                首页
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>

              {/* 页码按钮 */}
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
                      className={`px-3 py-1 border rounded-lg ${currentPage === pageNum
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'border-gray-300 hover:bg-gray-50'
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
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                末页
              </button>

              <span className="text-sm text-gray-600 ml-2">
                第 {currentPage} / {totalPages} 页
              </span>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title={editingEmp ? '编辑员工' : '创建员工'}
      >
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-xs text-red-600 flex items-center gap-1">
            <span className="font-bold">*</span> 标记为必填项, 请务必填写完整。
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 头像上传区域 */}
          <div className="flex flex-col items-center pb-4 border-b">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-3xl font-bold text-primary-600 overflow-hidden border-4 border-white shadow-lg">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="头像预览" className="w-full h-full object-cover" />
                ) : (
                  <span>{formData.real_name?.charAt(0) || '员'}</span>
                )}
              </div>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center text-sm"
                  title="删除头像"
                >
                  ×
                </button>
              )}
            </div>
            <label className="mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 cursor-pointer transition-colors text-sm">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              {avatarPreview ? '更换头像' : '上传头像'}
            </label>
            <p className="text-xs text-gray-500 mt-2">支持 JPG、PNG 格式，大小不超过 2MB</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                工号 {editingEmp ? <span className="text-red-500">*</span> : <span className="text-gray-400 text-xs font-normal">(留空自动生成)</span>}
              </label>
              <input
                type="text"
                value={formData.employee_no}
                onChange={(e) => setFormData({ ...formData, employee_no: e.target.value })}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${editingEmp ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder={editingEmp ? '' : "自动生成 (如: EMP0001)"}
                readOnly={!!editingEmp}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${validationErrors.real_name ? 'text-red-500' : 'text-gray-700'}`}>
                姓名 <span className="text-red-500">* (必填)</span>
              </label>
              <input
                type="text"
                required
                value={formData.real_name}
                onChange={(e) => {
                  setFormData({ ...formData, real_name: e.target.value });
                  if (validationErrors.real_name) setValidationErrors(prev => ({ ...prev, real_name: false }));
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${validationErrors.real_name ? 'border-red-500 focus:ring-red-500/20 bg-red-50/30' : 'border-gray-300'}`}
                placeholder="请输入员工真实姓名"
              />
              {validationErrors.real_name && <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                请填写该必填项
              </p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${validationErrors.phone ? 'text-red-500' : 'text-gray-700'}`}>
                手机号 <span className="text-red-500">* (必填)</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (validationErrors.phone) setValidationErrors(prev => ({ ...prev, phone: false }));
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${validationErrors.phone ? 'border-red-500 focus:ring-red-500/20 bg-red-50/30' : 'border-gray-300'}`}
                placeholder="请输入联系电话"
              />
              {validationErrors.phone && <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                请填写该必填项
              </p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${validationErrors.department_id ? 'text-red-500' : 'text-gray-700'}`}>
                所属部门 <span className="text-red-500">* (必填)</span>
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => {
                  handleDepartmentChange(e.target.value);
                  if (validationErrors.department_id) setValidationErrors(prev => ({ ...prev, department_id: false }));
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${validationErrors.department_id ? 'border-red-500 focus:ring-red-500/20 bg-red-50/30' : 'border-gray-300'}`}
              >
                <option value="">请选择部门</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              {validationErrors.department_id && <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                请选择所属部门
              </p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">职位</label>
              <select
                value={formData.position}
                onChange={(e) => {
                  setFormData({ ...formData, position: e.target.value });
                  if (validationErrors.position) setValidationErrors(prev => ({ ...prev, position: false }));
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${validationErrors.position ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-300'}`}
                disabled={!formData.department_id}
              >
                <option value="">请选择职位</option>
                {filteredPositions.map(pos => (
                  <option key={pos.id} value={pos.name}>{pos.name}</option>
                ))}
              </select>
              {validationErrors.position && <p className="text-red-500 text-xs mt-1">请选择职位</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">入职日期</label>
              <input
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
                onFocus={(e) => e.target.showPicker && e.target.showPicker()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">员工评级</label>
              <select
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {[1, 2, 3, 4, 5].map(r => (
                  <option key={r} value={r}>{r}星</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">紧急联系人</label>
              <input
                type="text"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">紧急联系电话</label>
              <input
                type="tel"
                value={formData.emergency_phone}
                onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">家庭住址</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">学历</label>
            <select
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">请选择学历</option>
              <option value="高中">高中</option>
              <option value="大专">大专</option>
              <option value="本科">本科</option>
              <option value="硕士">硕士</option>
              <option value="博士">博士</option>
            </select>
          </div>

          {/* 角色选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              员工角色
            </label>
            <select
              value={formData.role_id}
              onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">请选择角色</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name} (级别 {role.level}) - {role.description}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              💡 提示：角色决定了员工的系统权限
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">技能特长</label>
            <textarea
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                resetForm()
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              {editingEmp ? '更新' : '创建'}
            </button>
          </div>
        </form>
      </Modal>

      <EmployeeDetail
        employee={viewingEmp}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setViewingEmp(null)
        }}
        departments={departments}
      />

      {/* 删除确认模态框 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDeletingEmp(null)
        }}
        title="确认删除"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-2xl">
              ⚠
            </div>
            <div className="flex-1">
              <p className="text-gray-800 font-medium">确定要删除以下员工吗？</p>
              {deletingEmp && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>姓名：{deletingEmp.real_name}</p>
                  <p>工号：{deletingEmp.employee_no}</p>
                  <p>部门：{departments.find(d => d.id === deletingEmp.department_id)?.name || '-'}</p>
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600">
            此操作将永久删除该员工的所有信息，包括关联的用户账号，且无法恢复。
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setDeletingEmp(null)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              确认删除
            </button>
          </div>
        </div>
      </Modal>

      {/* 状态修改模态框 */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false)
          setStatusChangingEmp(null)
        }}
        title="修改员工状态"
      >
        <div className="space-y-4">
          {statusChangingEmp && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-lg font-bold text-primary-600 overflow-hidden">
                  {statusChangingEmp.avatar ? (
                    <img src={statusChangingEmp.avatar} alt={statusChangingEmp.real_name} className="w-full h-full object-cover" />
                  ) : (
                    statusChangingEmp.real_name?.charAt(0) || '员'
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{statusChangingEmp.real_name}</div>
                  <div className="text-sm text-gray-600">工号：{statusChangingEmp.employee_no}</div>
                  <div className="text-sm text-gray-600">
                    部门：{departments.find(d => d.id === statusChangingEmp.department_id)?.name || '-'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              新状态 <span className="text-red-500">*</span>
            </label>
            <select
              value={statusChangeData.newStatus}
              onChange={(e) => setStatusChangeData({ ...statusChangeData, newStatus: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="active">在职</option>
              <option value="inactive">停用</option>
              <option value="resigned">离职</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              变动日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={statusChangeData.changeDate}
              onChange={(e) => setStatusChangeData({ ...statusChangeData, changeDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
              onFocus={(e) => e.target.showPicker && e.target.showPicker()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">变动原因</label>
            <textarea
              value={statusChangeData.reason}
              onChange={(e) => setStatusChangeData({ ...statusChangeData, reason: e.target.value })}
              rows="3"
              placeholder="请输入状态变动的原因..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsStatusModalOpen(false)
                setStatusChangingEmp(null)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleStatusChange}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              确认修改
            </button>
          </div>
        </div>
      </Modal>
      {/* 部门主管设置模态框 */}
      <Modal
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
        title="设置部门主管"
        size="small"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsManagerModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleManagerChangeConfirm}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              确认
            </button>
          </div>
        }
      >
        <div className="p-4">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-600 mb-2">
              {managerChangingEmp?.avatar ? (
                <img src={managerChangingEmp.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                managerChangingEmp?.real_name?.charAt(0)
              )}
            </div>
          </div>
          <h3 className="text-center text-lg font-medium text-gray-900 mb-1">{managerChangingEmp?.real_name}</h3>
          <p className="text-center text-sm text-gray-500 mb-6">{managerChangingEmp?.department_name} - {managerChangingEmp?.position}</p>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700 font-medium">设为部门主管</span>
              <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                <input
                  type="checkbox"
                  className="peer absolute w-0 h-0 opacity-0"
                  checked={managerChangeValue}
                  onChange={(e) => setManagerChangeValue(e.target.checked)}
                />
                <span className="block w-12 h-6 bg-gray-300 rounded-full shadow-inner peer-checked:bg-primary-600 transition-colors duration-300"></span>
                <span className="absolute block w-4 h-4 mt-1 ml-1 bg-white rounded-full shadow inset-y-0 left-0 peer-checked:translate-x-6 transition-transform duration-300"></span>
              </div>
            </label>
            <p className="text-xs text-gray-500 mt-2">
              设置为部门主管后，该员工将拥有审批本部门员工考勤申请的权限。
            </p>
          </div>
        </div>
      </Modal>

      {/* 用户部门管理模态框 */}
      <UserDepartmentModal
        isOpen={isUserDepartmentModalOpen}
        onClose={() => setIsUserDepartmentModalOpen(false)}
        user={selectedUserForDepartment}
        onSuccess={handleUserDepartmentSuccess}
      />
    </div>
  )
}

export default EmployeeManagement
