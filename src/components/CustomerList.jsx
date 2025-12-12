import React, { useState, useEffect } from 'react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import customerAPI from '../api/customerAPI.js'
import Modal from './Modal'
import CustomerForm from './CustomerForm'

const CustomerList = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const response = await customerAPI.getAll()
      setCustomers(response.data)
    } catch (error) {
      toast.error('加载客服列表失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingCustomer(null)
    setIsModalOpen(true)
  }

  const handleEdit = (customer) => {
    setEditingCustomer(customer)
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个客服人员吗？')) {
      try {
        await customerAPI.delete(id)
        toast.success('删除成功！')
        loadCustomers()
      } catch (error) {
        toast.error('删除失败')
      }
    }
  }

  const handleSave = async (customerData) => {
    try {
      if (editingCustomer) {
        await customerAPI.update(editingCustomer.id, customerData)
        toast.success('更新成功！')
      } else {
        await customerAPI.create(customerData)
        toast.success('添加成功！')
      }
      setIsModalOpen(false)
      loadCustomers()
    } catch (error) {
      toast.error(editingCustomer ? '更新失败' : '添加失败')
    }
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
            <h2 className="text-2xl font-bold text-gray-800">客服人员管理</h2>
            <p className="text-gray-500 text-sm mt-1">共 {customers.length} 名客服人员</p>
          </div>
          <Button onClick={handleAdd}>
            <span className="text-xl">+</span>
            <span>添加客服</span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-primary-100 text-primary-800">
                <TableHead className="px-4 py-3 text-left rounded-tl-lg">姓名</TableHead>
                <TableHead className="px-4 py-3 text-left">邮箱</TableHead>
                <TableHead className="px-4 py-3 text-left">电话</TableHead>
                <TableHead className="px-4 py-3 text-left">部门</TableHead>
                <TableHead className="px-4 py-3 text-left">评级</TableHead>
                <TableHead className="px-4 py-3 text-left">状态</TableHead>
                <TableHead className="px-4 py-3 text-center rounded-tr-lg">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer, index) => (
                  <TableRow key={customer.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-primary-50/30'} hover:bg-primary-100/50 transition-colors`}>
                    <TableCell className="px-4 py-3 font-medium">{customer.name}</TableCell>
                    <TableCell className="px-4 py-3 text-gray-600">{customer.email}</TableCell>
                    <TableCell className="px-4 py-3 text-gray-600">{customer.phone}</TableCell>
                    <TableCell className="px-4 py-3 text-gray-600">{customer.department || '客服部'}</TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="text-yellow-500">{'⭐'.repeat(customer.rating || 3)}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        customer.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {customer.status === 'active' ? '在职' : '离职'}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <Button onClick={() => handleEdit(customer)} size="sm">
                        编辑
                      </Button>
                      <Button onClick={() => handleDelete(customer.id)} variant="destructive" size="sm">
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? '编辑客服' : '添加客服'}>
        <CustomerForm customer={editingCustomer} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  )
}

export default CustomerList
