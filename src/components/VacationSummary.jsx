import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getApiBaseUrl } from '../utils/apiConfig';
import VacationDetailModal from './VacationDetailModal';
import { Search, RotateCcw, Eye } from 'lucide-react';

// 导入 shadcn UI 组件
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow, TableCell } from './ui/table';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const { Option } = Select;

const VacationSummary = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [vacationTypes, setVacationTypes] = useState([]);
  const [filters, setFilters] = useState(() => {
    return {
      department_id: undefined,
      search: '',
      year: new Date().getFullYear()
    };
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 详情模态框状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    loadDepartments();
    loadVacationTypes();
  }, []);

  useEffect(() => {
    loadData();
  }, [filters, pagination.current, pagination.pageSize]);

  const loadDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBaseUrl()}/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      // 确保 ID 是数字类型
      const depts = result.filter(d => d.status === 'active').map(d => ({
        ...d,
        id: parseInt(d.id)
      }));
      setDepartments(depts);
    } catch (error) {
      console.error('加载部门失败:', error);
    }
  };

  // 调试功能：显示当前状态
  const showDebugInfo = () => {
    const userStr = localStorage.getItem('user');
    alert(`Filters: ${JSON.stringify(filters)}\nUser: ${userStr}\nDepts Count: ${departments.length}`);
  };

  const loadVacationTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBaseUrl()}/vacation-types`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setVacationTypes(result.data);
      }
    } catch (error) {
      console.error('加载假期类型失败:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        year: filters.year,
        page: pagination.current,
        limit: pagination.pageSize,
        ...(filters.department_id && { department_id: filters.department_id }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`${getApiBaseUrl()}/vacation/type-balances/all?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setPagination(prev => ({
          ...prev,
          total: result.pagination.total
        }));
      } else {
        toast.error(result.message || '加载失败');
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  const handleViewDetails = (record) => {
    setSelectedEmployee(record);
    setDetailModalVisible(true);
  };

  // 计算汇总数据
  const getAggregatedData = (balances) => {
    return balances.reduce((acc, curr) => ({
      total: acc.total + parseFloat(curr.total || 0),
      used: acc.used + parseFloat(curr.used || 0),
      remaining: acc.remaining + parseFloat(curr.remaining || 0)
    }), { total: 0, used: 0, remaining: 0 });
  };

  // 静态列定义
  // 自定义渲染表格行
  const renderTableRows = (data) => {
    return data.map((record) => {
      const stats = getAggregatedData(record.vacation_balances);
      const isLow = stats.remaining < 0;

      return (
        <TableRow key={record.employee_id}>
          <TableCell className="font-medium">{record.employee_no}</TableCell>
          <TableCell>{record.employee_name}</TableCell>
          <TableCell>{record.department_name}</TableCell>
          <TableCell className="font-medium">{stats.total.toFixed(1)}</TableCell>
          <TableCell className="text-gray-600">{stats.used.toFixed(1)}</TableCell>
          <TableCell
            style={{
              color: isLow ? '#ff4d4f' : '#52c41a',
              fontWeight: 'bold'
            }}
          >
            {stats.remaining.toFixed(1)}
          </TableCell>
          <TableCell>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetails(record)}
              className="flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              详情
            </Button>
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">假期汇总</h1>
          <p className="text-gray-500">查看全员假期余额统计</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadData}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            刷新
          </Button>
          <Button
            onClick={showDebugInfo}
            variant="outline"
            size="sm"
          >
            Debug
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="year-select" className="text-sm font-medium mb-1 block">年份</Label>
              <Select
                value={filters.year.toString()}
                onValueChange={val => setFilters({ ...filters, year: parseInt(val) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择年份" />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2].map(i => {
                    const y = new Date().getFullYear() - 1 + i;
                    return <SelectItem key={y} value={y.toString()}>{y}年</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="department-select" className="text-sm font-medium mb-1 block">部门</Label>
              <Select
                value={filters.department_id?.toString() || ""}
                onValueChange={val => setFilters({ ...filters, department_id: val ? parseInt(val) : undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择部门" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部部门</SelectItem>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search-input" className="text-sm font-medium mb-1 block">搜索</Label>
              <div className="relative">
                <Input
                  id="search-input"
                  placeholder="搜索姓名/工号"
                  value={filters.search}
                  onChange={e => setFilters({ ...filters, search: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && loadData()}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={loadData} className="w-full">查询</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">工号</TableHead>
                <TableHead className="w-[100px]">姓名</TableHead>
                <TableHead className="w-[120px]">部门</TableHead>
                <TableHead className="w-[120px]">总额度 (天)</TableHead>
                <TableHead className="w-[120px]">已使用 (天)</TableHead>
                <TableHead className="w-[120px]">剩余 (天)</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderTableRows(data)}
            </TableBody>
          </Table>

          {data.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              暂无数据
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEmployee && (
        <VacationDetailModal
          visible={detailModalVisible}
          onClose={() => {
            setDetailModalVisible(false);
            setSelectedEmployee(null);
          }}
          employeeId={selectedEmployee.employee_id}
          employeeName={selectedEmployee.employee_name}
        />
      )}
    </div>
  );
};

export default VacationSummary;
