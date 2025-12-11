import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title as ChartTitle, Tooltip, Legend } from 'chart.js'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { ArrowLeft } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTitle, Tooltip, Legend)

const ExamAnalysis = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [examAnalysis, setExamAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExamAnalysis();
  }, [examId]);

  const fetchExamAnalysis = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`/api/statistics/exam/${examId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      setExamAnalysis(response.data.data)
    } catch (error) {
      toast.error(`获取试卷分析失败: ${error.response?.data?.message || error.message}`)
      console.error('Failed to fetch exam analysis:', error)
      navigate('/assessment/exams')
    } finally {
      setLoading(false)
    }
  }

  const getScoreDistributionData = () => {
    if (!examAnalysis || !examAnalysis.score_distribution) return { labels: [], datasets: [] }

    const labels = Object.keys(examAnalysis.score_distribution)
    const data = Object.values(examAnalysis.score_distribution)

    return {
      labels,
      datasets: [
        {
          label: '分数分布',
          data,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    }
  }

  const renderQuestionCorrectnessRows = () => (
    (question_analysis || []).map((row) => (
      <TableRow key={row.question_id}>
        <TableCell>{row.question_number}</TableCell>
        <TableCell><Badge variant="outline">{row.question_type}</Badge></TableCell>
        <TableCell className="max-w-[520px] truncate">{row.content}</TableCell>
        <TableCell>{`${(row.correct_rate * 100).toFixed(2)}%`}</TableCell>
        <TableCell>{row.average_score?.toFixed(2)}</TableCell>
      </TableRow>
    ))
  )

  const renderMistakeRows = () => (
    (mistake_questions || []).map((row) => (
      <TableRow key={row.question_id}>
        <TableCell>{row.rank}</TableCell>
        <TableCell><Badge variant="outline">{row.question_type}</Badge></TableCell>
        <TableCell className="max-w-[520px] truncate">{row.content}</TableCell>
        <TableCell>{row.mistake_count}</TableCell>
      </TableRow>
    ))
  )

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        <div className="mt-2 text-sm text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (!examAnalysis) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>试卷分析</CardTitle>
          </CardHeader>
          <CardContent>
            <p>无法加载试卷分析数据。</p>
            <Button onClick={() => navigate('/assessment/exams')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> 返回试卷列表
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { exam_details, participation_stats, question_analysis, mistake_questions } = examAnalysis;

  return (
    <div className="p-6 space-y-4">
      <div className="mb-4">
        <Button variant="outline" onClick={() => navigate('/assessment/exams')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回试卷列表
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>试卷基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">标题</div>
              <div className="text-sm">{exam_details.title}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">分类</div>
              <div className="text-sm">{exam_details.category}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">难度</div>
              <div className="text-sm">{exam_details.difficulty}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">题目数</div>
              <div className="text-sm">{exam_details.question_count}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">总分</div>
              <div className="text-sm">{exam_details.total_score}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">及格分</div>
              <div className="text-sm">{exam_details.pass_score}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>参与统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">参加人数</div>
              <div className="text-sm">{participation_stats.total_participants}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">平均分</div>
              <div className="text-sm">{participation_stats.average_score?.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">最高分</div>
              <div className="text-sm">{participation_stats.highest_score?.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">最低分</div>
              <div className="text-sm">{participation_stats.lowest_score?.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">通过率</div>
              <div className="text-sm">{`${(participation_stats.pass_rate * 100).toFixed(2)}%`}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>成绩分布图</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {getScoreDistributionData().labels.length > 0 ? (
              <Bar data={getScoreDistributionData()} options={{ responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: '分数分布' } } }} />
            ) : (
              <p className="text-sm text-muted-foreground">暂无成绩分布数据。</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>题目正确率分析</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>题号</TableHead>
                <TableHead>题型</TableHead>
                <TableHead>题目内容</TableHead>
                <TableHead>正确率</TableHead>
                <TableHead>平均得分</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderQuestionCorrectnessRows()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>易错题排行 (TOP 10)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>排名</TableHead>
                <TableHead>题型</TableHead>
                <TableHead>题目内容</TableHead>
                <TableHead>错误次数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderMistakeRows()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>答题时间分析</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">答题时间分析功能待实现。</p>
        </CardContent>
      </Card>
    </div>
  )
};

export default ExamAnalysis;
