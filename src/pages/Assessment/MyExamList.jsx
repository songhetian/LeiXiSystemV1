import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

// 导入 shadcn UI 组件
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';

// 导入 Lucide React 图标
import { Play, Eye, History } from 'lucide-react';

const MyExamList = () => {
  const navigate = useNavigate();
  const [myExams, setMyExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: undefined,
  });

  useEffect(() => {
    fetchMyExams();
  }, [filters]);

  const fetchMyExams = async () => {
    console.log('Fetching my exams from:', `${axios.defaults.baseURL || 'http://localhost:3001'}/api/my-exams`);
    setLoading(true);
    try {
      console.log('发送请求...');
      const response = await axios.get('/api/my-exams', {
        params: {
          status: filters.status,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('✅ 收到响应:', response);
      console.log('响应数据:', response.data);
      console.log('考试列表:', response.data.data.exams);
      setMyExams(response.data.data.exams);
      console.log('✅ 考试列表已设置');
    } catch (error) {
      console.error('❌ 请求失败:', error);
      console.error('错误响应:', error.response);
      console.error('错误消息:', error.message);
      toast.error('获取我的考试列表失败');
      console.error('Failed to fetch my exams:', error);
    } finally {
      setLoading(false);
      console.log('✅ Loading 状态已设置为 false');
    }
  };

  const handleFilterChange = (value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      status: value,
    }));
  };

  const getDifficultyTag = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">简单</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">中等</Badge>;
      case 'hard':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">困难</Badge>;
      default:
        return <Badge variant="secondary">{difficulty}</Badge>;
    }
  };

  const getExamStatus = (exam) => {
    const now = dayjs();
    const startTime = dayjs(exam.start_time);
    const endTime = dayjs(exam.end_time);

    if (exam.status === 'in_progress') {
      return { tag: <Badge variant="secondary" className="bg-blue-100 text-blue-800">进行中</Badge>, action: 'continue' };
    }
    if (exam.status === 'graded' || exam.status === 'submitted') {
      return { tag: <Badge variant="secondary" className="bg-green-100 text-green-800">已完成</Badge>, action: 'view_result' };
    }
    if (now.isBefore(startTime)) {
      return { tag: <Badge variant="secondary">未开始</Badge>, action: 'not_started' };
    }
    if (now.isAfter(endTime)) {
      return { tag: <Badge variant="secondary" className="bg-red-100 text-red-800">已结束</Badge>, action: 'view_result' };
    }
    return { tag: <Badge variant="secondary" className="bg-green-100 text-green-800">可开始</Badge>, action: 'start' };
  };

  const handleStartExam = async (planId) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/assessment-results/start', { plan_id: planId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('考试已开始');
      navigate(`/assessment/take-exam/${response.data.data.result_id}`);
    } catch (error) {
      toast.error(`开始考试失败: ${error.response?.data?.message || error.message}`);
      console.error('Failed to start exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResult = (resultId) => {
    navigate(`/assessment/results/${resultId}/result`);
  };

  const handleViewHistory = () => {
    navigate('/assessment/my-results'); // Navigate to my results page
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>我的考试</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleViewHistory} className="flex items-center">
              <History className="mr-2 h-4 w-4" />
              我的成绩
            </Button>
            <Select onValueChange={handleFilterChange} value={filters.status} defaultValue={filters.status}>
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
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myExams.length === 0 ? (
                <p className="text-center col-span-full py-5">暂无考试</p>
              ) : (
                myExams.map((exam) => {
                  const { tag, action } = getExamStatus(exam);
                  return (
                    <Card key={exam.plan_id} className="flex flex-col">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-semibold">{exam.plan_title}</CardTitle>
                        {tag}
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-sm"><strong>试卷:</strong> {exam.exam_title}</p>
                        <p className="text-sm"><strong>难度:</strong> {getDifficultyTag(exam.difficulty)}</p>
                        <p className="text-sm"><strong>时长:</strong> {exam.duration} 分钟</p>
                        <p className="text-sm"><strong>题目数:</strong> {exam.question_count}</p>
                        <p className="text-sm"><strong>及格分:</strong> {exam.pass_score}</p>
                        <p className="text-sm"><strong>时间范围:</strong> {dayjs(exam.start_time).format('YYYY-MM-DD HH:mm')} - {dayjs(exam.end_time).format('YYYY-MM-DD HH:mm')}</p>
                        <p className="text-sm"><strong>剩余尝试次数:</strong> {exam.max_attempts - exam.attempt_count}</p>
                        {exam.best_score !== null && <p className="text-sm"><strong>最佳成绩:</strong> {exam.best_score}</p>}
                        <div className="flex space-x-2 mt-4">
                          {action === 'start' && (
                            <Button onClick={() => handleStartExam(exam.plan_id)} className="flex items-center">
                              <Play className="mr-2 h-4 w-4" />
                              开始考试
                            </Button>
                          )}
                          {action === 'continue' && (
                            <Button onClick={() => navigate(`/assessment/take-exam/${exam.result_id}`)} className="flex items-center">
                              <Play className="mr-2 h-4 w-4" />
                              继续考试
                            </Button>
                          )}
                          {action === 'view_result' && (
                            <Button variant="outline" onClick={() => handleViewResult(exam.result_id)} className="flex items-center">
                              <Eye className="mr-2 h-4 w-4" />
                              查看成绩
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyExamList;
