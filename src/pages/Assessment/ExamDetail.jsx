import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../../components/ui/accordion'
import { Edit, Plus, Upload, Shuffle, Eye, ArrowLeft } from 'lucide-react'

const ExamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExamDetails();
    fetchExamQuestions();
  }, [id]);

  const fetchExamDetails = async () => {
    try {
      const response = await axios.get(`/api/exams/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      setExam(response.data.data)
    } catch (error) {
      toast.error('获取试卷详情失败')
      console.error('Failed to fetch exam details:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExamQuestions = async () => {
    try {
      const response = await axios.get(`/api/exams/${id}/questions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      setQuestions(response.data.data.questions)
    } catch (error) {
      toast.error('获取试卷题目失败')
      console.error('Failed to fetch exam questions:', error)
    }
  }

  const getStatusTag = (status) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">草稿</Badge>
      case 'published':
        return <Badge className="bg-green-600 text-white">已发布</Badge>
      case 'archived':
        return <Badge className="bg-yellow-500 text-white">已归档</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getDifficultyTag = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return <Badge className="bg-green-600 text-white">简单</Badge>
      case 'medium':
        return <Badge className="bg-blue-600 text-white">中等</Badge>
      case 'hard':
        return <Badge className="bg-red-600 text-white">困难</Badge>
      default:
        return <Badge>{difficulty}</Badge>
    }
  }

  const getQuestionTypeLabel = (type) => {
    switch (type) {
      case 'single_choice':
        return '单选题';
      case 'multiple_choice':
        return '多选题';
      case 'true_false':
        return '判断题';
      case 'fill_blank':
        return '填空题';
      case 'essay':
        return '简答题';
      default:
        return type;
    }
  }

  const handleEditExam = () => {
    navigate(`/assessment/exams/${id}/edit`);
  };

  const handleAddQuestion = () => {
    navigate(`/assessment/exams/${id}/questions/new`);
  }

  const handleBatchImportQuestions = () => {
    toast.info('批量导入题目功能待实现')
  }

  const handleReorderQuestions = () => {
    toast.info('题目排序功能待实现')
  }

  const handlePreviewExam = () => {
    toast.info('试卷预览功能待实现')
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>试卷详情</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 w-2/3 bg-muted animate-pulse" />
              <div className="h-4 w-1/2 bg-muted animate-pulse" />
              <div className="h-4 w-3/4 bg-muted animate-pulse" />
              <div className="h-4 w-1/3 bg-muted animate-pulse" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>考试配置信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 w-2/5 bg-muted animate-pulse" />
              <div className="h-4 w-1/3 bg-muted animate-pulse" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>题目列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted animate-pulse" />
              <div className="h-4 w-5/6 bg-muted animate-pulse" />
              <div className="h-4 w-4/6 bg-muted animate-pulse" />
              <div className="h-4 w-3/6 bg-muted animate-pulse" />
              <div className="h-4 w-2/6 bg-muted animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>试卷详情</CardTitle>
          </CardHeader>
          <CardContent>
            <p>试卷不存在或加载失败。</p>
            <Button onClick={() => navigate('/assessment/exams')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> 返回试卷列表
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button variant="outline" onClick={() => navigate('/assessment/exams')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回试卷列表
        </Button>
        <Button onClick={handleEditExam}>
          <Edit className="mr-2 h-4 w-4" /> 编辑试卷
        </Button>
        <Button variant="secondary" onClick={handlePreviewExam}>
          <Eye className="mr-2 h-4 w-4" /> 预览试卷
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>试卷基本信息</CardTitle>
          <CardDescription />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">标题</div>
              <div className="text-sm">{exam.title}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">分类</div>
              <div className="text-sm">{exam.category}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">难度</div>
              <div className="text-sm">{getDifficultyTag(exam.difficulty)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">状态</div>
              <div className="text-sm">{getStatusTag(exam.status)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">创建人</div>
              <div className="text-sm">{exam.created_by_name || '未知'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">创建时间</div>
              <div className="text-sm">{new Date(exam.created_at).toLocaleString()}</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-muted-foreground">描述</div>
            <div className="text-sm">{exam.description || '无'}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>考试配置信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">考试时长</div>
              <div className="text-sm">{exam.duration} 分钟</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">总分</div>
              <div className="text-sm">{exam.total_score}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">及格分</div>
              <div className="text-sm">{exam.pass_score}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">题目数量</div>
              <div className="text-sm">{exam.question_count}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>题目列表</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleAddQuestion}>
                <Plus className="mr-2 h-4 w-4" /> 添加题目
              </Button>
              <Button variant="outline" onClick={handleBatchImportQuestions}>
                <Upload className="mr-2 h-4 w-4" /> 批量导入
              </Button>
              <Button variant="outline" onClick={handleReorderQuestions}>
                <Shuffle className="mr-2 h-4 w-4" /> 题目排序
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <p>暂无题目，请添加。</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {questions.map((question, index) => (
                <AccordionItem key={question.id} value={String(question.id)}>
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <span className="mr-2">{index + 1}.</span>
                      <Badge variant="secondary" className="mr-2">
                        {getQuestionTypeLabel(question.type)}
                      </Badge>
                      <span className="truncate">{question.content}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <p>
                        <span className="font-semibold">分值:</span> {question.score}
                      </p>
                      {question.options && (
                        <div>
                          <span className="font-semibold">选项:</span>
                          <ul className="list-disc pl-5 mt-1">
                            {JSON.parse(question.options).map((option, idx) => (
                              <li key={idx}>{option.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {question.correct_answer && (
                        <p>
                          <span className="font-semibold">正确答案:</span> {question.correct_answer}
                        </p>
                      )}
                      {question.explanation && (
                        <p>
                          <span className="font-semibold">解析:</span> {question.explanation}
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>统计信息</CardTitle>
        </CardHeader>
        <CardContent>
          <p>使用次数: 待获取</p>
          <p>平均分: 待获取</p>
          <p>通过率: 待获取</p>
        </CardContent>
      </Card>
    </div>
  )
};

export default ExamDetail;
