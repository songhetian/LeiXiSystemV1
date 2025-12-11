import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

// 导入 shadcn UI 组件
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ChevronLeft, Printer, CircleCheck, CircleX, AlertCircle } from 'lucide-react';

const AnswerDetail = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [answerDetails, setAnswerDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    fetchAnswerDetails();
  }, [resultId]);

  const fetchAnswerDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/assessment-results/${resultId}/answers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setAnswerDetails(response.data.data);
    } catch (error) {
      toast.error(`获取答题详情失败: ${error.response?.data?.message || error.message}`);
      console.error('Failed to fetch answer details:', error);
      navigate(`/assessment/results/${resultId}/result`); // Go back to result if failed
    } finally {
      setLoading(false);
    }
  };

  const getQuestionType = (q) => q?.question_type || q?.type || '';

  const getQuestionTypeBadge = (type) => {
    switch (type) {
      case 'single_choice': return <Badge variant="default">单选</Badge>;
      case 'multiple_choice': return <Badge variant="secondary">多选</Badge>;
      case 'true_false': return <Badge variant="outline">判断</Badge>;
      case 'fill_blank': return <Badge variant="default">填空</Badge>;
      case 'essay': return <Badge variant="destructive">简答</Badge>;
      default: return <Badge>{type}</Badge>;
    }
  };

  const renderUserAnswer = (question, userAnswer) => {
    if (!userAnswer) return <span className="text-gray-500">未作答</span>;

    try {
      const t = getQuestionType(question);
      let displayAnswer = userAnswer;
      if (t === 'multiple_choice' || t === 'fill_blank') {
        displayAnswer = JSON.parse(userAnswer).join(', ');
      } else if (t === 'true_false') {
        displayAnswer = userAnswer === 'true' ? '正确' : '错误';
      }
      return <span className={`font-semibold ${question.is_correct === 1 ? 'text-green-600' : 'text-red-600'}`}>{displayAnswer}</span>;
    } catch (e) {
      return <span className="text-red-500">答案解析错误</span>;
    }
  };

  const renderCorrectAnswer = (question) => {
    if (!question.correct_answer) return <span className="text-gray-500">无</span>;

    try {
      const t = getQuestionType(question);
      let displayAnswer = question.correct_answer;
      if (t === 'multiple_choice' || t === 'fill_blank') {
        displayAnswer = JSON.parse(question.correct_answer).join(', ');
      } else if (t === 'true_false') {
        displayAnswer = question.correct_answer === 'true' ? '正确' : '错误';
      }
      return <span className="font-semibold">{displayAnswer}</span>;
    } catch (e) {
      return <span className="text-red-500">答案解析错误</span>;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <span className="ml-2">加载中...</span>
      </div>
    );
  }

  if (!answerDetails || !answerDetails.questions) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>答题详情</CardTitle>
          </CardHeader>
          <CardContent>
            <p>无法加载答题详情。</p>
            <div className="mt-4">
              <Button onClick={() => navigate(`/assessment/results/${resultId}/result`)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                返回考试结果
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { exam_title, score, total_score, is_passed, questions } = answerDetails;
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <Card className="w-full rounded-none shadow-md">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">答题详情 - {exam_title}</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/assessment/results/${resultId}/result`)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                返回考试结果
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                打印
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Side Navigation */}
        <Card className="w-52 flex-shrink-0 overflow-y-auto rounded-none border-r">
          <CardHeader>
            <CardTitle className="text-lg">题目导航</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, index) => (
                <Button
                  key={q.question_id}
                  variant={currentQuestionIndex === index ? 'default' : 'outline'}
                  className={`h-8 p-0 text-xs ${
                    q.is_correct === 1 ? 'bg-green-100 hover:bg-green-200 border-green-500' :
                    q.is_correct === 0 ? 'bg-red-100 hover:bg-red-200 border-red-500' : ''
                  }`}
                  onClick={() => setCurrentQuestionIndex(index)}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Question Display Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {currentQuestion && (
            <Card className="mb-4 border-2 border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                  <span>{currentQuestionIndex + 1}.</span>
                  {getQuestionTypeBadge(getQuestionType(currentQuestion))}
                  <span>分值: {currentQuestion.score}</span>
                  {currentQuestion.user_score !== null && (
                    <span className={`font-semibold ${currentQuestion.user_score > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      得分: {currentQuestion.user_score}
                    </span>
                  )}
                  {currentQuestion.is_correct !== null && (
                    <Badge variant={currentQuestion.is_correct === 1 ? 'default' : 'destructive'}>
                      {currentQuestion.is_correct === 1 ? (
                        <><CircleCheck className="mr-1 h-3 w-3" /> 正确</>
                      ) : (
                        <><CircleX className="mr-1 h-3 w-3" /> 错误</>
                      )}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none mb-6" dangerouslySetInnerHTML={{ __html: currentQuestion.content }} />

                {(getQuestionType(currentQuestion) === 'single_choice' || getQuestionType(currentQuestion) === 'multiple_choice') && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">选项:</h3>
                    <div className="space-y-2">
                      {(() => {
                        try {
                          return JSON.parse(currentQuestion.options).map((item, idx) => (
                            <div
                              key={idx}
                              className={`p-2 rounded border ${
                                (() => {
                                  try {
                                    return (currentQuestion.user_answer && JSON.parse(currentQuestion.user_answer).includes(item)) ?
                                      'border-blue-500 bg-blue-50' : '';
                                  } catch {
                                    return '';
                                  }
                                })()
                              } ${
                                (() => {
                                  try {
                                    return (currentQuestion.correct_answer && JSON.parse(currentQuestion.correct_answer).includes(item)) ?
                                      'border-green-500 bg-green-50 font-bold' : '';
                                  } catch {
                                    return '';
                                  }
                                })()
                              }`}
                            >
                              <span>{String.fromCharCode(65 + idx)}. {item}</span>
                            </div>
                          ));
                        } catch {
                          return [];
                        }
                      })()}
                    </div>
                  </div>
                )}

                <div className="mb-2">
                  <span className="font-semibold">您的答案:</span> {renderUserAnswer(currentQuestion, currentQuestion.user_answer)}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">正确答案:</span> {renderCorrectAnswer(currentQuestion)}
                </div>

                {currentQuestion.explanation && (
                  <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="font-semibold flex items-center">
                      <AlertCircle className="mr-2 h-4 w-4 text-blue-500" />
                      解析:
                    </div>
                    <div className="mt-1">{currentQuestion.explanation}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              上一题
            </Button>
            <Button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              下一题
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnswerDetail;
