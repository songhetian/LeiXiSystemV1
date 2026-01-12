import React, { useState, useEffect } from 'react'
import { formatDate } from '../utils/date'
import Modal from './Modal'
import { getApiUrl } from '../utils/apiConfig'
import { getImageUrl } from '../utils/fileUtils'
import { 
  PhoneOutlined, 
  MailOutlined, 
  HomeOutlined, 
  CalendarOutlined,
  SolutionOutlined,
  AuditOutlined,
  TrophyOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  UserOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  ApartmentOutlined,
  GlobalOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'

function EmployeeDetail({ employee, isOpen, onClose, departments }) {
  const [employeeChanges, setEmployeeChanges] = useState([])
  const [detailedEmployee, setDetailedEmployee] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (employee && isOpen) {
      setDetailedEmployee(employee)
      fetchFullProfile()
      fetchEmployeeChanges()
    } else {
      setDetailedEmployee(null)
      setEmployeeChanges([])
    }
  }, [employee, isOpen])

  const fetchFullProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl(`/api/users/${employee.user_id}/profile`), {
        headers: { 'Authorization': `Bearer ${token}` }
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
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const result = await response.json()
        setEmployeeChanges(Array.isArray(result) ? result : [])
      }
    } catch (error) {
      console.error('获取员工变动记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDuration = (startDate) => {
    if (!startDate) return '-'
    const start = new Date(startDate)
    const end = new Date()
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays < 365) return `${diffDays}天`
    return `${(diffDays / 365).toFixed(1)}年`
  }

  const getWorkExperience = () => {
    if (!employeeChanges.length && detailedEmployee?.hire_date) {
      return [{
        department: departments.find(d => d.id === detailedEmployee.department_id)?.name || '未归属',
        position: detailedEmployee.position_name || '岗位待定',
        startDate: detailedEmployee.hire_date,
        isCurrent: true,
        type: 'hire',
        reason: '初始入职'
      }]
    }
    return [...employeeChanges].sort((a, b) => new Date(b.change_date) - new Date(a.change_date))
  }

  if (!employee) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xlarge" noPadding={true}>
      <div className="flex flex-col md:flex-row h-[85vh] bg-white overflow-hidden rounded-2xl">
        
        {/* 左侧：个人信息概览区 (Light Gray Sidebar) */}
        <div className="w-full md:w-85 bg-slate-50 border-r border-slate-100 flex flex-col shrink-0">
          {/* 头像名片 */}
          <div className="p-8 pb-4">
            <div className="relative mb-6">
              <div className="w-36 h-36 mx-auto rounded-3xl bg-white p-1.5 shadow-xl shadow-slate-200/50 border border-slate-100 transition-all hover:scale-[1.02]">
                <div className="w-full h-full rounded-2xl bg-slate-50 flex items-center justify-center text-5xl font-bold overflow-hidden">
                  {detailedEmployee?.avatar ? (
                    <img src={getImageUrl(detailedEmployee.avatar)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserOutlined className="text-slate-300" />
                  )}
                </div>
              </div>
              <div className="absolute bottom-1 right-12 bg-white p-1 rounded-full shadow-md">
                <div className={`w-4 h-4 rounded-full border-2 border-white ${detailedEmployee?.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{detailedEmployee?.real_name}</h2>
              <div className="mt-2 inline-flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100">
                {detailedEmployee?.position_name || '待定岗位'}
              </div>
            </div>
          </div>

          {/* 核心指标统计 */}
          <div className="px-8 py-6 grid grid-cols-2 gap-4 border-y border-slate-200/60 my-2">
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
              <span className="text-lg font-black text-slate-800">{calculateDuration(detailedEmployee?.hire_date)}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">在职时长</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-1">
                <span className="text-lg font-black text-slate-800">{detailedEmployee?.rating || 3}</span>
                <TrophyOutlined className="text-amber-400 text-xs" />
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">综合评分</span>
            </div>
          </div>

          {/* 联系方式与个人信息 */}
          <div className="flex-1 px-8 py-4 space-y-6 overflow-y-auto scrollbar-hide">
            <section>
              <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                <InfoCircleOutlined className="text-blue-500" /> 联系与地址
              </h4>
              <div className="space-y-4">
                <ContactItem icon={<PhoneOutlined />} label="手机" value={detailedEmployee?.phone} color="blue" />
                <ContactItem icon={<MailOutlined />} label="邮箱" value={detailedEmployee?.email} color="purple" />
                <ContactItem icon={<HomeOutlined />} label="地址" value={detailedEmployee?.address} color="emerald" isAddress={true} />
              </div>
            </section>

            <section>
              <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                <IdcardOutlined className="text-blue-500" /> 证件资料
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <IDCardPreview url={detailedEmployee?.id_card_front_url} label="正面" />
                <IDCardPreview url={detailedEmployee?.id_card_back_url} label="反面" />
              </div>
            </section>
          </div>
        </div>

        {/* 右侧：详细内容区 (Clean White) */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <div className="px-10 py-6 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <SolutionOutlined className="text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">员工档案全景</h3>
                <p className="text-xs text-slate-400 font-medium">Employee Professional Profile</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-all text-slate-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-12">
            {/* 核心档案块 */}
            <section>
              <SectionHeader icon={<SafetyCertificateOutlined />} title="核心档案" />
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8">
                <ProfileItem label="员工编号" value={detailedEmployee?.employee_no} subValue="Employee ID" />
                <ProfileItem label="所属部门" value={departments.find(d => d.id === detailedEmployee?.department_id)?.name} subValue="Department" />
                <ProfileItem label="入职日期" value={detailedEmployee?.hire_date ? formatDate(detailedEmployee.hire_date) : '-'} subValue="Join Date" />
                <ProfileItem label="最高学历" value={detailedEmployee?.education} subValue="Education" />
                <ProfileItem label="系统账号" value={detailedEmployee?.username} subValue="System Account" />
                <ProfileItem label="紧急联系人" value={detailedEmployee?.emergency_contact ? `${detailedEmployee.emergency_contact} (${detailedEmployee.emergency_phone})` : '-'} subValue="Emergency" />
              </div>
            </section>

            {/* 成长轨迹时间轴 */}
            <section>
              <SectionHeader icon={<ClockCircleOutlined />} title="成长足迹" />
              <div className="relative pl-10">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
                <div className="space-y-10">
                  {getWorkExperience().map((item, idx) => (
                    <TimelineItem key={idx} item={item} isFirst={idx === 0} />
                  ))}
                </div>
              </div>
            </section>

            {/* 综合评价与备注 */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <CommentCard title="技能专长" content={detailedEmployee?.skills} icon={<TrophyOutlined />} color="blue" />
              <CommentCard title="管理备注" content={detailedEmployee?.remark} icon={<AuditOutlined />} color="slate" />
            </div>
          </div>

          {/* Footer */}
          <div className="px-10 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-4 shrink-0">
            <button 
              onClick={onClose} 
              className="px-12 py-3 bg-slate-900 text-white text-sm font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 hover:shadow-slate-300 active:scale-95"
            >
              完成查阅
            </button>
          </div>
        </div>

        {/* 加载中动画 */}
        {loading && !detailedEmployee && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-blue-600 text-xs font-black tracking-[0.4em] uppercase animate-pulse">Archiving Data...</div>
          </div>
        )}
      </div>
    </Modal>
  )
}

/* --- 内部小组件 (确保样式统一) --- */

const ContactItem = ({ icon, label, value, color, isAddress }) => (
  <div className="flex items-center gap-4 group">
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-colors ${
      color === 'blue' ? 'bg-blue-100 text-blue-600' : 
      color === 'purple' ? 'bg-purple-100 text-purple-600' : 
      'bg-emerald-100 text-emerald-600'
    }`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{label}</div>
      <div className={`text-sm font-bold text-slate-700 truncate ${isAddress ? 'text-xs' : ''}`}>{value || '-'}</div>
    </div>
  </div>
);

const IDCardPreview = ({ url, label }) => (
  <div 
    className="group relative aspect-[1.586/1] bg-white rounded-xl overflow-hidden border border-slate-200 cursor-pointer transition-all hover:border-blue-400 hover:shadow-lg"
    onClick={() => url && window.open(getImageUrl(url), '_blank')}
  >
    {url ? (
      <img src={getImageUrl(url)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
    ) : (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-300">
        <IdcardOutlined className="text-xl mb-1" />
        <span className="text-[10px] font-bold">未上传</span>
      </div>
    )}
    <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 text-white text-[9px] font-black rounded uppercase tracking-tighter">
      {label}
    </div>
  </div>
);

const SectionHeader = ({ icon, title }) => (
  <div className="flex items-center gap-3 mb-8">
    <div className="text-blue-600 text-xl font-bold">{icon}</div>
    <h4 className="text-lg font-black text-slate-800 tracking-tight">{title}</h4>
    <div className="h-px bg-slate-100 flex-1 ml-4"></div>
  </div>
);

const ProfileItem = ({ label, value, subValue }) => (
  <div className="group">
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</div>
    <div className="text-sm font-bold text-slate-700 leading-none">{value || '-'}</div>
    <div className="text-[9px] text-slate-300 mt-1 uppercase font-medium">{subValue}</div>
  </div>
);

const TimelineItem = ({ item, isFirst }) => (
  <div className="relative group">
    <div className={`absolute -left-[25px] top-1 w-5 h-5 rounded-full border-4 bg-white transition-all duration-300 ${
      isFirst ? 'border-blue-600 ring-4 ring-blue-100' : 'border-slate-200 group-hover:border-blue-300'
    }`}></div>
    <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/20 transition-all duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h5 className="text-sm font-black text-slate-800">
          {item.new_department_name || item.department} <span className="mx-2 text-slate-300">/</span> {item.new_position_name || item.new_position || item.position}
        </h5>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-white text-[10px] font-black text-slate-400 rounded-lg border border-slate-100 shadow-sm uppercase tracking-wider">
            {formatDate(item.change_date || item.startDate)}
          </span>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${item.type === 'hire' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
            {item.type === 'hire' ? 'Join' : 'Transfer'}
          </span>
        </div>
      </div>
      <p className="text-xs text-slate-500 font-medium leading-relaxed border-l-2 border-slate-200 pl-3">
        {item.reason || '无备注。'}
      </p>
    </div>
  </div>
);

const CommentCard = ({ title, content, icon, color }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
    <div className={`absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500 ${color === 'blue' ? 'text-blue-900' : 'text-slate-900'}`}>
      {React.cloneElement(icon, { style: { fontSize: '100px' } })}
    </div>
    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${color === 'blue' ? 'bg-blue-500' : 'bg-slate-400'}`}></span> {title}
    </h4>
    <p className="text-sm text-slate-600 font-medium leading-relaxed relative z-10">
      {content || `暂无${title}信息。`}
    </p>
  </div>
);

export default EmployeeDetail


