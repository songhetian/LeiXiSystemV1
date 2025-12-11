import React, { useState, useEffect } from 'react';
import { Edit, Trash2, GripVertical } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// 导入 shadcn UI 组件
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

// Helper function to reorder a list
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const getItemStyle = (isDragging, draggableStyle) => ({
  userSelect: 'none',
  padding: 16,
  margin: `0 0 8px 0`,
  borderRadius: '6px',
  background: isDragging ? '#f0f9ff' : 'white',
  border: isDragging ? '1px solid #bae6fd' : '1px solid #e5e7eb',
  boxShadow: isDragging ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  ...draggableStyle,
});

const getListStyle = (isDraggingOver) => ({
  background: isDraggingOver ? '#f9fafb' : '#f3f4f6',
  padding: 8,
  minHeight: '100px',
  borderRadius: '6px',
});

const QuestionList = ({ examId, onEditQuestion, onDeleteQuestion, onQuestionsReordered }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (examId) {
      fetchExamQuestions(examId);
    }
  }, [examId]);

  const fetchExamQuestions = async (currentExamId) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/exams/${currentExamId}/questions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setQuestions(response.data.data.questions);
    } catch (error) {
      toast.error('获取试卷题目失败');
      console.error('Failed to fetch exam questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) {
      return;
    }

    const reorderedQuestions = reorder(
      questions,
      result.source.index,
      result.destination.index
    );

    setQuestions(reorderedQuestions);

    // Update order_num in backend
    try {
      const questionIds = reorderedQuestions.map(q => q.id);
      await axios.put(`/api/exams/${examId}/questions/reorder`, { question_ids: questionIds }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('题目排序成功');
      if (onQuestionsReordered) {
        onQuestionsReordered(reorderedQuestions);
      }
    } catch (error) {
      toast.error('题目排序失败');
      console.error('Failed to reorder questions:', error);
      // Revert to original order if API call fails
      fetchExamQuestions(examId);
    }
  };

  const getQuestionTypeTag = (type) => {
    switch (type) {
      case 'single_choice': return <Badge variant="default">单选</Badge>;
      case 'multiple_choice': return <Badge variant="secondary">多选</Badge>;
      case 'true_false': return <Badge variant="outline">判断</Badge>;
      case 'fill_blank': return <Badge variant="default">填空</Badge>;
      case 'essay': return <Badge variant="destructive">简答</Badge>;
      default: return <Badge>{type}</Badge>;
    }
  };

  const handleDeleteQuestion = (questionId) => {
    if (window.confirm('确定删除此题目吗？')) {
      onDeleteQuestion(questionId);
    }
  };

  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-2">加载中...</span>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="questions">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={getListStyle(snapshot.isDraggingOver)}
              >
                {questions.length === 0 ? (
                  <p className="text-center py-5 text-gray-500">暂无题目</p>
                ) : (
                  <div className="space-y-3">
                    {questions.map((question, index) => (
                      <Draggable key={question.id} draggableId={String(question.id)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={getItemStyle(
                              snapshot.isDragging,
                              provided.draggableProps.style
                            )}
                            className="flex items-start"
                          >
                            <div {...provided.dragHandleProps} className="pt-3 pr-2 cursor-move">
                              <GripVertical className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center">
                                  <span className="font-medium mr-2">{index + 1}.</span>
                                  {getQuestionTypeTag(question.type)}
                                  <span className="ml-2 truncate">{question.content}</span>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEditQuestion(question.id)}
                                    className="h-8 px-3"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    编辑
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteQuestion(question.id)}
                                    className="h-8 px-3"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    删除
                                  </Button>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 mt-2">
                                <p><strong>分值:</strong> {question.score}</p>
                                {question.options && (
                                  <div className="mt-1">
                                    <strong>选项:</strong>
                                    <ul className="list-disc pl-5 mt-1">
                                      {question.options.map((option, optIndex) => (
                                        <li key={optIndex}>{option}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {question.correct_answer && (
                                  <p className="mt-1"><strong>正确答案:</strong> {question.correct_answer}</p>
                                )}
                                {question.explanation && (
                                  <p className="mt-1"><strong>解析:</strong> {question.explanation}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </div>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
};

export default QuestionList;
