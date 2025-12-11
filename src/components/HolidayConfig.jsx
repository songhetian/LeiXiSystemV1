import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../utils/apiConfig';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

// 导入 shadcn UI 组件
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Calendar, Plus, Edit, Trash2 } from 'lucide-react';

const { Option } = Select;

const HolidayConfig = () => {
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(dayjs().year());
  const [holidays, setHolidays] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [vacationTypes, setVacationTypes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [form, setForm] = useState({
    days: 1,
    month: 1,
    vacation_type_id: null
  });

  // 表单错误状态
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
    loadVacationTypes();
  }, [year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // 加载节假日列表
      const holidaysRes = await fetch(`${getApiBaseUrl()}/holidays?year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const holidaysData = await holidaysRes.json();

      // 加载月度汇总
      const summaryRes = await fetch(`${getApiBaseUrl()}/holidays/monthly-summary?year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const summaryData = await summaryRes.json();

      if (holidaysData.success) {
        setHolidays(holidaysData.data);
      }

      if (summaryData.success) {
        setMonthlySummary(summaryData.data);
      }
    } catch (error) {
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

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

  // 根据假期类型名称查找类型ID
  const findVacationTypeByName = (typeName) => {
    const type = vacationTypes.find(t => t.name === typeName);
    return type?.id || null;
  };

  const handleAdd = (month) => {
    setEditingHoliday(null);
    setForm({ days: 1, month, vacation_type_id: null });
    setModalVisible(true);
  };

  const handleEdit = (holiday) => {
    setEditingHoliday(holiday);
    setForm({
      days: holiday.days,
      month: holiday.month,
      vacation_type_id: holiday.vacation_type_id || null
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个节假日配置吗？')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${getApiBaseUrl()}/holidays/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success) {
          toast.success('删除成功');
          loadData();
        } else {
          toast.error(result.message || '删除失败');
        }
      } catch (error) {
        toast.error('删除失败');
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.vacation_type_id) {
      newErrors.vacation_type_id = '请选择假期类型';
    }

    if (!form.days || form.days <= 0) {
      newErrors.days = '天数必须大于0';
    }

    if (!form.month) {
      newErrors.month = '请选择月份';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      // 获取假期类型名称作为name
      const selectedType = vacationTypes.find(t => t.id === form.vacation_type_id);
      const name = selectedType?.name || '假期';

      const url = editingHoliday
        ? `${getApiBaseUrl()}/holidays/${editingHoliday.id}`
        : `${getApiBaseUrl()}/holidays`;

      const response = await fetch(url, {
        method: editingHoliday ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          days: form.days,
          month: form.month,
          year: editingHoliday ? undefined : year,
          vacation_type_id: form.vacation_type_id
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(editingHoliday ? '更新成功' : '创建成功');
        setModalVisible(false);
        loadData();
      } else {
        toast.error(result.message || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleQuickAdd = async (typeName, days, month) => {
    try {
      const token = localStorage.getItem('token');
      let typeId = findVacationTypeByName(typeName);

      // 如果不存在假期类型，自动创建
      if (!typeId) {
        try {
          const HOLIDAY_CODES = {
            '元旦': 'new_year',
            '春节': 'spring_festival',
            '清明节': 'qingming',
            '劳动节': 'labor_day',
            '端午节': 'dragon_boat',
            '中秋节': 'mid_autumn',
            '国庆节': 'national_day'
          };

          const code = HOLIDAY_CODES[typeName] || `holiday_${Date.now()}`;

          const createTypeRes = await fetch(`${getApiBaseUrl()}/vacation-types`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              code,
              name: typeName,
              base_days: days,
              included_in_total: false, // 节假日通常不计入总额度
              description: `${typeName}假期`,
              enabled: true
            })
          });

          const createTypeData = await createTypeRes.json();
          if (createTypeData.success) {
            typeId = createTypeData.data.insertId || createTypeData.data.id;
            message.success(`自动创建假期类型: ${typeName}`);
            // 重新加载假期类型列表
            loadVacationTypes();
          } else {
            message.error(`创建假期类型失败: ${createTypeData.message}`);
            return;
          }
        } catch (err) {
          console.error('创建假期类型出错:', err);
          message.error('自动创建假期类型失败');
          return;
        }
      }

      const response = await fetch(`${getApiBaseUrl()}/holidays`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: typeName,
          days,
          month,
          year,
          vacation_type_id: typeId
        })
      });

      const result = await response.json();
      if (result.success) {
        message.success(`已添加${typeName}`);
        loadData();
      } else {
        message.error(result.message || '添加失败');
      }
    } catch (error) {
      message.error('添加失败');
    }
  };

  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];

  const getMonthHolidays = (month) => {
    return holidays.filter(h => h.month === month);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* 头部 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">节假日配置</h1>
          <p className="text-gray-600 mt-1">配置全年节假日和假期天数</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">年份:</span>
          <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4].map(i => (
                <SelectItem key={i} value={(dayjs().year() - 2 + i).toString()}>
                  {dayjs().year() - 2 + i}年
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 快速操作按钮组 */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => handleQuickAdd('元旦', 1, 1)}>
          <Plus className="mr-2 h-4 w-4" />
          快速添加元旦
        </Button>
        <Button onClick={() => handleQuickAdd('春节', 7, 2)}>
          <Plus className="mr-2 h-4 w-4" />
          快速添加春节
        </Button>
        <Button onClick={() => handleQuickAdd('清明节', 3, 4)}>
          <Plus className="mr-2 h-4 w-4" />
          快速添加清明节
        </Button>
        <Button onClick={() => handleQuickAdd('劳动节', 5, 5)}>
          <Plus className="mr-2 h-4 w-4" />
          快速添加劳动节
        </Button>
        <Button onClick={() => handleQuickAdd('端午节', 3, 6)}>
          <Plus className="mr-2 h-4 w-4" />
          快速添加端午节
        </Button>
        <Button onClick={() => handleQuickAdd('中秋节', 3, 9)}>
          <Plus className="mr-2 h-4 w-4" />
          快速添加中秋节
        </Button>
        <Button onClick={() => handleQuickAdd('国庆节', 7, 10)}>
          <Plus className="mr-2 h-4 w-4" />
          快速添加国庆节
        </Button>
      </div>

      {/* 月度卡片视图 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {monthNames.map((monthName, index) => {
          const month = index + 1;
          const monthHolidays = getMonthHolidays(month);
          const summary = monthlySummary.find(s => s.month === month) || { total_days: 0, holiday_count: 0 };

          return (
            <Card key={month} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="text-blue-500 h-5 w-5" />
                  {monthName}
                </CardTitle>
                <Badge variant="secondary">{summary.total_days} 天</Badge>
              </CardHeader>
              <CardContent>
                {monthHolidays.length === 0 ? (
                  <div className="my-4 text-center text-gray-500">
                    <p>暂无节假日</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {monthHolidays.map(holiday => (
                      <div
                        key={holiday.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{holiday.vacation_type_name || holiday.name}</div>
                          <div className="text-sm text-gray-500">{holiday.days} 天</div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(holiday)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(holiday.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 编辑模态框 */}
      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingHoliday ? '编辑节假日' : '新增节假日'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="vacation_type_id" className="text-sm font-medium text-gray-700 mb-2">
                假期类型 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.vacation_type_id ? form.vacation_type_id.toString() : ""}
                onValueChange={(value) => {
                  const selectedType = vacationTypes.find(t => t.id === parseInt(value));
                  setForm({
                    ...form,
                    vacation_type_id: parseInt(value),
                    // 如果选择了假期类型且有基准天数，自动填充
                    days: selectedType?.base_days > 0 ? selectedType.base_days : form.days
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择假期类型" />
                </SelectTrigger>
                <SelectContent>
                  {vacationTypes.map(type => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vacation_type_id && <p className="text-red-500 text-sm mt-1">{errors.vacation_type_id}</p>}
            </div>
            <div>
              <Label htmlFor="days" className="text-sm font-medium text-gray-700 mb-2">
                天数 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="days"
                type="number"
                min="1"
                max="31"
                value={form.days}
                onChange={(e) => setForm({ ...form, days: parseInt(e.target.value) || 0 })}
                className={errors.days ? 'border-red-500' : ''}
              />
              {errors.days && <p className="text-red-500 text-sm mt-1">{errors.days}</p>}
            </div>
            <div>
              <Label htmlFor="month" className="text-sm font-medium text-gray-700 mb-2">
                所属月份 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.month.toString()}
                onValueChange={(value) => setForm({ ...form, month: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((name, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.month && <p className="text-red-500 text-sm mt-1">{errors.month}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HolidayConfig;
