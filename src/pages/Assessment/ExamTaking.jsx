import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { ArrowLeft, Check, Flag, Clock, Menu, Save, CheckCircle, AlertCircle, Loader, AlertTriangle } from 'lucide-react';

// 导入 shadcn UI 组件
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Checkbox } from '../../components/ui/checkbox';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../components/ui/sheet';
import { Skeleton } from '../../components/ui/skeleton';
import { Badge } from '../../components/ui/badge';

dayjs.extend(duration);



import useExamTimer from '../../hooks/useExamTimer';
import useAutoSave from '../../hooks/useAutoSave';
import useExamLogger from '../../hooks/useExamLogger';
import QuestionNav from '../../components/QuestionNav';
import LazyImageRenderer from '../../components/LazyImageRenderer';

const ExamTaking = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { questionId: answer }
  const [markedQuestions, setMarkedQuestions] = useState({}); // { questionId: true/false }
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'success' | 'error'

  const { timeLeft, formatTime, setIsRunning, pageSwitchCount } = useExamTimer(
    examData?.remaining_time || 0,
    () => handleSubmitExam(true), // Auto-submit on timer end
    resultId
  );

  const { sendLog } = useExamLogger(resultId, () => handleSubmitExam(true));

  const saveAnswerToBackend = useCallback(async (questionId, answer) => {
    if (!resultId || !questionId) return;
    setSaveStatus('saving');
    try {
      await axios.put(`/api/assessment-results/${resultId}/answer`, {
        question_id: questionId,
        user_answer: answer,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
      sendLog('ANSWER_SAVED', { questionId, answer });
    } catch (error) {
      setSaveStatus('error');
      console.error('Auto-save failed:', error);
      sendLog('ANSWER_SAVE_FAILED', { questionId, answer, error: error.message });
    }
  }, [resultId, sendLog]);

  const { debouncedSave, isSaving, saveError } = useAutoSave(saveAnswerToBackend, resultId, 3000, 30000);

  // Manual save function
  const handleManualSave = async () => {
    if (!resultId || Object.keys(userAnswers).length === 0) {
      toast.warning('没有需要保存的答案');
      return;
    }

    setSaveStatus('saving');
    try {
      // Save all answers
      for (const [questionId, answer] of Object.entries(userAnswers)) {
        await axios.put(`/api/assessment-results/${resultId}/answer`, {
          question_id: questionId,
          user_answer: answer,
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
      }
      setSaveStatus('success');
      toast.success('手动保存成功');
      setTimeout(() => setSaveStatus('idle'), 2000);
      sendLog('MANUAL_SAVE_SUCCESS');
    } catch (error) {
      setSaveStatus('error');
      toast.error('手动保存失败，请重试');
      console.error('Manual save failed:', error);
      sendLog('MANUAL_SAVE_FAILED', { error: error.message });
    }
  };

  useEffect(() => {
    fetchExamProgress();
  }, [resultId]);

  useEffect(() => {
    if (examData && examData.remaining_time !== undefined) {
      setIsRunning(true);
    }
  }, [examData?.remaining_time]);

  // Responsive check
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchExamProgress = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/assessment-results/${resultId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = response.data.data;
      console.log('[ExamTaking] 接收到的 saved_answers:', data.saved_answers);
      setExamData(data);
      setUserAnswers(data.saved_answers || {});
      console.log('[ExamTaking] 设置 userAnswers 为:', data.saved_answers || {});
    } catch (error) {
      toast.error(`获取考试进度失败: ${error.response?.data?.message || error.message}`);
      console.error('Failed to fetch exam progress:', error);
      navigate('/assessment/my-exams'); // Go back if failed to load exam
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    const formattedAnswer = typeof answer === 'object' ? JSON.stringify(answer) : String(answer);
    setUserAnswers((prev) => ({ ...prev, [questionId]: formattedAnswer }));
    debouncedSave(questionId, formattedAnswer);
    sendLog('ANSWER_CHANGED', { questionId, answer: formattedAnswer });
  };

  const handleNextQuestion = () => {
    const totalQuestions = examData.questions.length;
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      sendLog('QUESTION_NAVIGATED', { from: currentQuestionIndex, to: currentQuestionIndex + 1, direction: 'next' });
    } else {
      toast.warning('已经是最后一题');
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      sendLog('QUESTION_NAVIGATED', { from: currentQuestionIndex, to: currentQuestionIndex - 1, direction: 'prev' });
    } else {
      toast.warning('已经是第一题');
    }
  };

  const handleJumpToQuestion = (index) => {
    setCurrentQuestionIndex(index);
    if (isMobile) {
      setDrawerVisible(false); // Close drawer after jumping
    }
  };

  const handleToggleMark = (questionId) => {
    setMarkedQuestions((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleSubmitExam = async (isTimeout = false) => {
    setLoading(true);
    setIsRunning(false); // Stop the timer
    debouncedSave.cancel?.(); // Cancel any pending auto-saves

    try {
      // 在提交前,先保存所有答案到后端,确保验证能通过
      console.log('提交前保存所有答案:', userAnswers);
      if (Object.keys(userAnswers).length > 0) {
        await axios.put(`/api/assessment-results/${resultId}/answer`, {
          answers: userAnswers
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        console.log('所有答案已保存,开始提交');
      }

      await axios.post(`/api/assessment-results/${resultId}/submit`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success(isTimeout ? '考试时间到，已自动提交' : '考试提交成功');
      sendLog(isTimeout ? 'EXAM_AUTO_SUBMIT_TIMEOUT' : 'EXAM_SUBMITTED', { isTimeout });
      navigate(`/assessment/results/${resultId}/result`);
    } catch (error) {
      toast.error(`提交考试失败: ${error.response?.data?.message || error.message}`);
      console.error('Failed to submit exam:', error);
      sendLog('EXAM_SUBMIT_FAILED', { error: error.message });
    } finally {
      setLoading(false);
      setSubmitModalVisible(false);
    }
  };

  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

  const showSubmitConfirmModal = () => {
    const unansweredCount = examData.questions.filter(q => !userAnswers[q.id]).length;
    sendLog('SUBMIT_CONFIRM_OPENED', { unansweredCount });
    setSubmitConfirmOpen(true);
  };

  // Render save status indicator
  const renderSaveStatus = () => {
    if (saveStatus === 'saving' || isSaving) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Loader className="h-3 w-3 animate-spin" />
          保存中...
        </Badge>
      );
    }
    if (saveStatus === 'success') {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          已保存
        </Badge>
      );
    }
    if (saveStatus === 'error' || saveError) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          保存失败
        </Badge>
      );
    }
    return null;
  };

  if (loading || !examData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Top Toolbar Skeleton */}
        <Card style={{ width: '100%', position: 'fixed', top: 0, zIndex: 100, borderRadius: 0 }} bodyStyle={{ padding: '10px 24px' }}>
          <div className="flex justify-between w-full">
            <Skeleton className="w-48 h-6" />
            <div className="flex space-x-2">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="w-20 h-6" />
              <Skeleton className="w-30 h-6" />
              <Skeleton className="w-12 h-6" />
              <Skeleton className="w-16 h-8" />
            </div>
          </div>
        </Card>

        <div style={{ display: 'flex', flex: 1, paddingTop: 64, overflow: 'hidden' }}>
          {/* Side Navigation Skeleton */}
          {!isMobile && (
            <Card style={{ width: 140, flexShrink: 0, overflowY: 'auto', borderRadius: 0 }}>
              <Skeleton active paragraph={{ rows: 10 }} />
            </Card>
          )}

          {/* Question Display Area Skeleton */}
          <div style={{ flex: 1, padding: isMobile ? 16 : 24, overflowY: 'auto' }}>
            <Card>
              <Skeleton active paragraph={{ rows: 5 }} />
              <Skeleton active paragraph={{ rows: 8 }} style={{ marginTop: 24 }} />
              <div className="mt-6 flex justify-between w-full">
                <Skeleton className="w-20 h-8" />
                <Skeleton className="w-20 h-8" />
                <Skeleton className="w-20 h-8" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Check if questions array is valid
  if (!examData.questions || !Array.isArray(examData.questions) || examData.questions.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Card>
          <div className="flex flex-col items-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
            <h4 className="text-xl font-semibold">试卷数据异常</h4>
            <p className="text-gray-500">该试卷没有题目，请联系管理员检查试卷配置</p>
            <Button onClick={() => navigate('/assessment/my-exams')}>
              返回考试列表
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentQuestion = examData.questions[currentQuestionIndex];

  // Additional safety check for current question
  if (!currentQuestion) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Card>
          <div className="flex flex-col items-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
            <h4 className="text-xl font-semibold">题目加载失败</h4>
            <p className="text-gray-500">无法加载当前题目，请刷新页面重试</p>
            <Button onClick={() => navigate('/assessment/my-exams')}>
              返回考试列表
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  const answeredCount = Object.keys(userAnswers).filter(qId => userAnswers[qId] !== undefined && userAnswers[qId] !== null && userAnswers[qId] !== '').length;
  const totalQuestions = examData.questions.length;
  const progressPercent = (answeredCount / totalQuestions) * 100;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const renderAnswerInput = (question) => {
    const currentAnswer = userAnswers[question.id];
    try {
      let parsedAnswer = currentAnswer;
      if (currentAnswer && (question.type === 'multiple_choice' || question.type === 'fill_blank')) {
        parsedAnswer = JSON.parse(currentAnswer);
      }

      switch (question.type) {
        case 'single_choice':
          return (
            <RadioGroup
              onValueChange={(value) => handleAnswerChange(question.id, value)}
              value={parsedAnswer}
              className="space-y-2"
            >
              {question.options?.map((option, index) => {
                const optionLetter = String.fromCharCode(65 + index); // A, B, C, D...
                return (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={optionLetter} id={`${question.id}-${optionLetter}`} />
                    <Label htmlFor={`${question.id}-${optionLetter}`}>{option}</Label>
                  </div>
                );
              })}
            </RadioGroup>
          );
        case 'multiple_choice':
          return (
            <div className="space-y-2">
              {question.options?.map((option, index) => {
                const optionLetter = String.fromCharCode(65 + index); // A, B, C, D...
                const isChecked = Array.isArray(parsedAnswer) && parsedAnswer.includes(optionLetter);
                return (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${question.id}-${optionLetter}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        let newValues = Array.isArray(parsedAnswer) ? [...parsedAnswer] : [];
                        if (checked) {
                          newValues.push(optionLetter);
                        } else {
                          newValues = newValues.filter(v => v !== optionLetter);
                        }
                        handleAnswerChange(question.id, newValues);
                      }}
                    />
                    <Label htmlFor={`${question.id}-${optionLetter}`}>{option}</Label>
                  </div>
                );
              })}
            </div>
          );
        case 'true_false':
          return (
            <RadioGroup
              onValueChange={(value) => handleAnswerChange(question.id, value)}
              value={parsedAnswer}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="A" id={`${question.id}-A`} />
                <Label htmlFor={`${question.id}-A`}>正确</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="B" id={`${question.id}-B`} />
                <Label htmlFor={`${question.id}-B`}>错误</Label>
              </div>
            </RadioGroup>
          );
        case 'fill_blank':
          const blankCount = (question.content.match(/____/g) || []).length || 1;
          const currentFillBlanks = Array.isArray(parsedAnswer) ? parsedAnswer : Array(blankCount).fill('');

          return (
            <div className="space-y-4">
              {Array.from({ length: blankCount }).map((_, index) => (
                <div key={index}>
                  <Label htmlFor={`blank-${question.id}-${index}`} className="text-sm font-medium mb-1 block">
                    填空 {index + 1}
                  </Label>
                  <Input
                    id={`blank-${question.id}-${index}`}
                    placeholder={`填空 ${index + 1}`}
                    value={currentFillBlanks[index]}
                    onChange={(e) => {
                      const newBlanks = [...currentFillBlanks];
                      newBlanks[index] = e.target.value;
                      handleAnswerChange(question.id, newBlanks);
                    }}
                  />
                </div>
              ))}
            </div>
          );
        case 'essay':
          return (
            <div>
              <Label htmlFor={`essay-${question.id}`} className="text-sm font-medium mb-1 block">
                答案
              </Label>
              <Textarea
                id={`essay-${question.id}`}
                rows={8}
                placeholder="请输入您的答案"
                value={parsedAnswer}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              />
            </div>
          );
        default:
          return <p className="text-destructive">未知题型</p>;
      }
    } catch (e) {
      console.error("Error rendering answer input or parsing answer:", e);
      return <p className="text-destructive">答案解析错误</p>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top Toolbar */}
      <Card
        style={{ width: '100%', position: 'fixed', top: 0, zIndex: 100, borderRadius: 0 }}
        bodyStyle={{ padding: '10px 24px' }}
      >
        <div className="flex justify-between w-full">
          <div>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setDrawerVisible(true)}>
                <Menu className="h-4 w-4" />
              </Button>
            )}
            <h4 className="text-lg font-semibold m-0 inline-block ml-2">{examData.exam_title}</h4>
          </div>
          <div className="flex items-center space-x-4">
            <Clock className="h-4 w-4" />
            <span className="font-semibold" style={{ color: timeLeft <= 300 ? 'red' : 'inherit' }}>
              {formatTime(timeLeft)}
            </span>
            {renderSaveStatus()}
            <Progress value={progressPercent} className="w-32" />
            <span>{answeredCount}/{totalQuestions}</span>
            <Button onClick={showSubmitConfirmModal}>提交考试</Button>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', flex: 1, paddingTop: 64, overflow: 'hidden' }}>
        {/* Side Navigation - Width reduced from 200px to 140px (30% reduction) */}
        {!isMobile && (
          <Card style={{ width: 140, flexShrink: 0, overflowY: 'auto', borderRadius: 0 }}>
            <QuestionNav
              questions={examData.questions}
              currentQuestionIndex={currentQuestionIndex}
              onQuestionChange={handleJumpToQuestion}
              answeredQuestions={new Set(Object.keys(userAnswers).filter(qId => userAnswers[qId] !== undefined && userAnswers[qId] !== null && userAnswers[qId] !== ''))}
              markedQuestions={new Set(Object.keys(markedQuestions).filter(qId => markedQuestions[qId]))}
              onToggleMark={handleToggleMark}
            />
          </Card>
        )}

        {/* Question Display Area */}
        <div style={{ flex: 1, padding: isMobile ? 16 : 24, overflowY: 'auto' }}>
          <Card>
            <h5 className="text-lg font-medium">
              {currentQuestionIndex + 1}. [{currentQuestion.type}] (分值: {currentQuestion.score})
            </h5>
            <LazyImageRenderer htmlContent={currentQuestion.content} />

            {/* Answer Input Area */}
            <div style={{ marginTop: 24 }}>
              {renderAnswerInput(currentQuestion)}
            </div>

            {/* Navigation and Control */}
            <div className="mt-6 flex justify-between w-full">
              <Button
                onClick={handlePrevQuestion}
                disabled={isFirstQuestion}
                variant={isFirstQuestion ? 'secondary' : 'default'}
              >
                上一题
              </Button>
              <Button
                onClick={() => handleToggleMark(currentQuestion.id)}
                variant={markedQuestions[currentQuestion.id] ? 'default' : 'outline'}
                className="flex items-center gap-2"
              >
                <Flag className="h-4 w-4" />
                {markedQuestions[currentQuestion.id] ? '取消标记' : '标记题目'}
              </Button>
              <Button
                onClick={handleNextQuestion}
                disabled={isLastQuestion}
                variant={isLastQuestion ? 'secondary' : 'default'}
              >
                下一题
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile Drawer for Question Navigation */}
      {isMobile && (
        <Sheet open={drawerVisible} onOpenChange={setDrawerVisible}>
          <SheetContent side="left" className="w-4/5 p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>题目导航</SheetTitle>
            </SheetHeader>
            <div className="p-4">
              <QuestionNav
                questions={examData.questions}
                currentQuestionIndex={currentQuestionIndex}
                onQuestionChange={handleJumpToQuestion}
                answeredQuestions={new Set(Object.keys(userAnswers).filter(qId => userAnswers[qId] !== undefined && userAnswers[qId] !== null && userAnswers[qId] !== ''))}
                markedQuestions={new Set(Object.keys(markedQuestions).filter(qId => markedQuestions[qId]))}
                onToggleMark={handleToggleMark}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default ExamTaking;
