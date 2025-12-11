import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getApiBaseUrl } from '../utils/apiConfig';
import dayjs from 'dayjs';

// 导入 shadcn UI 组件
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow, TableCell } from './ui/table';
import { Badge } from './ui/badge';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Calendar } from 'lucide-react';



const VacationQuotaWizard = ({ visible, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    annual_leave_default: 5,
    sick_leave_default: 10,
    overtime_to_leave_ratio: 8,
    entry_date_rule: 'prorated' // prorated or full
  });
  const [holidays, setHolidays] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [year, setYear] = useState(dayjs().year());

  // Fetch initial data
  useEffect(() => {
    if (visible) {
      fetchSettings();
      fetchHolidays();
      fetchEmployees();
    }
  }, [visible, year]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBaseUrl()}/vacation/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setSettings(prev => ({ ...prev, ...result.data }));
      }
    } catch (error) {
      console.error('Failed to fetch settings', error);
    }
  };

  const fetchHolidays = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBaseUrl()}/vacation/holidays?year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setHolidays(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch holidays', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBaseUrl()}/vacation/balance/all?year=${year}&limit=1000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setEmployees(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch employees', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${getApiBaseUrl()}/vacation/settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      });
      toast.success('设置已保存');
      next();
    } catch (error) {
      toast.error('保存失败');
    }
  };

  const next = () => {
    setCurrentStep(currentStep + 1);
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  // Step 1: Global Settings
  const renderGlobalSettings = () => (
    <div className="max-w-2xl mx-auto py-8">
      <Alert className="mb-6">
        <AlertTitle>全局默认设置</AlertTitle>
        <AlertDescription>
          这些设置将作为新员工的默认假期额度。修改此处不会影响现有员工的额度。
        </AlertDescription>
      </Alert>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">默认年假额度 (天/年)</label>
          <Input
            type="number"
            min="0"
            value={settings.annual_leave_default}
            onChange={e => setSettings({ ...settings, annual_leave_default: parseFloat(e.target.value) || 0 })}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">默认病假额度 (天/年)</label>
          <Input
            type="number"
            min="0"
            value={settings.sick_leave_default}
            onChange={e => setSettings({ ...settings, sick_leave_default: parseFloat(e.target.value) || 0 })}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">入职首年规则</label>
          <div className="flex gap-4">
            <Button
              variant={settings.entry_date_rule === 'prorated' ? 'default' : 'outline'}
              onClick={() => setSettings({ ...settings, entry_date_rule: 'prorated' })}
            >
              按比例折算
            </Button>
            <Button
              variant={settings.entry_date_rule === 'full' ? 'default' : 'outline'}
              onClick={() => setSettings({ ...settings, entry_date_rule: 'full' })}
            >
              全额发放
            </Button>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            {settings.entry_date_rule === 'prorated'
              ? '例如：6月入职，将获得 50% 的年假额度'
              : '无论何时入职，都将获得完整的年假额度'}
          </p>
        </div>
      </div>
    </div>
  );

  // Step 2: Holidays
  const [newHoliday, setNewHoliday] = useState({ date: null, name: '', type: 'holiday' });

  const handleAddHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name) {
      toast.warn('请填写完整信息');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await fetch(`${getApiBaseUrl()}/vacation/holidays`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: newHoliday.date.format('YYYY-MM-DD'),
          name: newHoliday.name,
          type: newHoliday.type
        })
      });
      toast.success('添加成功');
      setNewHoliday({ date: null, name: '', type: 'holiday' });
      fetchHolidays();
    } catch (error) {
      toast.error('添加失败');
    }
  };

  const handleDeleteHoliday = async (date) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${getApiBaseUrl()}/vacation/holidays/${date}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('删除成功');
      fetchHolidays();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const renderHolidays = () => (
    <div className="py-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">节假日与调休设置 ({year}年)</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setYear(year - 1)}>上一年</Button>
          <span className="font-bold">{year}</span>
          <Button variant="outline" onClick={() => setYear(year + 1)}>下一年</Button>
        </div>
      </div>

      {/* Add Holiday Form */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <input
            type="date"
            value={newHoliday.date ? newHoliday.date.format('YYYY-MM-DD') : ''}
            onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value ? dayjs(e.target.value) : null })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <Input
          placeholder="节日名称"
          value={newHoliday.name}
          onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })}
          className="w-32"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">调休班</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={newHoliday.type === 'holiday'}
              onChange={e => setNewHoliday({ ...newHoliday, type: e.target.checked ? 'holiday' : 'workday' })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
          <span className="text-sm text-gray-600">节假日</span>
        </div>
        <Button onClick={handleAddHoliday}>添加</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>法定节假日</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {holidays.filter(h => h.type === 'holiday').map(h => (
                <div key={h.date} className="flex justify-between items-center p-2 bg-red-50 rounded group">
                  <span>{dayjs(h.date).format('MM-DD')} {h.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">休</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteHoliday(h.date)}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              ))}
              {holidays.filter(h => h.type === 'holiday').length === 0 && <div className="text-gray-400 text-center py-4">暂无数据</div>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>调休工作日</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {holidays.filter(h => h.type === 'workday').map(h => (
                <div key={h.date} className="flex justify-between items-center p-2 bg-blue-50 rounded group">
                  <span>{dayjs(h.date).format('MM-DD')} {h.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">班</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteHoliday(h.date)}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              ))}
              {holidays.filter(h => h.type === 'workday').length === 0 && <div className="text-gray-400 text-center py-4">暂无数据</div>}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4 text-right">
        <a href="http://timor.tech/api/holiday" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
          参考国务院放假安排
        </a>
      </div>
    </div>
  );

  // Step 3: Overtime Rules
  const renderOvertimeRules = () => (
    <div className="max-w-2xl mx-auto py-8">
      <Alert className="mb-6">
        <AlertTitle>加班转换规则</AlertTitle>
        <AlertDescription>
          设置加班时长转换为调休假期的比例。
        </AlertDescription>
      </Alert>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">加班转调休比例 (小时 : 天)</label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              value={settings.overtime_to_leave_ratio}
              onChange={e => setSettings({ ...settings, overtime_to_leave_ratio: parseInt(e.target.value) || 1 })}
              className="w-32"
            />
            <span className="text-gray-600">小时 = 1 天调休</span>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            默认每 8 小时加班可转换为 1 天调休假。
          </p>
        </div>
      </div>
    </div>
  );

  // Step 4: Employee Quotas Review
  const renderEmployeeQuotas = () => {
    // Render table rows directly since we're not using Ant Design's Table anymore
    const renderTableRows = () => {
      return employees.map((record) => (
        <TableRow key={record.id}>
          <TableCell>{record.real_name}</TableCell>
          <TableCell>{record.department_name}</TableCell>
          <TableCell>
            <span className={record.annual_leave_total < settings.annual_leave_default ? 'text-orange-500' : 'text-green-600'}>
              {record.annual_leave_total}
            </span>
          </TableCell>
          <TableCell>{record.sick_leave_total}</TableCell>
          <TableCell>
            {record.annual_leave_total < settings.annual_leave_default
              ? <Badge variant="default">低于默认</Badge>
              : <Badge variant="secondary">正常</Badge>}
          </TableCell>
          <TableCell>
            <Button
              variant="link"
              onClick={() => {
                toast.info('请在"假期管理"主界面进行个别调整');
              }}
            >
              调整
            </Button>
          </TableCell>
        </TableRow>
      ));
    };

    return (
      <div className="py-4">
        <Alert className="mb-4">
          <AlertTitle>额度概览</AlertTitle>
          <AlertDescription>
            当前共有 {employees.length} 名员工。以下列表展示了当前的额度状态，您可以在"假期管理"主界面进行个别调整。
          </AlertDescription>
        </Alert>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>年假余额</TableHead>
                <TableHead>病假余额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderTableRows()}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const steps = [
    { title: '全局设置', content: renderGlobalSettings() },
    { title: '节假日', content: renderHolidays() },
    { title: '加班规则', content: renderOvertimeRules() },
    { title: '额度概览', content: renderEmployeeQuotas() },
  ];

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">假期配置向导</h2>
          <Button variant="ghost" onClick={onClose}>关闭</Button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Custom step indicator */}
          <div className="mb-8">
            <div className="flex justify-between relative">
              {/* Progress line */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                ></div>
              </div>

              {steps.map((step, index) => (
                <div key={step.title} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors ${index <= currentStep ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                  >
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                  <span
                    className={`text-sm ${index <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-500'}`}
                  >
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            {steps[currentStep].content}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-between">
          <Button
            onClick={prev}
            disabled={currentStep === 0}
          >
            上一步
          </Button>

          {currentStep < steps.length - 1 && (
            <Button
              onClick={currentStep === 0 || currentStep === 2 ? handleSaveSettings : next}
            >
              保存并下一步
            </Button>
          )}

          {currentStep === steps.length - 1 && (
            <Button
              onClick={() => {
                toast.success('配置完成');
                onSuccess?.();
                onClose();
              }}
            >
              完成配置
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VacationQuotaWizard;
