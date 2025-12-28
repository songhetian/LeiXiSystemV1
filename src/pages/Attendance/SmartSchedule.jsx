import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../utils/apiConfig';
import { getCurrentUser, isSystemAdmin } from '../../utils/auth';

const SmartSchedule = () => {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [restShiftId, setRestShiftId] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedMonth, setSelectedMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [scheduleRules, setScheduleRules] = useState([
    { id: Date.now(), employee_id: '', start_day: '', end_day: '', shift_id: '' }
  ]);
  const [generatedSchedule, setGeneratedSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    loadDepartments();
    loadRestShift();
  }, []);

  // 当月份改变时，更新开始和结束日期
  useEffect(() => {
    updateDateRange();
  }, [selectedMonth]);

  const updateDateRange = () => {
    const { year, month } = selectedMonth;
    // 月初
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    // 月末
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    setStartDate(start);
    setEndDate(end);
  };

  const handlePrevMonth = () => {
    setSelectedMonth(prev => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  };

  const setQuickMonth = (offset = 0) => {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    setSelectedMonth({
      year: targetDate.getFullYear(),
      month: targetDate.getMonth() + 1
    });
  };

  useEffect(() => {
    if (selectedDepartment) {
      loadEmployees();
      loadShifts();
    }
  }, [selectedDepartment]);

  const loadDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(getApiUrl('/api/departments/list'), { headers });

      if (response.data.success) {
        const depts = response.data.data || [];
        setDepartments(depts);

        if (depts.length > 0) {
          setSelectedDepartment(depts[0].id);
        }
      } else {
        console.error('加载部门失败:', response.data.message);
        setDepartments([]);
      }
    } catch (error) {
      console.error('加载部门失败:', error);
      setDepartments([]);
    }
  };

  const loadEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(getApiUrl('/api/employees'), { headers });
      if (response.data) {
        const deptEmployees = response.data.filter(
          e => e.department_id == selectedDepartment && e.status === 'active'
        );
        setEmployees(deptEmployees);
      }
    } catch (error) {
      console.error('获取员工列表失败:', error);
    }
  };

  const loadShifts = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(getApiUrl('/api/shifts'), {
        params: { is_active: 1, limit: 100 },
        headers
      });
      if (response.data.success) {
        setShifts(response.data.data);
      }
    } catch (error) {
      console.error('获取班次列表失败:', error);
    }
  };

  const loadRestShift = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(getApiUrl('/api/shifts/rest'), { headers });
      if (response.data.success) {
        setRestShiftId(response.data.data.id);
      }
    } catch (error) {
      console.error('获取休息班次失败:', error);
    }
  };

  const addRule = () => {
    setScheduleRules([...scheduleRules, {
      id: Date.now(),
      employee_id: '',
      start_day: '',
      end_day: '',
      shift_id: ''
    }]);
  };

  const removeRule = (id) => {
    if (scheduleRules.length > 1) {
      setScheduleRules(scheduleRules.filter(rule => rule.id !== id));
    }
  };

  const updateRule = (id, field, value) => {
    setScheduleRules(scheduleRules.map(rule => {
      if (rule.id === id) {
        const updatedRule = { ...rule, [field]: value };

        // 如果修改了开始日期，确保结束日期不小于开始日期
        if (field === 'start_day' && updatedRule.end_day && parseInt(value) > parseInt(updatedRule.end_day)) {
          updatedRule.end_day = value;
        }

        // 如果修改了结束日期，确保结束日期不小于开始日期
        if (field === 'end_day' && updatedRule.start_day && parseInt(value) < parseInt(updatedRule.start_day)) {
          return rule; // 不更新，保持原值
        }

        return updatedRule;
      }
      return rule;
    }));
  };

  const parseScheduleRules = () => {
    const rules = [];

    for (const rule of scheduleRules) {
      if (!rule.employee_id || !rule.start_day || !rule.end_day) {
        continue; // 跳过不完整的规则
      }

      const employee = employees.find(e => e.id == rule.employee_id);
      if (!employee) continue;

      let shift = null;
      let action = '休息';

      if (rule.shift_id && rule.shift_id != restShiftId) {
        shift = shifts.find(s => s.id == rule.shift_id);
        action = shift?.name || '休息';
      }

      rules.push({
        employee_id: employee.id,
        employee_name: employee.real_name,
        start_day: parseInt(rule.start_day),
        end_day: parseInt(rule.end_day),
        action: action,
        shift_id: shift?.id || null,
        shift_name: shift?.name || null
      });
    }

    return rules;
  };

  const generateSchedule = async () => {
    if (!selectedDepartment || !startDate || !endDate) {
      setModalMessage('请填写完整信息');
      setShowModal(true);
      return;
    }

    setLoading(true);
    setModalMessage('正在生成排班方案...');
    setShowModal(true);

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // 解析排班规则
      const parsedRules = parseScheduleRules();

      const response = await axios.post(getApiUrl('/api/smart-schedule/generate-excel'), {
        departmentId: selectedDepartment,
        startDate,
        endDate,
        textRules: parsedRules
      }, {
        headers,
        responseType: 'blob'  // 接收文件
      });

      // 下载Excel文件
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `排班方案_${startDate}_${endDate}.xlsx`;
      link.click();

      setModalMessage('✅ 排班方案已生成并下载！\n\n请查看Excel文件，确认后可通过"排班管理"页面导入。');
    } catch (error) {
      console.error('生成排班失败:', error);
      setModalMessage('❌ 生成排班失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const applySchedule = async () => {
    if (!generatedSchedule) {
      alert('请先生成排班方案');
      return;
    }

    if (conflicts.length > 0) {
      if (!window.confirm(`检测到 ${conflicts.length} 个冲突，确定要应用吗？`)) {
        return;
      }
    }

    if (!window.confirm('确定要应用此排班方案吗？这将覆盖现有排班。')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.post(getApiUrl('/api/smart-schedule/apply'), {
        schedule: generatedSchedule.schedule
      }, { headers });

      alert('排班方案已应用！员工将收到通知。');
      setGeneratedSchedule(null);
      setConflicts([]);
    } catch (error) {
      console.error('应用排班失败:', error);
      alert('应用排班失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const exportSchedule = () => {
    if (!generatedSchedule) return;

    const csv = convertToCSV(generatedSchedule.schedule);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `schedule_${startDate}_${endDate}.csv`;
    link.click();
  };

  const convertToCSV = (schedule) => {
    const headers = ['员工ID', '班次ID', '日期', '是否休息'];
    const rows = schedule.map(s => [
      s.employee_id,
      s.shift_id || '',
      s.schedule_date,
      s.is_rest_day ? '是' : '否'
    ]);

    return [headers, ...rows].map(row => row.jo).join('\n');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 头部 */}
      <div className="mx-auto max-w-6xl mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">智能排班</h1>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Automation Scheduler</p>
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-blue-600/20 to-transparent w-full"></div>
      </div>

      {/* 模态框 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => !loading && setShowModal(false)}>
          <div className="w-full max-w-md transform rounded-xl bg-white p-8 shadow-2xl border border-gray-100 transition-all text-center" onClick={(e) => e.stopPropagation()}>
            {loading ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-12 h-12 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-sm text-gray-600 font-medium">正在生成排班方案...</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="whitespace-pre-line text-gray-700 font-medium leading-relaxed">{modalMessage}</p>
                </div>
                <div className="flex justify-center border-t border-gray-50 pt-5">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-12 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                  >
                    确认
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl space-y-6 pb-12">
        {/* 主要表单区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：基本设置 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm sticky top-6">
              <div className="flex items-center gap-2 mb-6 pb-3 border-b border-gray-50">
                <span className="text-lg">⚙️</span>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">设置参数</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">选择部门</label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-gray-900 focus:ring-0 transition-all cursor-pointer"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    {departments.length === 0 ? (
                      <option value="">加载中...</option>
                    ) : (
                      departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">排班周期</label>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setQuickMonth(0)}
                        className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        本月
                      </button>
                      <button
                        onClick={() => setQuickMonth(1)}
                        className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        下月
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex items-center shadow-inner">
                    <button onClick={handlePrevMonth} className="p-3 text-gray-400 hover:text-blue-600 hover:bg-white transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="flex-1 text-center py-2.5 border-x border-gray-100">
                      <span className="text-sm font-black text-gray-900 tracking-tight">{selectedMonth.year}年 {selectedMonth.month}月</span>
                    </div>
                    <button onClick={handleNextMonth} className="p-3 text-gray-400 hover:text-blue-600 hover:bg-white transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                  <div className="mt-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100/30 text-center">
                    <span className="text-[10px] font-bold text-blue-600 tracking-tight flex items-center justify-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {startDate} → {endDate}
                    </span>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={generateSchedule}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    )}
                    <span>生成排班方案</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：规则列表 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm min-h-[500px]">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">规则定义</h3>
                </div>
                <button
                  onClick={addRule}
                  className="bg-blue-600 text-white px-5 py-2 text-xs font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  添加新规则
                </button>
              </div>

              <div className="space-y-4">
                {scheduleRules.map((rule, index) => (
                  <div key={rule.id} className="group relative flex items-center gap-4 bg-gray-50/50 border border-gray-100 rounded-xl p-5 hover:bg-white hover:border-gray-200 hover:shadow-md transition-all">
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-xs font-black text-gray-400">
                      {index + 1}
                    </div>

                    <div className="grid flex-1 grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">客服人员</label>
                        <select
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:border-gray-900 focus:ring-0 transition-all"
                          value={rule.employee_id}
                          onChange={(e) => updateRule(rule.id, 'employee_id', e.target.value)}
                        >
                          <option value="">请选择</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.real_name} ({emp.employee_no})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">开始日期</label>
                        <select
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:border-gray-900 focus:ring-0"
                          value={rule.start_day}
                          onChange={(e) => updateRule(rule.id, 'start_day', e.target.value)}
                        >
                          <option value="">请选择</option>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day}>{day}号</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">结束日期</label>
                        <select
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:border-gray-900 focus:ring-0 disabled:opacity-40"
                          value={rule.end_day}
                          onChange={(e) => updateRule(rule.id, 'end_day', e.target.value)}
                          disabled={!rule.start_day}
                        >
                          <option value="">请选择</option>
                          {Array.from({ length: 31 }, (_, i) => i + 1)
                            .filter(day => !rule.start_day || day >= parseInt(rule.start_day))
                            .map(day => (
                              <option key={day} value={day}>{day}号</option>
                            ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">排班班次</label>
                        <select
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:border-gray-900 focus:ring-0"
                          value={rule.shift_id}
                          onChange={(e) => updateRule(rule.id, 'shift_id', e.target.value)}
                        >
                          <option value="">请选择</option>
                          {shifts.map(shift => (
                            <option key={shift.id} value={shift.id}>{shift.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {scheduleRules.length > 1 && (
                      <button
                        onClick={() => removeRule(rule.id)}
                        className="w-8 h-8 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                        title="删除规则"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {scheduleRules.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-sm font-medium">暂未添加排班规则</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartSchedule;
