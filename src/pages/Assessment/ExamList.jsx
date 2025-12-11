import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../../styles/assessment-business.css';

// 导入 shadcn UI 组件
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Eye, Edit, Trash2, Plus, Archive, ArrowUpDown } from 'lucide-react';

const ExamList = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    category: undefined,
    difficulty: undefined,
    status: undefined,
    title: '',
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

  const fetchExams = async (params = {}) => {
    setLoading(true);
    try {
      const response = await axios.get('/api/exams', {
        params: {
          page: params.pagination?.current || pagination.current,
          pageSize: params.pagination?.pageSize || pagination.pageSize,
          ...filters,
          ...params.filters,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`, // Assuming token is stored in localStorage
        },
      });
      setExams(response.data.data.exams);
      setPagination({
        ...pagination,
        current: response.data.data.page,
        pageSize: response.data.data.pageSize,
        total: response.data.data.total,
      });
    } catch (error) {
      toast.error('获取试卷列表失败');
      console.error('Failed to fetch exams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [pagination.current, pagination.pageSize, filters]);

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
    setPagination((prevPagination) => ({ ...prevPagination, current: 1 })); // Reset to first page on filter change
  };

  const handleSearch = (value) => {
    handleFilterChange('title', value);
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">草稿</Badge>;
      case 'published':
        return <Badge className="bg-green-600 text-white">已发布</Badge>;
      case 'archived':
        return <Badge className="bg-yellow-500 text-white">已归档</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDifficultyTag = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return <Badge className="bg-green-600 text-white">简单</Badge>;
      case 'medium':
        return <Badge className="bg-blue-600 text-white">中等</Badge>;
      case 'hard':
        return <Badge className="bg-red-600 text-white">困难</Badge>;
      default:
        return <Badge>{difficulty}</Badge>;
    }
  };

  const renderTableRows = () => {
    return exams.map((exam) => (
      <TableRow key={exam.id}>
        <TableCell>{exam.title}</TableCell>
        <TableCell><Badge variant="outline">{exam.category}</Badge></TableCell>
        <TableCell>{getDifficultyTag(exam.difficulty)}</TableCell>
        <TableCell>{exam.question_count}</TableCell>
        <TableCell>{exam.total_score}</TableCell>
        <TableCell>{exam.pass_score}</TableCell>
        <TableCell>{getStatusTag(exam.status)}</TableCell>
        <TableCell>{new Date(exam.created_at).toLocaleString()}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleView(exam.id)}>
              <Eye className="h-4 w-4 mr-1" />
              查看
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleEdit(exam.id)}>
              <Edit className="h-4 w-4 mr-1" />
              编辑
            </Button>
            {exam.status === 'draft' && (
              <Button size="sm" onClick={() => handlePublish(exam.id)}>
                发布
              </Button>
            )}
            {exam.status === 'published' && (
              <Button variant="outline" size="sm" onClick={() => handleArchive(exam.id)}>
                <Archive className="h-4 w-4 mr-1" />
                归档
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => {
              if (window.confirm("确定删除此试卷吗？")) {
                handleDelete(exam.id);
              }
            }}>
              <Trash2 className="h-4 w-4 mr-1" />
              删除
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  const handleAdd = () => {
    toast.info('添加试卷功能待实现');
    // navigate('/exams/new');
  };

  const handleView = (id) => {
    toast.info(`查看试卷 ${id} 功能待实现`);
    // navigate(`/exams/${id}`);
  };

  const handleEdit = (id) => {
    toast.info(`编辑试卷 ${id} 功能待实现`);
    // navigate(`/exams/${id}/edit`);
  };

  const handlePublish = async (id) => {
    try {
      await axios.put(`/api/exams/${id}/status`, { status: 'published' }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('试卷发布成功');
      fetchExams();
    } catch (error) {
      toast.error('试卷发布失败');
      console.error('Failed to publish exam:', error);
    }
  };

  const handleArchive = async (id) => {
    try {
      await axios.put(`/api/exams/${id}/status`, { status: 'archived' }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('试卷归档成功');
      fetchExams();
    } catch (error) {
      toast.error('试卷归档失败');
      console.error('Failed to archive exam:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/exams/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('试卷删除成功');
      fetchExams();
    } catch (error) {
      toast.error('试卷删除失败');
      console.error('Failed to delete exam:', error);
    }
  };

  return (
    <div className="assessment-business p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>试卷列表</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                添加试卷
              </Button>
              <Button variant="outline" onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                切换视图 ({viewMode === 'table' ? '卡片' : '表格'})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <Input
              placeholder="搜索试卷标题"
              value={filters.title}
              onChange={(e) => handleFilterChange('title', e.target.value)}
              className="max-w-xs"
            />
            <div className="flex flex-wrap gap-2">
              <Select value={filters.category || ''} onValueChange={(value) => handleFilterChange('category', value || undefined)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="筛选分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部分类</SelectItem>
                  <SelectItem value="前端">前端</SelectItem>
                  <SelectItem value="后端">后端</SelectItem>
                  <SelectItem value="测试">测试</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.difficulty || ''} onValueChange={(value) => handleFilterChange('difficulty', value || undefined)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="筛选难度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部难度</SelectItem>
                  <SelectItem value="easy">简单</SelectItem>
                  <SelectItem value="medium">中等</SelectItem>
                  <SelectItem value="hard">困难</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.status || ''} onValueChange={(value) => handleFilterChange('status', value || undefined)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="筛选状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部状态</SelectItem>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="published">已发布</SelectItem>
                  <SelectItem value="archived">已归档</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {viewMode === 'table' ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>标题</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead>难度</TableHead>
                    <TableHead>题目数</TableHead>
                    <TableHead>总分</TableHead>
                    <TableHead>及格分</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 mr-2" />
                          加载中...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : exams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        暂无试卷数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    renderTableRows()
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((exam) => (
                <Card key={exam.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{exam.title}</CardTitle>
                      {getStatusTag(exam.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p><strong>分类:</strong> {exam.category}</p>
                      <p><strong>难度:</strong> {getDifficultyTag(exam.difficulty)}</p>
                      <p><strong>题目数:</strong> {exam.question_count}</p>
                      <p><strong>总分:</strong> {exam.total_score}</p>
                      <p><strong>及格分:</strong> {exam.pass_score}</p>
                      <p><strong>创建时间:</strong> {new Date(exam.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => handleView(exam.id)}>
                        <Eye className="h-4 w-4 mr-1" />
                        查看
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(exam.id)}>
                        <Edit className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                      {exam.status === 'draft' && (
                        <Button size="sm" onClick={() => handlePublish(exam.id)}>
                          发布
                        </Button>
                      )}
                      {exam.status === 'published' && (
                        <Button variant="outline" size="sm" onClick={() => handleArchive(exam.id)}>
                          <Archive className="h-4 w-4 mr-1" />
                          归档
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => {
                        if (window.confirm("确定删除此试卷吗？")) {
                          handleDelete(exam.id);
                        }
                      }}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        删除
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {viewMode === 'table' && !loading && exams.length > 0 && (
            <div className="flex items-center justify-between mt-4">
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
                <span className="self-center text-sm">
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

export default ExamList;
