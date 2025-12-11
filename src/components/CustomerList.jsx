import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import customerAPI from '../api/customerAPI.js'
import Modal from './Modal'
import CustomerForm from './CustomerForm'
// 导入shadcn UI组件
import { Button } from './ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'

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
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">客服人员管理</h2>
              <p className="text-gray-500 text-sm mt-1">共 {customers.length} 名客服人员</p>
            </div>
            <Button onClick={handleAdd}>
              添加客服
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="rounded-tl-lg">姓名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>电话</TableHead>
                  <TableHead>部门</TableHead>
                  <TableHead>评级</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-center rounded-tr-lg">操作</TableHead>
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
                    <TableRow key={customer.id} className={index % 2 === 0 ? 'bg-white' : 'bg-primary-50/30'}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.department || '客服部'}</TableCell>
                      <TableCell>
                        <span className="text-yellow-500">{'⭐'.repeat(customer.rating || 3)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                          {customer.status === 'active' ? '在职' : '离职'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mr-2"
                          onClick={() => handleEdit(customer)}
                        >
                          编辑
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(customer.id)}
                        >
                          删除
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? '编辑客服' : '添加客服'}>
        <CustomerForm customer={editingCustomer} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  )
}

export default CustomerList
