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
      width={650}
      bodyStyle={{ padding: 0, overflowX: 'hidden' }}
      closable={false}
    >
      {/* 极简控制条 */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <Tooltip title="编辑此员工">
          <Button shape="circle" icon={<EditOutlined />} onClick={() => onAction?.('edit', detailedEmployee)} />
        </Tooltip>
        <Button shape="circle" icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>} onClick={onClose} />
      </div>

      {/* 头部：身份卡片 */}
      <div className="bg-slate-950 p-10 pt-12 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px]"></div>
        
        <div className="flex items-start gap-8 relative z-10">
          <div className="relative group">
            <Badge 
              dot 
              offset={[-15, 115]} 
              status={detailedEmployee?.status === 'active' ? 'success' : 'default'}
              style={{ width: 20, height: 20, border: '4px solid #020617' }}
            >
              <Avatar 
                size={130} 
                src={detailedEmployee?.avatar ? getImageUrl(detailedEmployee.avatar) : null}
                icon={<UserOutlined />}
                className="border-4 border-white/5 shadow-2xl rounded-[2.5rem] bg-slate-900 transition-transform group-hover:scale-105 duration-500"
              />
            </Badge>
          </div>

          <div className="flex-1 min-w-0 pt-2">
            <Space align="center" size="middle" className="mb-2">
              <Title level={2} style={{ margin: 0, color: 'white', letterSpacing: '-0.02em' }}>{detailedEmployee?.real_name}</Title>
              {detailedEmployee?.is_department_manager === 1 && (
                <Tag color="#EAB308" className="m-0 border-none px-3 rounded-full font-black text-[10px] text-slate-950 uppercase tracking-wider">Manager</Tag>
              )}
            </Space>
            
            <div className="flex flex-wrap gap-y-2 items-center text-slate-400 text-sm font-medium">
              <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[11px] font-bold border border-blue-500/20">#{detailedEmployee?.employee_no}</span>
              <span className="mx-3 opacity-20">|</span>
              <span>{detailedEmployee?.department_name}</span>
              <span className="mx-3 opacity-20">|</span>
              <span>{detailedEmployee?.position_name || '待定岗位'}</span>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-6">
              <div>
                <div className="text-white text-xl font-black">{calculateDurationDays(detailedEmployee?.hire_date)}<span className="text-[10px] ml-1 opacity-40">DAYS</span></div>
                <div className="text-slate-500 text-[9px] font-black uppercase tracking-tighter mt-1">在职天数</div>
              </div>
              <div>
                <div className="text-white text-xl font-black flex items-center gap-1.5">
                  {detailedEmployee?.rating || 3}
                  <TrophyOutlined className="text-amber-500 text-sm" />
                </div>
                <div className="text-slate-500 text-[9px] font-black uppercase tracking-tighter mt-1">绩效评级</div>
              </div>
              <div>
                <Progress 
                  percent={calculateCompleteness()} 
                  size={[60, 8]} 
                  strokeColor={{ '0%': '#3b82f6', '100%': '#8b5cf6' }} 
                  trailColor="rgba(255,255,255,0.05)"
                  format={() => null}
                />
                <div className="text-slate-500 text-[9px] font-black uppercase tracking-tighter mt-1">资料完善度 {calculateCompleteness()}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主体内容 */}
      <div className="p-10 space-y-12">
        {/* 快捷操作卡片 */}
        <div className="flex gap-3">
           <Button block icon={<EditOutlined />} onClick={() => onAction?.('edit', detailedEmployee)}>编辑档案</Button>
           <Button block icon={<KeyOutlined />} onClick={() => onAction?.('resetPassword', detailedEmployee)}>重置密码</Button>
           <Button block icon={<NodeIndexOutlined />} onClick={() => onAction?.('permission', detailedEmployee)}>分配角色</Button>
        </div>

        {/* 联络与档案 */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-black uppercase tracking-[0.2em]">
              <GlobalOutlined className="text-blue-500" /> 核心档案明细
            </div>
            {profileLoading && <Skeleton.Button active size="small" />}
          </div>

          <div className="bg-slate-50 rounded-3xl border border-slate-100 p-8">
            {profileLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : (
              <Descriptions column={2} colon={false} labelStyle={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }} contentStyle={{ color: '#1e293b', fontWeight: 'bold' }}>
                <Descriptions.Item label="手机号码" span={1}><PhoneOutlined className="mr-2 text-blue-500" />{detailedEmployee?.phone || '-'}</Descriptions.Item>
                <Descriptions.Item label="入职日期" span={1}><CalendarOutlined className="mr-2 text-emerald-500" />{formatDate(detailedEmployee?.hire_date)}</Descriptions.Item>
                <Descriptions.Item label="电子邮箱" span={2}><MailOutlined className="mr-2 text-purple-500" />{detailedEmployee?.email || '-'}</Descriptions.Item>
                <Descriptions.Item label="最高学历" span={1}>{detailedEmployee?.education || '-'}</Descriptions.Item>
                <Descriptions.Item label="登录账号" span={1}>{detailedEmployee?.username}</Descriptions.Item>
                <Descriptions.Item label="居住地址" span={2}><HomeOutlined className="mr-2 text-slate-400" />{detailedEmployee?.address || '-'}</Descriptions.Item>
                <Descriptions.Item label="紧急联系人" span={2}>
                  <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-xl border border-slate-200">
                    <Text strong className="text-xs">{detailedEmployee?.emergency_contact || '未填写'}</Text>
                    <Divider type="vertical" />
                    <Text className="text-xs text-slate-500">{detailedEmployee?.emergency_phone || '-'}</Text>
                  </div>
                </Descriptions.Item>
              </Descriptions>
            )}
          </div>
          
          {/* 证件预览 */}
          <div className="mt-6 flex gap-4">
             <div className="flex-1 flex flex-col items-center p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 hover:border-blue-400 transition-all cursor-pointer group" onClick={() => detailedEmployee?.id_card_front_url && window.open(getImageUrl(detailedEmployee.id_card_front_url))}>
                <IdcardOutlined className="text-2xl text-slate-300 group-hover:text-blue-500 mb-2" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Card Front</span>
             </div>
             <div className="flex-1 flex flex-col items-center p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 hover:border-blue-400 transition-all cursor-pointer group" onClick={() => detailedEmployee?.id_card_back_url && window.open(getImageUrl(detailedEmployee.id_card_back_url))}>
                <IdcardOutlined className="text-2xl text-slate-300 group-hover:text-blue-500 mb-2" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Card Back</span>
             </div>
          </div>
        </section>

        {/* 职业成长轨迹 - 从变动记录中读取 */}
        <section>
          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mb-10">
            <ClockCircleOutlined className="text-indigo-500" /> 职业成长轨迹 / Career Path
          </div>
          
          {loading ? (
            <div className="px-4"><Skeleton active /></div>
          ) : employeeChanges.length > 0 ? (
            <div className="px-6">
              <Timeline 
                mode="left"
                items={employeeChanges.map((change, idx) => ({
                  color: getChangeLabel(change.change_type).color,
                  label: <span className="text-[10px] font-black text-slate-400">{formatDate(change.change_date)}</span>,
                  children: (
                    <div className="mb-10 pl-2">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-black text-slate-800 text-sm leading-none">
                          {change.new_department_name || '未知部门'} · {change.new_position_name || change.new_position || '未知岗位'}
                        </span>
                        <Tag color={getChangeLabel(change.change_type).color} className="m-0 border-none px-2 rounded-md font-bold text-[9px] uppercase">
                          {getChangeLabel(change.change_type).text}
                        </Tag>
                      </div>
                      <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-2xl border-l-4 border-slate-200 italic shadow-sm">
                        “ {change.reason || '无记录备注'} ”
                      </div>
                    </div>
                  )
                }))}
              />
            </div>
          ) : (
            <Empty description="暂无历史变动记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </section>

        {/* 评价与标签 */}
        <section className="pb-16">
          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mb-8">
            <TrophyOutlined className="text-amber-500" /> 评价与技能 / Feedback
          </div>
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
              <div className="text-[10px] font-black text-blue-600 uppercase mb-4 flex items-center gap-2">
                <CheckCircleFilled /> 核心技能特长
              </div>
              <div className="flex flex-wrap gap-2">
                {detailedEmployee?.skills ? detailedEmployee.skills.split(/[,，、\s]+/).map((skill, i) => (
                  <Tag key={i} className="m-0 bg-blue-50 border-blue-100 text-blue-600 font-bold px-3 py-1 rounded-xl text-xs">{skill}</Tag>
                )) : <Text type="secondary" italic>尚未定义技能标签</Text>}
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
              <div className="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2">
                <ExclamationCircleFilled /> 内部管理备注
              </div>
              <Paragraph className="text-sm text-slate-600 m-0 leading-relaxed italic line-clamp-4">
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
