import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, RotateCcw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title as ChartTitle } from 'chart.js';
import { toast } from 'react-toastify';
import './ExamResult.css';

// 导入 shadcn UI 组件
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ChartTitle);

const ExamResult = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [examResult, setExamResult] = useState(null);
  const [detailedQuestions, setDetailedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExamResult();
  }, [resultId]);

  const fetchExamResult = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/assessment-results/${resultId}/result`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const payload = response.data.data;
      setExamResult(payload.result_summary);
      setDetailedQuestions(payload.detailed_questions || []);
    } catch (error) {
      toast.error(`获取考试结果失败: ${error.response?.data?.message || error.message}`);
      console.error('Failed to fetch exam result:', error);
      navigate('/assessment/my-exams'); // Go back if failed to load result
    } finally {
      setLoading(false);
    }
  };

  const getCorrectRateByQuestionType = () => {
    const dataSource = detailedQuestions || [];
    if (dataSource.length === 0) return { labels: [], datasets: [] };

    const typeStats = {}; // { type: { correct: 0, total: 0 } }

    dataSource.forEach(detail => {
      const type = detail.type;
      if (!typeStats[type]) {
        typeStats[type] = { correct: 0, total: 0 };
      }
      typeStats[type].total++;
      if (detail.is_correct === 1) {
        typeStats[type].correct++;
      }
    });

    const labels = Object.keys(typeStats).map(type => {
      switch (type) {
        case 'single_choice': return '单选题';
        case 'multiple_choice': return '多选题';
        case 'true_false': return '判断题';
        case 'fill_blank': return '填空题';
        case 'essay': return '简答题';
        default: return type;
      }
    });
    const data = Object.values(typeStats).map(stats => (stats.correct / stats.total) * 100);

    return {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const getScoreDistribution = () => {
    // 占位：后端单个结果暂不含分布，这里使用详细题目得分构造简单分布或留空
    return { labels: [], datasets: [] };

    return {
      labels: labels,
      datasets: [
        {
          label: '分数分布',
          data: data,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="exam-result-page">
        <div className="loading-container flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-lg">加载中...</span>
        </div>
      </div>
    );
  }

  if (!examResult) {
    return (
      <div className="exam-result-page">
        <div className="empty-state">
          <Card>
            <CardHeader>
              <CardTitle>考试结果</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">无法加载考试结果。</p>
              <Button onClick={() => navigate('/assessment/my-exams')} className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回我的考试
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { exam_title, user_score, exam_total_score, is_passed, duration, plan_id, correct_rate, time_taken, rank, attempt_count, max_attempts } = examResult;
  const score = user_score;
  const total_score = exam_total_score;
  const canRetake = true;

  return (
    <div className="exam-result-page p-6">
      <Card className="exam-result-card">
        <CardHeader>
          <CardTitle className="text-xl">考试结果 - {exam_title}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 成绩卡片 */}
          <Card className="score-summary-card mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <div className="text-4xl font-bold mb-2">
                  {score !== null ? score.toFixed(2) : '待评分'} / {total_score}
                </div>
                <Badge variant={is_passed ? "default" : "destructive"} className="mb-4">
                  {is_passed ? '通过' : '未通过'}
                </Badge>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                  <div className="border rounded-lg p-3">
                    <div className="text-sm text-gray-500">正确率</div>
                    <div className="font-semibold">
                      {correct_rate !== null ? `${(correct_rate * 100).toFixed(2)}%` : '-'}
                    </div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-sm text-gray-500">用时</div>
                    <div className="font-semibold">
                      {time_taken !== null ? `${Math.floor(time_taken / 60)}分${time_taken % 60}秒` : '-'}
                    </div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-sm text-gray-500">排名</div>
                    <div className="font-semibold">
                      {rank !== null ? rank : '-'}
                    </div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-sm text-gray-500">尝试次数</div>
                    <div className="font-semibold">
                      {attempt_count} / {max_attempts}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 答题统计 */}
          <div className="charts-container grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="chart-card">
              <CardHeader>
                <CardTitle>各题型正确率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="chart-container h-64">
                  {getCorrectRateByQuestionType().labels.length > 0 ? (
                    <Pie data={getCorrectRateByQuestionType()} options={{ responsive: true, maintainAspectRatio: false }} />
                  ) : (
                    <p className="text-center text-gray-500">暂无题型正确率数据。</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="chart-card">
              <CardHeader>
                <CardTitle>分数分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="chart-container h-64">
                  {getScoreDistribution().labels.length > 0 ? (
                    <Bar data={getScoreDistribution()} options={{ responsive: true, maintainAspectRatio: false }} />
                  ) : (
                    <p className="text-center text-gray-500">暂无分数分布数据。</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 操作按钮 */}
          <div className="button-group flex flex-wrap gap-3">
            <Button className="result-action-btn" onClick={() => navigate(`/assessment/results/${resultId}/answers`)} variant="default">
              <Eye className="mr-2 h-4 w-4" />
              查看答题详情
            </Button>
            <Button className="result-action-btn" onClick={() => navigate('/assessment/my-exams')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回我的考试
            </Button>
            {canRetake && (
              <Button className="result-action-btn" onClick={() => navigate(`/assessment/instructions/${plan_id}`)} variant="secondary">
                <RotateCcw className="mr-2 h-4 w-4" />
                再次考试
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamResult;
