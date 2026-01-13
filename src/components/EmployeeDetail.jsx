import React, { useState, useEffect } from 'react'
import { Drawer, Tag, Timeline, Badge, Typography, Avatar, Divider, Space, Skeleton, Empty, Descriptions, Button, Tooltip, Progress, ConfigProvider, theme } from 'antd'
import {
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  CalendarOutlined,
  SolutionOutlined,
  AuditOutlined,
  TrophyOutlined,
  IdcardOutlined,
  UserOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  EditOutlined,
  NodeIndexOutlined,
  KeyOutlined,
  GlobalOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled
} from '@ant-design/icons'
import { formatDate } from '../utils/date'
import { getApiUrl } from '../utils/apiConfig'
import { getImageUrl } from '../utils/fileUtils'

const { Title, Text, Paragraph } = Typography;

function EmployeeDetail({ employee, isOpen, onClose, departments, onAction }) {
  const [employeeChanges, setEmployeeChanges] = useState([])
  const [detailedEmployee, setDetailedEmployee] = useState(null)
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    if (employee && isOpen) {
      // 立即设置已有基础信息，让用户第一时间看到内容
      setDetailedEmployee(employee)
      fetchFullProfile()
      fetchEmployeeChanges()
    }
  }, [employee, isOpen])

  const fetchFullProfile = async () => {
    setProfileLoading(true)
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
    } finally {
      setProfileLoading(false)
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

  // 计算资料完善度 (示例逻辑)
  const calculateCompleteness = () => {
    if (!detailedEmployee) return 0;
    const fields = ['phone', 'email', 'address', 'education', 'skills', 'id_card_front_url', 'emergency_contact'];
    const filled = fields.filter(f => detailedEmployee[f]).length;
    return Math.round((filled / fields.length) * 100);
  }

  const calculateDurationDays = (startDate) => {
    if (!startDate) return 0
    const start = new Date(startDate)
    const end = new Date()
    return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24))
  }

  const getChangeLabel = (type) => {
    const config = {
      hire: { color: 'green', text: '入职' },
      transfer: { color: 'blue', text: '调岗' },
      promotion: { color: 'gold', text: '晋升' },
      resign: { color: 'red', text: '离职' },
      terminate: { color: 'red', text: '解聘' }
    }
    return config[type] || { color: 'default', text: type }
  }

  if (!employee) return null

  return (
    <Drawer
      title={null}
      placement="right"
      onClose={onClose}
      open={isOpen}
      width={680}
      styles={{ body: { padding: 0, overflowX: 'hidden', background: '#f8fafc' } }}
      closable={false}
    >
      {/* 极简控制条 */}
      <div className="absolute top-5 right-5 z-50 flex gap-2">
        <Tooltip title="编辑此员工">
          <Button
            shape="circle"
            icon={<EditOutlined />}
            onClick={() => onAction?.('edit', detailedEmployee)}
            className="border-none bg-white/10 hover:bg-white/20 text-white backdrop-blur-md shadow-lg"
          />
        </Tooltip>
        <Button
          shape="circle"
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
          onClick={onClose}
          className="border-none bg-white/10 hover:bg-white/20 text-white backdrop-blur-md shadow-lg"
        />
      </div>

      {/* 头部：沉浸式身份卡片 */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 p-12 pt-16 relative overflow-hidden">
        {/* 动态装饰背景 */}
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-72 h-72 bg-indigo-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-10 relative z-10 text-center md:text-left">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <Badge
              dot
              offset={[-15, 125]}
              status={detailedEmployee?.status === 'active' ? 'success' : 'default'}
              style={{ width: 22, height: 22, border: '4px solid #0f172a', backgroundColor: '#22c55e' }}
            >
              <Avatar
                size={140}
                src={detailedEmployee?.avatar ? getImageUrl(detailedEmployee.avatar) : null}
                icon={<UserOutlined />}
                className="border-4 border-white/10 shadow-3xl rounded-[2.8rem] bg-slate-800 transition-all group-hover:scale-[1.02] group-hover:shadow-blue-500/20 duration-500 object-cover"
              />
            </Badge>
          </div>

          <div className="flex-1 min-w-0 pt-2 pb-2">
            <Space align="center" size="middle" className="mb-3 flex justify-center md:justify-start">
              <Title level={1} style={{ margin: 0, color: 'white', letterSpacing: '-0.03em', fontSize: '2.5rem', fontWeight: 900 }}>{detailedEmployee?.real_name}</Title>
              {detailedEmployee?.is_department_manager === 1 && (
                <Tag color="#EAB308" className="m-0 border-none px-4 py-1 rounded-full font-black text-[11px] text-slate-950 uppercase tracking-widest shadow-lg shadow-yellow-500/20">Executive</Tag>
              )}
            </Space>

            <div className="flex flex-wrap gap-y-3 items-center justify-center md:justify-start text-slate-400 text-sm font-semibold">
              <span className="bg-blue-500/10 text-blue-300 px-3 py-1 rounded-lg text-[12px] font-bold border border-blue-500/20 shadow-inner">
                {detailedEmployee?.employee_no}
              </span>
              <span className="mx-4 opacity-30 h-4 w-px bg-slate-500"></span>
              <span className="text-slate-300">{detailedEmployee?.department_name}</span>
              <span className="mx-4 opacity-30 h-4 w-px bg-slate-500"></span>
              <span className="text-slate-300">{detailedEmployee?.position_name || '待定岗位'}</span>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-8">
              <div className="group/stat">
                <div className="text-white text-2xl font-black transition-transform group-hover/stat:translate-y-[-2px]">
                  {calculateDurationDays(detailedEmployee?.hire_date)}
                  <span className="text-[10px] ml-1.5 opacity-40 font-bold tracking-tighter">DAYS</span>
                </div>
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2 group-hover/stat:text-blue-400 transition-colors">在职天数</div>
              </div>
              <div className="group/stat">
                <div className="text-white text-2xl font-black flex items-center justify-center md:justify-start gap-2 transition-transform group-hover/stat:translate-y-[-2px]">
                  {detailedEmployee?.rating || 3}
                  <TrophyOutlined className="text-amber-400 text-lg shadow-sm" />
                </div>
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2 group-hover/stat:text-amber-400 transition-colors">绩效评级</div>
              </div>
              <div className="group/stat">
                <div className="flex flex-col justify-center md:justify-start">
                  <div className="flex items-center gap-2 mb-1.5 justify-center md:justify-start flex-nowrap">
                    <Progress
                      percent={calculateCompleteness()}
                      size={[80, 10]}
                      strokeColor={{ '0%': '#3b82f6', '100%': '#8b5cf6' }}
                      trailColor="rgba(255,255,255,0.08)"
                      format={() => null}
                      className="m-0"
                    />
                    <span className="text-white text-xs font-black">{calculateCompleteness()}%</span>
                  </div>
                  <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest group-hover/stat:text-indigo-400 transition-colors">资料完善度</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主体内容：采用毛玻璃卡片布局 */}
      <div className="p-10 space-y-12">
        {/* 快捷操作卡片 */}
        <div className="grid grid-cols-3 gap-4">
          <Button
            className="h-12 rounded-2xl border-white bg-white/60 hover:bg-white hover:text-blue-600 font-bold shadow-sm transition-all"
            icon={<EditOutlined />}
            onClick={() => onAction?.('edit', detailedEmployee)}
          >
            编辑档案
          </Button>
          <Button
            className="h-12 rounded-2xl border-white bg-white/60 hover:bg-white hover:text-amber-600 font-bold shadow-sm transition-all"
            icon={<KeyOutlined />}
            onClick={() => onAction?.('resetPassword', detailedEmployee)}
          >
            重置密码
          </Button>
          <Button
            className="h-12 rounded-2xl border-white bg-white/60 hover:bg-white hover:text-indigo-600 font-bold shadow-sm transition-all"
            icon={<NodeIndexOutlined />}
            onClick={() => onAction?.('permission', detailedEmployee)}
          >
            角色权限
          </Button>
        </div>

        {/* 联络与档案 */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <GlobalOutlined className="text-blue-500 text-base" />
              </div>
              <span className="text-slate-900 text-[13px] font-black uppercase tracking-[0.15em]">核心档案明细 / CORE PROFILE</span>
            </div>
            {profileLoading && <Skeleton.Button active size="small" />}
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-10">
            {profileLoading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
              <Descriptions
                column={2}
                colon={false}
                labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                contentStyle={{ color: '#0f172a', fontWeight: 700, fontSize: '14px', paddingBottom: '20px' }}
              >
                <Descriptions.Item label="手机号码" span={1}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                      <PhoneOutlined className="text-blue-500 text-xs" />
                    </div>
                    {detailedEmployee?.phone || '-'}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="入职日期" span={1}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <CalendarOutlined className="text-emerald-500 text-xs" />
                    </div>
                    {formatDate(detailedEmployee?.hire_date)}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="电子邮箱" span={2}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                      <MailOutlined className="text-purple-500 text-xs" />
                    </div>
                    {detailedEmployee?.email || '-'}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="最高学历" span={1}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-500">🎓</div>
                    {detailedEmployee?.education || '-'}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="登录账号" span={1}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                      <UserOutlined className="text-slate-500 text-xs" />
                    </div>
                    {detailedEmployee?.username}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="居住地址" span={2}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                      <HomeOutlined className="text-slate-500 text-xs" />
                    </div>
                    {detailedEmployee?.address || '-'}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="紧急联系人" span={2}>
                  <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 w-full mt-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">Name</span>
                      <Text strong className="text-sm">{detailedEmployee?.emergency_contact || '未填写'}</Text>
                    </div>
                    <div className="w-px h-8 bg-slate-200"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">Phone</span>
                      <Text strong className="text-sm font-mono">{detailedEmployee?.emergency_phone || '-'}</Text>
                    </div>
                  </div>
                </Descriptions.Item>
              </Descriptions>
            )}
          </div>

          {/* 证件预览 */}
          <div className="mt-8 grid grid-cols-2 gap-6">
            <div
              className="flex items-center gap-4 p-5 bg-white/60 hover:bg-white rounded-3xl border border-white shadow-sm hover:shadow-md transition-all cursor-pointer group"
              onClick={() => detailedEmployee?.id_card_front_url && window.open(getImageUrl(detailedEmployee.id_card_front_url))}
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                <IdcardOutlined className="text-xl text-indigo-500 group-hover:text-white" />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Frontage</div>
                <div className="text-xs font-bold text-slate-700">身份证正面预览</div>
              </div>
            </div>
            <div
              className="flex items-center gap-4 p-5 bg-white/60 hover:bg-white rounded-3xl border border-white shadow-sm hover:shadow-md transition-all cursor-pointer group"
              onClick={() => detailedEmployee?.id_card_back_url && window.open(getImageUrl(detailedEmployee.id_card_back_url))}
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                <IdcardOutlined className="text-xl text-indigo-500 group-hover:text-white" />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Backside</div>
                <div className="text-xs font-bold text-slate-700">身份证反面预览</div>
              </div>
            </div>
          </div>
        </section>

        {/* 职业成长轨迹 */}
        <section>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <ClockCircleOutlined className="text-indigo-500 text-base" />
            </div>
            <span className="text-slate-900 text-[13px] font-black uppercase tracking-[0.15em]">职业成长轨迹 / CAREER PATH</span>
          </div>

          {loading ? (
            <div className="px-4"><Skeleton active /></div>
          ) : employeeChanges.length > 0 ? (
            <div className="px-6">
              <Timeline
                mode="left"
                className="custom-timeline"
                items={employeeChanges.map((change, idx) => ({
                  dot: <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${change.change_type === 'hire' ? 'bg-emerald-500' :
                      change.change_type === 'transfer' ? 'bg-blue-500' :
                        change.change_type === 'promotion' ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />,
                  label: <span className="text-[11px] font-black text-slate-400 italic">{formatDate(change.change_date)}</span>,
                  children: (
                    <div className="mb-12 pl-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-extrabold text-slate-800 text-[15px] leading-none">
                          {change.new_department_name || '未知部门'} · {change.new_position_name || change.new_position || '未知岗位'}
                        </span>
                        <Tag
                          color={getChangeLabel(change.change_type).color}
                          className="m-0 border-none px-3 py-0.5 rounded-full font-black text-[10px] uppercase shadow-sm"
                        >
                          {getChangeLabel(change.change_type).text}
                        </Tag>
                      </div>
                      <div className="text-sm text-slate-600 bg-white/40 backdrop-blur-sm p-5 rounded-3xl border border-white shadow-sm italic relative">
                        <div className="absolute top-[-8px] left-6 text-2xl text-slate-200 font-serif leading-none">“</div>
                        {change.reason || '无记录备注'}
                      </div>
                    </div>
                  )
                }))}
              />
            </div>
          ) : (
            <div className="bg-white/40 backdrop-blur-sm rounded-[2.5rem] border border-white py-16">
              <Empty description={<span className="text-slate-400 font-bold">暂无历史变动记录</span>} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          )}
        </section>

        {/* 评价与技能 */}
        <section className="pb-16 px-1">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <TrophyOutlined className="text-amber-500 text-base" />
            </div>
            <span className="text-slate-900 text-[13px] font-black uppercase tracking-[0.15em]">评价与技能 / FEEDBACK & SKILLS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-10 rounded-[3rem] border border-white shadow-xl shadow-blue-500/5 relative overflow-hidden group">
              <div className="absolute top-[-20px] right-[-20px] text-8xl text-blue-500/5 rotate-12 transition-transform group-hover:rotate-45 duration-700 font-black">SKILLS</div>
              <div className="text-[11px] font-black text-blue-600 uppercase mb-6 flex items-center gap-2 relative z-10">
                <CheckCircleFilled className="text-sm" /> 核心技能特长
              </div>
              <div className="flex flex-wrap gap-3 relative z-10">
                {detailedEmployee?.skills ? detailedEmployee.skills.split(/[,，、\s]+/).map((skill, i) => (
                  <span key={i} className="bg-white px-4 py-2 rounded-2xl text-blue-700 font-bold text-xs shadow-sm border border-blue-100/50 hover:scale-110 transition-transform cursor-default">
                    {skill}
                  </span>
                )) : <Text type="secondary" italic className="text-slate-400">尚未定义技能标签</Text>}
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
              <div className="absolute top-[-20px] right-[-20px] text-8xl text-slate-100 rotate-12 transition-transform group-hover:rotate-45 duration-700 font-black uppercase">NOTE</div>
              <div className="text-[11px] font-black text-slate-400 uppercase mb-6 flex items-center gap-2 relative z-10">
                <ExclamationCircleFilled className="text-sm" /> 内部管理备注
              </div>
              <Paragraph className="text-[13px] text-slate-600 m-0 leading-relaxed italic line-clamp-4 relative z-10">
                {detailedEmployee?.remark || '暂无内部评价备注。'}
              </Paragraph>
            </div>
          </div>
        </section>
      </div>
    </Drawer>
  )
}

export default EmployeeDetail
