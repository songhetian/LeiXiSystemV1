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
      const response = await fetch(getApiUrl(`/api/employee-changes/${employee.id}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const result = await response.json()
        // 后端返回的是直接的数组
        setEmployeeChanges(Array.isArray(result) ? result : [])
      }
    } catch (error) {
      console.error('获取员工变动记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()
    
    // 确保开始日期不晚于结束日期
    if (start > end) return '-'

    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 30) return `${diffDays}天`
    
    const years = Math.floor(diffDays / 365)
    const months = Math.floor((diffDays % 365) / 30)
    
    let result = ''
    if (years > 0) result += `${years}年`
    if (months > 0) result += `${months}个月`
    
    return result || '不足1个月'
  }

  const getWorkExperience = () => {
    if (!employeeChanges.length) {
      // 如果没有变动记录，至少显示当前的入职信息
      if (detailedEmployee?.hire_date) {
        return [{
          department: departments.find(d => d.id === detailedEmployee.department_id)?.name || '未知部门',
          position: detailedEmployee.position_name || '未知职位',
          startDate: detailedEmployee.hire_date,
          endDate: null,
          duration: calculateDuration(detailedEmployee.hire_date, null),
          type: 'hire',
          isCurrent: true
        }]
      }
      return []
    }

    // 按日期升序排列
    const sortedChanges = [...employeeChanges].sort((a, b) => new Date(a.change_date) - new Date(b.change_date))
    
    const experience = []
    
    for (let i = 0; i < sortedChanges.length; i++) {
      const change = sortedChanges[i]
      const nextChange = sortedChanges[i + 1]
      
      experience.push({
        department: change.new_department_name || departments.find(d => d.id === change.new_department_id)?.name || '未知部门',
        position: change.new_position || change.new_position_name || '未知职位',
        startDate: change.change_date,
        endDate: nextChange ? nextChange.change_date : (detailedEmployee.status === 'resigned' ? null : null), // 如果离职了，最后一个段落可能应该有结束日期
        duration: calculateDuration(change.change_date, nextChange ? nextChange.change_date : null),
        type: change.change_type,
        isCurrent: !nextChange && detailedEmployee.status !== 'resigned',
        reason: change.reason
      })
    }

    // 按日期降序返回，方便显示
    return experience.reverse()
  }

  if (!employee) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="large" noPadding={true}>
      <div className="flex flex-col bg-white overflow-hidden rounded-xl">
        {detailedEmployee && (
          <div className="flex flex-col h-full">
            {/* 顶部个人背景/装饰 */}
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
              <div className="absolute -bottom-10 left-8 flex items-end gap-6">
                <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-xl">
                  <div className="w-full h-full rounded-xl bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-400 overflow-hidden">
                    {detailedEmployee.avatar ? (
                      <img 
                        src={getImageUrl(detailedEmployee.avatar, { bustCache: true })} 
                        alt={detailedEmployee.real_name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      detailedEmployee.real_name?.charAt(0) || '员'
                    )}
                  </div>
                </div>
                <div className="pb-12">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-white drop-shadow-md">{detailedEmployee.real_name}</h3>
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full shadow-sm border ${
                      detailedEmployee.status === 'active' 
                        ? 'bg-emerald-500 text-white border-emerald-400' 
                        : 'bg-red-500 text-white border-red-400'
                    }`}>
                      {detailedEmployee.status === 'active' ? '在职' : '离职'}
                    </span>
                  </div>
                  <p className="text-blue-50 font-semibold text-sm mt-1 drop-shadow-sm">
                    {detailedEmployee.position_name || '岗位待定'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-16 pb-6 px-8">
              {/* 关键指标卡片 */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">员工工号</div>
                  <div className="text-lg font-bold text-gray-900">{detailedEmployee.employee_no}</div>
                </div>
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                  <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">所属部门</div>
                  <div className="text-lg font-bold text-gray-900 truncate">
                    {departments.find(d => d.id === detailedEmployee.department_id)?.name || '-'}
                  </div>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">累计司龄</div>
                  <div className="text-lg font-bold text-gray-900">
                    {detailedEmployee.hire_date ? calculateDuration(detailedEmployee.hire_date, null) : '-'}
                  </div>
                </div>
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                  <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">综合评分</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-lg font-bold text-gray-900">{detailedEmployee.rating || 3}</span>
                    <span className="text-amber-400">★</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-8">
                {/* 左侧详情 */}
                <div className="col-span-7 space-y-8">
                  {/* 基本资料 */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                      <h4 className="text-base font-bold text-gray-900">基本资料</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                      <div className="group">
                        <label className="text-xs text-gray-500 block mb-1">登录账号</label>
                        <div className="text-sm font-medium text-gray-800 pb-2 border-b border-gray-100 group-hover:border-blue-200 transition-colors">
                          {detailedEmployee.username || '-'}
                        </div>
                      </div>
                      <div className="group">
                        <label className="text-xs text-gray-500 block mb-1">入职日期</label>
                        <div className="text-sm font-medium text-gray-800 pb-2 border-b border-gray-100 group-hover:border-blue-200 transition-colors">
                          {detailedEmployee.hire_date ? formatDate(detailedEmployee.hire_date) : '-'}
                        </div>
                      </div>
                      <div className="group">
                        <label className="text-xs text-gray-500 block mb-1">联系手机</label>
                        <div className="text-sm font-medium text-gray-800 pb-2 border-b border-gray-100 group-hover:border-blue-200 transition-colors">
                          {detailedEmployee.phone || '-'}
                        </div>
                      </div>
                      <div className="group">
                        <label className="text-xs text-gray-500 block mb-1">电子邮箱</label>
                        <div className="text-sm font-medium text-gray-800 pb-2 border-b border-gray-100 group-hover:border-blue-200 transition-colors truncate">
                          {detailedEmployee.email || '-'}
                        </div>
                      </div>
                      <div className="group">
                        <label className="text-xs text-gray-500 block mb-1">最高学历</label>
                        <div className="text-sm font-medium text-gray-800 pb-2 border-b border-gray-100 group-hover:border-blue-200 transition-colors">
                          {detailedEmployee.education || '-'}
                        </div>
                      </div>
                      <div className="group">
                        <label className="text-xs text-gray-500 block mb-1">紧急联系人</label>
                        <div className="text-sm font-medium text-gray-800 pb-2 border-b border-gray-100 group-hover:border-blue-200 transition-colors">
                          {detailedEmployee.emergency_contact || '-'} ({detailedEmployee.emergency_phone || '-'})
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 工作经历 */}
                  <section>
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                      <h4 className="text-base font-bold text-gray-900">工作经历</h4>
                    </div>
                    <div className="relative pl-6 border-l-2 border-gray-100 space-y-8">
                      {getWorkExperience().length > 0 ? getWorkExperience().map((exp, index) => (
                        <div key={index} className="relative">
                          {/* 时间轴圆点 */}
                          <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-white ${
                            exp.isCurrent ? 'border-blue-600 scale-125' : 'border-gray-300'
                          }`}>
                            {exp.isCurrent && <div className="absolute inset-1 bg-blue-600 rounded-full animate-pulse"></div>}
                          </div>
                          
                          <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className={`text-sm font-bold ${exp.isCurrent ? 'text-blue-600' : 'text-gray-900'}`}>
                                {exp.department} · {exp.position}
                              </h5>
                              <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded uppercase">
                                {exp.duration}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                              <span>{formatDate(exp.startDate)}</span>
                              <span>至</span>
                              <span>{exp.endDate ? formatDate(exp.endDate) : (exp.isCurrent ? '至今' : '-')}</span>
                              <span className={`px-1.5 py-0.5 rounded-sm text-[10px] ${
                                exp.type === 'hire' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                              }`}>
                                {exp.type === 'hire' ? '初始入职' : '岗位调动'}
                              </span>
                            </div>
                            {exp.reason && (
                              <p className="text-xs text-gray-500 bg-gray-50/50 p-2 rounded italic border-l-2 border-gray-200">
                                {exp.reason}
                              </p>
                            )}
                          </div>
                        </div>
                      )) : (
                        <div className="text-gray-400 text-sm italic">暂无详细变动记录</div>
                      )}
                    </div>
                  </section>
                </div>

                {/* 右侧边栏 */}
                <div className="col-span-5 space-y-8">
                  {/* 证件预览 */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                      <h4 className="text-base font-bold text-gray-900">证件附件</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="group relative aspect-[1.586/1] rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 hover:border-blue-400 transition-all cursor-pointer shadow-sm">
                        {detailedEmployee.id_card_front_url ? (
                          <>
                            <img 
                              src={getImageUrl(detailedEmployee.id_card_front_url, { bustCache: true })} 
                              alt="ID Front" 
                              className="w-full h-full object-cover" 
                            />
                            <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" onClick={() => window.open(getImageUrl(detailedEmployee.id_card_front_url), '_blank')}>
                              <span className="text-white text-xs font-medium px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">查看大图</span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                            <span className="text-2xl">🪪</span>
                            <span className="text-[10px] font-medium uppercase tracking-wider">身份证正面未上传</span>
                          </div>
                        )}
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-gray-900/60 backdrop-blur-sm text-white text-[10px] font-bold rounded uppercase">正面</div>
                      </div>

                      <div className="group relative aspect-[1.586/1] rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 hover:border-blue-400 transition-all cursor-pointer shadow-sm">
                        {detailedEmployee.id_card_back_url ? (
                          <>
                            <img 
                              src={getImageUrl(detailedEmployee.id_card_back_url, { bustCache: true })} 
                              alt="ID Back" 
                              className="w-full h-full object-cover" 
                            />
                            <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" onClick={() => window.open(getImageUrl(detailedEmployee.id_card_back_url), '_blank')}>
                              <span className="text-white text-xs font-medium px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">查看大图</span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                            <span className="text-2xl">🪪</span>
                            <span className="text-[10px] font-medium uppercase tracking-wider">身份证反面未上传</span>
                          </div>
                        )}
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-gray-900/60 backdrop-blur-sm text-white text-[10px] font-bold rounded uppercase">反面</div>
                      </div>
                    </div>
                  </section>

                  {/* 技能特长 & 备注 */}
                  <section className="bg-gray-50/80 p-5 rounded-2xl space-y-6">
                    <div>
                      <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">技能特长</h5>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {detailedEmployee.skills || '该员工暂未填写技能特长'}
                      </p>
                    </div>
                    <div className="pt-6 border-t border-gray-200/60">
                      <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">备注信息</h5>
                      <p className="text-sm text-gray-600 leading-relaxed italic">
                        {detailedEmployee.remark || '无备注信息'}
                      </p>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {/* 页脚 */}
            <div className="bg-gray-50 border-t border-gray-100 px-8 py-4 flex justify-between items-center">
              <div className="text-[10px] text-gray-400 font-medium">
                最后更新: {detailedEmployee.updated_at ? formatDateTime(detailedEmployee.updated_at) : '-'}
              </div>
              <button
                onClick={onClose}
                className="px-8 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                关闭详情
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-blue-600 text-xs font-bold tracking-widest uppercase animate-pulse">加载中...</div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default EmployeeDetail
