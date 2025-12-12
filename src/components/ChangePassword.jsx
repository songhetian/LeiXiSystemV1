import React, { useState } from 'react'
import { toast } from 'sonner'
import { getApiBaseUrl } from '../utils/apiConfig'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Lock, Loader2, AlertTriangle, Lightbulb } from 'lucide-react'

const ChangePassword = () => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error('请填写所有字段')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('两次输入的新密码不一致')
      return
    }

    if (formData.newPassword.length < 6) {
      toast.error('新密码长度至少6位')
      return
    }

    if (formData.oldPassword === formData.newPassword) {
      toast.error('新密码不能与旧密码相同')
      return
    }

    try {
      setLoading(true)
      const API_BASE_URL = getApiBaseUrl()
      const token = localStorage.getItem('token')

      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('密码修改成功，请重新登录')
        setFormData({
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
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 页面标题 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Lock className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">修改密码</h1>
            <p className="text-sm text-gray-600">修改您的登录密码</p>
          </div>
        </div>
      </div>

      {/* 修改密码表单 */}
      <div className="max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 旧密码 */}
            <div className="space-y-2">
              <Label htmlFor="oldPassword">当前密码</Label>
              <Input
                id="oldPassword"
                type="password"
                value={formData.oldPassword}
                onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                placeholder="请输入当前密码"
                required
              />
            </div>

            {/* 新密码 */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="请输入新密码（至少6位）"
                required
              />
              {formData.newPassword && formData.newPassword.length < 6 && (
                <p className="text-sm text-red-600">密码长度至少6位</p>
              )}
            </div>

            {/* 确认新密码 */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="请再次输入新密码"
                required
              />
              {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                <p className="text-sm text-red-600">两次输入的密码不一致</p>
              )}
            </div>

            {/* 提示信息 */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>重要提示</AlertTitle>
              <AlertDescription>
                <ul className="space-y-1 mt-2">
                  <li>• 密码长度至少6位</li>
                  <li>• 新密码不能与旧密码相同</li>
                  <li>• 修改成功后需要重新登录</li>
                  <li>• 建议使用字母、数字和符号组合</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* 提交按钮 */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                size="lg"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? '修改中...' : '确认修改'}
              </Button>
            </div>
          </form>
        </div>

        {/* 安全提示 */}
        <Alert className="mt-6">
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>密码安全建议</AlertTitle>
          <AlertDescription>
            <ul className="space-y-1 mt-2">
              <li>• 定期更换密码（建议每3个月）</li>
              <li>• 不要使用生日、电话等容易猜到的密码</li>
              <li>• 不要在多个系统使用相同密码</li>
              <li>• 不要将密码告诉他人</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}

export default ChangePassword
