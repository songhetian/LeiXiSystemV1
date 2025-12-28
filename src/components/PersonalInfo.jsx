import React, { useState, useEffect } from 'react'
import { toast } from 'sonner';
import { getApiBaseUrl, getApiUrl } from '../utils/apiConfig'
import { getImageUrl } from '../utils/fileUtils'
import Modal from './Modal'
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  AcademicCapIcon,
  HomeIcon,
  LockClosedIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  UsersIcon,
  InformationCircleIcon,
  UserCircleIcon,
  IdentificationIcon,
  ChevronDownIcon,
  SwatchIcon
} from '@heroicons/react/24/outline'

const PALETTE_MORANDI = [
  '#F3F4F6', // Default Gray
  '#FFFFFF', // White
  '#DCDCDC', // Gainsboro
  '#F5F5DC', // Beige
  '#FAEBD7', // AntiqueWhite
  '#E6E6FA', // Lavender
  '#F0F8FF', // AliceBlue
  '#F0FFF0', // Honeydew
  '#FFF0F5', // LavenderBlush
  '#FFE4E1', // MistyRose
  '#D3D3D3', // LightGray
  '#B0C4DE', // LightSteelBlue
  '#C1CDC1', // Honeydew 3 (Sage-ish)
  '#E0FFFF', // LightCyan
]

const PersonalInfo = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [imageModal, setImageModal] = useState({ isOpen: false, url: '', title: '' })

  // 主题设置
  const [theme, setTheme] = useState({
    background: '#F3F4F6'  // 使用单一背景色替代左右分区
  })

  // 加载主题
  useEffect(() => {
    const savedTheme = localStorage.getItem('personalInfoTheme')
    if (savedTheme) {
      try {
        setTheme(JSON.parse(savedTheme))
      } catch (e) {
        console.error('Theme parse error', e)
        // 如果解析失败，使用默认主题
        setTheme({ background: '#F3F4F6' })
      }
    }
  }, [])

  // 保存主题
  const updateTheme = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('personalInfoTheme', JSON.stringify(newTheme))

    // 触发自定义事件，通知其他组件主题已更新
    window.dispatchEvent(new CustomEvent('themeChange', { detail: newTheme }))
  }

  // 表单状态
  const [formData, setFormData] = useState({
    real_name: '',
    email: '',
    phone: '',
    emergency_contact: '',
    emergency_phone: '',
    address: '',
    education: '',
    id_card_front_url: '',
    id_card_back_url: ''
  })

  // 密码修改状态
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // 1. 加载用户信息
  useEffect(() => {
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    try {
      const token = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')

      if (!token) {
        console.error('未找到登录token')
        return
      }

      // 优先从服务器获取最新数据
      try {
        const userId = savedUser ? JSON.parse(savedUser).id : null
        if (userId) {
          const API_BASE_URL = getApiBaseUrl()
          const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (response.ok) {
            const data = await response.json()
            const userData = data.success ? data.data : data

            // 更新localStorage,但不包含图片URL(避免缓存问题)
            const userDataForStorage = { ...userData }
            delete userDataForStorage.id_card_front_url
            delete userDataForStorage.id_card_back_url
            localStorage.setItem('user', JSON.stringify(userDataForStorage))

            setUser(userData)
            setFormData({
              real_name: userData.real_name || '',
              email: userData.email || '',
              phone: userData.phone || '',
              emergency_contact: userData.emergency_contact || '',
              emergency_phone: userData.emergency_phone || '',
              address: userData.address || '',
              education: userData.education || '',
              id_card_front_url: userData.id_card_front_url || '',
              id_card_back_url: userData.id_card_back_url || ''
            })
            return
          }
        }
      } catch (serverError) {
        console.warn('从服务器获取用户信息失败,使用本地缓存:', serverError)
      }

      // 如果服务器获取失败,使用localStorage数据
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setFormData({
          real_name: userData.real_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          emergency_contact: userData.emergency_contact || '',
          emergency_phone: userData.emergency_phone || '',
          address: userData.address || '',
          education: userData.education || '',
          id_card_front_url: userData.id_card_front_url || '',
          id_card_back_url: userData.id_card_back_url || ''
        })
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  }

  // 2. 保存修改
  const handleSave = async () => {
    try {
      setLoading(true)
      const API_BASE_URL = getApiBaseUrl()
      const token = localStorage.getItem('token')

      const response = await fetch(`${API_BASE_URL}/users/${user.id}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        // 保存成功后重新从服务器获取最新数据
        await loadUserInfo()
        setEditing(false)
        toast.success('个人信息更新成功')
      } else {
        const data = await response.json()
        toast.error(data.message || '更新失败')
      }
    } catch (error) {
      console.error('更新失败:', error)
      toast.error('更新失败')
    } finally {
      setLoading(false)
    }
  }

  // 3. 修改密码
  const handlePasswordChange = async (e) => {
    e.preventDefault()

    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('请填写所有字段')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('两次输入的新密码不一致')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('新密码长度至少6位')
      return
    }

    if (passwordData.oldPassword === passwordData.newPassword) {
      toast.error('新密码不能与旧密码相同')
      return
    }

    try {
      setPasswordLoading(true)
      const API_BASE_URL = getApiBaseUrl()
      const token = localStorage.getItem('token')

      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('密码修改成功，请重新登录')
        setShowPasswordModal(false)
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        })

        // 3秒后自动退出登录
        setTimeout(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.reload()
        }, 3000)
      } else {
        toast.error(data.message || '密码修改失败')
      }
    } catch (error) {
      console.error('密码修改失败:', error)
      toast.error('密码修改失败')
    } finally {
      setPasswordLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // --- UI 组件 ---

  // 重构InfoItem组件，确保输入框正常工作且不会失去焦点
  const InfoItem = ({ label, value, icon, editing, type = 'text', options = [], name }) => {
    // 为每个输入项创建独立的状态
    const [localValue, setLocalValue] = useState(value || '');

    // 当外部value变化时，更新本地状态（仅在初始加载或重置时）
    useEffect(() => {
      setLocalValue(value || '');
    }, [value]);

    // 处理值变化，只更新本地状态，不立即更新父组件
    const handleLocalChange = (e) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
    };

    // 当输入框失去焦点时，才更新父组件的表单数据
    const handleBlur = () => {
      setFormData(prev => ({ ...prev, [name]: localValue }));
    };

    return (
      <div className="group">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-500 mb-2">
          <span className="text-blue-500">{icon}</span>
          {label}
        </label>

        {editing ? (
          type === 'select' ? (
            <div className="relative">
              <select
                value={localValue}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setLocalValue(newValue);
                  // 选择框变化后立即更新父组件
                  setFormData(prev => ({ ...prev, [name]: newValue }));
                }}
                className="w-full pl-4 pr-10 py-2.5 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-100 hover:bg-gray-50 text-gray-800 appearance-none"
              >
                <option value="">请选择</option>
                {options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                 <ChevronDownIcon className="w-4 h-4" />
              </div>
            </div>
          ) : (
            <input
              type={type}
              value={localValue}
              onChange={handleLocalChange}
              onBlur={handleBlur}
              className="w-full px-4 py-2.5 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-100 hover:bg-gray-50 text-gray-800 placeholder-gray-400"
              placeholder={`请输入${label}`}
            />
          )
        ) : (
          <div className="py-2.5 px-4 bg-gray-100 rounded-xl border border-transparent transition-all text-gray-800 font-medium min-h-[46px] flex items-center">
             {localValue ? localValue : <span className="text-gray-400 text-sm font-normal">未填写</span>}
          </div>
        )}
      </div>
    );
  };

  // 身份证上传组件
  const ImageUpload = ({ label, name, value, editing, icon }) => {
    const [uploading, setUploading] = useState(false)

    const handleFileChange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      try {
        setUploading(true)
        const API_BASE_URL = getApiBaseUrl()
        const token = localStorage.getItem('token')

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        })

        const data = await response.json()
        if (data.success) {
          setFormData(prev => ({ ...prev, [name]: data.url }))
          toast.success(`${label}上传成功`)
        } else {
          toast.error(data.error || '上传失败')
        }
      } catch (error) {
        console.error('上传出错:', error)
        toast.error('网络错误,请稍后重试')
      } finally {
        setUploading(false)
      }
    }

    return (
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-500">
          <span className="text-blue-500">{icon}</span>
          {label}
        </label>

        <div className="relative group aspect-[1.6/1] rounded-2xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 transition-all hover:border-blue-400">
          {value ? (
            <>
              <img
                src={getImageUrl(value, { bustCache: true })}
                alt={label}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setImageModal({ isOpen: true, url: getImageUrl(value, { bustCache: true }), title: label })}
              />
              {editing && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer px-4 py-2 bg-white/90 text-gray-800 rounded-xl font-medium text-sm hover:bg-white transition-colors">
                    更换图片
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <InformationCircleIcon className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">暂未上传{label}</p>
                {editing && <p className="text-xs text-gray-400 mt-1">点击上传或拖拽文件</p>}
              </div>
              {editing && (
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              )}
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-xs font-medium text-gray-500">上传中...</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-full p-6 md:p-8 transition-colors duration-500"
      style={{ backgroundColor: theme.background }}  // 使用单一背景色
    >
      <div className="max-w-5xl mx-auto space-y-6 pt-6">
        {/* 主要内容卡片 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">

          {/* 用户概览头部 Banner - 改为简约风格 */}
          <div className="relative h-32 bg-gradient-to-r from-slate-100 to-gray-50 border-b border-gray-200">
             <div className="absolute top-6 right-6 flex items-center gap-3">
               <button
                  onClick={() => setShowThemeModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 hover:text-blue-600 transition-all shadow-sm font-medium text-sm"
               >
                  <SwatchIcon className="w-4 h-4" />
                  <span>个性主题</span>
               </button>
               <button
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 transition-all shadow-sm font-medium text-sm"
                >
                  <LockClosedIcon className="w-4 h-4 text-gray-400" />
                  修改密码
              </button>
             </div>
          </div>

          <div className="px-8 pb-8 relative">
             {/* 头像区域 */}
             <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12 mb-8">
                <div className="w-24 h-24 rounded-2xl bg-white p-1.5 shadow-lg ring-1 ring-gray-100">
                   <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-3xl font-bold text-gray-600">
                      {user.real_name?.charAt(0) || 'User'}
                   </div>
                </div>

                <div className="flex-1 text-center md:text-left space-y-1 pb-1">
                   <h2 className="text-2xl font-bold text-gray-900">{user.real_name}</h2>
                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm">
                      <span className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                        <UserCircleIcon className="w-4 h-4 text-gray-400" />
                        {user.username}
                      </span>
                      {user.employee_no && (
                        <span className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                          <IdentificationIcon className="w-4 h-4 text-gray-400" />
                          {user.employee_no}
                        </span>
                      )}
                   </div>
                </div>

                {/* 编辑按钮 */}
                <div className="pb-1">
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors font-medium text-sm"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                      编辑资料
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditing(false)
                          loadUserInfo()
                        }}
                        className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <CheckIcon className="w-4 h-4" />
                        )}
                        保存修改
                      </button>
                    </div>
                  )}
                </div>
             </div>

             {/* 分割线 */}
             <div className="h-px bg-gray-100 w-full mb-8"></div>

             {/* 详细信息网格 */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-12 gap-y-8 max-w-4xl">
               <InfoItem
                  label="真实姓名"
                  value={formData.real_name}
                  name="real_name"
                  icon={<UserIcon className="w-4 h-4" />}
                  editing={editing}
               />
               <InfoItem
                  label="电子邮箱"
                  value={formData.email}
                  name="email"
                  icon={<EnvelopeIcon className="w-4 h-4" />}
                  editing={editing}
                  type="email"
               />
               <InfoItem
                  label="手机号码"
                  value={formData.phone}
                  name="phone"
                  icon={<PhoneIcon className="w-4 h-4" />}
                  editing={editing}
                  type="tel"
               />
               <InfoItem
                  label="最高学历"
                  value={formData.education}
                  name="education"
                  icon={<AcademicCapIcon className="w-4 h-4" />}
                  editing={editing}
                  type="select"
                  options={['高中', '大专', '本科', '硕士', '博士']}
               />

               <div className="hidden md:block md:col-span-2 h-px bg-gray-50 my-2"></div>

               <InfoItem
                  label="紧急联系人"
                  value={formData.emergency_contact}
                  name="emergency_contact"
                  icon={<UsersIcon className="w-4 h-4" />}
                  editing={editing}
               />
               <InfoItem
                  label="紧急联系电话"
                  value={formData.emergency_phone}
                  name="emergency_phone"
                  icon={<PhoneIcon className="w-4 h-4" />}
                  editing={editing}
                  type="tel"
               />

               <div className="md:col-span-2">
                 <InfoItem
                    label="家庭住址"
                    value={formData.address}
                    name="address"
                    icon={<HomeIcon className="w-4 h-4" />}
                    editing={editing}
                 />
               </div>

                <div className="md:col-span-2 mt-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <IdentificationIcon className="w-5 h-5 text-blue-500" />
                    证件信息
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ImageUpload
                      label="身份证正面"
                      name="id_card_front_url"
                      value={formData.id_card_front_url}
                      editing={editing}
                      icon={<InformationCircleIcon className="w-4 h-4" />}
                    />
                    <ImageUpload
                      label="身份证反面"
                      name="id_card_back_url"
                      value={formData.id_card_back_url}
                      editing={editing}
                      icon={<InformationCircleIcon className="w-4 h-4" />}
                    />
                  </div>
                </div>
              </div>

          </div>
        </div>

      </div>

      {/* 修改密码模态框 */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false)
          setPasswordData({
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
          })
        }}
        title={
          <div className="flex items-center gap-2">
            <LockClosedIcon className="w-5 h-5 text-gray-500" />
            <span>修改密码</span>
          </div>
        }
        size="small"
      >
        <form onSubmit={handlePasswordChange} className="space-y-5 px-1">
          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-sm text-blue-800 flex items-start gap-3">
             <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
             <div className="space-y-1">
               <p className="font-medium">安全提示</p>
               <ul className="list-disc list-inside text-blue-700/80 space-y-0.5 text-xs">
                 <li>密码长度至少6位</li>
                 <li>新密码不能与旧密码相同</li>
                 <li>修改后需要重新登录</li>
               </ul>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">当前密码</label>
            <div className="relative">
              <input
                type="password"
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="请输入当前使用的密码"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">新密码</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="6位以上新密码"
                  required
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">确认新密码</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="重复新密码"
                  required
                />
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-50 mt-2">
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all font-medium text-sm"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium text-sm shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              {passwordLoading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              确认修改
            </button>
          </div>
        </form>
      </Modal>

      {/* 主题设置模态框 */}
      <Modal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        title={
          <div className="flex items-center gap-2">
            <SwatchIcon className="w-5 h-5 text-gray-500" />
            <span>个性化背景设置</span>
          </div>
        }
        size="small"
      >
         <div className="space-y-6 p-1">
            <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600 border border-gray-100">
               <p>✨ 选择您喜欢的莫兰迪色系，自定义页面背景颜色，打造专属的护眼界面。</p>
            </div>

            <div className="space-y-3">
               <label className="block text-sm font-bold text-gray-700 mx-1">🎨 背景颜色</label>
               <div className="grid grid-cols-7 gap-2 mt-2">
                  {PALETTE_MORANDI.map(color => (
                     <button
                       key={color}
                       onClick={() => updateTheme({ ...theme, background: color })}
                       className={`w-8 h-8 rounded-lg border-2 shadow-sm hover:scale-110 transition-transform ${
                         theme.background === color
                           ? 'border-blue-500 ring-2 ring-blue-200'
                           : 'border-gray-200 hover:border-gray-300'
                       }`}
                       style={{ backgroundColor: color }}
                       title={color}
                     />
                  ))}
               </div>
               {/* 增加第二行颜色选择 */}
               <div className="grid grid-cols-7 gap-2">
                  {/* 添加更多颜色选项 */}
                  {[
                    '#8B5CF6', // 紫色
                    '#EC4899', // 粉色
                    '#F59E0B', // 琥珀色
                    '#10B981', // 绿色
                    '#3B82F6', // 蓝色
                    '#EF4444', // 红色
                    '#6B7280'  // 灰色
                  ].map(color => (
                     <button
                       key={color}
                       onClick={() => updateTheme({ ...theme, background: color })}
                       className={`w-8 h-8 rounded-lg border-2 shadow-sm hover:scale-110 transition-transform ${
                         theme.background === color
                           ? 'border-blue-500 ring-2 ring-blue-200'
                           : 'border-gray-200 hover:border-gray-300'
                       }`}
                       style={{ backgroundColor: color }}
                       title={color}
                     />
                  ))}
               </div>
            </div>

            <div className="pt-4 flex justify-end">
               <button
                  onClick={() => {
                     updateTheme({ background: '#F3F4F6' })
                  }}
                  className="mr-auto text-sm text-gray-500 hover:text-gray-700 underline"
               >
                  恢复默认
               </button>
               <button
                 onClick={() => setShowThemeModal(false)}
                 className="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-medium text-sm shadow-lg shadow-gray-200"
               >
                 完成设置
               </button>
            </div>
         </div>
      </Modal>

      {/* 图片查看模态框 */}
      {imageModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setImageModal({ isOpen: false, url: '', title: '' })}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setImageModal({ isOpen: false, url: '', title: '' })}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-white text-center mb-2 font-medium">{imageModal.title}</div>
            <img
              src={imageModal.url}
              alt={imageModal.title}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default PersonalInfo
