import React, { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { DatePicker, TimePicker, DateTimePicker } from '@/components/ui/date-picker'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import sessionAPI from '../api/sessionAPI.js'
import Modal from './Modal'
import ImportSessionModal from './ImportSessionModal'; // Import the new modal

const SessionManagement = () => {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false); // State for the import modal

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const response = await sessionAPI.getAll()
      setSessions(response.data)
    } catch (error) {
      toast.error('加载会话列表失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (session) => {
    setSelectedSession(session)
    setIsDetailOpen(true)
  }

  const handleEndSession = (id) => {
    setSessions(sessions.map(s =>
      s.id === id ? { ...s, status: 'completed', duration: '12分钟' } : s
    ))
    toast.success('会话已结束！')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-primary-600 text-xl">加载中...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">会话管理</h2>
            <p className="text-gray-500 text-sm mt-1">共 {sessions.length} 个会话</p>
          </div>
          <div className="flex gap-3">
             <Button onClick={() => setIsImportModalOpen(true)}>
              <span className="text-xl">↑</span>
              <span>导入会话</span>
            </Button>
            <select className="px-4 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option>全部状态</option>
              <option>进行中</option>
              <option>已完成</option>
            </select>
            <DatePicker
              className="px-4 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {sessions.map((session) => (
            <div key={session.id} className="border border-primary-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-primary-50/30">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{session.customer}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      session.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {session.status === 'active' ? '进行中' : '已完成'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>客服：{session.agent}</div>
                    <div>开始时间：{session.startTime}</div>
                    <div>时长：{session.duration}</div>
                    {session.satisfaction && (
                      <div>满意度：<span className="text-yellow-500">{'⭐'.repeat(session.satisfaction)}</span></div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleViewDetail(session)}>
                    查看详情
                  </Button>
                  {session.status === 'active' && (
                    <Button onClick={() => handleEndSession(session.id)}>
                      结束会话
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="会话详情">
        {selectedSession && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600">客户</Label>
                <p className="font-medium">{selectedSession.customer}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">客服</Label>
                <p className="font-medium">{selectedSession.agent}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">开始时间</Label>
                <p className="font-medium">{selectedSession.startTime}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">时长</Label>
                <p className="font-medium">{selectedSession.duration}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-600 block mb-2">会话记录</Label>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                <div className="text-sm">
                  <span className="font-medium text-blue-600">客户：</span>
                  <span className="text-gray-700">你好，我想咨询一下产品问题</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-green-600">{selectedSession.agent}：</span>
                  <span className="text-gray-700">您好！很高兴为您服务，请问有什么可以帮助您的？</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-blue-600">客户：</span>
                  <span className="text-gray-700">产品使用过程中遇到了一些问题...</span>
                </div>
              </div>
            </div>
            <Button onClick={() => setIsDetailOpen(false)}>
              关闭
            </Button>
          </div>
        )}
      </Modal>

      <ImportSessionModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
    </div>
  )
}

export default SessionManagement
