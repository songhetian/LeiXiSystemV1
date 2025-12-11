import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useFormAutoSave } from '../../hooks/useFormAutoSave';
import { toast } from 'react-toastify';
import {
  Plus,
  ArrowLeft,
  Save,
  CheckCircle,
  XCircle,
  MinusCircle,
  ImagePlus
} from 'lucide-react';

// 导入 shadcn UI 组件
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Checkbox } from '../../components/ui/checkbox';
import { Badge } from '../../components/ui/badge';

const QuestionEditor = () => {
  const navigate = useNavigate();
  const { examId, questionId } = useParams(); // examId for new question, questionId for editing
  const [loading, setLoading] = useState(false);
  const [questionType, setQuestionType] = useState('single_choice');
  const [formChanged, setFormChanged] = useState(false);
  const [formData, setFormData] = useState({
    type: 'single_choice',
    content: '',
    score: 5,
    options: [{ value: '' }, { value: '' }],
    correct_answer: undefined,
    fill_blanks: [{ keyword: '' }],
    explanation: ''
  });

  useEffect(() => {
    if (questionId) {
      fetchQuestionDetails(questionId);
    } else {
      // Set default values for new question
      setFormData({
        type: 'single_choice',
        content: '',
        score: 5,
        options: [{ value: '' }, { value: '' }],
        correct_answer: undefined,
        fill_blanks: [{ keyword: '' }],
        explanation: ''
      });
    }
  }, [questionId]);

  const fetchQuestionDetails = async (id) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/questions/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const question = response.data.data;
      setQuestionType(question.type);

      // Parse JSON fields
      if (question.options && typeof question.options === 'string') {
        question.options = JSON.parse(question.options);
      }
      if (question.correct_answer && typeof question.correct_answer === 'string') {
        question.correct_answer = JSON.parse(question.correct_answer);
      }
      if (question.fill_blanks && typeof question.fill_blanks === 'string') {
        question.fill_blanks = JSON.parse(question.fill_blanks);
      }

      setFormData(question);
    } catch (error) {
      toast.error('获取题目详情失败');
      console.error('Failed to fetch question details:', error);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        exam_id: examId,
      };

      // Stringify JSON fields for API
      if (payload.options) {
        payload.options = JSON.stringify(payload.options);
      }
      if (payload.correct_answer) {
        payload.correct_answer = JSON.stringify(payload.correct_answer);
      }
      if (payload.fill_blanks) {
        payload.fill_blanks = JSON.stringify(payload.fill_blanks);
      }

      if (questionId) {
        await axios.put(`/api/questions/${questionId}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        toast.success('题目更新成功');
      } else {
        await axios.post(`/api/exams/${examId}/questions`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        toast.success('题目创建成功');
      }
      navigate(`/assessment/exams/${examId}`); // Navigate back to exam details
    } catch (error) {
      toast.error(`操作失败: ${error.response?.data?.message || error.message}`);
      console.error('Failed to save question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionTypeChange = (value) => {
    setQuestionType(value);
    // Reset relevant fields when type changes
    const newData = { ...formData };
    newData.type = value;
    newData.options = undefined;
    newData.correct_answer = undefined;
    newData.fill_blanks = undefined;

    if (value === 'single_choice' || value === 'multiple_choice') {
      newData.options = [{ value: '' }, { value: '' }];
    }
    if (value === 'fill_blank') {
      newData.fill_blanks = [{ keyword: '' }];
    }

    setFormData(newData);
  };

  // Auto-save draft function
  const autoSaveDraft = useCallback(async (values) => {
    if (!questionId) return;

    try {
      const payload = { ...values, exam_id: examId };
      if (payload.options) payload.options = JSON.stringify(payload.options);
      if (payload.correct_answer) payload.correct_answer = JSON.stringify(payload.correct_answer);
      if (payload.fill_blanks) payload.fill_blanks = JSON.stringify(payload.fill_blanks);

      await axios.put(`/api/questions/${questionId}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
      throw error;
    }
  }, [questionId, examId]);

  const { triggerSave, isSaving, saveStatus } = useFormAutoSave(autoSaveDraft, 3000, questionId && formChanged);

  const handleFormChange = useCallback((field, value) => {
    setFormChanged(true);
    setFormData(prev => ({ ...prev, [field]: value }));

    if (questionId) {
      triggerSave({ ...formData, [field]: value });
    }
  }, [questionId, formData, triggerSave]);

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index].value = value;
    setFormData(prev => ({ ...prev, options: newOptions }));

    if (questionId) {
      triggerSave({ ...formData, options: newOptions });
    }
  };

  const addOption = () => {
    const newOptions = [...formData.options, { value: '' }];
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const removeOption = (index) => {
    if (formData.options.length <= 2) return;
    const newOptions = [...formData.options];
    newOptions.splice(index, 1);
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const handleFillBlankChange = (index, value) => {
    const newFillBlanks = [...formData.fill_blanks];
    newFillBlanks[index].keyword = value;
    setFormData(prev => ({ ...prev, fill_blanks: newFillBlanks }));

    if (questionId) {
      triggerSave({ ...formData, fill_blanks: newFillBlanks });
    }
  };

  const addFillBlank = () => {
    const newFillBlanks = [...formData.fill_blanks, { keyword: '' }];
    setFormData(prev => ({ ...prev, fill_blanks: newFillBlanks }));
  };

  const removeFillBlank = (index) => {
    if (formData.fill_blanks.length <= 1) return;
    const newFillBlanks = [...formData.fill_blanks];
    newFillBlanks.splice(index, 1);
    setFormData(prev => ({ ...prev, fill_blanks: newFillBlanks }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFinish(formData);
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {questionId ? '编辑题目' : '创建题目'}
            </CardTitle>
            {questionId && (
              <div className="flex items-center space-x-2">
                {isSaving && (
                  <Badge variant="secondary" className="flex items-center">
                    <Save className="h-3 w-3 mr-1 animate-spin" />
                    保存中...
                  </Badge>
                )}
                {saveStatus === 'success' && (
                  <Badge variant="default" className="flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    已保存
                  </Badge>
                )}
                {saveStatus === 'error' && (
                  <Badge variant="destructive" className="flex items-center">
                    <XCircle className="h-3 w-3 mr-1" />
                    保存失败
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="type">题型</Label>
                <Select
                  value={formData.type}
                  onValueChange={handleQuestionTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择题型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_choice">单选题</SelectItem>
                    <SelectItem value="multiple_choice">多选题</SelectItem>
                    <SelectItem value="true_false">判断题</SelectItem>
                    <SelectItem value="fill_blank">填空题</SelectItem>
                    <SelectItem value="essay">简答题</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">题目内容</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleFormChange('content', e.target.value)}
                  rows={4}
                  placeholder="请输入题目内容"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="score">分值</Label>
                <Input
                  id="score"
                  type="number"
                  min="1"
                  value={formData.score}
                  onChange={(e) => handleFormChange('score', parseInt(e.target.value) || 0)}
                />
              </div>

              {/* Options for Single/Multiple Choice */}
              {(questionType === 'single_choice' || questionType === 'multiple_choice') && (
                <div className="space-y-4">
                  <div>
                    <Label>选项</Label>
                    {formData.options?.map((option, index) => (
                      <div key={index} className="flex items-center mt-2">
                        <Input
                          value={option.value}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`选项 ${index + 1}`}
                          className="mr-2"
                        />
                        {formData.options.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeOption(index)}
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOption}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    添加选项
                  </Button>
                </div>
              )}

              {/* Correct Answer for Single Choice */}
              {questionType === 'single_choice' && (
                <div className="space-y-2">
                  <Label>正确答案</Label>
                  <RadioGroup
                    value={formData.correct_answer}
                    onValueChange={(value) => handleFormChange('correct_answer', value)}
                  >
                    {formData.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={option.value}
                          id={`option-${index}`}
                        />
                        <Label htmlFor={`option-${index}`}>
                          {`选项 ${index + 1}: ${option.value}`}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Correct Answer for Multiple Choice */}
              {questionType === 'multiple_choice' && (
                <div className="space-y-2">
                  <Label>正确答案</Label>
                  <div className="space-y-2">
                    {formData.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.correct_answer?.includes(option.value)}
                          onCheckedChange={(checked) => {
                            let newCorrectAnswers = formData.correct_answer || [];
                            if (checked) {
                              newCorrectAnswers = [...newCorrectAnswers, option.value];
                            } else {
                              newCorrectAnswers = newCorrectAnswers.filter(val => val !== option.value);
                            }
                            handleFormChange('correct_answer', newCorrectAnswers);
                          }}
                          id={`multi-option-${index}`}
                        />
                        <Label htmlFor={`multi-option-${index}`}>
                          {`选项 ${index + 1}: ${option.value}`}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Correct Answer for True/False */}
              {questionType === 'true_false' && (
                <div className="space-y-2">
                  <Label>正确答案</Label>
                  <RadioGroup
                    value={formData.correct_answer?.toString()}
                    onValueChange={(value) => handleFormChange('correct_answer', value === 'true')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="true" />
                      <Label htmlFor="true">正确</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="false" />
                      <Label htmlFor="false">错误</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Keywords for Fill-in-the-blank */}
              {questionType === 'fill_blank' && (
                <div className="space-y-4">
                  <div>
                    <Label>填空项</Label>
                    {formData.fill_blanks?.map((blank, index) => (
                      <div key={index} className="flex items-center mt-2">
                        <Input
                          value={blank.keyword}
                          onChange={(e) => handleFillBlankChange(index, e.target.value)}
                          placeholder={`填空项 ${index + 1} 关键词`}
                          className="mr-2"
                        />
                        {formData.fill_blanks.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeFillBlank(index)}
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addFillBlank}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    添加填空项
                  </Button>
                </div>
              )}

              {/* Reference Answer for Essay */}
              {questionType === 'essay' && (
                <div className="space-y-2">
                  <Label htmlFor="correct_answer">参考答案</Label>
                  <Textarea
                    id="correct_answer"
                    value={formData.correct_answer || ''}
                    onChange={(e) => handleFormChange('correct_answer', e.target.value)}
                    rows={6}
                    placeholder="请输入参考答案"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="explanation">解析</Label>
                <Textarea
                  id="explanation"
                  value={formData.explanation}
                  onChange={(e) => handleFormChange('explanation', e.target.value)}
                  rows={4}
                  placeholder="请输入题目解析"
                />
              </div>

              {/* Image Upload (Placeholder) */}
              <div className="space-y-2">
                <Label>图片上传</Label>
                <Button variant="outline" disabled>
                  <ImagePlus className="h-4 w-4 mr-2" />
                  上传图片 (待实现)
                </Button>
              </div>

              <div className="flex space-x-2">
                <Button type="submit" disabled={loading}>
                  {loading && <Save className="h-4 w-4 mr-2 animate-spin" />}
                  保存题目
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/assessment/exams/${examId}`)}
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  取消
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionEditor;
