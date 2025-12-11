import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ExcelJS from 'exceljs';
import { toast } from 'react-toastify';

// 导入 shadcn UI 组件
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';

// 导入 Lucide React 图标
import { Upload, Download, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

const QuestionImport = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [fileList, setFileList] = useState([]);
  const [parsedData, setParsedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDownloadTemplate = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('题目导入模板');

    worksheet.columns = [
      { header: '题型 (type)', key: 'type', width: 15 },
      { header: '题目内容 (content)', key: 'content', width: 50 },
      { header: '分值 (score)', key: 'score', width: 10 },
      { header: '选项 (options)', key: 'options', width: 40 },
      { header: '正确答案 (correct_answer)', key: 'correct_answer', width: 40 },
      { header: '解析 (explanation)', key: 'explanation', width: 50 },
    ];

    worksheet.addRow({
      type: 'single_choice',
      content: '以下哪个是正确的选项？',
      score: 5,
      options: '["选项A", "选项B", "选项C", "选项D"]',
      correct_answer: '"选项A"',
      explanation: '这是正确选项的解释。',
    });
    worksheet.addRow({
      type: 'multiple_choice',
      content: '以下哪些是正确的选项？',
      score: 10,
      options: '["选项A", "选项B", "选项C", "选项D"]',
      correct_answer: '["选项A", "选项C"]',
      explanation: '这是正确选项的解释。',
    });
    worksheet.addRow({
      type: 'true_false',
      content: '地球是方的。',
      score: 2,
      options: '["true", "false"]',
      correct_answer: 'false',
      explanation: '地球是圆的。',
    });
    worksheet.addRow({
      type: 'fill_blank',
      content: '中国的首都是____。',
      score: 5,
      options: '[]',
      correct_answer: '["北京"]',
      explanation: '北京是中国的首都。',
    });
    worksheet.addRow({
      type: 'essay',
      content: '请简述你对人工智能的理解。',
      score: 20,
      options: '[]',
      correct_answer: '人工智能是...',
      explanation: '参考答案：人工智能是...',
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '题目导入模板.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    }).catch(error => {
      toast.error('下载模板失败');
      console.error('Failed to download template:', error);
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isXLSX = file.name.endsWith('.xlsx');
    if (!isXLSX) {
      toast.error('只能上传 XLSX 文件!');
      return;
    }

    const isLt2M = file.size / 1024 / 1024 < 10; // 10MB limit
    if (!isLt2M) {
      toast.error('文件大小不能超过 10MB!');
      return;
    }

    if (isXLSX && isLt2M) {
      setFileList([file]);
      parseExcel(file);
    }
  };

  const parseExcel = async (file) => {
    setLoading(true);
    setImportErrors([]);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target.result;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.getWorksheet(1);
        const headers = worksheet.getRow(1).values.map(h => {
          // Extract key from header like "题型 (type)" -> "type"
          const match = h.match(/\(([^)]+)\)/);
          return match ? match[1] : h;
        });

        const data = [];
        const errors = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row

          const rowData = {};
          row.eachCell((cell, colNumber) => {
            const headerKey = headers[colNumber - 1];
            if (headerKey) {
              rowData[headerKey] = cell.value;
            }
          });

          // Basic validation
          const { type, content, score, options, correct_answer, explanation } = rowData;
          let isValid = true;
          let rowError = '';

          if (!type || !content || !score) {
            isValid = false;
            rowError += '缺少必填字段 (题型, 题目内容, 分值); ';
          }
          if (isNaN(score) || score <= 0) {
            isValid = false;
            rowError += '分值必须是大于0的数字; ';
          }

          // Type-specific validation
          try {
            switch (type) {
              case 'single_choice':
              case 'multiple_choice':
                if (!options || !correct_answer) {
                  isValid = false;
                  rowError += '选择题必须提供选项和正确答案; ';
                } else {
                  const parsedOptions = JSON.parse(options);
                  if (!Array.isArray(parsedOptions) || parsedOptions.length < 2) {
                    isValid = false;
                    rowError += '选项必须是包含至少两个元素的JSON数组; ';
                  }
                  const parsedCorrectAnswer = JSON.parse(correct_answer);
                  if (type === 'single_choice' && (Array.isArray(parsedCorrectAnswer) || !parsedOptions.includes(parsedCorrectAnswer))) {
                    isValid = false;
                    rowError += '单选题正确答案必须是单个选项值且存在于选项中; ';
                  }
                  if (type === 'multiple_choice' && (!Array.isArray(parsedCorrectAnswer) || parsedCorrectAnswer.length < 2 || !parsedCorrectAnswer.every(ans => parsedOptions.includes(ans)))) {
                    isValid = false;
                    rowError += '多选题正确答案必须是包含至少两个选项值的JSON数组且存在于选项中; ';
                  }
                }
                break;
              case 'true_false':
                if (correct_answer !== 'true' && correct_answer !== 'false') {
                  isValid = false;
                  rowError += '判断题正确答案必须是 "true" 或 "false"; ';
                }
                break;
              case 'fill_blank':
                if (!correct_answer) {
                  isValid = false;
                  rowError += '填空题必须提供正确答案; ';
                } else {
                  const parsedCorrectAnswer = JSON.parse(correct_answer);
                  if (!Array.isArray(parsedCorrectAnswer) || parsedCorrectAnswer.length === 0) {
                    isValid = false;
                    rowError += '填空题正确答案必须是包含至少一个关键词的JSON数组; ';
                  }
                }
                break;
              case 'essay':
                // Essay questions don't strictly require correct_answer for auto-grading, but can have reference
                break;
              default:
                isValid = false;
                rowError += '无效的题型; ';
            }
          } catch (jsonError) {
            isValid = false;
            rowError += `JSON解析错误: ${jsonError.message}; `;
          }

          if (isValid) {
            data.push({ ...rowData, key: rowNumber });
          } else {
            errors.push({ row: rowNumber, message: rowError, data: rowData });
          }
        });
        setParsedData(data);
        setImportErrors(errors);
        if (errors.length > 0) {
          toast.warning(`文件解析完成，发现 ${errors.length} 条错误。`);
        } else {
          toast.success('文件解析成功，请确认后导入。');
        }
      } catch (error) {
        toast.error('解析 Excel 文件失败');
        console.error('Failed to parse Excel:', error);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportConfirm = async () => {
    if (parsedData.length === 0) {
      toast.warning('没有可导入的题目。');
      return;
    }
    if (importErrors.length > 0) {
      toast.error('存在错误数据，请修正后重新上传。');
      return;
    }

    setLoading(true);
    try {
      // Backend API for batch import (not yet implemented, placeholder)
      await axios.post(`/api/exams/${examId}/questions/batch-import`, { questions: parsedData }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('题目批量导入成功！');
      navigate(`/assessment/exams/${examId}`);
    } catch (error) {
      toast.error(`批量导入失败: ${error.response?.data?.message || error.message}`);
      console.error('Failed to batch import questions:', error);
    } finally {
      setLoading(false);
    }
  };

  // 自定义加载指示器组件
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>批量导入题目</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <LoadingSpinner />}

          <div className="flex flex-wrap gap-2 mb-6">
            <Button variant="outline" onClick={() => navigate(`/assessment/exams/${examId}`)} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回试卷详情
            </Button>
            <Button onClick={handleDownloadTemplate} className="flex items-center">
              <Download className="h-4 w-4 mr-2" />
              下载导入模板
            </Button>

            <div className="relative">
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                <Upload className="h-4 w-4 mr-2" />
                上传题目文件 (.xlsx)
              </label>
            </div>
          </div>

          {parsedData.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>导入预览</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">行号</TableHead>
                      <TableHead>题型</TableHead>
                      <TableHead>题目内容</TableHead>
                      <TableHead className="w-20">分值</TableHead>
                      <TableHead>选项</TableHead>
                      <TableHead>正确答案</TableHead>
                      <TableHead>解析</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((item) => (
                      <TableRow key={item.key}>
                        <TableCell>{item.key}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{item.content}</TableCell>
                        <TableCell>{item.score}</TableCell>
                        <TableCell className="max-w-xs truncate">{item.options}</TableCell>
                        <TableCell className="max-w-xs truncate">{item.correct_answer}</TableCell>
                        <TableCell className="max-w-xs truncate">{item.explanation}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="flex items-center"
                        disabled={parsedData.length === 0 || importErrors.length > 0}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        确认导入 ({parsedData.length} 条)
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>确认导入</DialogTitle>
                        <DialogDescription>
                          确认导入所有有效题目吗？
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                          取消
                        </Button>
                        <Button onClick={() => {
                          setIsDialogOpen(false);
                          handleImportConfirm();
                        }}>
                          确认
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setParsedData([]);
                      setFileList([]);
                      setImportErrors([]);
                    }}
                  >
                    清空预览
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {importErrors.length > 0 && (
            <Card className="mb-6 border-red-500">
              <CardHeader>
                <CardTitle className="text-red-500">导入错误</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">行号</TableHead>
                      <TableHead>错误信息</TableHead>
                      <TableHead>原始数据</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importErrors.map((error) => (
                      <TableRow key={error.row}>
                        <TableCell>{error.row}</TableCell>
                        <TableCell className="text-red-500">{error.message}</TableCell>
                        <TableCell className="max-w-xs truncate">{JSON.stringify(error.data)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionImport;
