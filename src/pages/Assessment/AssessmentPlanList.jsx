import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

// 导入 shadcn UI 组件
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit, Trash2, Eye, Send, RotateCcw } from 'lucide-react';



const AssessmentPlanList = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // State for filters
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [dateRange, setDateRange] = useState([null, null]);

  const fetchAssessmentPlans = async (params = {}) => {
    setLoading(true);
    try {
      const response = await axios.get('/api/assessment-plans', {
        params: {
          page: params.pagination?.current || pagination.current,
          pageSize: params.pagination?.pageSize || pagination.pageSize,
          status: statusFilter,
          start_time: dateRange[0] ? dayjs(dateRange[0]).format('YYYY-MM-DD') : undefined,
          end_time: dateRange[1] ? dayjs(dateRange[1]).format('YYYY-MM-DD') : undefined,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setPlans(response.data.data.plans);
      setPagination({
        ...pagination,
        current: response.data.data.page,
        pageSize: response.data.data.pageSize,
        total: response.data.data.total,
      });
    } catch (error) {
      toast.error('获取考核计划列表失败');
      console.error('Failed to fetch assessment plans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessmentPlans();
  }, [pagination.current, pagination.pageSize, statusFilter, dateRange]);

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPagination((prevPagination) => ({ ...prevPagination, current: 1 })); // Reset to first page on filter change
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates || [null, null]);
    setPagination((prevPagination) => ({ ...prevPagination, current: 1 })); // Reset to first page on filter change
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">草稿</Badge>;
      case 'published':
        return <Badge variant="default">已发布</Badge>;
      case 'ongoing':
        return <Badge variant="default">进行中</Badge>;
      case 'completed':
        return <Badge variant="secondary">已完成</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">已取消</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Render table rows directly since we're not using Ant Design's Table anymore
  const renderTableRows = () => {
    return plans.map((record) => (
      <tr key={record.id} className="border-b hover:bg-gray-50">
        <td className="p-3">{record.title}</td>
        <td className="p-3">{record.exam_title}</td>
        <td className="p-3">{getStatusBadge(record.status)}</td>
        <td className="p-3">{dayjs(record.start_time).format('YYYY-MM-DD HH:mm')}</td>
        <td className="p-3">{dayjs(record.end_time).format('YYYY-MM-DD HH:mm')}</td>
        <td className="p-3">{`${record.participant_stats.completed_count || 0} / ${record.participant_stats.total_participants || 0}`}</td>
        <td className="p-3">{(record.pass_rate * 100).toFixed(2)}%</td>
        <td className="p-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleView(record.id)}>
              <Eye className="mr-1 h-4 w-4" />
              查看
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleEdit(record.id)}>
              <Edit className="mr-1 h-4 w-4" />
              编辑
            </Button>
            {record.status === 'draft' && (
              <Button size="sm" onClick={() => handlePublish(record.id)}>
                <Send className="mr-1 h-4 w-4" />
                发布
              </Button>
            )}
            {(record.status === 'published' || record.status === 'ongoing') && (
              <Button variant="outline" size="sm" onClick={() => {
                if (window.confirm("确定取消此考核计划吗？")) {
                  handleCancel(record.id);
                }
              }}>
                <RotateCcw className="mr-1 h-4 w-4" />
                取消
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => {
              if (window.confirm("确定删除此考核计划吗？")) {
                handleDelete(record.id);
              }
            }}>
              <Trash2 className="mr-1 h-4 w-4" />
              删除
            </Button>
          </div>
        </td>
      </tr>
    ));
  };

  const handleAdd = () => {
    navigate('/assessment/plans/new');
  };

  const handleView = (id) => {
    navigate(`/assessment/plans/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/assessment/plans/${id}/edit`);
  };

  const handlePublish = async (id) => {
    try {
      await axios.put(`/api/assessment-plans/${id}/status`, { status: 'published' }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('考核计划发布成功');
      fetchAssessmentPlans();
    } catch (error) {
      toast.error(`发布失败: ${error.response?.data?.message || error.message}`);
      console.error('Failed to publish plan:', error);
    }
  };

  const handleCancel = async (id) => {
    try {
      await axios.put(`/api/assessment-plans/${id}/status`, { status: 'cancelled' }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('考核计划已取消');
      fetchAssessmentPlans();
    } catch (error) {
      toast.error(`取消失败: ${error.response?.data?.message || error.message}`);
      console.error('Failed to cancel plan:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/assessment-plans/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('考核计划删除成功');
      fetchAssessmentPlans();
    } catch (error) {
      toast.error(`删除失败: ${error.response?.data?.message || error.message}`);
      console.error('Failed to delete plan:', error);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>考核计划列表</CardTitle>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            创建考核计划
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <select
              className="border border-gray-300 rounded-md px-3 py-2"
              value={statusFilter || ''}
              onChange={(e) => handleStatusFilterChange(e.target.value || undefined)}
            >
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
              <option value="ongoing">进行中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>

            <div className="flex gap-2 items-center">
              <input
                type="date"
                className="border border-gray-300 rounded-md px-3 py-2"
                value={dateRange[0] ? dayjs(dateRange[0]).format('YYYY-MM-DD') : ''}
                onChange={(e) => handleDateRangeChange([e.target.value ? dayjs(e.target.value) : null, dateRange[1]])}
              />
              <span>至</span>
              <input
                type="date"
                className="border border-gray-300 rounded-md px-3 py-2"
                value={dateRange[1] ? dayjs(dateRange[1]).format('YYYY-MM-DD') : ''}
                onChange={(e) => handleDateRangeChange([dateRange[0], e.target.value ? dayjs(e.target.value) : null])}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">标题</th>
                  <th className="p-3 text-left">试卷</th>
                  <th className="p-3 text-left">状态</th>
                  <th className="p-3 text-left">开始时间</th>
                  <th className="p-3 text-left">结束时间</th>
                  <th className="p-3 text-left">参与情况</th>
                  <th className="p-3 text-left">通过率</th>
                  <th className="p-3 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2"></div>
                        加载中...
                      </div>
                    </td>
                  </tr>
                ) : plans.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-gray-500">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  renderTableRows()
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {plans.length > 0 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-500">
                共 {pagination.total} 条记录
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTableChange({ ...pagination, current: pagination.current - 1 })}
                  disabled={pagination.current === 1}
                >
                  上一页
                </Button>
                <span className="self-center">
                  第 {pagination.current} 页，共 {Math.ceil(pagination.total / pagination.pageSize)} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTableChange({ ...pagination, current: pagination.current + 1 })}
                  disabled={pagination.current === Math.ceil(pagination.total / pagination.pageSize)}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssessmentPlanList;
