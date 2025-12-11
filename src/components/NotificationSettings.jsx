import React, { useState, useEffect } from 'react'
import { getApiUrl } from '../utils/apiConfig'
import { apiGet, apiPut } from '../utils/apiClient'
import { toast } from 'react-toastify'

// 导入 shadcn UI 组件
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
const NotificationSettings = () => {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState([])
  const [roles, setRoles] = useState([])
  const [saving, setSaving] = useState(false)

  // 事件类型映射
  const eventTypeMap = {
    'leave_apply': '请假申请',
    'leave_approval': '请假审批通过',
    'leave_rejection': '请假审批拒绝',
    'exam_publish': '考试发布',
    'exam_result': '考试结果发布'
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [settingsRes, rolesRes] = await Promise.all([
        apiGet('/api/notification-settings'),
        apiGet('/api/notification-settings/roles')
      ])

      if (settingsRes.success) {
        setSettings(settingsRes.data)
      }
      if (rolesRes.success) {
        // 添加特殊角色 "申请人" 和 "考生"
        setRoles(['申请人', '考生', ...rolesRes.data])
      }
    } catch (error) {
      console.error('获取数据失败:', error)
      toast.error('获取配置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (eventType, newRoles) => {
    const newSettings = [...settings]
    const index = newSettings.findIndex(s => s.event_type === eventType)

    if (index > -1) {
      newSettings[index].target_roles = newRoles
      setSettings(newSettings)
    } else {
      newSettings.push({
        event_type: eventType,
        target_roles: newRoles
      })
      setSettings(newSettings)
    }
  }

  const handleSave = async (record) => {
    setSaving(true)
    try {
      await apiPut(`/api/notification-settings/${record.event_type}`, {
        targetRoles: record.target_roles
      })
      toast.success('保存成功')
    } catch (error) {
      console.error('保存失败:', error)
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 确保所有定义的事件类型都显示，即使数据库中没有记录
  const displayData = Object.keys(eventTypeMap).map(type => {
    const existing = settings.find(s => s.event_type === type)
    return existing || { event_type: type, target_roles: [] }
  })

  return (
    <div className="p-6">
      <Card>
        <div className="mb-6">
          <h3 className="text-lg font-semibold">通知设置</h3>
          <p className="text-gray-500 text-sm mt-1">
            配置各类系统事件触发时，哪些角色的用户会收到通知弹窗。
          </p>
        </div>
        <CardContent>
          <div className="space-y-6">
            {displayData.map((item) => (
              <div key={item.event_type} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                    <span className="font-medium">{eventTypeMap[item.event_type] || item.event_type}</span>
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">接收通知角色</label>
                    <Select
                      value={Array.isArray(item.target_roles) ? item.target_roles : (typeof item.target_roles === 'string' ? JSON.parse(item.target_roles) : [])}
                      onValueChange={(value) => handleRoleChange(item.event_type, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="请选择接收角色" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Button onClick={() => handleSave(item)} disabled={saving}>
                    {saving ? '保存中...' : '保存'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default NotificationSettings
