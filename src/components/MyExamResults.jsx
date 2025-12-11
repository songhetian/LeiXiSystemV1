import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/apiConfig';
import './MyExamResults.css';
import { toast } from 'react-toastify';
import { Eye } from 'lucide-react';

// 导入 shadcn UI 组件
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

const MyExamResults = ({ onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    is_passed: '' // '' for all, 'true', 'false'
  });

  // 新增状态用于模态框
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExamResults, setSelectedExamResults] = useState([]);
  const [examTitles, setExamTitles] = useState([]); // 存储所有试卷标题

  const fetchResults = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page,
        limit: pageSize,
        search: filters.search,
        sort_by: 'submit_time',
        order: 'desc'
      });

      if (filters.is_passed) {
        queryParams.append('is_passed', filters.is_passed);
      }

      const url = getApiUrl(`/api/my-exam-results?${queryParams.toString()}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setResults(data.data.results);
        setPagination({
          current: data.data.page,
          pageSize: pageSize, // Keep current page size
          total: data.data.total
        });

        // 提取所有唯一的试卷标题
        const titles = [...new Set(data.data.results.map(result => result.exam_title))];
        setExamTitles(titles);
      } else {
        toast.error(data.message || '获取考试结果失败');
      }
    } catch (error) {
      console.error('Failed to fetch exam results:', error);
      toast.error('获取考试结果失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults(pagination.current, pagination.pageSize);
  }, [pagination.current, pagination.pageSize, filters]); // Re-fetch when these change

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to page 1
  };

  const handleFilterChange = (value) => {
    setFilters(prev => ({ ...prev, is_passed: value }));
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to page 1
  };

  // 新增：根据试卷标题过滤结果
  const handleExamFilterChange = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to page 1
  };

  const handleTableChange = (newPagination) => {
    setPagination(prev => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize
    }));
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  // 新增：显示模态框并设置选中的考试结果
  const showModal = (examTitle) => {
    const examResults = results.filter(result => result.exam_title === examTitle);
    setSelectedExamResults(examResults);
    setModalVisible(true);
  };

  // 新增：关闭模态框
  const closeModal = () => {
    setModalVisible(false);
    setSelectedExamResults([]);
  };

  // 将结果按试卷分组
  const groupedResults = results.reduce((acc, result) => {
    const examTitle = result.exam_title;
    if (!acc[examTitle]) {
      acc[examTitle] = {
        exam_title: examTitle,
        plan_title: result.plan_title,
        attempts: [],
        highestScore: 0,
        isPassed: false
      };
    }

    acc[examTitle].attempts.push(result);

    // 更新最高分和是否通过
    if (result.score > acc[examTitle].highestScore) {
      acc[examTitle].highestScore = result.score;
      acc[examTitle].isPassed = result.is_passed;
    }

    return acc;
  }, {});

  return (
    <div className="my-exam-results-container p-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>我的考试结果</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="exam-results-controls space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="搜索试卷名称..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-40">
                <Select value={filters.is_passed} onValueChange={handleFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="所有结果" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">所有结果</SelectItem>
                    <SelectItem value="true">合格</SelectItem>
                    <SelectItem value="false">不合格</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-40">
                <Select value={filters.search} onValueChange={handleExamFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择试卷" />
                  </SelectTrigger>
                  <SelectContent>
                    {examTitles.map((title, index) => (
                      <SelectItem key={index} value={title}>{title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 卡片式布局 */}
          <div className="exam-cards-container mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(groupedResults).map((examTitle, index) => {
              const examData = groupedResults[examTitle];
              const isPassed = examData.isPassed;
              const highestScore = examData.highestScore;

              return (
                <div
                  key={index}
                  className={`exam-card p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    isPassed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                  onClick={() => showModal(examTitle)}
                >
                  <div className="exam-card-header">
                    <h3 className="exam-card-title font-semibold text-gray-900">{examTitle}</h3>
                    <p className="exam-card-plan text-sm text-gray-600 mt-1">{examData.plan_title}</p>
                  </div>
                  <div className="exam-card-body mt-3">
                    <div className="exam-score flex justify-between items-center">
                      <span className="score-label text-gray-700">最高分:</span>
                      <span className="score-value font-bold text-lg">{highestScore}</span>
                    </div>
                    <div className={`exam-status mt-2 px-2 py-1 rounded text-center text-sm font-medium ${
                      isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isPassed ? '合格' : '不合格'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 分页 */}
          <div className="exam-results-pagination flex items-center justify-between mt-6">
            <Button
              variant="outline"
              disabled={pagination.current === 1}
              onClick={() => handleTableChange({ current: pagination.current - 1, pageSize: pagination.pageSize })}
            >
              上一页
            </Button>
            <span className="pagination-info text-sm text-gray-600">
              第 {pagination.current} 页，共 {Math.ceil(pagination.total / pagination.pageSize)} 页
            </span>
            <Button
              variant="outline"
              disabled={pagination.current === Math.ceil(pagination.total / pagination.pageSize)}
              onClick={() => handleTableChange({ current: pagination.current + 1, pageSize: pagination.pageSize })}
            >
              下一页
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 模态框：显示历次考试详情 */}
      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>考试详情</DialogTitle>
          </DialogHeader>
          <div className="exam-details-modal space-y-4">
            {selectedExamResults.map((result, index) => (
              <div key={index} className="exam-detail-card p-4 border rounded-lg">
                <div className="detail-header flex justify-between items-center">
                  <span className="attempt-number font-medium">第 {result.attempt_number} 次尝试</span>
                  <span className={`detail-status px-2 py-1 rounded text-sm font-medium ${
                    result.is_passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.is_passed ? '合格' : '不合格'}
                  </span>
                </div>
                <div className="detail-body mt-3 space-y-2">
                  <div className="detail-row flex justify-between">
                    <span className="detail-label text-gray-600">得分:</span>
                    <span className="detail-value font-medium">{result.score} / {result.exam_total_score}</span>
                  </div>
                  <div className="detail-row flex justify-between">
                    <span className="detail-label text-gray-600">提交时间:</span>
                    <span className="detail-value">{new Date(result.submit_time).toLocaleString('zh-CN')}</span>
                  </div>
                  <div className="detail-row flex justify-between">
                    <span className="detail-label text-gray-600">用时:</span>
                    <span className="detail-value">{formatDuration(result.duration)}</span>
                  </div>
                </div>
                <div className="detail-actions mt-4">
                  <Button onClick={() => onNavigate('exam-result', { resultId: result.id })} className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    查看详情
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyExamResults;
