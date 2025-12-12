import React, { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const CustomerForm = ({ customer, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '客服部',
    status: 'active',
    rating: 3
  })

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        department: customer.department || '客服部',
        status: customer.status || 'active',
        rating: customer.rating || 3
      })
    }
  }, [customer])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">姓名 *</Label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          required
        />
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">邮箱 *</Label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          required
        />
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">电话 *</Label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          required
        />
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">部门</Label>
        <select
          value={formData.department}
          onChange={(e) => setFormData({...formData, department: e.target.value})}
          className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option>客服部</option>
          <option>技术部</option>
          <option>销售部</option>
          <option>市场部</option>
        </select>
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">评级</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(rating => (
            <button
              key={rating}
              type="button"
              onClick={() => setFormData({...formData, rating})}
              className={`text-2xl transition-all ${formData.rating >= rating ? 'text-yellow-500 scale-110' : 'text-gray-300'}`}
            >
              ⭐
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-2">状态</Label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value})}
          className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="active">在职</option>
          <option value="inactive">离职</option>
        </select>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          取消
        </Button>
        <Button>
          保存
        </Button>
      </div>
    </form>
  )
}

export default CustomerForm
