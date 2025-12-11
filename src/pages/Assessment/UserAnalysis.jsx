import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Line, Radar, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, RadialLinearScale, Filler, BarElement, Title as ChartTitle, Tooltip, Legend } from 'chart.js';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

// 导入 shadcn UI 组件
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, RadialLinearScale, Filler, BarElement, ChartTitle, Tooltip, Legend);

const UserAnalysis = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userAnalysis, setUserAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserAnalysis();
  }, [userId]);

  const fetchUserAnalysis = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/statistics/user/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setUserAnalysis(response.data.data);
    } catch (error) {
      toast.error(`获取用户分析失败: ${error.response?.data?.message || error.message}`);
      console.error('Failed to fetch user analysis:', error);
      navigate('/users'); // Navigate back to user list or dashboard
    } finally {
      setLoading(false);
    }
  };

  const getScoreTrendData = () => {
    if (!userAnalysis || !userAnalysis.exam_history) return { labels: [], datasets: [] };

    const sortedHistory = [...userAnalysis.exam_history].sort((a, b) => dayjs(a.submit_time).valueOf() - dayjs(b.submit_time).valueOf());

    return {
      labels: sortedHistory.map(record => dayjs(record.submit_time).format('YYYY-MM-DD HH:mm')),
      datasets: [
        {
          label: '我的成绩',
          data: sortedHistory.map(record => record.score),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1,
        },
        {
          label: '平均分',
          data: sortedHistory.map(record => record.average_score_for_exam), // Assuming backend provides this
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          tension: 0.1,
        },
      ],
    };
  };

  const getStrengthsWeaknessesData = () => {
    if (!userAnalysis || !userAnalysis.correctness_by_type) return { labels: [], datasets: [] };

    const labels = Object.keys(userAnalysis.correctness_by_type).map(type => {
      switch (type) {
        case 'single_choice': return '单选';
        case 'multiple_choice': return '多选';
        case 'true_false': return '判断';
        case 'fill_blank': return '填空';
        case 'essay': return '简答';
        default: return type;
      }
    });
    const data = Object.values(userAnalysis.correctness_by_type).map(stats => (stats.correct / stats.total) * 100);

    return {
      labels: labels,
      datasets: [
        {
          label: '正确率 (%)',
          data: data,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const getComparisonWithAverageData = () => {
    if (!userAnalysis || !userAnalysis.exam_history) return { labels: [], datasets: [] };

    const labels = userAnalysis.exam_history.map(record => record.exam_title);
    const userScores = userAnalysis.exam_history.map(record => record.score);
    const averageScores = userAnalysis.exam_history.map(record => record.average_score_for_exam);

    return {
      labels: labels,
      datasets: [
        {
          label: '我的成绩',
          data: userScores,
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
        {
          label: '平均分',
          data: averageScores,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg">加载中...</span>
      </div>
    );
  }

  if (!userAnalysis) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>用户成绩分析</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">无法加载用户成绩分析数据。</p>
            <Button onClick={() => navigate('/users')} className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回用户列表
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user_info, overall_stats, exam_history } = userAnalysis;

  return (
    <div className="p-6">
      <div className="mb-4">
        <Button variant="outline" onClick={() => navigate('/users')} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回用户列表
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>用户成绩分析 - {user_info.real_name || user_info.username}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 个人成绩概览卡片 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>个人成绩概览</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-gray-500">参加考试次数</div>
                  <div className="text-2xl font-bold">{overall_stats.total_exams}</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-gray-500">平均分</div>
                  <div className="text-2xl font-bold">{overall_stats.average_score?.toFixed(2)}</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-gray-500">通过率</div>
                  <div className="text-2xl font-bold">{`${(overall_stats.pass_rate * 100).toFixed(2)}%`}</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-gray-500">最佳成绩</div>
                  <div className="text-2xl font-bold">{overall_stats.best_score?.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 成绩趋势图 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>成绩趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: '300px' }}>
                {getScoreTrendData().labels.length > 0 ? (
                  <Line data={getScoreTrendData()} options={{ responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: '成绩趋势' } } }} />
                ) : (
                  <p>暂无成绩趋势数据。</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 强弱项分析（雷达图） */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>强弱项分析 (按题型)</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: '300px' }} className="flex justify-center items-center">
                {getStrengthsWeaknessesData().labels.length > 0 ? (
                  <Radar data={getStrengthsWeaknessesData()} options={{ responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: '题型正确率' } }, scales: { r: { beginAtZero: true, min: 0, max: 100 } } }} />
                ) : (
                  <p>暂无强弱项分析数据。</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 与平均分对比（柱状图） */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>与平均分对比</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: '300px' }}>
                {getComparisonWithAverageData().labels.length > 0 ? (
                  <Bar data={getComparisonWithAverageData()} options={{ responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: '我的成绩与平均分对比' } } }} />
                ) : (
                  <p>暂无对比数据。</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 考试历史记录（时间轴） */}
          <Card>
            <CardHeader>
              <CardTitle>考试历史记录</CardTitle>
            </CardHeader>
            <CardContent>
              {exam_history.length > 0 ? (
                <div className="space-y-6">
                  {exam_history.map((record, index) => (
                    <div key={index} className="flex">
                      <div className="flex flex-col items-center mr-4">
                        <div className={`w-3 h-3 rounded-full ${record.is_passed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        {index !== exam_history.length - 1 && <div className="h-full w-0.5 bg-gray-200"></div>}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="font-semibold">{dayjs(record.submit_time).format('YYYY-MM-DD HH:mm')} - {record.exam_title}</div>
                        <div className="mt-2">
                          成绩: <span className="font-semibold">{record.score?.toFixed(2)}</span> / {record.total_score}
                          <Badge variant={record.is_passed ? "default" : "destructive"} className="ml-2">
                            {record.is_passed ? '通过' : '未通过'}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => navigate(`/assessment/results/${record.result_id}/result`)}
                        >
                          查看详情
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>暂无考试历史记录。</p>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserAnalysis;
