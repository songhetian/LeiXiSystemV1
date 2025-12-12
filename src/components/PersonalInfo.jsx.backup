import React, { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { getApiBaseUrl } from '../utils/apiConfig'
import Modal from './Modal'

const PersonalInfo = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [formData, setFormData] = useState({
    real_name: '',
    email: '',
    phone: '',
    emergency_contact: '',
    emergency_phone: '',
    address: '',
    education: ''
  })
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    try {
      const savedUser = localStorage.getItem('user')
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
          education: userData.education || ''
        })
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  }

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
        const updatedUser = { ...user, ...formData }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setUser(updatedUser)
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
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  const InfoItem = ({ label, value, icon, editing, type = 'text', options = [] }) => (
    <div className="group">
      <Label className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-3">
        <span className="text-lg">{icon}</span>
        {label}
      </Label>
      {editing ? (
        type === 'select' ? (
          <select
            value={value}
            onChange={(e) => setFormData({ ...formData, [Object.keys(formData).find(k => formData[k] === value)]: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white"
          >
            <option value="">请选择</option>
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => {
              const key = Object.keys(formData).find(k => formData[k] === value)
              setFormData({ ...formData, [key]: e.target.value })
            }}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        )
      ) : (
        <p className="text-gray-900 py-2.5 px-4 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
          {value || <span className="text-gray-400">未填写</span>}
        </p>
      )}
    </div>
  )

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-xl">
                <span className="text-3xl">👤</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">个人中心</h1>
                <p className="text-sm text-gray-600 mt-1">管理您的个人信息和账户设置</p>
              </div>
            </div>
            <Button onClick={() => setShowPasswordModal(true)}>
              <span className="text-lg">🔒</span>
              修改密码
            </Button>
          </div>
        </div>

        {/* 个人信息卡片 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* 头部 - 柔和色调 */}
          <div className="relative bg-gradient-to-r from-slate-100 to-gray-100 px-8 py-12 border-b border-gray-200">
            <div className="relative flex items-center gap-8">
              <div className="w-28 h-28 rounded-2xl bg-white shadow-md flex items-center justify-center text-4xl font-semibold text-slate-700 ring-4 ring-gray-200">
                {user.real_name?.charAt(0) || '员'}
              </div>
              <div className="text-slate-800 flex-1">
                <h2 className="text-3xl font-bold mb-3 tracking-tight">{user.real_name}</h2>
                <div className="flex items-center gap-6 text-slate-600">
                  <div className="flex items-center gap-2 bg-white/70 text-slate-700 px-3 py-1.5 rounded-lg">
                    <span>👤</span>
                    <span className="font-medium">{user.username}</span>
                  </div>
                  {user.employee_no && (
                    <div className="flex items-center gap-2 bg-white/70 text-slate-700 px-3 py-1.5 rounded-lg">
                      <span>🏷️</span>
                      <span className="font-medium">工号：{user.employee_no}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 信息内容 */}
          <div className="p-10">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-slate-400 rounded-full"></span>
                基本信息
              </h3>
              {!editing ? (
                <Button onClick={() => setEditing(true)} variant="ghost">
                  <span>✏️</span>
                  编辑信息
                </Button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setEditing(false)
                      loadUserInfo()
                    }}
                    className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    取消
                  </button>
                  <Button onClick={handleSave} disabled={loading}>
                    <span>💾</span>
                    {loading ? '保存中...' : '保存'}
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <InfoItem label="姓名" value={formData.real_name} icon="👤" editing={editing} />
              <InfoItem label="邮箱" value={formData.email} icon="📧" editing={editing} type="email" />
              <InfoItem label="手机号" value={formData.phone} icon="📱" editing={editing} type="tel" />
              <InfoItem
                label="学历"
                value={formData.education}
                icon="🎓"
                editing={editing}
                type="select"
                options={['高中', '大专', '本科', '硕士', '博士']}
              />
              <InfoItem label="紧急联系人" value={formData.emergency_contact} icon="🆘" editing={editing} />
              <InfoItem label="紧急联系电话" value={formData.emergency_phone} icon="☎️" editing={editing} type="tel" />
              <div className="md:col-span-2">
                <InfoItem label="家庭住址" value={formData.address} icon="🏠" editing={editing} />
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
        title="🔒 修改密码"
        size="small"
      >
        <form onSubmit={handlePasswordChange} className="space-y-6">
          {/* 当前密码 */}
          <div>
            <Label className="block text-sm font-semibold text-gray-700 mb-2">
              当前密码
            </Label>
            <input
              type="password"
              value={passwordData.oldPassword}
              onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
              placeholder="请输入当前密码"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              required
            />
          </div>

          {/* 新密码 */}
          <div>
            <Label className="block text-sm font-semibold text-gray-700 mb-2">
              新密码
            </Label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              placeholder="请输入新密码（至少6位）"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              required
            />
            {passwordData.newPassword && passwordData.newPassword.length < 6 && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span>
                密码长度至少6位
              </p>
            )}
          </div>

          {/* 确认新密码 */}
          <div>
            <Label className="block text-sm font-semibold text-gray-700 mb-2">
              确认新密码
            </Label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="请再次输入新密码"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              required
            />
            {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span>
                两次输入的密码不一致
              </p>
            )}
          </div>

          {/* 提示信息 */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 text-xl">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-900 mb-2">重要提示</p>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• 密码长度至少6位</li>
                  <li>• 新密码不能与旧密码相同</li>
                  <li>• 修改成功后需要重新登录</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button"
              onClick={() => {
                setShowPasswordModal(false)
                setPasswordData({
                  oldPassword: '',
                  newPassword: '',
                  confirmPassword: ''
                })
              }}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              取消
            </Button>
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>🔒</span>
              {passwordLoading ? '修改中...' : '确认修改'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default PersonalInfo
