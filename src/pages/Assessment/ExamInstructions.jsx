import React, { useState, useEffect } from 'react';
import { Play, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

// 导入 shadcn UI 组件
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const ExamInstructions = () => {
  const { planId } = useParams(); // Assuming planId is passed to get instructions
  const navigate = useNavigate();
  const [planDetails, setPlanDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (planId) {
      fetchPlanDetails(planId);
    } else {
      toast.error('未指定考核计划ID');
      setLoading(false);
    }
  }, [planId]);

  const fetchPlanDetails = async (id) => {
    try {
      const response = await axios.get(`/api/assessment-plans/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setPlanDetails(response.data.data);
    } catch (error) {
      toast.error('获取考核计划详情失败');
      console.error('Failed to fetch plan details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async () => {
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg">加载中...</span>
      </div>
    );
  }

  if (!planDetails) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>考试须知</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">无法加载考试须知，请检查考核计划ID。</p>
            <Button onClick={() => navigate('/assessment/my-exams')} className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回我的考试
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">考试须知 - {planDetails.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">请仔细阅读以下考试规则和注意事项：</p>

          <h3 className="text-lg font-semibold mt-6 mb-3">考试规则</h3>
          <div className="border rounded-lg divide-y">
            <div className="p-4">
              <div className="font-medium">考试时长</div>
              <div className="text-gray-600">{planDetails.exam_duration || planDetails.duration} 分钟</div>
            </div>
            <div className="p-4">
              <div className="font-medium">题目数量</div>
              <div className="text-gray-600">{planDetails.question_count} 题</div>
            </div>
            <div className="p-4">
              <div className="font-medium">总分</div>
              <div className="text-gray-600">{planDetails.total_score} 分</div>
            </div>
            <div className="p-4">
              <div className="font-medium">及格分</div>
              <div className="text-gray-600">{planDetails.pass_score} 分</div>
            </div>
            <div className="p-4">
              <div className="font-medium">尝试次数</div>
              <div className="text-gray-600">最多可尝试 {planDetails.max_attempts} 次</div>
            </div>
          </div>

          <h3 className="text-lg font-semibold mt-8 mb-3">注意事项</h3>
          <div className="border rounded-lg divide-y">
            <div className="p-4">考试期间请勿切换页面或离开考试界面，否则可能被记录为作弊行为。</div>
            <div className="p-4">您的答案将自动保存，但仍建议您在完成答题后手动提交。</div>
            <div className="p-4">考试时间结束后，系统将自动提交您的试卷。</div>
            <div className="p-4">请确保网络连接稳定，避免因网络问题导致考试中断。</div>
          </div>

          <div className="flex flex-wrap gap-3 mt-8">
            <Button onClick={handleStartExam} disabled={loading} className="flex items-center">
              <Play className="mr-2 h-4 w-4" />
              确认并开始考试
            </Button>
            <Button variant="outline" onClick={() => navigate('/assessment/my-exams')} disabled={loading} className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              取消并返回
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamInstructions;
