import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../utils/apiConfig';
import { toast } from 'react-toastify';

// 导入 shadcn UI 组件
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow, TableCell } from './ui/table';
import { Textarea } from './ui/textarea';
import { Pin, PinOff, Edit, Trash2, Plus } from 'lucide-react';

const COMMON_VACATION_TYPES = [
  { code: 'annual', name: '年假', base_days: 5, included_in_total: true, description: '法定年休假' },
  { code: 'sick', name: '病假', base_days: 12, included_in_total: true, description: '因病请假' },
  { code: 'personal', name: '事假', base_days: 0, included_in_total: false, description: '因私事请假' },
  { code: 'marriage', name: '婚假', base_days: 3, included_in_total: false, description: '结婚请假' },
  { code: 'maternity', name: '产假', base_days: 98, included_in_total: false, description: '生育请假' },
  { code: 'paternity', name: '陪产假', base_days: 15, included_in_total: false, description: '陪护妻子生育' },
  { code: 'bereavement', name: '丧假', base_days: 3, included_in_total: false, description: '直系亲属去世' },
  { code: 'compensatory', name: '调休', base_days: 0, included_in_total: true, description: '加班调休' },
];

const VacationTypeManagement = ({ visible, onClose, standalone = false }) => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [quickAddModalVisible, setQuickAddModalVisible] = useState(false);
  const [selectedQuickTypes, setSelectedQuickTypes] = useState(COMMON_VACATION_TYPES.map(t => t.code));

  // 表单状态
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    base_days: 0,
    description: '',
    included_in_total: true,
    enabled: true
  });

  // 表单错误状态
  const [errors, setErrors] = useState({});

  // 中文名称到英文的映射
  const chineseToEnglishMap = {
    '年假': 'annual',
    '病假': 'sick',
    '事假': 'personal',
    '婚假': 'marriage',
    '产假': 'maternity',
    '陪产假': 'paternity',
    '丧假': 'bereavement',
    '调休': 'compensatory'
  };

  // 生成唯一的假期类型编码
  const generateVacationCode = (name, existingCodes = []) => {
    if (!name) return '';

    // 1. 检查是否有直接映射
    if (chineseToEnglishMap[name]) {
      let code = chineseToEnglishMap[name];
      // 检查唯一性
      let counter = 1;
      let uniqueCode = code;
      while (existingCodes.includes(uniqueCode)) {
        uniqueCode = `${code}_${counter}`;
        counter++;
      }
      return uniqueCode;
    }

    // 2. 处理其他名称
    let code = name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // 移除特殊字符
      .replace(/\s+/g, '_') // 替换空格为下划线
      .replace(/^_|_$/g, ''); // 移除首尾下划线

    // 3. 确保唯一性
    let counter = 1;
    let uniqueCode = code;
    while (existingCodes.includes(uniqueCode)) {
      uniqueCode = `${code}_${counter}`;
      counter++;
    }

    return uniqueCode;
  };

  // 处理名称变化，自动生成编码
  const handleNameChange = (e) => {
    const name = e.target.value;
    if (!editingType && name) {
      const existingCodes = types.map(t => t.code);
      const generatedCode = generateVacationCode(name, existingCodes);
      setFormData({ ...formData, code: generatedCode, name });
    } else {
      setFormData({ ...formData, name });
    }
  };

  useEffect(() => {
    if (visible || standalone) {
      loadTypes();
    }
  }, [visible, standalone]);

  const loadTypes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBaseUrl()}/vacation-types`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        // 按照置顶和排序顺序排列
        const sortedTypes = data.data.sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) {
            return b.is_pinned - a.is_pinned; // 置顶的在前
          }
          return (a.sort_order || 999) - (b.sort_order || 999);
        });
        setTypes(sortedTypes);
      } else {
        toast.error(data.message || '加载假期类型失败');
      }
    } catch (error) {
      toast.error('加载假期类型失败');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = '请输入类型代码';
    }

    if (!formData.name.trim()) {
      newErrors.name = '请输入类型名称';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingType
        ? `${getApiBaseUrl()}/vacation-types/${editingType.id}`
        : `${getApiBaseUrl()}/vacation-types`;

      const method = editingType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(editingType ? '更新成功' : '创建成功');
        setModalVisible(false);
        loadTypes();
      } else {
        toast.error(data.message || '保存失败');
      }
    } catch (error) {
      toast.error('保存失败');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个假期类型吗？')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${getApiBaseUrl()}/vacation-types/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          toast.success('删除成功');
          loadTypes();
        } else {
          toast.error(data.message || '删除失败');
        }
      } catch (error) {
        toast.error('删除失败');
      }
    }
  };

  const handleTogglePin = async (id, currentPinned) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBaseUrl()}/vacation-types/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_pinned: !currentPinned })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(currentPinned ? '已取消置顶' : '已置顶');
        loadTypes();
      } else {
        toast.error(data.message || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleQuickAdd = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const existingCodes = types.map(t => t.code);
      const typesToAdd = COMMON_VACATION_TYPES.filter(
        t => selectedQuickTypes.includes(t.code) && !existingCodes.includes(t.code)
      );

      if (typesToAdd.length === 0) {
        toast.info('选中的类型已全部存在');
        setQuickAddModalVisible(false);
        setLoading(false);
        return;
      }

      let successCount = 0;
      for (const type of typesToAdd) {
        try {
          const response = await fetch(`${getApiBaseUrl()}/vacation-types`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(type)
          });
          const data = await response.json();
          if (data.success) successCount++;
        } catch (e) {
          console.error(`Failed to add ${type.name}`, e);
        }
      }

      toast.success(`成功添加 ${successCount} 个假期类型`);
      setQuickAddModalVisible(false);
      loadTypes();
    } catch (error) {
      toast.error('批量添加失败');
    } finally {
      setLoading(false);
    }
  };

  const renderTableRows = () => {
    return types.map((record) => (
      <TableRow key={record.id}>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTogglePin(record.id, record.is_pinned)}
          >
            {record.is_pinned ? <Pin className="h-4 w-4 text-blue-500" /> : <PinOff className="h-4 w-4" />}
          </Button>
        </TableCell>
        <TableCell>{record.name}</TableCell>
        <TableCell>{record.description}</TableCell>
        <TableCell>
          <span className={record.included_in_total ? 'text-blue-600' : 'text-gray-400'}>
            {record.included_in_total ? '是' : '否'}
          </span>
        </TableCell>
        <TableCell>
          <span className={record.enabled ? 'text-green-600' : 'text-gray-400'}>
            {record.enabled ? '启用' : '禁用'}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingType(record);
                setFormData({
                  code: record.code,
                  name: record.name,
                  base_days: record.base_days,
                  description: record.description,
                  included_in_total: record.included_in_total,
                  enabled: record.enabled
                });
                setModalVisible(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(record.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  const content = (
    <>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">假期类型管理</h2>
          <p className="text-gray-600 text-sm mt-1">管理系统中的假期类型配置</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setQuickAddModalVisible(true)}>
            <Plus className="h-4 w-4 mr-1" />
            快捷添加
          </Button>
          <Button
            onClick={() => {
              setEditingType(null);
              setFormData({
                code: '',
                name: '',
                base_days: 0,
                description: '',
                included_in_total: true,
                enabled: true
              });
              setModalVisible(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            新增类型
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>置顶</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>计入总额</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderTableRows()}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingType ? '编辑类型' : '新增类型'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                类型代码 (唯一标识)
              </Label>
              <div className="col-span-3">
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="例如: annual_leave"
                  disabled={!!editingType}
                  readOnly={!!editingType}
                  className={errors.code ? 'border-red-500' : ''}
                />
                {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                类型名称
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="例如: 年假"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="base_days" className="text-right">
                基准天数 (默认额度)
              </Label>
              <div className="col-span-3">
                <Input
                  id="base_days"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.base_days}
                  onChange={(e) => setFormData({ ...formData, base_days: parseFloat(e.target.value) || 0 })}
                  className="w-full"
                />
                <span className="ml-2">天</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                描述
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                计入总假期额度
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="included_in_total"
                  checked={formData.included_in_total}
                  onCheckedChange={(checked) => setFormData({ ...formData, included_in_total: checked })}
                />
                <span>{formData.included_in_total ? '是' : '否'}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                状态
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
                <span>{formData.enabled ? '启用' : '禁用'}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={quickAddModalVisible} onOpenChange={setQuickAddModalVisible}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>快捷添加常用假期</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4 text-gray-600">请选择要添加的假期类型（已存在的将自动跳过）：</p>
            <div className="grid grid-cols-2 gap-4">
              {COMMON_VACATION_TYPES.map(type => (
                <label key={type.code} className="flex items-center space-x-2 cursor-pointer p-2 border rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedQuickTypes.includes(type.code)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedQuickTypes([...selectedQuickTypes, type.code]);
                      } else {
                        setSelectedQuickTypes(selectedQuickTypes.filter(c => c !== type.code));
                      }
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium">{type.name}</div>
                    <div className="text-xs text-gray-500">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleQuickAdd} disabled={loading}>
              {loading ? '添加中...' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  if (standalone) {
    return <div className="p-6">{content}</div>;
  }

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>假期类型管理</DialogTitle>
        </DialogHeader>
        <div className="max-h-[80vh] overflow-y-auto pr-2">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VacationTypeManagement;
