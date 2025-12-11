import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getApiUrl } from '../../utils/apiConfig';
import { useDebounce } from '../../hooks/useDebounce';
import { useFormAutoSave } from '../../hooks/useFormAutoSave';

// 导入 shadcn UI 组件
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { CheckCircle, XCircle, Save } from 'lucide-react';

const ExamForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // For editing existing exam
  const [loading, setLoading] = useState(false);
  const [formChanged, setFormChanged] = useState(false);
  const [examCategories, setExamCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'medium',
    duration: 60,
    total_score: 100,
    pass_score: 60,
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchExamCategories();
    if (id) {
      fetchExamDetails(id);
    }
  }, [id]);

  const fetchExamCategories = async () => {
    try {
      const response = await axios.get(getApiUrl('/api/exam-categories'), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const list = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
        ? response.data
        : []
      setExamCategories(list);
    } catch (error) {
      message.error('获取考试分类失败');
      console.error('Failed to fetch exam categories:', error);
    }
  };

  const fetchExamDetails = async (examId) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/exams/${examId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const exam = response.data.data;
      setFormData({
        ...exam,
        category: exam.category_id, // Assuming category_id is used for Select
      });
    } catch (error) {
      toast.error('获取试卷详情失败');
      console.error('Failed to fetch exam details:', error);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (status = 'draft') => {
    setLoading(true);
    try {
      // Validate form
      const errors = {};
      if (!formData.title) {
        errors.title = '请输入试卷标题';
      }
      if (!formData.category) {
        errors.category = '请选择试卷分类';
      }
      if (!formData.difficulty) {
        errors.difficulty = '请选择试卷难度';
      }
      if (!formData.duration || formData.duration <= 0) {
        errors.duration = '时长必须大于0';
      }
      if (!formData.total_score || formData.total_score <= 0) {
        errors.total_score = '总分必须大于0';
      }
      if (!formData.pass_score || formData.pass_score < 0 || formData.pass_score > formData.total_score) {
        errors.pass_score = '及格分必须在0到总分之间';
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        toast.error('请检查表单填写');
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        category_id: formData.category, // Map back to category_id for API
        status: status,
      };

      if (id) {
        await axios.put(`/api/exams/${id}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        toast.success('试卷更新成功');
      } else {
        await axios.post('/api/exams', payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        toast.success('试卷创建成功');
      }
      navigate('/assessment/exams'); // Navigate back to exam list
    } catch (error) {
      toast.error(`操作失败: ${error.response?.data?.message || error.message}`);
      console.error('Failed to save exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    onFinish('draft');
  };

  const handlePublish = () => {
    onFinish('published');
  };

  // Auto-save draft function
  const autoSaveDraft = useCallback(async () => {
    if (!id) return; // Only auto-save for existing exams

    try {
      const payload = {
        ...formData,
        category_id: formData.category,
        status: 'draft',
      };

      await axios.put(`/api/exams/${id}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
      throw error;
    }
  }, [id, formData]);

  // Use auto-save hook with 3 second debounce
  const { triggerSave, isSaving, saveStatus } = useFormAutoSave(autoSaveDraft, 3000, id && formChanged);

  // Handle form value changes
  const handleFormChange = useCallback(() => {
    setFormChanged(true);
    if (id) {
      triggerSave();
    }
  }, [id, triggerSave]);

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{id ? '编辑试卷' : '创建试卷'}</CardTitle>
            {id && (
              <div className="flex items-center gap-2">
                {isSaving && (
                  <div className="flex items-center gap-1 text-sm text-blue-600">
                    <Save className="h-4 w-4 animate-spin" />
                    保存中...
                  </div>
                )}
                {saveStatus === 'success' && (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    已保存
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <XCircle className="h-4 w-4" />
                    保存失败
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 基本信息表单 */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">试卷标题</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请输入试卷标题"
                  className={formErrors.title ? "border-red-500" : ""}
                />
                {formErrors.title && <p className="text-sm text-red-500 mt-1">{formErrors.title}</p>}
              </div>

              <div>
                <Label htmlFor="description">试卷描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入试卷描述"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="category">分类</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className={formErrors.category ? "border-red-500" : ""}>
                    <SelectValue placeholder="请选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {examCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category && <p className="text-sm text-red-500 mt-1">{formErrors.category}</p>}
              </div>

              <div>
                <Label htmlFor="difficulty">难度</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger className={formErrors.difficulty ? "border-red-500" : ""}>
                    <SelectValue placeholder="请选择难度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">简单</SelectItem>
                    <SelectItem value="medium">中等</SelectItem>
                    <SelectItem value="hard">困难</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.difficulty && <p className="text-sm text-red-500 mt-1">{formErrors.difficulty}</p>}
              </div>
            </div>

            {/* 考试配置 */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="duration">考试时长 (分钟)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  className={formErrors.duration ? "border-red-500" : ""}
                />
                {formErrors.duration && <p className="text-sm text-red-500 mt-1">{formErrors.duration}</p>}
              </div>

              <div>
                <Label htmlFor="total_score">总分</Label>
                <Input
                  id="total_score"
                  type="number"
                  min="1"
                  value={formData.total_score}
                  onChange={(e) => setFormData({ ...formData, total_score: parseInt(e.target.value) || 0 })}
                  className={formErrors.total_score ? "border-red-500" : ""}
                />
                {formErrors.total_score && <p className="text-sm text-red-500 mt-1">{formErrors.total_score}</p>}
              </div>

              <div>
                <Label htmlFor="pass_score">及格分</Label>
                <Input
                  id="pass_score"
                  type="number"
                  min="0"
                  value={formData.pass_score}
                  onChange={(e) => setFormData({ ...formData, pass_score: parseInt(e.target.value) || 0 })}
                  className={formErrors.pass_score ? "border-red-500" : ""}
                />
                {formErrors.pass_score && <p className="text-sm text-red-500 mt-1">{formErrors.pass_score}</p>}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleSaveDraft} disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                    保存中...
                  </div>
                ) : (
                  "保存草稿"
                )}
              </Button>
              <Button onClick={handlePublish} disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                    发布中...
                  </div>
                ) : (
                  "发布试卷"
                )}
              </Button>
              <Button variant="outline" onClick={() => navigate('/assessment/exams')} disabled={loading}>
                取消
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamForm;
