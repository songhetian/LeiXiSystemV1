// [SHADCN-REPLACED]
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Shadcn UI Components
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table';
import { MotionCard } from '../components/ui/motion-card';
import { MotionTable, MotionTableBody, MotionTableCell, MotionTableHead, MotionTableHeader, MotionTableRow } from '../components/ui/motion-table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';

// Icons
import {
  Plus,
  Edit,
  Trash2,
  Pin,
  PinOff
} from 'lucide-react';

import { getApiBaseUrl } from '../utils/apiConfig';

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

const VacationTypeManagementOptimized = ({ visible, onClose, standalone = false }) => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [quickAddModalVisible, setQuickAddModalVisible] = useState(false);
  const [selectedQuickTypes, setSelectedQuickTypes] = useState(COMMON_VACATION_TYPES.map(t => t.code));
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    base_days: 0,
    description: '',
    included_in_total: true,
    enabled: true
  });

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
  const handleNameChange = (value) => {
    setFormData(prev => ({
      ...prev,
      name: value
    }));

    if (!editingType && value) {
      const existingCodes = types.map(t => t.code);
      const generatedCode = generateVacationCode(value, existingCodes);
      setFormData(prev => ({
        ...prev,
        code: generatedCode
      }));
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
        alert(data.message || '加载假期类型失败');
      }
    } catch (error) {
      alert('加载假期类型失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
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
        alert(editingType ? '更新成功' : '创建成功');
        setModalVisible(false);
        loadTypes();
      } else {
        alert(data.message || '保存失败');
      }
    } catch (error) {
      alert('保存失败');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('确定要删除这个假期类型吗？')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${getApiBaseUrl()}/vacation-types/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          alert('删除成功');
          loadTypes();
        } else {
          alert(data.message || '删除失败');
        }
      } catch (error) {
        alert('删除失败');
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
        alert(currentPinned ? '已取消置顶' : '已置顶');
        loadTypes();
      } else {
        alert(data.message || '操作失败');
      }
    } catch (error) {
      alert('操作失败');
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
        alert('选中的类型已全部存在');
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

      alert(`成功添加 ${successCount} 个假期类型`);
      setQuickAddModalVisible(false);
      loadTypes();
    } catch (error) {
      alert('批量添加失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const openModal = (type = null) => {
    if (type) {
      setEditingType(type);
      setFormData(type);
    } else {
      setEditingType(null);
      setFormData({
        code: '',
        name: '',
        base_days: 0,
        description: '',
        included_in_total: true,
        enabled: true
      });
    }
    setModalVisible(true);
  };

  const content = (
    <>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">假期类型管理</h2>
          <p className="text-gray-600 text-sm mt-1">管理系统中的假期类型配置</p>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setQuickAddModalVisible(true)}
          >
            <Plus className="w-4 h-4" />
            快捷添加
          </Button>
          <Button
            className="flex items-center gap-2"
            onClick={() => openModal()}
          >
            <Plus className="w-4 h-4" />
            新增类型
          </Button>
        </div>
      </div>

      <MotionCard>
        <MotionTable>
          <MotionTableHeader>
            <MotionTableRow>
              <MotionTableHead>置顶</MotionTableHead>
              <MotionTableHead>名称</MotionTableHead>
              <MotionTableHead>描述</MotionTableHead>
              <MotionTableHead>计入总额</MotionTableHead>
              <MotionTableHead>状态</MotionTableHead>
              <MotionTableHead>操作</MotionTableHead>
            </MotionTableRow>
          </MotionTableHeader>
          <MotionTableBody>
            {types.map((record, index) => (
              <MotionTableRow
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <MotionTableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePin(record.id, record.is_pinned)}
                  >
                    {record.is_pinned ? (
                      <Pin className="w-4 h-4 text-blue-500" />
                    ) : (
                      <PinOff className="w-4 h-4" />
                    )}
                  </Button>
                </MotionTableCell>
                <MotionTableCell>{record.name}</MotionTableCell>
                <MotionTableCell>{record.description}</MotionTableCell>
                <MotionTableCell>
                  <span className={record.included_in_total ? 'text-blue-600' : 'text-gray-400'}>
                    {record.included_in_total ? '是' : '否'}
                  </span>
                </MotionTableCell>
                <MotionTableCell>
                  <span className={record.enabled ? 'text-green-600' : 'text-gray-400'}>
                    {record.enabled ? '启用' : '禁用'}
                  </span>
                </MotionTableCell>
                <MotionTableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => openModal(record)}
                    >
                      <Edit className="w-4 h-4" />
                      编辑
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => handleDelete(record.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
                    </Button>
                  </div>
                </MotionTableCell>
              </MotionTableRow>
            ))}
          </MotionTableBody>
        </MotionTable>
      </MotionCard>

      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingType ? '编辑类型' : '新增类型'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">类型代码 (唯一标识)</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="例如: annual_leave"
                disabled={!!editingType}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">类型名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="例如: 年假"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_days">基准天数 (默认额度)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="base_days"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.base_days}
                  onChange={(e) => handleInputChange('base_days', parseFloat(e.target.value) || 0)}
                />
                <span>天</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="included_in_total">计入总假期额度</Label>
              <Switch
                id="included_in_total"
                checked={formData.included_in_total}
                onCheckedChange={(checked) => handleInputChange('included_in_total', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">状态</Label>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => handleInputChange('enabled', checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalVisible(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={quickAddModalVisible} onOpenChange={setQuickAddModalVisible}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>快捷添加常用假期</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="mb-4 text-gray-600">请选择要添加的假期类型（已存在的将自动跳过）：</p>
            <div className="grid grid-cols-1 gap-4">
              {COMMON_VACATION_TYPES.map(type => (
                <label key={type.code} className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    checked={selectedQuickTypes.includes(type.code)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedQuickTypes([...selectedQuickTypes, type.code]);
                      } else {
                        setSelectedQuickTypes(selectedQuickTypes.filter(c => c !== type.code));
                      }
                    }}
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
            <Button variant="outline" onClick={() => setQuickAddModalVisible(false)}>
              取消
            </Button>
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

  return content;
};

export default VacationTypeManagementOptimized;
