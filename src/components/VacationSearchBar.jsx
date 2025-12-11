import React, { useState, useEffect } from 'react';
import { useDebounce, getQuickDateRange, daysBetween } from '../hooks/useVacationHelpers';
import dayjs from 'dayjs';

// 导入 shadcn UI 组件
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Calendar } from 'lucide-react';



const VacationSearchBar = ({ onSearch, loading }) => {
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [quickRange, setQuickRange] = useState(null);

  // 防抖搜索文本
  const debouncedSearchText = useDebounce(searchText, 300);

  // 当防抖值变化时触发搜索
  useEffect(() => {
    handleSearch();
  }, [debouncedSearchText, dateRange]);

  const handleSearch = () => {
    const [startDate, endDate] = dateRange;
    onSearch({
      keyword: debouncedSearchText,
      startDate: startDate ? startDate.format('YYYY-MM-DD') : null,
      endDate: endDate ? endDate.format('YYYY-MM-DD') : null
    });
  };

  const handleQuickRange = (type) => {
    const [start, end] = getQuickDateRange(type);
    if (start && end) {
      setDateRange([dayjs(start), dayjs(end)]);
      setQuickRange(type);
    }
  };

  const handleClear = () => {
    setSearchText('');
    setDateRange([null, null]);
    setQuickRange(null);
  };

  const handleDateChange = (dates) => {
    setDateRange(dates || [null, null]);
    setQuickRange(null); // 清除快捷选择标记
  };

  // 验证日期范围不超过365天
  const disabledDate = (current) => {
    if (!dateRange || !dateRange[0]) {
      return false;
    }
    const tooLate = current && current.diff(dateRange[0], 'days') > 365;
    const tooEarly = current && dateRange[0].diff(current, 'days') > 365;
    return tooEarly || tooLate;
  };

  const quickRangeOptions = [
    { label: '今日', value: 'today', color: 'blue' },
    { label: '本周', value: 'week', color: 'cyan' },
    { label: '本月', value: 'month', color: 'green' },
    { label: '本季度', value: 'quarter', color: 'orange' },
    { label: '本年', value: 'year', color: 'purple' }
  ];

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
      <div className="space-y-4">
        {/* 搜索框 */}
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <Input
                placeholder="搜索姓名、工号或审批单号..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 rounded-lg"
              />
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={loading}
            className="px-6"
          >
            {loading ? '搜索中...' : '搜索'}
          </Button>

          {(searchText || dateRange[0]) && (
            <Button
              onClick={handleClear}
              variant="outline"
            >
              清除
            </Button>
          )}
        </div>

        {/* 日期范围选择 */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">日期范围:</span>
          </div>

          {/* 快捷选择按钮 */}
          <div className="flex gap-2 flex-wrap">
            {quickRangeOptions.map(option => (
              <button
                key={option.value}
                className={`px-3 py-1 text-sm rounded-full transition-opacity ${quickRange === option.value ? `bg-${option.color}-500 text-white` : 'bg-gray-200 text-gray-700 hover:opacity-80'}`}
                onClick={() => handleQuickRange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* 自定义日期范围 */}
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : ''}
              onChange={(e) => handleDateChange([e.target.value ? dayjs(e.target.value) : null, dateRange[1]])}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <span className="text-gray-500">至</span>
            <input
              type="date"
              value={dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : ''}
              onChange={(e) => handleDateChange([dateRange[0], e.target.value ? dayjs(e.target.value) : null])}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* 显示选中的天数 */}
          {dateRange[0] && dateRange[1] && (
            <span className="text-sm text-gray-500">
              共 {daysBetween(dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')) + 1} 天
            </span>
          )}
        </div>

        {/* 提示信息 */}
        {debouncedSearchText !== searchText && (
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
            正在搜索...
          </div>
        )}
      </div>
    </div>
  );
};

export default VacationSearchBar;
