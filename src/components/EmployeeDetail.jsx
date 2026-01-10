import React, { useState, useEffect } from 'react'
import { formatDate } from '../utils/date'
import Modal from './Modal'
import { getApiUrl } from '../utils/apiConfig'
import { getImageUrl } from '../utils/fileUtils'


function EmployeeDetail({ employee, isOpen, onClose, departments }) {
  const [employeeChanges, setEmployeeChanges] = useState([])
  const [detailedEmployee, setDetailedEmployee] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (employee && isOpen) {
      setDetailedEmployee(employee)
      fetchEmployeeChanges()
      fetchFullProfile()
    } else {
      setDetailedEmployee(null)
    }
  }, [employee, isOpen])

  const fetchFullProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl(`/api/users/${employee.user_id}/profile`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setDetailedEmployee(prev => ({ ...prev, ...result.data }))
        }
      }
    } catch (error) {
      console.error('获取员工详细信息失败:', error)
    }
  }

  const fetchEmployeeChanges = async () => {
    if (!employee?.id) return
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl(`/api/employees/${employee.id}/changes`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setEmployeeChanges(result.data)
        }
      }
    } catch (error) {
      console.error('获取员工变动记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTenureFromChanges = () => {
    if (!detailedEmployee?.hire_date) return '-'
    const hireDate = new Date(detailedEmployee.hire_date)
    const now = new Date()
    const diffTime = Math.abs(now - hireDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const years = Math.floor(diffDays / 365)
    const months = Math.floor((diffDays % 365) / 30)
    const days = diffDays % 30
    if (years > 0) return `${years}年${months}个月`
    if (months > 0) return `${months}个月${days}天`
    return `${days}天`
  }

  const getHistoricalDepartments = () => {
    if (!employeeChanges.length) return []
    const sortedChanges = [...employeeChanges].sort((a, b) => new Date(a.change_date) - new Date(b.change_date))
    const deptHistory = []
    sortedChanges.forEach((change, index) => {
      if (change.new_department_id) {
        const nextChange = sortedChanges[index + 1]
        const endDate = nextChange ? new Date(nextChange.change_date) : new Date()
        const startDate = new Date(change.change_date)
        const diffTime = Math.abs(endDate - startDate)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        const years = Math.floor(diffDays / 365)
        const months = Math.floor((diffDays % 365) / 30)
        const days = diffDays % 30
        let tenure = '-'
        if (years > 0) {
          tenure = `${years}年${months}个月`
        } else if (months > 0) {
          tenure = `${months}个月${days}天`
        } else {
          tenure = `${days}天`
        }
        deptHistory.push({
          name: change.new_department_name,
          date: change.change_date,
          type: change.change_type,
          tenure: tenure,
          isCurrent: !nextChange
        })
      }
    })
    return deptHistory
  }

  const renderRating = (rating) => `${rating}星`

  if (!employee) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="large" noPadding={true}>
      <div className="flex flex-col bg-white">
        {detailedEmployee && (
          <div className="flex flex-col">
            {/* 头部 - 紧凑布局，突出关键信息 */}
            <div className="bg-gray-100 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-white flex items-center justify-center text-xl font-bold text-gray-600 overflow-hidden flex-shrink-0">
                  {detailedEmployee.avatar ? (
                    <img src={getImageUrl(detailedEmployee.avatar, { bustCache: true })} alt={detailedEmployee.real_name} className="w-full h-full object-cover" />
                  ) : (
                    detailedEmployee.real_name?.charAt(0) || '员'
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-gray-900">{detailedEmployee.real_name}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      detailedEmployee.status === 'active' ? 'bg-green-500 text-white' :
                      detailedEmployee.status === 'resigned' ? 'bg-red-500 text-white' :
                      'bg-gray-500 text-white'
                    }`}>
                      {detailedEmployee.status === 'active' ? '在职' : detailedEmployee.status === 'resigned' ? '离职' : '已禁用'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{detailedEmployee.position_name || '岗位待定'}</p>
                </div>
                <div className="text-right text-sm text-gray-600 space-y-1">
                  <div>工号: <span className="font-medium text-gray-900">{detailedEmployee.employee_no}</span></div>
                  <div>司龄: <span className="font-medium text-gray-900">{calculateTenureFromChanges()}</span></div>
                </div>
              </div>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* 核心信息 - 突出显示 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">部门</div>
                  <div className="text-sm font-semibold text-gray-800">
                    {departments.find(d => d.id === detailedEmployee.department_id)?.name || '-'}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">手机</div>
                  <div className="text-sm font-semibold text-gray-800">{detailedEmployee.phone || '-'}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">邮箱</div>
                  <div className="text-sm font-semibold text-gray-800 truncate">{detailedEmployee.email || '-'}</div>
                </div>
              </div>

              {/* 详细信息 - 分栏展示 */}
              <div className="grid grid-cols-2 gap-6">
                {/* 左侧 */}
                <div className="space-y-4">
                  <section>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 border-l-3 border-blue-600 pl-2">基本信息</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-xs text-gray-500 w-20">登录账号</span>
                        <span className="text-sm text-gray-700 font-medium">{detailedEmployee.username || '-'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-xs text-gray-500 w-20">入职日期</span>
                        <span className="text-sm text-gray-700 font-medium">
                          {detailedEmployee.hire_date ? formatDate(detailedEmployee.hire_date) : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-xs text-gray-500 w-20">学历</span>
                        <span className="text-sm text-gray-700 font-medium">{detailedEmployee.education || '-'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-xs text-gray-500 w-20">评级</span>
                        <span className="text-sm text-gray-700 font-medium">{renderRating(detailedEmployee.rating || 3)}</span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 border-l-3 border-blue-600 pl-2">紧急联系</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-xs text-gray-500 w-20">联系人</span>
                        <span className="text-sm text-gray-700 font-medium">{detailedEmployee.emergency_contact || '-'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-xs text-gray-500 w-20">电话</span>
                        <span className="text-sm text-gray-700 font-medium">{detailedEmployee.emergency_phone || '-'}</span>
                      </div>
                      <div className="py-1">
                        <span className="text-xs text-gray-500 block mb-1">地址</span>
                        <span className="text-sm text-gray-700">{detailedEmployee.address || '-'}</span>
                      </div>
                    </div>
                  </section>
                </div>

                {/* 右侧 */}
                <div className="space-y-4">
                  {/* 技能与备注 */}
                  { (detailedEmployee.skills || detailedEmployee.remark) && (
                    <section>
                      <h4 className="text-sm font-semibold text-gray-800 mb-3 border-l-3 border-blue-600 pl-2">技能备注</h4>
                      {detailedEmployee.skills && (
                        <div className="mb-3">
                          <div className="text-xs text-gray-500 mb-1">技能特长</div>
                          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{detailedEmployee.skills}</p>
                        </div>
                      )}
                      {detailedEmployee.remark && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">备注信息</div>
                          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{detailedEmployee.remark}</p>
                        </div>
                      )}
                    </section>
                  )}

                  {/* 证件附件 */}
                  <section>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 border-l-3 border-blue-600 pl-2">证件附件</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">正面</div>
                        <div className="aspect-[1.586/1] rounded overflow-hidden bg-gray-100 border border-gray-200">
                          {detailedEmployee.id_card_front_url ? (
                            <img src={getImageUrl(detailedEmployee.id_card_front_url, { bustCache: true })} alt="Front" className="w-full h-full object-cover cursor-pointer" onClick={() => window.open(getImageUrl(detailedEmployee.id_card_front_url), '_blank')} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs italic">暂未上传</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">反面</div>
                        <div className="aspect-[1.586/1] rounded overflow-hidden bg-gray-100 border border-gray-200">
                          {detailedEmployee.id_card_back_url ? (
                            <img src={getImageUrl(detailedEmployee.id_card_back_url, { bustCache: true })} alt="Back" className="w-full h-full object-cover cursor-pointer" onClick={() => window.open(getImageUrl(detailedEmployee.id_card_back_url), '_blank')} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs italic">暂未上传</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              {/* 工作履历 */}
              {getHistoricalDepartments().length > 0 && (
                <section>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 border-l-3 border-blue-600 pl-2">工作履历</h4>
                  <div className="space-y-2">
                    {getHistoricalDepartments().map((dept, index) => (
                      <div key={index} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                        <div className={`w-2 h-2 rounded-full ${dept.isCurrent ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-800">{dept.name}</span>
                            {dept.isCurrent && (
                              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded">当前</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(dept.date)} · {dept.type === 'hire' ? '入职' : '调动'} · 在职 {dept.tenure}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* 底部操作页脚 */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
              >
                关闭
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
            <div className="text-gray-500 text-sm">加载中...</div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default EmployeeDetail
