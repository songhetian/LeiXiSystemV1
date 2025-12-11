import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

// 导入 shadcn UI 组件
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';

// 导入 Lucide React 图标
import { Eye } from 'lucide-react';

// 自定义日期范围选择器组件
const DateRangePicker = ({ value, onChange }) => {
  const [startDate, endDate] = value || [null, null];

  const handleStartDateSelect = (date) => {
    onChange([date, endDate]);
  };

  const handleEndDateSelect = (date) => {
    onChange([startDate, date]);
  };

  return (
    <div className="flex items-center space-x-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
            {startDate ? dayjs(startDate).format('YYYY-MM-DD') : '开始日期'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={handleStartDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <span>-</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
            {endDate ? dayjs(endDate).format('YYYY-MM-DD') : '结束日期'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={handleEndDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

const MyResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: undefined,
    dateRange: [], // [start_time, end_time]
  });
  const [sorter, setSorter] = useState({});

  const fetchMyResults = async (params = {}) => {
    setLoading(true);
    try {
      const response = await axios.get('/api/my-results', {
        params: {
          page: params.pagination?.current || pagination.current,
          pageSize: params.pagination?.pageSize || pagination.pageSize,
          status: filters.status,
          start_time: filters.dateRange[0] ? dayjs(filters.dateRange[0]).format('YYYY-MM-DD') : undefined,
          end_time: filters.dateRange[1] ? dayjs(filters.dateRange[1]).format('YYYY-MM-DD') : undefined,
          sort_field: params.sorter?.field,
          sort_order: params.sorter?.order,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setResults(response.data.data.results);
      setPagination({
        ...pagination,
        current: response.data.data.page,
        pageSize: response.data.data.pageSize,
        total: response.data.data.total,
      });
    } catch (error) {
      toast.error('获取我的考试记录失败');
      console.error('Failed to fetch my results:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyResults();
  }, [pagination.current, pagination.pageSize, filters, sorter]);

  const handleTableChange = (newPagination, _, newSorter) => {
    setPagination(newPagination);
    setSorter({ field: newSorter.field, order: newSorter.order });
  };

  const handleFilterChange = (key, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
    setPagination((prevPagination) => ({ ...prevPagination, current: 1 })); // Reset to first page on filter change
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">进行中</Badge>;
      case 'submitted':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">待评分</Badge>;
      case 'graded':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">已评分</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">已过期</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPassStatusTag = (isPassed) => {
    if (isPassed === null) return '-';
    return isPassed ?
      <Badge variant="secondary" className="bg-green-100 text-green-800">通过</Badge> :
      <Badge variant="secondary" className="bg-red-100 text-red-800">未通过</Badge>;
  };

  // 自定义加载指示器组件
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>我的成绩</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <Select onValueChange={(value) => handleFilterChange('status', value)} value={filters.status}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="筛选状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_progress">进行中</SelectItem>
                <SelectItem value="submitted">待评分</SelectItem>
                <SelectItem value="graded">已评分</SelectItem>
                <SelectItem value="expired">已过期</SelectItem>
              </SelectContent>
            </Select>
            <DateRangePicker
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
            />
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>考试名称</TableHead>
                  <TableHead>考核计划</TableHead>
                  <TableHead>考试时间</TableHead>
                  <TableHead>成绩</TableHead>
                  <TableHead>通过状态</TableHead>
                  <TableHead>用时</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.exam_title}</TableCell>
                      <TableCell>{record.plan_title}</TableCell>
                      <TableCell>
                        {record.submit_time ? dayjs(record.submit_time).format('YYYY-MM-DD HH:mm') : '-'}
                      </TableCell>
                      <TableCell>
                        {record.score !== null ? record.score.toFixed(2) : '-'}
                      </TableCell>
                      <TableCell>
                        {getPassStatusTag(record.is_passed)}
                      </TableCell>
                      <TableCell>
                        {record.time_taken !== null ?
                          `${Math.floor(record.time_taken / 60)}分${record.time_taken % 60}秒` :
                          '-'}
                      </TableCell>
                      <TableCell>
                        {getStatusTag(record.status)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/assessment/results/${record.id}/result`)}
                          className="flex items-center"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          查看详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* 简单的分页信息显示 */}
          <div className="mt-4 text-sm text-gray-500">
            共 {pagination.total} 条记录，当前第 {pagination.current} 页，每页 {pagination.pageSize} 条
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyResults;
