import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getApiBaseUrl } from '../utils/apiConfig';

// 导入 shadcn UI 组件
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';



const VacationTrendChart = ({ employeeId }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [months, setMonths] = useState(6);

  useEffect(() => {
    if (employeeId) {
      loadTrendData();
    }
  }, [employeeId, months]);

  const loadTrendData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${getApiBaseUrl()}/vacation/trend-data?employee_id=${employeeId}&months=${months}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        toast.error(result.message || '加载趋势数据失败');
      }
    } catch (error) {
      console.error('加载趋势数据失败:', error);
      toast.error('加载趋势数据失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>假期使用趋势</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">时间范围:</span>
          <select
            value={months}
            onChange={(e) => setMonths(parseInt(e.target.value))}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
          >
            <option value={3}>近3个月</option>
            <option value={6}>近6个月</option>
            <option value={12}>近12个月</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-80">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div style={{ height: 350 }}>
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    label={{ value: '月份', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    label={{ value: '天数', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="annual_leave_used"
                    name="年假使用"
                    stroke="#1890ff"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="overtime_leave_used"
                    name="加班假使用"
                    stroke="#52c41a"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sick_leave_used"
                    name="病假使用"
                    stroke="#faad14"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                暂无数据
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VacationTrendChart;
