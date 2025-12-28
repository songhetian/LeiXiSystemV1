import React, { useState } from 'react'
import { toast } from 'sonner';
import { getApiUrl } from '../utils/apiConfig'


export default function EmployeeBatchOperations({ onImportSuccess }) {
  const [importing, setImporting] = useState(false)

  // 下载导入模板
  const handleDownloadTemplate = () => {
    try {
      // 创建模板CSV内容
      const headers = [
        '工号*', '姓名*', '用户名*', '密码*', '邮箱', '手机',
        '部门ID*', '职位', '入职日期*', '状态', '星级',
        '紧急联系人', '紧急联系电话', '地址', '学历', '技能', '备注'
      ]

      const example = [
        'EMP0001', '张三', 'zhangsan', '123456', 'zhangsan@example.com', '13800138000',
        '1', '工程师', '2024-01-01', 'active', '5',
        '李四', '13900139000', '北京市朝阳区', '本科', 'Java,Python', '示例员工'
      ]

      const csvContent = [
        headers.join(','),
        example.join(','),
        '# 说明：',
        '# 1. 带*号的字段为必填项',
        '# 2. 状态可选值：active(在职)、inactive(离职)、pending(待入职)',
        '# 3. 星级范围：1-5',
        '# 4. 部门ID需要先在系统中查询对应的部门ID',
        '# 5. 日期格式：YYYY-MM-DD',
        '# 6. 删除示例行和说明行后，填写实际数据'
      ].join('\n')

      // 添加BOM支持中文
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', '员工导入模板.csv')
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('模板下载成功')
    } catch (error) {
      console.error('下载模板失败:', error)
      toast.error('下载模板失败')
    }
  }

  // 批量导出员工
  const handleBatchExport = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(getApiUrl('/api/employees'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('获取员工数据失败')
      }

      const employees = await response.json()

      if (employees.length === 0) {
        toast.warning('没有员工数据可导出')
        return
      }

      // 生成CSV内容
      const headers = [
        '工号', '姓名', '用户名', '邮箱', '手机',
        '部门', '职位', '入职日期', '状态', '星级',
        '紧急联系人', '紧急联系电话', '地址', '学历', '技能', '备注'
      ]

      const csvContent = [
        headers.join(','),
        ...employees.map(emp => [
          emp.employee_no || '',
          emp.real_name || '',
          emp.username || '',
          emp.email || '',
          emp.phone || '',
          emp.department_name || '',
          emp.position || '',
          emp.hire_date ? emp.hire_date.split('T')[0] : '',
          emp.status || '',
          emp.rating || '',
          emp.emergency_contact || '',
          emp.emergency_phone || '',
          emp.address || '',
          emp.education || '',
          emp.skills || '',
          emp.remark || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n')

      // 添加BOM支持中文
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)

      const now = new Date()
      const dateStr = now.toISOString().split('T')[0]
      link.setAttribute('download', `员工列表_${dateStr}.csv`)

      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(`成功导出 ${employees.length} 名员工`)
    } catch (error) {
      console.error('导出失败:', error)
      toast.error('导出失败：' + error.message)
    }
  }

  // 批量导入员工
  const handleBatchImport = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast.error('请选择CSV文件')
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        setImporting(true)
        const text = e.target.result
        const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'))

        if (lines.length < 2) {
          toast.error('文件内容为空或格式不正确')
          return
        }

        // 跳过表头
        const dataLines = lines.slice(1)
        const employees = []

        for (const line of dataLines) {
          // 简单的CSV解析（不处理引号内的逗号）
          const fields = line.split(',').map(f => f.trim().replace(/^"|"$/g, ''))

          if (fields.length < 9) {
            console.warn('跳过格式不正确的行:', line)
            continue
          }

          employees.push({
            employee_no: fields[0],
            real_name: fields[1],
            username: fields[2],
            password: fields[3],
            email: fields[4] || null,
            phone: fields[5] || null,
            department_id: parseInt(fields[6]),
            position: fields[7] || null,
            hire_date: fields[8],
            status: fields[9] || 'active',
            rating: parseInt(fields[10]) || 3,
            emergency_contact: fields[11] || null,
            emergency_phone: fields[12] || null,
            address: fields[13] || null,
            education: fields[14] || null,
            skills: fields[15] || null,
            remark: fields[16] || null
          })
        }

        if (employees.length === 0) {
          toast.error('没有有效的员工数据')
          return
        }

        // 调用后端API批量导入
        const token = localStorage.getItem('token')
        const response = await fetch(getApiUrl('/api/employees/batch-import'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ employees })
        })

        const result = await response.json()

        if (result.success) {
          toast.success(`成功导入 ${result.successCount} 名员工${result.failCount > 0 ? `，失败 ${result.failCount} 名` : ''}`)
          if (onImportSuccess) {
            onImportSuccess()
          }
        } else {
          toast.error('导入失败：' + result.message)
        }
      } catch (error) {
        console.error('导入失败:', error)
        toast.error('导入失败：' + error.message)
      } finally {
        setImporting(false)
        event.target.value = '' // 清空文件选择
      }
    }

    reader.readAsText(file, 'UTF-8')
  }

  return (
    <div className="flex gap-2">
      {/* 下载模板 */}
      <button
        onClick={handleDownloadTemplate}
        className="px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-all"
      >
        下载模板
      </button>

      {/* 批量导入 */}
      <label className="px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-all cursor-pointer">
        {importing ? '导入中...' : '批量导入'}
        <input
          type="file"
          accept=".csv"
          onChange={handleBatchImport}
          disabled={importing}
          className="hidden"
        />
      </label>

      {/* 批量导出 */}
      <button
        onClick={handleBatchExport}
        className="px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-all"
      >
        批量导出
      </button>
    </div>
  )
}
