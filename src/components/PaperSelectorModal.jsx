import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Card, CardContent } from './ui/card';
import { X, Search, ListChecks, Star, Clock } from 'lucide-react';

const PaperSelectorModal = ({ isOpen, onSelect, onClose }) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchExams();
    }
  }, [isOpen]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await api.get('/exams?status=published&pageSize=100');
      setExams(response.data?.data?.exams || []);
    } catch (error) {
      console.error('获取试卷列表失败:', error);
      toast.error('获取试卷列表失败');
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = exams.filter(exam =>
    exam.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>选择试卷</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="搜索试卷..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading && (
            <Alert>
              <AlertTitle>加载中...</AlertTitle>
              <AlertDescription>请稍候</AlertDescription>
            </Alert>
          )}

          {!loading && filteredExams.length === 0 ? (
            <Alert className="bg-gray-50">
              <AlertTitle>暂无已发布的试卷</AlertTitle>
              <AlertDescription>请稍后重试或调整搜索关键词</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {filteredExams.map((exam) => (
                <Card key={exam.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800">{exam.title}</h4>
                      <div className="flex gap-4 flex-wrap items-center text-sm text-gray-600 mt-2">
                        <span className="flex items-center gap-1"><ListChecks className="h-4 w-4" />{exam.question_count} 题</span>
                        <span className="flex items-center gap-1"><Star className="h-4 w-4" />{exam.total_score} 分</span>
                        <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{exam.duration} 分钟</span>
                        {exam.difficulty && (
                          <Badge className={`text-xs ${exam.difficulty === 'easy' ? 'bg-green-600 text-white' : exam.difficulty === 'medium' ? 'bg-orange-500 text-white' : 'bg-red-600 text-white'}`}>
                            {exam.difficulty === 'easy' ? '简单' : exam.difficulty === 'medium' ? '中等' : '困难'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => { onSelect(exam); onClose(); }}
                      className="font-semibold"
                    >
                      选择
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaperSelectorModal;
