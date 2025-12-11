import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title as ChartTitle, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

// 导入 shadcn UI 组件
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ChartTitle, Tooltip, Legend);

const ExamStatistics = () => {
  const [loading, setLoading] = useState(false);
  const [overallStats, setOverallStats] = useState(null);
  const [scoreTrendData, setScoreTrendData] = useState({});
  const [departmentComparisonData, setDepartmentComparisonData] = useState({});
  const [rankingData, setRankingData] = useState([]);
  const [filters, setFilters] = useState({
    dateRange: [],
    examId: undefined,
  });
  const [exams, setExams] = useState([]); // For exam filter

  useEffect(() => {
    fetchOverallStats();
    fetchScoreTrend();
    fetchDepartmentComparison();
    fetchRanking();
    fetchExamsForFilter();
  }, [filters]);

  const fetchOverallStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/statistics/exam-overview', {
        params: {
          start_time: filters.dateRange[0] ? filters.dateRange[0].format('YYYY-MM-DD') : undefined,
          end_time: filters.dateRange[1] ? filters.dateRange[1].format('YYYY-MM-DD') : undefined,
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = response.data.data;
      setOverallStats({
        ...data,
        overall_pass_rate: data.pass_rate !== undefined ? parseFloat(data.pass_rate) : undefined
      });
    } catch (error) {
      toast.error('获取总体统计失败');
      console.error('Failed to fetch overall stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScoreTrend = async () => {
    try {
      // Assuming an API for score trend, e.g., /api/statistics/score-trend
      const response = await axios.get('/api/statistics/score-trend', { // Placeholder API
        params: {
          start_time: filters.dateRange[0] ? filters.dateRange[0].format('YYYY-MM-DD') : undefined,
          end_time: filters.dateRange[1] ? filters.dateRange[1].format('YYYY-MM-DD') : undefined,
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = response.data.data; // Expected format: { labels: [], avg_scores: [], pass_rates: [] }
      setScoreTrendData({
        labels: data.labels,
        datasets: [
          {
            label: '平均分趋势',
            data: data.avg_scores,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.1,
          },
          {
            label: '通过率趋势',
            data: data.pass_rates,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            tension: 0.1,
            yAxisID: 'y1', // Use a different Y-axis for pass rate (percentage)
          },
        ],
      });
    } catch (error) {
      console.warn('获取成绩趋势失败，可能后端API未实现或数据不足:', error);
      setScoreTrendData({});
    }
  };

  const fetchDepartmentComparison = async () => {
    try {
      const response = await axios.get('/api/statistics/department', {
        params: {
          start_time: filters.dateRange[0] ? filters.dateRange[0].format('YYYY-MM-DD') : undefined,
          end_time: filters.dateRange[1] ? filters.dateRange[1].format('YYYY-MM-DD') : undefined,
          exam_id: filters.examId,
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = response.data.data; // Expected format: { labels: [], avg_scores: [], pass_rates: [] }
      setDepartmentComparisonData({
        labels: data.labels,
        datasets: [
          {
            label: '平均分',
            data: data.avg_scores,
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
          },
          {
            label: '通过率',
            data: data.pass_rates,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            yAxisID: 'y1',
          },
        ],
      });
    } catch (error) {
      console.warn('获取部门对比统计失败，可能后端API未实现或数据不足:', error);
      setDepartmentComparisonData({});
    }
  };

  const fetchRanking = async () => {
    try {
      const response = await axios.get('/api/statistics/ranking', {
        params: {
          exam_id: filters.examId,
          // Add other filters if needed
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setRankingData(response.data.data.results || []);
    } catch (error) {
      console.warn('获取热门考试排行失败，可能后端API未实现或数据不足:', error);
      setRankingData([]);
    }
  };

  const fetchExamsForFilter = async () => {
    try {
      const response = await axios.get('/api/exams', {
        params: { pageSize: 9999 }, // Get all exams for filter
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setExams(response.data.data.exams);
    } catch (error) {
      console.error('Failed to fetch exams for filter:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  };

  const scoreTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: '成绩趋势' },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: '平均分' },
      },
      y1: {
        type: 'linear',
        position: 'right',
        beginAtZero: true,
        max: 100,
        title: { display: true, text: '通过率 (%)' },
        grid: { drawOnChartArea: false },
      },
    },
  };

  const departmentComparisonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: '部门对比' },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: '平均分' },
      },
      y1: {
        type: 'linear',
        position: 'right',
        beginAtZero: true,
        max: 100,
        title: { display: true, text: '通过率 (%)' },
        grid: { drawOnChartArea: false },
      },
    },
  };

  const rankingColumns = [
    { title: '排名', dataIndex: 'rank', key: 'rank' },
    { title: '考试名称', dataIndex: 'exam_title', key: 'exam_title' },
    { title: '参与人数', dataIndex: 'participant_count', key: 'participant_count' },
    { title: '平均分', dataIndex: 'average_score', key: 'average_score', render: (score) => score?.toFixed(2) },
    { title: '通过率', dataIndex: 'pass_rate', key: 'pass_rate', render: (rate) => `${(rate * 100).toFixed(2)}%` },
  ];

  return (
    <div className="p-6">
      <div className={`${loading ? 'opacity-50 pointer-events-none' : ''}`}>
        <Card>
          <CardHeader>
            <CardTitle>考试统计仪表板</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-6">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    {filters.dateRange[0] ? `${dayjs(filters.dateRange[0]).format('YYYY-MM-DD')} - ${dayjs(filters.dateRange[1]).format('YYYY-MM-DD')}` : '选择日期范围'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="range"
                    selected={{ from: filters.dateRange[0], to: filters.dateRange[1] }}
                    onSelect={(range) => handleFilterChange('dateRange', [range?.from, range?.to])}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <Select value={filters.examId || ''} onValueChange={(value) => handleFilterChange('examId', value || undefined)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="筛选试卷" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map(exam => (
                    <SelectItem key={exam.id} value={exam.id}>{exam.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          {/* 总体统计卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">总考试次数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats?.total_exams || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">平均分</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats?.average_score?.toFixed(2) || 'N/A'}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">总通过率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats?.overall_pass_rate !== undefined ? `${(overallStats.overall_pass_rate * 100).toFixed(2)}%` : 'N/A'}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">参与人数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats?.total_participants || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* 成绩趋势图表 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>成绩趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: '300px' }}>
                {scoreTrendData.labels?.length > 0 ? (
                  <Line options={scoreTrendOptions} data={scoreTrendData} />
                ) : (
                  <div>暂无成绩趋势数据。</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 部门对比图表 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>部门对比</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: '300px' }}>
                {departmentComparisonData.labels?.length > 0 ? (
                  <Bar options={departmentComparisonOptions} data={departmentComparisonData} />
                ) : (
                  <div>暂无部门对比数据。</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 热门考试排行 */}
          <Card>
            <CardHeader>
              <CardTitle>热门考试排行</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {rankingColumns.map((column) => (
                      <TableHead key={column.key}>{column.title}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankingData.map((record) => (
                    <TableRow key={record.exam_id}>
                      {rankingColumns.map((column) => (
                        <TableCell key={column.key}>
                          {column.render ? column.render(record[column.dataIndex], record) : record[column.dataIndex]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Card>
      </div>
    </div>
  );
};

export default ExamStatistics;
