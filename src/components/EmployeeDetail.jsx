import React, { useState, useEffect } from 'react'
import { formatDate } from '../utils/date'
import Modal from './Modal'
import { getApiUrl } from '../utils/apiConfig'

// 辅助函数：将相对路径转换为完整URL
const getImageUrl = (url) => {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  const baseUrl = getApiUrl('').replace('/api', '').replace(/\/$/, '')
  const path = url.startsWith('/') ? url : `/${url}`
  return `${baseUrl}${path}`
}

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
            {/* 头部 - 优雅 Slate 配色 */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl font-bold text-slate-700 overflow-hidden flex-shrink-0 border border-slate-200">
                  {detailedEmployee.avatar ? (
                    <img src={getImageUrl(detailedEmployee.avatar)} alt={detailedEmployee.real_name} className="w-full h-full object-cover" />
                  ) : (
                    detailedEmployee.real_name?.charAt(0) || '员'
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-1">
                    <h3 className="text-lg font-bold text-zinc-800">{detailedEmployee.real_name}</h3>
                    <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md border ${
                      detailedEmployee.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      detailedEmployee.status === 'resigned' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                      'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {detailedEmployee.status === 'active' ? '在职' : detailedEmployee.status === 'resigned' ? '离职' : '已禁用'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 font-medium mb-2">{detailedEmployee.position || '岗位待定'}</p>
                  <div className="flex items-center gap-4 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span className="text-slate-400 font-normal">工号:</span>
                      <span className="font-bold tabular-nums">{detailedEmployee.employee_no}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span className="text-slate-400 font-normal">评级:</span>
                      <span className="font-bold">{renderRating(detailedEmployee.rating || 3)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span className="text-slate-400 font-normal">司龄:</span>
                      <span className="font-bold">{calculateTenureFromChanges()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-8 space-y-10">
              {/* 基本档案 */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1 h-3.5 bg-slate-800 rounded-full"></span>
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight">基本档案</h4>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 font-medium">登录账号</span>
                    <span className="text-[13px] text-slate-700 font-bold font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100 italic">
                      {detailedEmployee.username || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 font-medium">所属部门</span>
                    <span className="text-[13px] text-slate-700 font-semibold">
                      {departments.find(d => d.id === detailedEmployee.department_id)?.name || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 font-medium">入职日期</span>
                    <span className="text-[13px] text-zinc-600 font-medium">
                      {detailedEmployee.hire_date ? formatDate(detailedEmployee.hire_date) : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 font-medium">学历情况</span>
                    <span className="text-[13px] text-zinc-600 font-medium">{detailedEmployee.education || '-'}</span>
                  </div>
                </div>
              </section>

              {/* 联系方式 */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1 h-3.5 bg-slate-800 rounded-full"></span>
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight">联系方式</h4>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 font-medium">手机号码</span>
                    <span className="text-[13px] text-slate-700 font-bold tabular-nums">{detailedEmployee.phone || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 font-medium">电子邮箱</span>
                    <span className="text-[13px] text-slate-700 font-medium">{detailedEmployee.email || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 font-medium">紧急联系人</span>
                    <span className="text-[13px] text-slate-700 font-medium">{detailedEmployee.emergency_contact || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs text-slate-400 font-medium">紧急电话</span>
                    <span className="text-[13px] text-slate-700 font-medium tabular-nums">{detailedEmployee.emergency_phone || '-'}</span>
                  </div>
                  <div className="col-span-2 flex items-start gap-4 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-400 font-medium mt-0.5">居住地址</span>
                    <span className="text-[13px] text-slate-600 leading-relaxed">{detailedEmployee.address || '-'}</span>
                  </div>
                </div>
              </section>

              {/* 技能与附件 */}
              { (detailedEmployee.skills || detailedEmployee.remark) && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-1 h-3.5 bg-slate-800 rounded-full"></span>
                    <h4 className="text-sm font-bold text-slate-800 tracking-tight">技能与备注</h4>
                  </div>
                  <div className="space-y-4">
                    {detailedEmployee.skills && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="text-[11px] text-slate-400 font-bold uppercase mb-2">技能特长</div>
                        <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">{detailedEmployee.skills}</p>
                      </div>
                    )}
                    {detailedEmployee.remark && (
                      <div className="bg-amber-50/30 p-4 rounded-xl border border-amber-100/50">
                        <div className="text-[11px] text-amber-600/70 font-bold uppercase mb-2">备注信息</div>
                        <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">{detailedEmployee.remark}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* 证件附件 */}
              <section className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                  <span className="w-1 h-3.5 bg-slate-800 rounded-full"></span>
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight">证件附件</h4>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="group space-y-3">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1">正面 (身份证)</div>
                    <div className="aspect-[1.586/1] rounded-2xl overflow-hidden bg-white border-2 border-slate-200 hover:border-slate-400 transition-all shadow-sm relative overflow-hidden">
                      {detailedEmployee.id_card_front_url ? (
                        <>
                          <img src={getImageUrl(detailedEmployee.id_card_front_url)} alt="Front" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div
                            className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]"
                            onClick={() => window.open(getImageUrl(detailedEmployee.id_card_front_url), '_blank')}
                          >
                            <span className="px-5 py-2 bg-white text-slate-900 text-xs font-bold rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">查看大图</span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50/50 italic">
                          <span className="text-[11px] font-bold tracking-tighter">暂未上传</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="group space-y-3">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1">反面 (身份证)</div>
                    <div className="aspect-[1.586/1] rounded-2xl overflow-hidden bg-white border-2 border-slate-200 hover:border-slate-400 transition-all shadow-sm relative overflow-hidden">
                      {detailedEmployee.id_card_back_url ? (
                        <>
                          <img src={getImageUrl(detailedEmployee.id_card_back_url)} alt="Back" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div
                            className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]"
                            onClick={() => window.open(getImageUrl(detailedEmployee.id_card_back_url), '_blank')}
                          >
                            <span className="px-5 py-2 bg-white text-slate-900 text-xs font-bold rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">查看大图</span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50/50 italic">
                          <span className="text-[11px] font-bold tracking-tighter">暂未上传</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* 工作经历 */}
              {getHistoricalDepartments().length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="w-1 h-3.5 bg-slate-800 rounded-full"></span>
                    <h4 className="text-sm font-bold text-slate-800 tracking-tight">工作履历</h4>
                  </div>
                  <div className="space-y-6">
                    {getHistoricalDepartments().map((dept, index) => (
                      <div key={index} className="flex gap-4 group">
                        <div className="flex flex-col items-center">
                          <div className={`w-2.5 h-2.5 rounded-full border-2 ${dept.isCurrent ? 'bg-slate-800 border-slate-800 scale-125' : 'bg-white border-slate-300'} z-10`}></div>
                          <div className="flex-1 w-[2px] bg-slate-100 group-last:hidden"></div>
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-[13px] font-bold text-slate-800 mb-0.5">{dept.name}</div>
                              <div className="text-[11px] text-slate-400 font-medium">
                                {formatDate(dept.date)} · {dept.type === 'hire' ? '入职' : '调动'}
                              </div>
                            </div>
                            {dept.isCurrent && (
                              <span className="px-2 py-0.5 bg-slate-800 text-white text-[10px] font-bold rounded">当前</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* 底部操作页脚 */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 transition-all shadow-sm active:scale-95"
              >
                关闭详情
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-[3px] border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">正在获取数据...</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default EmployeeDetail
