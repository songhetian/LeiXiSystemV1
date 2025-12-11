import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { toast } from 'react-toastify';

// 导入 shadcn UI 组件
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Edit, ArrowLeft, Download, Eye } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AssessmentPlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scoreDistributionData, setScoreDistributionData] = useState({});

  useEffect(() => {
    fetchAssessmentPlanDetails();
    fetchParticipants();
    fetchScoreDistribution();
  }, [id]);

  const fetchAssessmentPlanDetails = async () => {
    try {
      const response = await axios.get(`/api/assessment-plans/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setPlan(response.data.data);
    } catch (error) {
      toast.error('获取考核计划详情失败');
      console.error('Failed to fetch assessment plan details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await axios.get(`/api/assessment-plans/${id}/participants`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setParticipants(response.data.data.participants);
    } catch (error) {
      toast.error('获取参与者列表失败');
      console.error('Failed to fetch participants:', error);
    }
  };

  const fetchScoreDistribution = async () => {
    // Assuming a statistics API for score distribution per plan or exam
    // For now, we'll simulate or use a generic exam statistics if available
    try {
      // This would ideally be a specific API for plan score distribution
      // For demonstration, let's use exam statistics if plan.exam_id is available
      // Or, if the backend provides a dedicated endpoint for plan score distribution
      // For now, let's use a placeholder or derive from participants if possible
      // This part needs a dedicated backend API for score distribution by plan
      const response = await axios.get(`/api/statistics/exam/${plan?.exam_id}`, { // Placeholder
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const distribution = response.data.data.score_distribution;
      setScoreDistributionData({
        labels: Object.keys(distribution),
        datasets: [
          {
            label: '分数分布',
            data: Object.values(distribution),
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
          },
        ],
      });
    } catch (error) {
      console.warn('获取分数分布失败，可能后端API未实现或数据不足:', error);
      // Fallback to empty data
      setScoreDistributionData({
        labels: ['0-60', '60-70', '70-80', '80-90', '90-100'],
        datasets: [
          {
            label: '分数分布',
            data: [0, 0, 0, 0, 0],
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
          },
        ],
      });
    }
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

  const handleExport = () => {
    toast.info('导出功能待实现');
    // Implement Excel export logic here
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mr-2"></div>
        <span>加载中...</span>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>考核计划详情</CardTitle>
          </CardHeader>
          <CardContent>
            <p>考核计划不存在或加载失败。</p>
            <div className="mt-4">
              <Button onClick={() => navigate('/assessment/plans')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回计划列表
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalParticipants = plan.participant_stats?.total_participants || 0;
  const completedCount = plan.participant_stats?.completed_count || 0;
  const passRate = plan.pass_rate !== undefined ? (plan.pass_rate * 100).toFixed(2) : 'N/A';
  const averageScore = plan.average_score !== undefined ? plan.average_score.toFixed(2) : 'N/A';

  // Render table rows directly since we're not using Ant Design's Table anymore
  const renderParticipantRows = () => {
    return participants.map((record) => (
      <tr key={record.result_id} className="border-b">
        <td className="p-2">{record.real_name || record.username}</td>
        <td className="p-2">
          {(() => {
            switch (record.status) {
              case 'in_progress': return <Badge variant="default">进行中</Badge>;
              case 'submitted': return <Badge variant="secondary">待评分</Badge>;
              case 'graded': return <Badge variant="secondary">已评分</Badge>;
              case 'expired': return <Badge variant="destructive">已过期</Badge>;
              default: return <Badge>{record.status}</Badge>;
            }
          })()}
        </td>
        <td className="p-2">{record.score !== null ? record.score.toFixed(2) : '-'}</td>
        <td className="p-2">
          {record.is_passed ? <Badge variant="secondary">是</Badge> : <Badge variant="destructive">否</Badge>}
        </td>
        <td className="p-2">{record.attempt_number}</td>
        <td className="p-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/assessment/results/${record.result_id}/result`)}>
              <Eye className="mr-1 h-4 w-4" />
              查看结果
            </Button>
            {record.status === 'submitted' && (
              <Button variant="outline" size="sm" onClick={() => toast.info('人工评分功能待实现')}>
                <Edit className="mr-1 h-4 w-4" />
                人工评分
              </Button>
            )}
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <div className="p-6">
      <div className="flex gap-2 mb-4">
        <Button variant="outline" onClick={() => navigate('/assessment/plans')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回计划列表
        </Button>
        <Button onClick={() => navigate(`/assessment/plans/${id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          编辑计划
        </Button>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          导出数据
        </Button>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>计划基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded p-3">
              <div className="text-sm text-gray-500">标题</div>
              <div className="font-medium">{plan.title}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm text-gray-500">试卷</div>
              <div className="font-medium">{plan.exam_title}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm text-gray-500">状态</div>
              <div className="font-medium">{getStatusBadge(plan.status)}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm text-gray-500">开始时间</div>
              <div className="font-medium">{dayjs(plan.start_time).format('YYYY-MM-DD HH:mm')}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm text-gray-500">结束时间</div>
              <div className="font-medium">{dayjs(plan.end_time).format('YYYY-MM-DD HH:mm')}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm text-gray-500">最大尝试次数</div>
              <div className="font-medium">{plan.max_attempts}</div>
            </div>
            <div className="border rounded p-3 md:col-span-3">
              <div className="text-sm text-gray-500">描述</div>
              <div className="font-medium">{plan.description || '无'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>完成情况统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="border rounded p-3 text-center">
              <div className="text-sm text-gray-500">总人数</div>
              <div className="text-2xl font-bold">{totalParticipants}</div>
            </div>
            <div className="border rounded p-3 text-center">
              <div className="text-sm text-gray-500">已完成</div>
              <div className="text-2xl font-bold">{completedCount}</div>
            </div>
            <div className="border rounded p-3 text-center">
              <div className="text-sm text-gray-500">未完成</div>
              <div className="text-2xl font-bold">{totalParticipants - completedCount}</div>
            </div>
            <div className="border rounded p-3 text-center">
              <div className="text-sm text-gray-500">通过率</div>
              <div className="text-2xl font-bold">{passRate}%</div>
            </div>
            <div className="border rounded p-3 text-center">
              <div className="text-sm text-gray-500">平均分</div>
              <div className="text-2xl font-bold">{averageScore}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>参与者列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">用户</th>
                  <th className="p-2 text-left">完成状态</th>
                  <th className="p-2 text-left">考试成绩</th>
                  <th className="p-2 text-left">通过</th>
                  <th className="p-2 text-left">尝试次数</th>
                  <th className="p-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {renderParticipantRows()}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>成绩分布图表</CardTitle>
        </CardHeader>
        <CardContent>
          {scoreDistributionData.labels ? (
            <Bar data={scoreDistributionData} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: '成绩分布' } } }} />
          ) : (
            <p>暂无成绩分布数据。</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssessmentPlanDetail;
