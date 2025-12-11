import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../utils/apiConfig';
import { formatDate } from '../utils/date';
import { toast } from 'react-toastify';

// 导入 shadcn UI 组件
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from './ui/table';
import { Badge } from './ui/badge';

const BalanceChangeHistory = ({ visible, onClose, employeeId, year }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && employeeId) {
      loadHistory();
    }
  }, [visible, employeeId, year]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${getApiBaseUrl()}/vacation/balance-changes?employee_id=${employeeId}`;
      if (year) {
        url += `&year=${year}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setHistory(data.data);
      } else {
        toast.error(data.message || '加载历史记录失败');
      }
    } catch (error) {
      toast.error('加载历史记录失败');
    } finally {
      setLoading(false);
    }
  };

  const getChangeTypeTag = (type) => {
    const map = {
      'addition': { variant: 'success', text: '增加' },
      'deduction': { variant: 'destructive', text: '扣减' },
      'conversion': { variant: 'default', text: '转换' },
      'adjustment': { variant: 'secondary', text: '调整' }
    };
    const config = map[type] || { variant: 'default', text: type };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getLeaveTypeName = (type) => {
    const map = {
      'annual_leave': '年假',
      'compensatory': '调休假',
      'sick_leave': '病假',
      'personal_leave': '事假',
      'marriage_leave': '婚假',
      'maternity_leave': '产假',
      'paternity_leave': '陪产假',
      'bereavement_leave': '丧假'
    };
    return map[type] || type;
  };

  // Render table rows directly since we're not using Ant Design's Table anymore
  const renderTableRows = () => {
    return history.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{formatDate(item.created_at, true)}</TableCell>
        <TableCell>{getChangeTypeTag(item.change_type)}</TableCell>
        <TableCell>{getLeaveTypeName(item.leave_type)}</TableCell>
        <TableCell>
          <span className={item.amount > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
            {item.amount > 0 ? '+' : ''}{item.amount} 天
          </span>
        </TableCell>
        <TableCell>{item.balance_after != null ? `${item.balance_after} 天` : '-'}</TableCell>
        <TableCell>{item.reason}</TableCell>
      </TableRow>
    ));
  };

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>额度变更历史</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>变更类型</TableHead>
                <TableHead>假期类型</TableHead>
                <TableHead>变更数量</TableHead>
                <TableHead>变更后余额</TableHead>
                <TableHead>原因</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderTableRows()}
            </TableBody>
          </Table>
          {history.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">暂无数据</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BalanceChangeHistory;
