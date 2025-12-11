import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { Eye, Edit, Trash2, Download, Search, Calendar } from 'lucide-react';

// 导入 shadcn UI 组件
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow, TableCell } from '../../components/ui/table';

const ResultManagement = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    user_id: undefined,
    exam_id: undefined,
    plan_id: undefined,
    status: undefined,
    dateRange: [],
  });
  const [sorter, setSorter] = useState({});

  const [users, setUsers] = useState([]);
  const [exams, setExams] = useState([]);
  const [plans, setPlans] = useState([]);

  const [gradingModalVisible, setGradingModalVisible] = useState(false);
  const [currentGradingRecord, setCurrentGradingRecord] = useState(null);
  const [gradingForm, setGradingForm] = useState({
    question_id: '',
    user_answer: '',
    score: 0,
    max_score: 0
  });

  useEffect(() => {
    fetchResults();
    fetchFilterOptions();
  }, [pagination.current, pagination.pageSize, filters, sorter]);

  const fetchResults = async (params = {}) => {
    setLoading(true);
    try {
      const response = await axios.get('/api/assessment-results', {
        params: {
          page: params.pagination?.current || pagination.current,
          pageSize: params.pagination?.pageSize || pagination.pageSize,
          user_id: filters.user_id,
          exam_id: filters.exam_id,
          plan_id: filters.plan_id,
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
      toast.error('获取考试记录失败');
      console.error('Failed to fetch assessment results:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [usersRes, examsRes, plansRes] = await Promise.all([
        axios.get('/api/users-with-roles', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        axios.get('/api/exams', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        axios.get('/api/assessment-plans', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
      ]);
      setUsers(usersRes.data);
      setExams(examsRes.data.data.exams);
      setPlans(plansRes.data.data.plans);
    } catch (error) {
      toast.error('获取筛选选项失败');
      console.error('Failed to fetch filter options:', error);
    }
  };

  const handleTableChange = (newPagination, _, newSorter) => {
    setPagination(newPagination);
    setSorter({ field: newSorter.field, order: newSorter.order });
  };

  const handleFilterChange = (key, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
    setPagination((prevPagination) => ({ ...prevPagination, current: 1 }));
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'in_progress':
        return <Badge variant="secondary">进行中</Badge>;
      case 'submitted':
        return <Badge variant="default">待评分</Badge>;
      case 'graded':
        return <Badge variant="default">已评分</Badge>;
      case 'expired':
        return <Badge variant="destructive">已过期</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleManualGrade = async (record) => {
    setCurrentGradingRecord(record);
    // Fetch answer details for the record to find subjective questions
    try {
      const response = await axios.get(`/api/assessment-results/${record.id}/answers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const subjectiveQuestions = response.data.data.questions.filter(q => q.question_type === 'essay');
      if (subjectiveQuestions.length > 0) {
        // For simplicity, let's assume we grade the first subjective question found
        // In a real app, you'd list all subjective questions and allow grading each
        const firstSubjective = subjectiveQuestions[0];
        setGradingForm({
          question_id: firstSubjective.question_id,
          user_answer: firstSubjective.user_answer,
          score: firstSubjective.user_score || 0,
          max_score: firstSubjective.score,
        });
        setGradingModalVisible(true);
      } else {
        toast.info('此考试记录没有需要人工评分的主观题。');
      }
    } catch (error) {
      toast.error('获取题目详情失败，无法进行人工评分');
      console.error('Failed to fetch answers for grading:', error);
    }
  };

  const handleGradingFormChange = (field, value) => {
    setGradingForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGradingSubmit = async () => {
    setLoading(true);
    try {
      await axios.put(`/api/assessment-results/${currentGradingRecord.id}/grade`, {
        question_id: gradingForm.question_id,
        score: gradingForm.score,
        is_correct: gradingForm.score > 0 ? 1 : 0, // Simple logic: if score > 0, it's correct
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('评分成功');
      setGradingModalVisible(false);
      fetchResults(); // Refresh list
    } catch (error) {
      toast.error(`评分失败: ${error.response?.data?.message || error.message}`);
      console.error('Failed to submit grade:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResult = async (id) => {
    if (!window.confirm('确定要删除这条考试记录吗？')) return;

    setLoading(true);
    try {
      await axios.delete(`/api/assessment-results/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('考试记录删除成功');
      fetchResults();
    } catch (error) {
      toast.error(`删除失败: ${error.response?.data?.message || error.message}`);
      console.error('Failed to delete result:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchExport = () => {
    toast.info('批量导出功能待实现');
    // Implement batch export logic here
  };

  const handleBatchGrade = () => {
    toast.info('批量评分功能待实现');
    // Implement batch grading logic here
  };

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <CardHeader>
          <CardTitle>成绩管理 (管理员)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2 justify-between">
            <div className="flex flex-wrap gap-2">
              <Select onValueChange={(value) => handleFilterChange('user_id', value)} value={filters.user_id?.toString() || ""}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="筛选用户" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>{user.real_name || user.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={(value) => handleFilterChange('exam_id', value)} value={filters.exam_id?.toString() || ""}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="筛选试卷" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map(exam => (
                    <SelectItem key={exam.id} value={exam.id.toString()}>{exam.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={(value) => handleFilterChange('plan_id', value)} value={filters.plan_id?.toString() || ""}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="筛选计划" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id.toString()}>{plan.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={(value) => handleFilterChange('status', value)} value={filters.status || ""}>
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
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <Input
                  type="date"
                  onChange={(e) => handleFilterChange('dateRange', [e.target.value])}
                  value={filters.dateRange[0] || ""}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleBatchExport} className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                批量导出
              </Button>
              <Button onClick={handleBatchGrade} variant="outline" className="flex items-center gap-1">
                <Edit className="h-4 w-4" />
                批量评分
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户</TableHead>
                <TableHead>考试名称</TableHead>
                <TableHead>考核计划</TableHead>
                <TableHead>成绩</TableHead>
                <TableHead>通过状态</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>提交时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.real_name || record.username}</TableCell>
                  <TableCell>{record.exam_title}</TableCell>
                  <TableCell>{record.plan_title}</TableCell>
                  <TableCell>{record.score !== null ? record.score.toFixed(2) : '-'}</TableCell>
                  <TableCell>
                    {record.is_passed !== null ? (
                      record.is_passed ?
                      <Badge variant="default">通过</Badge> :
                      <Badge variant="destructive">未通过</Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{getStatusTag(record.status)}</TableCell>
                  <TableCell>{record.submit_time ? dayjs(record.submit_time).format('YYYY-MM-DD HH:mm') : '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => navigate(`/assessment/results/${record.id}/answers`)} size="sm" className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        查看详情
                      </Button>
                      {record.status === 'submitted' && (
                        <Button onClick={() => handleManualGrade(record)} variant="outline" size="sm" className="flex items-center gap-1">
                          <Edit className="h-4 w-4" />
                          人工评分
                        </Button>
                      )}
                      <Button onClick={() => handleDeleteResult(record.id)} variant="destructive" size="sm" className="flex items-center gap-1">
                        <Trash2 className="h-4 w-4" />
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={gradingModalVisible} onOpenChange={setGradingModalVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>人工评分</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-1 block">题目内容</Label>
              <p>{currentGradingRecord?.question_content}</p>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">用户答案</Label>
              <p>{gradingForm.user_answer || '未作答'}</p>
            </div>
            <div>
              <Label htmlFor="score" className="text-sm font-medium mb-1 block">
                评分 (满分: {gradingForm.max_score})
              </Label>
              <Input
                id="score"
                type="number"
                min="0"
                max={gradingForm.max_score}
                value={gradingForm.score || ''}
                onChange={(e) => handleGradingFormChange('score', parseFloat(e.target.value) || 0)}
                className="w-full"
              />
            </div>
            <DialogFooter>
              <Button onClick={() => setGradingModalVisible(false)} variant="outline">
                取消
              </Button>
              <Button onClick={handleGradingSubmit} disabled={loading}>
                {loading ? '保存中...' : '保存评分'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResultManagement;
