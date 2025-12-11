import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getApiBaseUrl } from '../utils/apiConfig';
import { formatDateTime } from '../utils/date';
import dayjs from 'dayjs';
import OvertimeConversionModal from './OvertimeConversionModal';
import { Calendar, RotateCw, ArrowUpDown } from 'lucide-react';

// 导入 shadcn UI 组件
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow, TableCell } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

const VacationMonthlyView = ({ employeeId, year: initialYear }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [year, setYear] = useState(initialYear || dayjs().year());
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [conversionModalVisible, setConversionModalVisible] = useState(false);
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    if (employeeId) {
      loadMonthlyData();
    }
    fetchHolidays();
  }, [employeeId, year, month]);

  const fetchHolidays = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBaseUrl()}/vacation/holidays?year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        // Filter for current month
        const currentMonthHolidays = result.data.filter(h => dayjs(h.date).month() + 1 === month);
        setHolidays(currentMonthHolidays);
      }
    } catch (error) {
      console.error('Failed to fetch holidays', error);
    }
  };

  const loadMonthlyData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${getApiBaseUrl()}/vacation/usage-details?employee_id=${employeeId}&year=${year}&month=${month}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        toast.error(result.message || '加载月度数据失败');
      }
    } catch (error) {
      console.error('加载月度数据失败:', error);
      toast.error('加载月度数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getChangeTypeTag = (type) => {
    const typeMap = {
      'addition': { variant: 'default', text: '增加' },
      'deduction': { variant: 'destructive', text: '扣减' },
      'conversion': { variant: 'secondary', text: '转换' },
      'adjustment': { variant: 'outline', text: '调整' }
    };
    const config = typeMap[type] || { variant: 'default', text: type };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getLeaveTypeTag = (type) => {
    const typeMap = {
      'annual_leave': { variant: 'default', text: '年假' },
      'sick_leave': { variant: 'secondary', text: '病假' },
      'overtime_leave': { variant: 'default', text: '加班假' },
      'personal_leave': { variant: 'outline', text: '事假' }
    };
    const config = typeMap[type] || { variant: 'default', text: type };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  // 自定义渲染表格行
  const renderTableRows = (data) => {
    return data.map((item) => (
      <TableRow key={item.id}>
        <TableCell className="w-44">{formatDateTime(item.created_at)}</TableCell>
        <TableCell className="w-24">{getChangeTypeTag(item.change_type)}</TableCell>
        <TableCell className="w-30">
          <span className={item.amount > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
            {item.amount > 0 ? '+' : ''}{item.amount} 天
          </span>
        </TableCell>
        <TableCell className="w-30">{item.balance_after != null ? `${item.balance_after} 天` : '-'}</TableCell>
        <TableCell className="truncate">{item.reason}</TableCell>
        <TableCell className="w-24">{item.operator_name}</TableCell>
      </TableRow>
    ));
  };

  // Calculate monthly summary
  const summary = data.reduce((acc, item) => {
    if (item.change_type === 'deduction') {
      acc.totalUsed += Math.abs(parseFloat(item.amount || 0));
    } else if (item.change_type === 'addition') {
      acc.totalAdded += parseFloat(item.amount || 0);
    }
    return acc;
  }, { totalUsed: 0, totalAdded: 0 });

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <span>月度使用明细</span>
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setConversionModalVisible(true)}
            className="flex items-center gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            加班转假期
          </Button>
          <input
            type="month"
            value={`${year}-${String(month).padStart(2, '0')}`}
            onChange={(e) => {
              if (e.target.value) {
                const [y, m] = e.target.value.split('-');
                setYear(parseInt(y));
                setMonth(parseInt(m));
              }
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <Button
            variant="outline"
            onClick={loadMonthlyData}
            className="flex items-center gap-2"
          >
            <RotateCw className="h-4 w-4" />
            刷新
          </Button>
        </div>
      </CardHeader>
      {/* Summary Row */}
      <div className="mb-4 space-y-4">
        {/* Special Dates Alert */}
        {holidays.length > 0 && (
          <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg flex flex-wrap gap-4 items-center">
            <span className="text-sm font-medium text-orange-800">本月特殊日期:</span>
            {holidays.map(h => (
              <div key={h.date} className="flex items-center gap-1 text-sm">
                <span className="text-gray-600">{dayjs(h.date).format('MM-DD')}</span>
                <span className="font-medium text-gray-800">{h.name}</span>
                <Tag color={h.type === 'holiday' ? 'red' : 'blue'}>
                  {h.type === 'holiday' ? '休' : '班'}
                </Tag>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 bg-blue-50 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-600">本月统计：</span>
            <span className="ml-4 text-green-600 font-semibold">新增 {summary.totalAdded.toFixed(1)} 天</span>
            <span className="ml-4 text-red-600 font-semibold">使用 {summary.totalUsed.toFixed(1)} 天</span>
            <span className="ml-4 text-blue-600 font-semibold">
              净变化 {(summary.totalAdded - summary.totalUsed).toFixed(1)} 天
            </span>
          </div>
          <div className="text-sm text-gray-500">
            共 {data.length} 条记录
          </div>
        </div>
      </div>

      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">日期</TableHead>
                <TableHead className="w-24">变更类型</TableHead>
                <TableHead className="w-30">变更数量</TableHead>
                <TableHead className="w-30">变更后余额</TableHead>
                <TableHead>原因</TableHead>
                <TableHead className="w-24">操作人</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderTableRows(data)}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <OvertimeConversionModal
        visible={conversionModalVisible}
        onClose={() => setConversionModalVisible(false)}
        employeeId={employeeId}
        onSuccess={loadMonthlyData}
      />
    </Card>
  );
};

export default VacationMonthlyView;
