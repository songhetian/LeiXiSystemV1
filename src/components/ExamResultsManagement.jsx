import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import api from '../api';
import './ExamResultsManagement.css';

// 导入 shadcn UI 组件
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

const ExamResultsManagement = ({ onNavigate }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterExam, setFilterExam] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployeeResults, setSelectedEmployeeResults] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await api.get('/assessment-results');
      const resultsData = response.data?.data?.results || response.data?.data || [];
      setResults(Array.isArray(resultsData) ? resultsData : []);
      setPagination(prev => ({ ...prev, total: resultsData.length }));
    } catch (error) {
      console.error('获取考试结果失败:', error);
      toast.error('获取考试结果列表失败');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and group results - show only highest score per employee+exam
  const filteredResults = useMemo(() => {
    if (!Array.isArray(results)) return [];

    // First filter by criteria
    const filtered = results.filter(result => {
      const matchesExam = filterExam === '' || result.exam_title === filterExam;
      const matchesDepartment = filterDepartment === '' || result.user_department === filterDepartment;
      const matchesEmployee = filterEmployee === '' || result.user_real_name === filterEmployee;
      const matchesStatus = filterStatus === '' ||
        (filterStatus === 'passed' && result.passed) ||
        (filterStatus === 'failed' && !result.passed);

      return matchesExam && matchesDepartment && matchesEmployee && matchesStatus;
    });

    // Group by employee + exam, keep only highest score
    const grouped = {};
    filtered.forEach(result => {
      const key = `${result.user_id}-${result.exam_id}`;
      if (!grouped[key]) {
        grouped[key] = result;
      } else {
        // Keep the one with highest score
        if ((result.score || 0) > (grouped[key].score || 0)) {
          grouped[key] = result;
        }
      }
    });

    // Convert to array and sort by submit time descending
    return Object.values(grouped).sort((a, b) =>
      new Date(b.submitted_at) - new Date(a.submitted_at)
    );
  }, [results, filterExam, filterDepartment, filterEmployee, filterStatus]);

  // Get unique values for dropdowns
  const examOptions = useMemo(() =>
    [...new Set(results.map(r => r.exam_title))].filter(Boolean),
    [results]
  );

  const departmentOptions = useMemo(() =>
    [...new Set(results.map(r => r.user_department))].filter(Boolean),
    [results]
  );

  const employeeOptions = useMemo(() =>
    [...new Set(results.map(r => r.user_real_name))].filter(Boolean),
    [results]
  );

  const showDetailModal = (userId, examId) => {
    const employeeExamResults = results.filter(result =>
      result.user_id === userId && result.exam_id === examId
    ).sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

    setSelectedEmployeeResults(employeeExamResults);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedEmployeeResults([]);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  const handleViewAnswers = (resultId) => {
    closeModal();
    // Navigate to exam result detail page
    if (onNavigate) {
      onNavigate('exam-result', { resultId });
    }
  };

  // Render table rows directly since we're not using Ant Design's Table anymore
  const renderTableRows = () => {
    return filteredResults.map((record) => (
      <TableRow key={record.id}>
        <TableCell className="w-[120px]">{record.user_real_name}</TableCell>
        <TableCell className="w-[150px]">{record.user_department}</TableCell>
        <TableCell className="w-[200px]">{record.exam_title}</TableCell>
        <TableCell className="w-[120px]">
          <span>
            <span className="score-number">{record.score || 0}</span>
            <span className="score-total"> / {record.total_score}</span>
          </span>
        </TableCell>
        <TableCell className="w-[100px] text-center">
          <Badge variant={record.passed ? 'success' : 'destructive'}>
            {record.passed ? '合格' : '不合格'}
          </Badge>
        </TableCell>
        <TableCell className="w-[180px]">
          {record.submitted_at ? new Date(record.submitted_at).toLocaleString('zh-CN') : '-'}
        </TableCell>
        <TableCell className="w-[100px]">{formatDuration(record.duration)}</TableCell>
        <TableCell className="w-[100px] text-center">
          <button
            className="action-btn"
            onClick={() => showDetailModal(record.user_id, record.exam_id)}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 inline mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            查看详情
          </button>
        </TableCell>
      </TableRow>
    ));
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  return (
    <div className="exam-results-management">
      <div className="exam-results-card">
        <div className="exam-results-header">
          <h2 className="exam-results-title">考试结果管理</h2>
          <p className="exam-results-subtitle">共 {filteredResults.length} 条记录</p>
        </div>

        <div className="search-filter-section">
          <div className="filter-group">
            <label className="filter-label">试卷选择</label>
            <Select value={filterExam || undefined} onValueChange={setFilterExam}>
              <SelectTrigger className="filter-select-full">
                <SelectValue placeholder="请选择试卷" />
              </SelectTrigger>
              <SelectContent>
                {examOptions.map((title, index) => (
                  <SelectItem key={index} value={title}>{title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="filter-group">
            <label className="filter-label">部门搜索</label>
            <Select value={filterDepartment || undefined} onValueChange={setFilterDepartment}>
              <SelectTrigger className="filter-select-full">
                <SelectValue placeholder="请选择部门" />
              </SelectTrigger>
              <SelectContent>
                {departmentOptions.map((dept, index) => (
                  <SelectItem key={index} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="filter-group">
            <label className="filter-label">员工姓名</label>
            <Select value={filterEmployee || undefined} onValueChange={setFilterEmployee}>
              <SelectTrigger className="filter-select-full">
                <SelectValue placeholder="请选择员工" />
              </SelectTrigger>
              <SelectContent>
                {employeeOptions.map((name, index) => (
                  <SelectItem key={index} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="filter-group">
            <label className="filter-label">考试状态</label>
            <Select value={filterStatus || undefined} onValueChange={setFilterStatus}>
              <SelectTrigger className="filter-select-full">
                <SelectValue placeholder="请选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passed">合格</SelectItem>
                <SelectItem value="failed">不合格</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="table-container overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">员工姓名</TableHead>
                <TableHead className="w-[150px]">所属部门</TableHead>
                <TableHead className="w-[200px]">试卷名称</TableHead>
                <TableHead className="w-[120px]">得分</TableHead>
                <TableHead className="w-[100px] text-center">结果</TableHead>
                <TableHead className="w-[180px]">提交时间</TableHead>
                <TableHead className="w-[100px]">用时</TableHead>
                <TableHead className="w-[100px] text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderTableRows()}
            </TableBody>
          </Table>
          {filteredResults.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">暂无数据</div>
          )}
        </div>
      </div>

      <Dialog open={modalVisible} onOpenChange={closeModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>考试详情</DialogTitle>
          </DialogHeader>
          <div className="modal-body mt-4 space-y-4">
            {selectedEmployeeResults.map((result, index) => (
              <div key={result.id} className="detail-record border rounded-lg p-4">
                <div className="detail-header flex justify-between items-center mb-3">
                  <span className="detail-title font-medium">第 {result.attempt_number} 次考试</span>
                  <Badge variant={result.passed ? 'success' : 'destructive'}>
                    {result.passed ? '合格' : '不合格'}
                  </Badge>
                </div>
                <div className="detail-grid grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="detail-item">
                    <span className="detail-label text-gray-600 text-sm">考试时间</span>
                    <div className="detail-value font-medium">{new Date(result.submitted_at).toLocaleString('zh-CN')}</div>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label text-gray-600 text-sm">用时</span>
                    <div className="detail-value font-medium">{formatDuration(result.duration)}</div>
                  </div>
                  <div className="detail-item md:col-span-2">
                    <span className="detail-label text-gray-600 text-sm">得分</span>
                    <div className="score-container mt-1">
                      <span className={`score-value text-lg font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                        {result.score !== null && result.score !== undefined ? result.score : 0}
                      </span>
                      <span className="score-total text-gray-500">/ {result.total_score}</span>
                    </div>
                  </div>
                </div>
                <div className="detail-footer pt-3 border-t">
                  <button
                    className="view-answers-btn-secondary inline-flex items-center px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    onClick={() => handleViewAnswers(result.id)}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    查看答题详情
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamResultsManagement;
