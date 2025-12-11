// [SHADCN-REPLACED]
import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { getApiBaseUrl } from '../utils/apiConfig'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'

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

  const InfoItem = ({ name, label, value, icon, editing, type = 'text', options = [] }) => (
    <div className="group">
      <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
        <span className="text-lg">{icon}</span>
        {label}
      </Label>
      {editing ? (
        type === 'select' ? (
          <Select value={value || ''} onValueChange={(val) => setFormData({ ...formData, [name]: val })}>
            <SelectTrigger className="w-full" />
            <SelectContent>
              <SelectItem value="">请选择</SelectItem>
              {options.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            type={type}
            value={value || ''}
            onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
          />
        )
      ) : (
        <div className="py-2.5 px-4 bg-gray-50 rounded-lg">
          <span className="text-gray-900">{value || <span className="text-gray-400">未填写</span>}</span>
        </div>
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
            <Button onClick={() => setShowPasswordModal(true)} className="flex items-center gap-2 shadow-sm">
              <span className="text-lg">🔒</span>
              修改密码
            </Button>
          </div>
        </div>

        {/* 个人信息卡片 */}
        <Card className="rounded-2xl border border-gray-200 overflow-hidden">
          {/* 头部 - 柔和色调 */}
          <div className="relative bg-gradient-to-r from-slate-100 to-gray-100 px-8 py-12 border-b border-gray-200">
            <div className="relative flex items-center gap-8">
              <Avatar className="w-28 h-28 rounded-2xl ring-4 ring-gray-200">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} alt={user.real_name} />
                ) : (
                  <AvatarFallback className="text-4xl font-semibold text-slate-700">{user.real_name?.charAt(0) || '员'}</AvatarFallback>
                )}
              </Avatar>
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
          <CardContent className="p-10">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-slate-400 rounded-full"></span>
                基本信息
              </h3>
              {!editing ? (
                <Button variant="outline" onClick={() => setEditing(true)} className="flex items-center gap-2">
                  <span>✏️</span>
                  编辑信息
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => { setEditing(false); loadUserInfo() }}>取消</Button>
                  <Button onClick={handleSave} disabled={loading} className="flex items-center gap-2">
                    <span>💾</span>
                    {loading ? '保存中...' : '保存'}
                  </Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <InfoItem name="real_name" label="姓名" value={formData.real_name} icon="👤" editing={editing} />
              <InfoItem name="email" label="邮箱" value={formData.email} icon="📧" editing={editing} type="email" />
              <InfoItem name="phone" label="手机号" value={formData.phone} icon="📱" editing={editing} type="tel" />
              <InfoItem
                name="education"
                label="学历"
                value={formData.education}
                icon="🎓"
                editing={editing}
                type="select"
                options={['高中', '大专', '本科', '硕士', '博士']}
              />
              <InfoItem name="emergency_contact" label="紧急联系人" value={formData.emergency_contact} icon="🆘" editing={editing} />
              <InfoItem name="emergency_phone" label="紧急联系电话" value={formData.emergency_phone} icon="☎️" editing={editing} type="tel" />
              <div className="md:col-span-2">
                <InfoItem name="address" label="家庭住址" value={formData.address} icon="🏠" editing={editing} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showPasswordModal} onOpenChange={(open) => {
        setShowPasswordModal(open)
        if (!open) {
          setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
            <DialogDescription>请输入当前密码和新密码</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <Label className="mb-2 block">当前密码</Label>
              <Input type="password" value={passwordData.oldPassword} onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })} required />
            </div>
            <div>
              <Label className="mb-2 block">新密码</Label>
              <Input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} required />
              {passwordData.newPassword && passwordData.newPassword.length < 6 && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span>⚠️</span>
                  密码长度至少6位
                </p>
              )}
            </div>
            <div>
              <Label className="mb-2 block">确认新密码</Label>
              <Input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} required />
              {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span>⚠️</span>
                  两次输入的密码不一致
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPasswordModal(false)}>取消</Button>
              <Button type="submit" disabled={passwordLoading} className="flex items-center gap-2">
                <span>🔒</span>
                {passwordLoading ? '修改中...' : '确认修改'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PersonalInfo
