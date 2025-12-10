import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../utils/apiConfig';
import { apiGet } from '../../utils/apiClient';
import { toast } from 'react-toastify';

// 导入 Shadcn UI 组件
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';

// 导入图标
import { Search, RefreshCw, User, Mail, Phone, Building, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EmployeeManagementTable() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 分页状态
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });

  // 筛选状态
  const [filters, setFilters] = useState({
    department: '',
    status: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, [pagination.page, searchTerm, filters]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await apiGet('/api/employees', {
        page: pagination.page,
        limit: pagination.pageSize,
        search: searchTerm,
        department: filters.department,
        status: filters.status
      });

      if (response.success) {
        setEmployees(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.totalPages || 0
        }));
      }
    } catch (error) {
      console.error('获取员工列表失败:', error);
      toast.error('获取员工列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilters({
      department: '',
      status: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { text: '在职', variant: 'default' },
      inactive: { text: '离职', variant: 'secondary' },
      probation: { text: '试用期', variant: 'outline' },
      suspended: { text: '暂停', variant: 'destructive' }
    };

    const config = statusConfig[status] || { text: '未知', variant: 'secondary' };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getDepartmentBadge = (department) => {
    const deptColors = {
      '技术部': 'bg-blue-100 text-blue-800',
      '人事部': 'bg-green-100 text-green-800',
      '财务部': 'bg-yellow-100 text-yellow-800',
      '市场部': 'bg-purple-100 text-purple-800',
      '客服部': 'bg-pink-100 text-pink-800'
    };

    const colorClass = deptColors[department] || 'bg-gray-100 text-gray-800';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        <Building className="mr-1 h-3 w-3" />
        {department || '未分配'}
      </span>
    );
  };

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-2xl font-bold">员工管理</CardTitle>
              <div className="flex gap-2">
                <Button onClick={fetchEmployees} variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  刷新
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* 搜索和筛选区域 */}
            <motion.div 
              className="mb-6 p-4 bg-gray-50 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="搜索员工姓名、工号..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <select
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={filters.department}
                  onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                >
                  <option value="">所有部门</option>
                  <option value="技术部">技术部</option>
                  <option value="人事部">人事部</option>
                  <option value="财务部">财务部</option>
                  <option value="市场部">市场部</option>
                  <option value="客服部">客服部</option>
                </select>
                
                <select
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">所有状态</option>
                  <option value="active">在职</option>
                  <option value="inactive">离职</option>
                  <option value="probation">试用期</option>
                  <option value="suspended">暂停</option>
                </select>
                
                <div className="flex gap-2">
                  <Button type="submit" size="sm">
                    <Search className="mr-2 h-4 w-4" />
                    搜索
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={clearSearch}>
                    清空
                  </Button>
                </div>
              </form>
            </motion.div>

            {/* 统计信息 */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">总员工数</p>
                      <p className="text-2xl font-bold">{pagination.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-full">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">在职员工</p>
                      <p className="text-2xl font-bold">
                        {employees.filter(emp => emp.status === 'active').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <Calendar className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">试用期</p>
                      <p className="text-2xl font-bold">
                        {employees.filter(emp => emp.status === 'probation').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <Building className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">部门数</p>
                      <p className="text-2xl font-bold">
                        {new Set(employees.map(emp => emp.department)).size}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 员工表格 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">工号</TableHead>
                          <TableHead>姓名</TableHead>
                          <TableHead>部门</TableHead>
                          <TableHead>职位</TableHead>
                          <TableHead>联系方式</TableHead>
                          <TableHead>入职日期</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employees.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                              暂无员工数据
                            </TableCell>
                          </TableRow>
                        ) : (
                          employees.map((employee) => (
                            <TableRow 
                              key={employee.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <TableCell className="font-medium">{employee.employee_no}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                    <User className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium">{employee.name}</div>
                                    <div className="text-sm text-gray-500">@{employee.username}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getDepartmentBadge(employee.department)}
                              </TableCell>
                              <TableCell>{employee.position || '未分配'}</TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center text-sm">
                                    <Mail className="mr-1 h-3 w-3 text-gray-400" />
                                    {employee.email || '未填写'}
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <Phone className="mr-1 h-3 w-3 text-gray-400" />
                                    {employee.phone || '未填写'}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {employee.hire_date 
                                  ? new Date(employee.hire_date).toLocaleDateString('zh-CN')
                                  : '未填写'}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(employee.status)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="outline" size="sm">编辑</Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* 分页控件 */}
                  {pagination.total > 0 && (
                    <div className="flex items-center justify-between px-2 py-4">
                      <div className="text-sm text-gray-600">
                        显示第 {(pagination.page - 1) * pagination.pageSize + 1} 到 {' '}
                        {Math.min(pagination.page * pagination.pageSize, pagination.total)} 条，
                        共 {pagination.total} 条记录
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                          disabled={pagination.page === 1}
                        >
                          上一页
                        </Button>
                        
                        <div className="text-sm">
                          第 {pagination.page} 页，共 {pagination.totalPages} 页
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                          disabled={pagination.page === pagination.totalPages}
                        >
                          下一页
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}