// [SHADCN-REPLACED]
import React, { useState, useEffect } from 'react'
import { formatDate } from '../utils/date'
import { toast } from 'react-toastify'
import { getApiUrl } from '../utils/apiConfig'

// 导入 shadcn UI 组件
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Badge } from "./ui/badge"
import { Switch } from "./ui/switch"
import { Label } from "./ui/label"

function DepartmentManagement() { 
  const [departments, setDepartments] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [viewingDept, setViewingDept] = useState(null)
  const [statusChangingDept, setStatusChangingDept] = useState(null)
  const [deptDetails, setDeptDetails] = useState(null)
  const [showDeleted, setShowDeleted] = useState(false)
  const [viewMode, setViewMode] = useState('card') // 'table' or 'card' - 默认改为卡片模式
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active'
  })

  useEffect(() => {
    fetchDepartments()
  }, [showDeleted])

  // 分页计算
  const totalPages = Math.ceil(departments.length / pageSize)
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return departments.slice(startIndex, endIndex)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token')
      const url = showDeleted
        ? getApiUrl('/api/departments?includeDeleted=true')
        : getApiUrl('/api/departments')
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()

      // 获取每个部门的员工数量
      const deptsWithCount = await Promise.all(
        data.map(async (dept) => {
          try {
            const empResponse = await fetch(getApiUrl('/api/employees'), {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            const employees = await empResponse.json()
            const count = employees.filter(emp => emp.department_id === dept.id).length
            return { ...dept, employee_count: count }
          } catch {
            return { ...dept, employee_count: 0 }
          }
        })
      )

      setDepartments(deptsWithCount)
    } catch (error) {
      toast.error('获取部门列表失败')
    }
  }

  const fetchDepartmentDetails = async (deptId) => {
    try {
      const token = localStorage.getItem('token')
      // 获取该部门的所有员工
      const empResponse = await fetch(getApiUrl('/api/employees'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const allEmployees = await empResponse.json()
      const deptEmployees = allEmployees.filter(emp => emp.department_id === deptId)

      // 按职位统计人数
      const positionStats = {}
      deptEmployees.forEach(emp => {
        const position = emp.position || '未分配职位'
        positionStats[position] = (positionStats[position] || 0) + 1
      })

      // 转换为数组格式
      const positionList = Object.entries(positionStats).map(([position, count]) => ({
        position,
        count
      }))

      setDeptDetails({
        totalCount: deptEmployees.length,
        positions: positionList,
        employees: deptEmployees
      })
    } catch (error) {
      toast.error('获取部门详情失败')
    }
  }

  const handleViewDetail = async (dept) => {
    setViewingDept(dept)
    setIsDetailModalOpen(true)
    await fetchDepartmentDetails(dept.id)
  }

  const handleStatusClick = (dept) => {
    setStatusChangingDept(dept)
    setIsStatusModalOpen(true)
  }

  const handleStatusChange = async (newStatus) => {
    if (!statusChangingDept) return

    // 如果状态没有变化，直接关闭
    if (statusChangingDept.status === newStatus) {
      setIsStatusModalOpen(false)
      setStatusChangingDept(null)
      return
    }

    // 如果部门有员工，给出警告提示
    const employeeCount = statusChangingDept.employee_count || 0
    if (employeeCount > 0) {
      const action = newStatus === 'active' ? '启用' : '停用'
      const employeeAction = newStatus === 'active' ? '启用' : '停用'
      const confirmMsg = `该部门有 ${employeeCount} 名员工，${action}部门后，所有员工状态将同步${employeeAction}。\n\n确定要继续吗？`

      if (!confirm(confirmMsg)) {
        return
      }
    }

    try {
      const response = await fetch(getApiUrl(`/api/departments/${statusChangingDept.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...statusChangingDept,
          status: newStatus
        })
      })

      if (response.ok) {
        const result = await response.json()
        const affectedCount = result.affectedEmployees || 0

        if (affectedCount > 0) {
          toast.success(`部门状态已修改，同时更新了 ${affectedCount} 名员工的状态`)
        } else {
          toast.success('部门状态修改成功')
        }

        setIsStatusModalOpen(false)
        setStatusChangingDept(null)
        fetchDepartments()
      } else {
        toast.error('状态修改失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingDept
        ? getApiUrl(`/api/departments/${editingDept.id}`)
        : getApiUrl('/api/departments')

      const response = await fetch(url, {
        method: editingDept ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(editingDept ? '部门更新成功' : '部门创建成功')
        setIsModalOpen(false)
        fetchDepartments()
        resetForm()
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleEdit = (dept) => {
    setEditingDept(dept)
    setFormData({
      name: dept.name,
      description: dept.description || '',
      status: dept.status
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (dept) => {
    const employeeCount = dept.employee_count || 0
    let confirmMsg = '确定要删除这个部门吗？\n\n'

    if (employeeCount > 0) {
      confirmMsg += `该部门有 ${employeeCount} 名员工，删除后员工也将被标记为删除状态。\n\n`
    }

    confirmMsg += '删除后可以随时恢复。'

    if (!confirm(confirmMsg)) return

    try {
      const response = await fetch(getApiUrl(`/api/departments/${dept.id}`), {
        method: 'DELETE'
      })
      if (response.ok) {
        toast.success('部门已删除（可恢复）')
        fetchDepartments()
      }
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const handleRestore = async (id) => {
    if (!confirm('确定要恢复这个部门吗？\n\n恢复后部门和员工状态将变为启用。')) return

    try {
      const response = await fetch(getApiUrl(`/api/departments/${id}/restore`), {
        method: 'POST'
      })
      if (response.ok) {
        toast.success('部门已恢复')
        fetchDepartments()
      }
    } catch (error) {
      toast.error('恢复失败')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', status: 'active' })
    setEditingDept(null)
  }

  return (
    <div className="p-4">
      {/* 头部 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">部门管理</h1>
        <p className="text-gray-600">管理系统中的部门信息</p>
      </div>

      {/* 控制栏 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-deleted"
              checked={showDeleted}
              onCheckedChange={setShowDeleted}
            />
            <Label htmlFor="show-deleted">显示已删除</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'table' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              表格视图
            </Button>
            <Button
              variant={viewMode === 'card' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('card')}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              卡片视图
            </Button>
          </div>
        </div>

        <Button onClick={() => setIsModalOpen(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          新增部门
        </Button>
      </div>

      {/* 表格视图 */}
      {viewMode === 'table' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">部门名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">描述</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">人数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">创建时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted">
                  {getCurrentPageData().map((dept) => (
                    <tr key={dept.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewDetail(dept)}
                          className="text-sm font-medium text-primary hover:underline"
                          title="点击查看部门详情"
                        >
                          {dept.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{dept.description || '-'}</td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary">
                          {dept.employee_count || 0} 人
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {dept.status === 'deleted' ? (
                          <Badge variant="destructive">已删除</Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusClick(dept)}
                            className={`${
                              dept.status === 'active' ? 'text-green-600 hover:text-green-700' : 'text-gray-600 hover:text-gray-700'
                            }`}
                            title="点击修改状态"
                          >
                            {dept.status === 'active' ? '启用' : '停用'}
                          </Button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDate(dept.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {dept.status === 'deleted' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestore(dept.id)}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              恢复
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(dept)}
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                编辑
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(dept)}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                删除
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 卡片视图 */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {getCurrentPageData().map((dept) => (
            <Card key={dept.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    <button
                      onClick={() => handleViewDetail(dept)}
                      className="hover:text-primary hover:underline text-left"
                    >
                      {dept.name}
                    </button>
                  </CardTitle>
                  {dept.status === 'deleted' ? (
                    <Badge variant="destructive">已删除</Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusClick(dept)}
                      className={`${
                        dept.status === 'active' ? 'text-green-600 hover:text-green-700' : 'text-gray-600 hover:text-gray-700'
                      }`}
                    >
                      {dept.status === 'active' ? '启用' : '停用'}
                    </Button>
                  )}
                </div>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                  {dept.description || '暂无描述'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>{dept.employee_count || 0} 人</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(dept.created_at)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 pt-3 border-t">
                {dept.status === 'deleted' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(dept.id)}
                    className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    恢复
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(dept)}
                      className="flex-1 text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      编辑
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(dept)}
                      className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      删除
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* 分页组件 */}
      {departments.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* 左侧：每页显示数量和总记录数 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">每页显示</span>
            <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8</SelectItem>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="48">48</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">条</span>
            <span className="text-sm text-muted-foreground ml-4">
              共 {departments.length} 条记录
            </span>
          </div>

          {/* 右侧：分页按钮 */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              首页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              上一页
            </Button>

            {/* 页码按钮 */}
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
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              下一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              末页
            </Button>

            <span className="text-sm text-muted-foreground ml-2 hidden sm:inline">
              第 {currentPage} / {totalPages} 页
            </span>
          </div>
        </div>
      )}

      {/* 编辑/新增部门对话框 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingDept ? '编辑部门' : '新增部门'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                部门名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">部门描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false)
                  resetForm()
                }}
              >
                取消
              </Button>
              <Button type="submit">
                {editingDept ? '更新' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 部门详情对话框 */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>部门详情</DialogTitle>
          </DialogHeader>
          {viewingDept && (
            <div className="space-y-4">
              {/* 部门基本信息 */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-3">{viewingDept.name}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">部门描述：</span>
                      <span className="text-foreground">{viewingDept.description || '无'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">状态：</span>
                      <Badge variant={viewingDept.status === 'active' ? 'default' : 'secondary'}>
                        {viewingDept.status === 'active' ? '启用' : '停用'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">总人数：</span>
                      <span className="font-semibold text-foreground">{deptDetails?.totalCount || 0} 人</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">创建时间：</span>
                      <span className="text-foreground">{formatDate(viewingDept.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 职位统计 */}
              <div>
                <h4 className="text-md font-semibold mb-3">职位分布</h4>
                {deptDetails ? (
                  deptDetails.positions.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {deptDetails.positions.map((pos, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                            <span className="font-medium">{pos.position}</span>
                          </div>
                          <Badge variant="secondary">{pos.count} 人</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      该部门暂无员工
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    加载中...
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDetailModalOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 状态修改对话框 */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>修改部门状态</DialogTitle>
          </DialogHeader>
          {statusChangingDept && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">部门名称：</span>
                    <span className="font-medium">{statusChangingDept.name}</span>
                  </div>
                  <div className="text-sm mt-2">
                    <span className="text-muted-foreground">当前状态：</span>
                    <Badge variant={statusChangingDept.status === 'active' ? 'default' : 'secondary'}>
                      {statusChangingDept.status === 'active' ? '启用' : '停用'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* 员工数量提示 */}
              {statusChangingDept.employee_count > 0 && (
                <div className="p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600 text-lg">⚠️</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800">重要提示</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        该部门有 <span className="font-semibold">{statusChangingDept.employee_count}</span> 名员工，
                        修改部门状态后，所有员工的状态将同步更新。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label className="block text-sm font-medium mb-2">
                  选择新状态
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={statusChangingDept.status === 'active' ? "default" : "outline"}
                    onClick={() => handleStatusChange('active')}
                    className={statusChangingDept.status === 'active' ? "" : "border-green-600 text-green-600 hover:bg-green-50"}
                  >
                    <div className="text-xl mb-1">✓</div>
                    <div className="font-medium">启用</div>
                    <div className="text-xs mt-1">部门正常运作</div>
                    {statusChangingDept.employee_count > 0 && (
                      <div className="text-xs mt-1 font-medium">
                        员工状态 → 启用
                      </div>
                    )}
                  </Button>
                  <Button
                    variant={statusChangingDept.status === 'inactive' ? "default" : "outline"}
                    onClick={() => handleStatusChange('inactive')}
                    className={statusChangingDept.status === 'inactive' ? "" : "border-gray-400 text-gray-600 hover:bg-gray-50"}
                  >
                    <div className="text-xl mb-1">✕</div>
                    <div className="font-medium">停用</div>
                    <div className="text-xs mt-1">暂停使用</div>
                    {statusChangingDept.employee_count > 0 && (
                      <div className="text-xs mt-1 font-medium">
                        员工状态 → 停用
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>取消</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DepartmentManagement
