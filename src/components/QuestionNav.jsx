import React, { useState } from 'react';

// 导入 shadcn UI 组件
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Star, StarOff, ChevronLeft, ChevronRight } from 'lucide-react';



const ITEMS_PER_PAGE = 10;

const QuestionNav = ({
  questions,
  currentQuestionIndex,
  onQuestionChange,
  answeredQuestions,
  markedQuestions,
  onToggleMark,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalQuestions = questions.length;
  const answeredCount = answeredQuestions.size;
  const progressPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Calculate pagination
  const totalPages = Math.ceil(totalQuestions / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalQuestions);
  const currentPageQuestions = questions.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Auto-navigate to page containing current question
  React.useEffect(() => {
    const pageContainingCurrentQuestion = Math.floor(currentQuestionIndex / ITEMS_PER_PAGE) + 1;
    if (pageContainingCurrentQuestion !== currentPage) {
      setCurrentPage(pageContainingCurrentQuestion);
    }
  }, [currentQuestionIndex]);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle>题目导航</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500">
            已答 {answeredCount} / 共 {totalQuestions}
          </div>
        </div>

        {/* Question grid - showing current page only */}
        <div className="grid grid-cols-5 gap-1 mb-4 flex-1">
          {currentPageQuestions.map((q, pageIndex) => {
            const actualIndex = startIndex + pageIndex;
            const isAnswered = answeredQuestions.has(q.id);
            const isMarked = markedQuestions.has(q.id);
            const isCurrent = currentQuestionIndex === actualIndex;

            // Determine button variant based on state
            let variant = 'outline';
            if (isCurrent) {
              variant = 'default';
            } else if (isAnswered) {
              variant = 'secondary';
            }

            return (
              <Button
                key={q.id}
                variant={variant}
                size="sm"
                className={`h-8 text-xs relative ${isMarked ? 'border-yellow-500 border-2' : ''} ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => onQuestionChange(actualIndex)}
              >
                <div className="flex items-center justify-center gap-1">
                  {actualIndex + 1}
                  {isMarked && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                </div>
              </Button>
            );
          })}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  size="sm"
                  variant={page === currentPage ? 'default' : 'outline'}
                  onClick={() => handlePageChange(page)}
                  className="w-8 h-8 p-0 text-xs"
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Mark/Unmark current question button */}
        <div className="text-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggleMark(questions[currentQuestionIndex]?.id)}
            disabled={!questions[currentQuestionIndex]}
            className="w-full"
          >
            {markedQuestions.has(questions[currentQuestionIndex]?.id) ? (
              <>
                <StarOff className="h-4 w-4 mr-2" />
                取消标记
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" />
                标记题目
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionNav;
