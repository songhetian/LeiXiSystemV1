import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../utils/apiConfig';
import { formatDate, formatDateTime } from '../utils/date';
import VacationTrendChart from './VacationTrendChart';
import VacationTypeComparisonChart from './VacationTypeComparisonChart';
import VacationMonthlyView from './VacationMonthlyView';
import VacationYearlyView from './VacationYearlyView';

// 导入 shadcn UI 组件
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow, TableCell } from './ui/table';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { User, Calendar, Clock, FileText, History } from 'lucide-react';

const { TabPane } = Tabs;

const VacationDetailModal = ({ visible, onClose, employee, year }) => {
  const [loading, setLoading] = useState(false);
  const [balanceData, setBalanceData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [vacationTypes, setVacationTypes] = useState([]);

  useEffect(() => {
    if (visible && employee) {
      loadVacationTypes();
      loadData();
    }
  }, [visible, employee, year]);

  const loadVacationTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBaseUrl()}/vacation/types`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setVacationTypes(result.data);
      }
    } catch (error) {
      console.error('加载假期类型失败:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // 加载动态类型余额数据
      const balanceRes = await fetch(
        `${getApiBaseUrl()}/vacation/type-balances/${employee.employee_id}?year=${year}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const balanceResult = await balanceRes.json();

      if (balanceResult.success) {
        setBalanceData(balanceResult.data);
      }

      // 加载历史记录
      const historyRes = await fetch(
        `${getApiBaseUrl()}/vacation/balance/history?employee_id=${employee.employee_id}&page=1&limit=100`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const historyResult = await historyRes.json();

      if (historyResult.success) {
        setHistoryData(historyResult.data);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (typeCode) => {
    const colorMap = {
      'annual_leave': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
      'sick_leave': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
      'overtime_leave': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' },
      'personal_leave': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
      'marriage_leave': { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600' },
      'maternity_leave': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' }
    };
    return colorMap[typeCode] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600' };
  };

  const getLeaveTypeTag = (type) => {
    const typeMap = {
      'annual_leave': { text: '年假' },
      'sick_leave': { text: '病假' },
      'overtime_leave': { text: '加班假' },
      'personal_leave': { text: '事假' },
      'marriage_leave': { text: '婚假' },
      'maternity_leave': { text: '产假' }
    };
    const config = typeMap[type] || { text: type };
    return <Badge variant="secondary">{config.text}</Badge>;
  };

  const getChangeTypeTag = (type) => {
    const typeMap = {
      'addition': { text: '增加' },
      'deduction': { text: '扣减' },
      'conversion': { text: '转换' },
      'adjustment': { text: '调整' }
    };
    const config = typeMap[type] || { text: type };
    return <Badge variant="secondary">{config.text}</Badge>;
  };

  const renderTableRows = () => {
    return historyData.map((record) => (
      <TableRow key={record.id}>
        <TableCell>{formatDateTime(record.created_at)}</TableCell>
        <TableCell>{getChangeTypeTag(record.change_type)}</TableCell>
        <TableCell>
          <span className={record.amount > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
            {record.amount > 0 ? '+' : ''}{record.amount} 天
          </span>
        </TableCell>
        <TableCell>{record.balance_after != null ? `${record.balance_after} 天` : '-'}</TableCell>
        <TableCell>{record.operator_name}</TableCell>
        <TableCell>{record.approval_no || '-'}</TableCell>
        <TableCell>{record.reason}</TableCell>
      </TableRow>
    ));
  };

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary-600" />
              <span>假期详情 - {employee?.real_name}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
          <Tabs defaultValue="balance">
            <TabsList>
              <TabsTrigger value="balance">
                <Calendar className="h-4 w-4 mr-2" />
                余额详情
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                变更历史
              </TabsTrigger>
              <TabsTrigger value="trend">
                <Clock className="h-4 w-4 mr-2" />
                趋势分析
              </TabsTrigger>
            </TabsList>

            {/* 余额详情 */}
            <TabsContent value="balance">
              {balanceData && (
                <div className="space-y-6 mt-4">
                  {/* 基本信息 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">工号</div>
                      <div>{employee?.employee_no}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">部门</div>
                      <div>{employee?.department_name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">年度</div>
                      <div>{year}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">最后更新</div>
                      <div>{balanceData.last_updated ? formatDateTime(balanceData.last_updated) : '-'}</div>
                    </div>
                  </div>

                  {/* 假期余额概览 */}
                  <div>
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      假期余额概览
                    </h4>

                    {(() => {
                      const totalStats = balanceData?.balances?.reduce((acc, curr) => ({
                        total: acc.total + parseFloat(curr.total || 0),
                        used: acc.used + parseFloat(curr.used || 0),
                        remaining: acc.remaining + parseFloat(curr.remaining || 0)
                      }), { total: 0, used: 0, remaining: 0 });

                      return (
                        <div className="grid grid-cols-3 gap-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-gray-500 mb-1">总额度</div>
                            <div className="text-2xl font-bold text-blue-600">{totalStats?.total.toFixed(1)} <span className="text-sm font-normal text-gray-500">天</span></div>
                          </div>
                          <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <div className="text-gray-500 mb-1">已使用</div>
                            <div className="text-2xl font-bold text-orange-600">{totalStats?.used.toFixed(1)} <span className="text-sm font-normal text-gray-500">天</span></div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-gray-500 mb-1">剩余</div>
                            <div className="text-2xl font-bold text-green-600">{totalStats?.remaining.toFixed(1)} <span className="text-sm font-normal text-gray-500">天</span></div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* 变更历史 */}
            <TabsContent value="history">
              <div className="mt-4 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>时间</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>变更数量</TableHead>
                      <TableHead>变更后余额</TableHead>
                      <TableHead>操作人</TableHead>
                      <TableHead>审批单号</TableHead>
                      <TableHead>原因</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {renderTableRows()}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* 趋势分析 */}
            <TabsContent value="trend">
              <div className="space-y-6 mt-4">
                <VacationTrendChart employeeId={employee?.employee_id} year={year} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VacationDetailModal;
