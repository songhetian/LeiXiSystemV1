import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getApiBaseUrl } from '../utils/apiConfig';
import dayjs from 'dayjs';

// 导入 shadcn UI 组件
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { ChevronRight } from 'lucide-react';



const VacationYearlyView = ({ employeeId, year: initialYear }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [year, setYear] = useState(initialYear || dayjs().year());

  useEffect(() => {
    if (employeeId) {
      loadYearlyData();
    }
  }, [employeeId, year]);

  const loadYearlyData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${getApiBaseUrl()}/vacation/usage-details?employee_id=${employeeId}&year=${year}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const result = await response.json();

      if (result.success) {
        // Group data by month
        const monthlyData = groupByMonth(result.data);
        setData(monthlyData);
      } else {
        toast.error(result.message || '加载年度数据失败');
      }
    } catch (error) {
      console.error('加载年度数据失败:', error);
      toast.error('加载年度数据失败');
    } finally {
      setLoading(false);
    }
  };

  const groupByMonth = (records) => {
    const months = {};

    records.forEach(record => {
      const month = dayjs(record.created_at).format('YYYY-MM');
      if (!months[month]) {
        months[month] = {
          month,
          records: [],
          totalUsed: 0,
          totalAdded: 0,
          annualUsed: 0,
          overtimeUsed: 0,
          sickUsed: 0
        };
      }

      months[month].records.push(record);

      if (record.change_type === 'deduction') {
        const amount = Math.abs(parseFloat(record.amount || 0));
        months[month].totalUsed += amount;

        if (record.leave_type === 'annual_leave') months[month].annualUsed += amount;
        if (record.leave_type === 'overtime_leave') months[month].overtimeUsed += amount;
        if (record.leave_type === 'sick_leave') months[month].sickUsed += amount;
      } else if (record.change_type === 'addition') {
        months[month].totalAdded += parseFloat(record.amount || 0);
      }
    });

    return Object.values(months).sort((a, b) => b.month.localeCompare(a.month));
  };

  const renderMonthPanel = (monthData, isOpen, onToggle) => {
    const monthName = dayjs(monthData.month).format('YYYY年MM月');
    const netChange = monthData.totalAdded - monthData.totalUsed;

    return (
      <div className="border border-gray-200 rounded-lg mb-2">
        <div
          className="flex items-center justify-between w-full p-4 cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-lg"
          onClick={onToggle}
        >
          <div className="flex items-center gap-4">
            <ChevronRight className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            <span className="font-semibold text-gray-800">{monthName}</span>
            <span className="text-sm text-gray-500">{monthData.records.length} 条记录</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">
              <span className="text-green-600">+{monthData.totalAdded.toFixed(1)}</span>
              {' / '}
              <span className="text-red-600">-{monthData.totalUsed.toFixed(1)}</span>
            </span>
            <span className={`text-sm font-semibold ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              净变化: {netChange > 0 ? '+' : ''}{netChange.toFixed(1)} 天
            </span>
          </div>
        </div>

        {isOpen && (
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-4">
              {/* Monthly Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-xs text-gray-500 mb-1">总使用</div>
                  <div className="text-lg font-bold text-gray-800">{monthData.totalUsed.toFixed(1)} 天</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">总增加</div>
                  <div className="text-lg font-bold text-green-600">{monthData.totalAdded.toFixed(1)} 天</div>
                </div>
              </div>

              {/* Records List */}
              <div className="space-y-2">
                {monthData.records.map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-500">
                        {dayjs(record.created_at).format('MM-DD HH:mm')}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          record.change_type === 'deduction' ? 'bg-red-100 text-red-700' :
                          record.change_type === 'addition' ? 'bg-green-100 text-green-700' :
                          record.change_type === 'conversion' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {record.change_type === 'deduction' ? '扣减' :
                           record.change_type === 'addition' ? '增加' :
                           record.change_type === 'conversion' ? '转换' : '调整'}
                        </span>
                        <span className="text-sm text-gray-600">{record.reason || '-'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-semibold ${
                        parseFloat(record.amount) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {parseFloat(record.amount) > 0 ? '+' : ''}{record.amount} 天
                      </span>
                      {record.balance_after != null && (
                        <span className="text-xs text-gray-500">
                          余额: {record.balance_after} 天
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Calculate yearly summary
  const yearlySummary = data.reduce((acc, monthData) => {
    acc.totalUsed += monthData.totalUsed;
    acc.totalAdded += monthData.totalAdded;
    acc.annualUsed += monthData.annualUsed;
    acc.overtimeUsed += monthData.overtimeUsed;
    acc.sickUsed += monthData.sickUsed;
    return acc;
  }, { totalUsed: 0, totalAdded: 0, annualUsed: 0, overtimeUsed: 0, sickUsed: 0 });

  // State to track open panels
  const [openPanels, setOpenPanels] = useState(new Set());

  // Toggle panel open/close
  const togglePanel = (panelKey) => {
    const newOpenPanels = new Set(openPanels);
    if (newOpenPanels.has(panelKey)) {
      newOpenPanels.delete(panelKey);
    } else {
      newOpenPanels.add(panelKey);
    }
    setOpenPanels(newOpenPanels);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <span>年度使用汇总</span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">年份:</span>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
          >
            {[0, 1, 2, 3, 4].map(i => (
              <option key={i} value={dayjs().year() - 2 + i}>
                {dayjs().year() - 2 + i}年
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-80">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            {/* Yearly Summary */}
            <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <div className="text-lg font-semibold text-gray-800 mb-4">{year}年度汇总</div>
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center col-span-2">
                  <div className="text-xs text-gray-600 mb-2">总使用</div>
                  <div className="text-2xl font-bold text-gray-800">{yearlySummary.totalUsed.toFixed(1)}</div>
                  <div className="text-xs text-gray-500 mt-1">天</div>
                </div>
                <div className="text-center col-span-2">
                  <div className="text-xs text-gray-600 mb-2">总增加</div>
                  <div className="text-2xl font-bold text-green-600">{yearlySummary.totalAdded.toFixed(1)}</div>
                  <div className="text-xs text-gray-500 mt-1">天</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-2">净变化</div>
                  <div className={`text-2xl font-bold ${
                    (yearlySummary.totalAdded - yearlySummary.totalUsed) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(yearlySummary.totalAdded - yearlySummary.totalUsed) > 0 ? '+' : ''}
                    {(yearlySummary.totalAdded - yearlySummary.totalUsed).toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">天</div>
                </div>
              </div>
            </div>

            {/* Monthly Breakdown */}
            {data.length > 0 ? (
              <div className="space-y-2">
                {data.map(monthData =>
                  renderMonthPanel(
                    monthData,
                    openPanels.has(monthData.month),
                    () => togglePanel(monthData.month)
                  )
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                本年度暂无记录
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default VacationYearlyView;
