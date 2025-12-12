import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker, TimePicker, DateTimePicker } from '@/components/ui/date-picker'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import axios from 'axios'
import { toast } from 'sonner'
import { getApiUrl } from '../../utils/apiConfig'


export default function ShiftManagement() {
  const [shifts, setShifts] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingShift, setEditingShift] = useState(null)

  // 分页状态
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  })

  // 筛选状态
  const [filters, setFilters] = useState({
    department_id: '',
    is_active: '',
    keyword: ''
  })

  const [formData, setFormData] = useState({
    name: '',
    start_time: '',
    end_time: '',
    rest_duration: 60,
    work_hours: 8,
    late_threshold: 30,
    early_threshold: 30,
    is_active: true,
    department_id: '',
    description: '',
    color: '#3B82F6'
  })

  useEffect(() => {
    fetchDepartments()
    fetchShifts()
  }, [pagination.page, pagination.limit, filters])

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const response = await axios.get(getApiUrl('/api/departments'), { headers })
      // 部门 API 直接返回数组，不是 { success, data } 格式
      if (Array.isArray(response.data)) {
        setDepartments(response.data)
      } else if (response.data.success) {
        setDepartments(response.data.data)
      }
    } catch (error) {
      console.error('获取部门列表失败:', error)
    }
  }

  const fetchShifts = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const params = {
        page: pagination.page,
        limit: pagination.limit
      }

      // 只添加非空的筛选条件
      if (filters.department_id) {
        params.department_id = filters.department_id
      }
      if (filters.is_active !== '') {
        params.is_active = filters.is_active
      }
      if (filters.keyword) {
        params.keyword = filters.keyword
      }

      const response = await axios.get(getApiUrl('/api/shifts'), { params, headers })
      if (response.data.success) {
        setShifts(response.data.data)
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination
        }))
      }
    } catch (error) {
      toast.error('获取班次列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleAdd = () => {
    setEditingShift(null)
    setFormData({
      name: '',
      start_time: '',
      end_time: '',
      rest_duration: 60,
      work_hours: 8,
      late_threshold: 30,
      early_threshold: 30,
      is_active: true,
      department_id: '',
      description: '',
      color: '#3B82F6'
    })
    setShowModal(true)
  }

  const handleEdit = (shift) => {
    setEditingShift(shift)
    setFormData({
      name: shift.name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      rest_duration: shift.rest_duration || 60,
      work_hours: shift.work_hours,
      late_threshold: shift.late_threshold,
      early_threshold: shift.early_threshold,
      is_active: shift.is_active === 1,
      department_id: shift.department_id || '',
      description: shift.description || '',
      color: shift.color || '#3B82F6'
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingShift) {
        // 更新
        const response = await axios.put(getApiUrl(`/api/shifts/${editingShift.id}`), formData)
        if (response.data.success) {
          toast.success('班次更新成功')
          setShowModal(false)
          fetchShifts()
        }
      } else {
        // 创建
        const response = await axios.post(getApiUrl('/api/shifts'), formData)
        if (response.data.success) {
          toast.success('班次创建成功')
          setShowModal(false)
          fetchShifts()
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个班次吗？')) return

    try {
      const response = await axios.delete(getApiUrl(`/api/shifts/${id}`))
      if (response.data.success) {
        toast.success('班次删除成功')
        fetchShifts()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '删除失败')
    }
  }

  const handleToggle = async (id) => {
    try {
      const response = await axios.post(getApiUrl(`/api/shifts/${id}/toggle`))
      if (response.data.success) {
        toast.success(response.data.message)
        fetchShifts()
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  return (
    <div className="p-6">
      {/* 头部 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">班次管理</h1>
          <p className="text-gray-600 mt-1">管理工作班次和时间设置</p>
        </div>
        <Button onClick={handleAdd}>
          + 新建班次
        </Button>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">部门</Label>
            <select
              value={filters.department_id}
              onChange={(e) => handleFilterChange('department_id', e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">全部部门</option>
              <option value="null">全公司通用</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">状态</Label>
            <select
              value={filters.is_active}
              onChange={(e) => handleFilterChange('is_active', e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">全部状态</option>
              <option value="1">启用中</option>
              <option value="0">已禁用</option>
            </select>
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">搜索</Label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              placeholder="班次名称"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ department_id: '', is_active: '', keyword: '' })
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
            >
              重置筛选
            </button>
          </div>
        </div>
      </div>

      {/* 班次列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : shifts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无班次</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="border-2 rounded-lg p-6 transition-all hover:shadow-md"
                  style={{
                    borderColor: shift.color || '#e5e7eb',
                    backgroundColor: shift.color ? `${shift.color}10` : '#f9fafb'
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{shift.name}</h3>
                      <div className="flex gap-2 mt-1">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs ${
                            shift.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {shift.is_active ? '启用中' : '已禁用'}
                        </span>
                        {shift.department_name && (
                          <span className="inline-block px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                            {shift.department_name}
                          </span>
                        )}
                        {!shift.department_id && (
                          <span className="inline-block px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            全公司
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <span>⏰</span>
                      <span>
                        {shift.start_time} - {shift.end_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📊</span>
                      <span>工作时长：{shift.work_hours} 小时</span>
                    </div>
                    {shift.rest_duration && (
                      <div className="flex items-center gap-2">
                        <span>☕</span>
                        <span>休息时长：{shift.rest_duration} 分钟</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span>⚠️</span>
                      <span>
                        迟到：{shift.late_threshold}分钟 / 早退：{shift.early_threshold}分钟
                      </span>
                    </div>
                    {shift.description && (
                      <div className="flex items-start gap-2 mt-2 pt-2 border-t">
                        <span>📝</span>
                        <span className="text-xs text-gray-500">{shift.description}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => handleEdit(shift)}>
                      编辑
                    </Button>
                    <Button onClick={() => handleToggle(shift.id)}>
                      {shift.is_active ? '禁用' : '启用'}
                    </Button>
                    <Button onClick={() => handleDelete(shift.id)} variant="destructive">
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* 分页 */}
            {pagination.total > 0 && (
              <div className="border-t p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    共 {pagination.total} 条记录
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-600 font-medium">每页</span>
                    <select
                      value={pagination.limit}
                      onChange={(e) => setPagination({ ...pagination, limit: parseInt(e.target.value), page: 1 })}
                      className="bg-white border-2 border-blue-200 rounded-md px-3 py-1 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer hover:border-blue-300 transition-colors"
                    >
                      <option value="6">6 条</option>
                      <option value="9">9 条</option>
                      <option value="12">12 条</option>
                      <option value="15">15 条</option>
                      <option value="18">18 条</option>
                      <option value="24">24 条</option>
                      <option value="30">30 条</option>
                    </select>
                    <span className="text-xs text-gray-500">({Math.ceil(pagination.limit / 3)} 行)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    第 {pagination.page} / {Math.ceil(pagination.total / pagination.limit)} 页
                  </span>
                  <Button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}>
                    上一页
                  </Button>
                  <Button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}>
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 编辑模态框 */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">
              {editingShift ? '编辑班次' : '新建班次'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    班次名称 <span className="text-red-500">*</span>
                  </Label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="例如：早班"
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    所属部门
                  </Label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">全公司通用</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">不选择部门则为全公司通用班次</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      上班时间 <span className="text-red-500">*</span>
                    </Label>
                    <input
                      type="time"
                      required
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      下班时间 <span className="text-red-500">*</span>
                    </Label>
                    <input
                      type="time"
                      required
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    休息时长（分钟）
                  </Label>
                  <input
                    type="number"
                    min="0"
                    max="480"
                    value={formData.rest_duration}
                    onChange={(e) => {
                      const restDuration = parseInt(e.target.value) || 0
                      setFormData({ ...formData, rest_duration: restDuration })
                    }}
                    className="w-full border rounded px-3 py-2"
                    placeholder="例如：60"
                  />
                  <p className="text-xs text-gray-500 mt-1">中午休息或其他休息时间，默认60分钟</p>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    工作时长（小时）
                  </Label>
                  <div className="w-full border rounded px-3 py-2 bg-gray-50 text-gray-700 font-semibold">
                    {(() => {
                      if (!formData.start_time || !formData.end_time) return '0.0'
                      const [startHour, startMinute] = formData.start_time.split(':').map(Number)
                      const [endHour, endMinute] = formData.end_time.split(':').map(Number)
                      let totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute)
                      if (totalMinutes < 0) totalMinutes += 24 * 60
                      const restMinutes = formData.rest_duration || 0
                      const workHours = Math.max(0, (totalMinutes - restMinutes) / 60)
                      return workHours.toFixed(1)
                    })()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">自动计算：下班时间 - 上班时间 - 休息时长</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      迟到阈值（分钟）
                    </Label>
                    <input
                      type="number"
                      min="0"
                      value={formData.late_threshold}
                      onChange={(e) => setFormData({ ...formData, late_threshold: parseInt(e.target.value) })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      早退阈值（分钟）
                    </Label>
                    <input
                      type="number"
                      min="0"
                      value={formData.early_threshold}
                      onChange={(e) => setFormData({ ...formData, early_threshold: parseInt(e.target.value) })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    班次描述
                  </Label>
                  <Textarea value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows="3"
                    placeholder="可选，描述班次的特点或适用场景"
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    班次颜色
                  </Label>

                  {/* 当前颜色和随机按钮 */}
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="h-10 w-20 p-1 rounded border cursor-pointer"
                    />
                    <Button type="button"
                      onClick={() => {
                        // 鲜艳的随机颜色
                        const vibrantColors = [
                          '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
                          '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
                          '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C', '#F39C12',
                          '#E67E22', '#16A085', '#27AE60', '#2980B9', '#8E44AD',
                          '#FF85A2', '#FFB6C1', '#87CEEB', '#98FB98', '#DDA0DD',
                          '#F0E68C', '#B0E0E6', '#FFDAB9', '#E0BBE4', '#FFDFD3',
                          '#FFD700', '#FF1493'
                        ]
                        const randomColor = vibrantColors[Math.floor(Math.random() * vibrantColors.length)]
                        setFormData({ ...formData, color: randomColor })
                      }}
                      className="px-4 py-2 border-2 border-gray-300 hover:border-blue-400 rounded-lg shadow-sm hover:shadow-md transition-all text-white font-medium"
                      style={{ backgroundColor: formData.color }}
                    >
                      随机
                    </Button>
                  </div>

                  {/* 鲜艳色系推荐 */}
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 mb-2">鲜艳色系推荐：</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: '0.5rem' }}>
                      {[
                        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
                        '#F8B739', '#52B788', '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C', '#F39C12', '#E67E22',
                        '#16A085', '#27AE60', '#2980B9', '#8E44AD', '#FF85A2', '#FFB6C1', '#87CEEB', '#98FB98',
                        '#DDA0DD', '#F0E68C', '#B0E0E6', '#FFDAB9', '#E0BBE4', '#FFDFD3', '#FFD700', '#FF1493'
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={`h-8 w-8 rounded border-2 transition-all hover:scale-110 ${
                            formData.color === color ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <Label htmlFor="is_active" className="text-sm text-gray-700">
                    启用此班次
                  </Label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition-colors"
                >
                  {editingShift ? '更新' : '创建'}
                </button>
                <Button type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded transition-colors"
                >
                  取消
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
