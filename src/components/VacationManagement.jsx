import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../utils/apiConfig';
import VacationQuotaWizard from './VacationQuotaWizard';
import VacationTypeManagement from './VacationTypeManagement';
import BalanceChangeHistory from './BalanceChangeHistory';
import VacationQuotaEditModal from './VacationQuotaEditModal';
import BatchVacationQuotaEditModal from './BatchVacationQuotaEditModal';
import VacationSearchBar from './VacationSearchBar';
import VacationDetailModal from './VacationDetailModal';
import VacationCard from './VacationCard';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

// 导入 shadcn UI 组件
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow, TableCell } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Checkbox } from './ui/checkbox';
import { Calendar, RefreshCw, Settings, ArrowLeftRight, Download, Eye, LayoutList, Grid3x3, BarChartHorizontal } from 'lucide-react';

const { Option } = Select;

const VacationManagement = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [year, setYear] = useState(dayjs().year());
  const [stats, setStats] = useState({
    totalVacationDays: 0,
    totalOvertimeHours: 0,
    avgUsage: 0
  });

  // Modals state
  const [wizardVisible, setWizardVisible] = useState(false);
  const [typesModalVisible, setTypesModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [quotaModalVisible, setQuotaModalVisible] = useState(false);
  const [batchQuotaModalVisible, setBatchQuotaModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [convertModalVisible, setConvertModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Search filters
  const [searchFilters, setSearchFilters] = useState({
    keyword: '',
    startDate: null,
    endDate: null
  });

  // Conversion state
  const [convertHours, setConvertHours] = useState(8);

  // Batch selection
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // View mode: 'table' or 'card'
  const [viewMode, setViewMode] = useState('table');

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBaseUrl()}/vacation/balance/all?year=${year}&limit=1000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        calculateStats(result.data);
      } else {
        toast.error(result.message || '加载数据失败');
      }
    } catch (error) {
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (items) => {
    const totalVacation = items.reduce((sum, item) => sum + parseFloat(item.total_days || 0), 0);
    const totalOvertime = items.reduce((sum, item) => sum + parseFloat(item.overtime_hours_total || 0), 0);
    const totalUsed = items.reduce((sum, item) =>
      sum + parseFloat(item.annual_leave_used || 0) + parseFloat(item.overtime_leave_used || 0), 0);

    setStats({
      totalVacationDays: totalVacation.toFixed(1),
      totalOvertimeHours: totalOvertime.toFixed(1),
      avgUsage: items.length ? (totalUsed / items.length).toFixed(1) : 0
    });
  };

  // Expiring Soon Logic
  const [expiringQuotas, setExpiringQuotas] = useState([]);

  useEffect(() => {
    fetchExpiringQuotas();
  }, []);

  const fetchExpiringQuotas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBaseUrl()}/vacation/expiring-soon?days=30`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setExpiringQuotas(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch expiring quotas', error);
    }
  };

  const onConvertSubmit = async () => {
    if (!selectedEmployee) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBaseUrl()}/vacation/convert-overtime`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employee_id: selectedEmployee.employee_id,
          hours: selectedEmployee.overtime_hours_total - (selectedEmployee.overtime_hours_converted || 0),
          year: year
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        setConvertModalVisible(false);
        loadData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      message.error('转换失败');
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = `${getApiBaseUrl()}/vacation/export/excel?year=${year}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `vacation_balances_${year}.xlsx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        toast.success('导出成功');
      } else {
        message.error('导出失败');
      }
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  const handleBatchExport = async () => {
    if (selectedRowKeys.length === 0) {
      toast.warning('请先选择要导出的记录');
      return;
    }

    try {
      // Filter selected data
      const selectedData = data.filter(item => selectedRowKeys.includes(item.id));

      // Create CSV content
      const headers = ['工号', '姓名', '部门', '年假余额', '加班假余额', '病假余额', '加班时长'];
      const rows = selectedData.map(item => [
        item.employee_no,
        item.real_name,
        item.department_name,
        ((item.annual_leave_total || 0) - (item.annual_leave_used || 0)).toFixed(1),
        ((item.overtime_leave_total || 0) - (item.overtime_leave_used || 0)).toFixed(1),
        ((item.sick_leave_total || 0) - (item.sick_leave_used || 0)).toFixed(1),
        ((item.overtime_hours_total || 0) - (item.overtime_hours_converted || 0)).toFixed(1)
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Add BOM for Excel UTF-8 support
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vacation_selected_${selectedRowKeys.length}_records.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`已导出 ${selectedRowKeys.length} 条记录`);
    } catch (error) {
      console.error('批量导出失败:', error);
      toast.error('批量导出失败');
    }
  };

  const columns = [
    {
      title: '工号',
      dataIndex: 'employee_no',
      key: 'employee_no',
      width: 100,
    },
    {
      title: '姓名',
      dataIndex: 'real_name',
      key: 'real_name',
      width: 100,
    },
    {
      title: '部门',
      dataIndex: 'department_name',
      key: 'department_name',
      width: 120,
    },
    {
      title: '假期余额 (天)',
      key: 'vacation_balance',
      width: 150,
      sorter: (a, b) => a.total_days - b.total_days,
      render: (_, record) => {
        const annualRemaining = (record.annual_leave_total || 0) - (record.annual_leave_used || 0);
        const overtimeRemaining = (record.overtime_leave_total || 0) - (record.overtime_leave_used || 0);
        const totalRemaining = annualRemaining + overtimeRemaining;
        return (
          <Tooltip title={`年假: ${annualRemaining.toFixed(1)} | 加班假: ${overtimeRemaining.toFixed(1)}`}>
            <span className="font-bold text-blue-600">{totalRemaining.toFixed(1)}</span>
          </Tooltip>
        );
      }
    },
    {
      title: '加班时长 (小时)',
      key: 'overtime_hours',
      width: 150,
      render: (_, record) => {
        const converted = record.overtime_hours_converted || 0;
        const remaining = (record.overtime_hours_total || 0) - converted;
        return (
          <Tooltip title={`总计: ${record.overtime_hours_total || 0}h | 已转: ${converted}h`}>
            <span className={remaining > 0 ? 'text-green-600 font-semibold' : 'text-gray-500'}>
              {remaining.toFixed(1)}
            </span>
          </Tooltip>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setSelectedEmployee(record);
              setDetailModalVisible(true);
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            详情
          </Button>
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setSelectedEmployee(record);
              // 设置转换小时数为员工的剩余加班时长
              const remainingHours = record.overtime_hours_total - (record.overtime_hours_converted || 0);
              setConvertHours(remainingHours);
              setConvertModalVisible(true);
            }}
            disabled={!record.overtime_hours_total || (record.overtime_hours_total - (record.overtime_hours_converted || 0)) < 8}
          >
            <ArrowLeftRight className="h-4 w-4 mr-1" />
            转换
          </Button>
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setSelectedEmployee(record);
              setQuotaModalVisible(true);
            }}
          >
            <Settings className="h-4 w-4 mr-1" />
            额度
          </Button>
        </div>
      )
    }
  ];

  // Filter data based on search criteria
  const filteredData = data.filter(item => {
    const matchesKeyword = !searchFilters.keyword ||
      item.real_name?.toLowerCase().includes(searchFilters.keyword.toLowerCase()) ||
      item.employee_no?.toLowerCase().includes(searchFilters.keyword.toLowerCase()) ||
      item.department_name?.toLowerCase().includes(searchFilters.keyword.toLowerCase());

    return matchesKeyword;
  });

  // Chart Data Preparation
  const departmentStats = filteredData.reduce((acc, item) => {
    const dept = item.department_name || 'Unknown';
    if (!acc[dept]) {
      acc[dept] = { name: dept, total: 0, used: 0 };
    }
    acc[dept].total += parseFloat(item.total_days || 0);
    acc[dept].used += (parseFloat(item.annual_leave_used || 0) + parseFloat(item.overtime_leave_used || 0));
    return acc;
  }, {});

  const barChartData = Object.values(departmentStats);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">假期管理</h1>
        <div className="flex flex-wrap gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-md shadow-sm" role="group">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-r-none border-r-0"
            >
              <LayoutList className="h-4 w-4 mr-1" />
              表格
            </Button>
            <Button
              variant={viewMode === 'card' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('card')}
              className="rounded-l-none"
            >
              <Grid3x3 className="h-4 w-4 mr-1" />
              卡片
            </Button>
          </div>

          {/* Batch Actions */}
          {selectedRowKeys.length > 0 && (
            <div className="flex rounded-md shadow-sm" role="group">
              <Button
                variant="default"
                size="sm"
                onClick={handleBatchExport}
                className="rounded-r-none border-r-0"
              >
                <Download className="h-4 w-4 mr-1" />
                导出选中 ({selectedRowKeys.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBatchQuotaModalVisible(true)}
                className="rounded-l-none"
              >
                <Settings className="h-4 w-4 mr-1" />
                批量额度
              </Button>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={() => setWizardVisible(true)}>
            <Settings className="h-4 w-4 mr-1" />
            假期配置向导
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTypesModalVisible(true)}>
            <Settings className="h-4 w-4 mr-1" />
            假期类型
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            导出全部
          </Button>
        </div>
      </div>

      {/* Expiring Soon Alert */}
      {expiringQuotas.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start">
          <div className="text-orange-500 mr-3 mt-1">
            <span className="text-xl">⚠️</span>
          </div>
          <div>
            <h3 className="text-orange-800 font-medium mb-1">即将过期的假期额度 ({expiringQuotas.length})</h3>
            <div className="text-sm text-orange-700 max-h-24 overflow-y-auto">
              {expiringQuotas.map((item, index) => (
                <div key={index} className="mb-1">
                  {item.real_name} ({item.department_name}): {item.annual_leave_remaining}天年假, {item.overtime_leave_remaining}天加班假将于 {dayjs(item.expiry_date).format('YYYY-MM-DD')} 过期
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-gray-500">总假期余额 (天)</div>
            <div className="text-2xl font-bold text-green-600">{stats.totalVacationDays}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-gray-500">总加班时长 (小时)</div>
            <div className="text-2xl font-bold text-red-600">{stats.totalOvertimeHours}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-gray-500">平均已用假期 (天/人)</div>
            <div className="text-2xl font-bold text-blue-600">{stats.avgUsage}</div>
          </CardContent>
        </Card>
      </div>

      {/* Year Selector and Search */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">年份:</span>
          <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4].map(i => (
                <SelectItem key={i} value={(dayjs().year() - 2 + i).toString()}>
                  {dayjs().year() - 2 + i}年
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-1" />
          刷新
        </Button>
      </div>

      {/* Advanced Search Bar */}
      <VacationSearchBar
        onSearch={setSearchFilters}
        loading={loading}
      />

      {/* Main Data Content */}
      {viewMode === 'table' ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>员工假期明细</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedRowKeys.length > 0 && selectedRowKeys.length === filteredData.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedRowKeys(filteredData.map(item => item.id));
                          } else {
                            setSelectedRowKeys([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>工号</TableHead>
                    <TableHead>姓名</TableHead>
                    <TableHead>部门</TableHead>
                    <TableHead>假期余额 (天)</TableHead>
                    <TableHead>加班时长 (小时)</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRowKeys.includes(item.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRowKeys([...selectedRowKeys, item.id]);
                            } else {
                              setSelectedRowKeys(selectedRowKeys.filter(key => key !== item.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>{item.employee_no}</TableCell>
                      <TableCell>{item.real_name}</TableCell>
                      <TableCell>{item.department_name}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="font-bold text-blue-600">
                                {(parseFloat(item.annual_leave_total || 0) - parseFloat(item.annual_leave_used || 0) +
                                  parseFloat(item.overtime_leave_total || 0) - parseFloat(item.overtime_leave_used || 0)).toFixed(1)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              年假: {(parseFloat(item.annual_leave_total || 0) - parseFloat(item.annual_leave_used || 0)).toFixed(1)} |
                              加班假: {(parseFloat(item.overtime_leave_total || 0) - parseFloat(item.overtime_leave_used || 0)).toFixed(1)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <span className={(parseFloat(item.overtime_hours_total || 0) - (item.overtime_hours_converted || 0)) > 0 ? 'text-green-600 font-semibold' : 'text-gray-500'}>
                                {(parseFloat(item.overtime_hours_total || 0) - (item.overtime_hours_converted || 0)).toFixed(1)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              总计: {item.overtime_hours_total || 0}h | 已转: {item.overtime_hours_converted || 0}h
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                              setSelectedEmployee(item);
                              setDetailModalVisible(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            详情
                          </Button>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                              setSelectedEmployee(item);
                              // 设置转换小时数为员工的剩余加班时长
                              const remainingHours = item.overtime_hours_total - (item.overtime_hours_converted || 0);
                              setConvertHours(remainingHours);
                              setConvertModalVisible(true);
                            }}
                            disabled={!item.overtime_hours_total || (item.overtime_hours_total - (item.overtime_hours_converted || 0)) < 8}
                          >
                            <ArrowLeftRight className="h-4 w-4 mr-1" />
                            转换
                          </Button>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                              setSelectedEmployee(item);
                              setQuotaModalVisible(true);
                            }}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            额度
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredData.map(item => (
            <VacationCard
              key={item.id}
              employee={item}
              onViewDetail={(record) => {
                setSelectedEmployee(record);
                setDetailModalVisible(true);
              }}
              onConvert={(record) => {
                setSelectedEmployee(record);
                setConvertModalVisible(true);
              }}
              onEditQuota={(record) => {
                setSelectedEmployee(record);
                setQuotaModalVisible(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-4">
        <div className="col-span-1">
          <Card title="各部门假期使用情况" className="shadow-sm">
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="total" name="总额度" fill="#8884d8" />
                  <Bar dataKey="used" name="已使用" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <VacationQuotaWizard
        visible={wizardVisible}
        onClose={() => setWizardVisible(false)}
        onSuccess={loadData}
      />

      <VacationTypeManagement
        visible={typesModalVisible}
        onClose={() => setTypesModalVisible(false)}
      />

      <BalanceChangeHistory
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        employeeId={selectedEmployee?.employee_id}
        year={year}
      />

      <VacationQuotaEditModal
        visible={quotaModalVisible}
        onClose={() => setQuotaModalVisible(false)}
        employee={selectedEmployee ? { id: selectedEmployee.employee_id, real_name: selectedEmployee.real_name } : null}
        year={year}
        onSuccess={loadData}
      />

      <BatchVacationQuotaEditModal
        visible={batchQuotaModalVisible}
        onClose={() => setBatchQuotaModalVisible(false)}
        employees={data.filter(item => selectedRowKeys.includes(item.id))}
        year={year}
        onSuccess={() => {
          loadData();
          setSelectedRowKeys([]); // Clear selection after success
        }}
      />

      <VacationDetailModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        employee={selectedEmployee}
        year={year}
      />

      <Dialog open={convertModalVisible} onOpenChange={setConvertModalVisible}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>加班转假期</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>员工：{selectedEmployee?.real_name}</p>
            <p>当前剩余加班：{selectedEmployee ? (selectedEmployee.overtime_hours_total - (selectedEmployee.overtime_hours_converted || 0)).toFixed(1) : 0} 小时</p>
            <div className="mt-4">
              <Label className="mr-2">转换小时数:</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="8"
                  max={selectedEmployee ? (selectedEmployee.overtime_hours_total - (selectedEmployee.overtime_hours_converted || 0)) : 8}
                  step="8"
                  value={selectedEmployee ? (selectedEmployee.overtime_hours_total - (selectedEmployee.overtime_hours_converted || 0)) : 8}
                  readOnly={true}
                  disabled={true}
                  className="w-24"
                />
                <span>小时</span>
              </div>
              <p className="text-gray-500 text-sm mt-2">注：每8小时转换为1天加班假</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onConvertSubmit}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VacationManagement;
