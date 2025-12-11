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
import { Plus, Edit, Trash2 } from 'lucide-react';

const ConversionRulesSettings = ({ visible, onClose, standalone = false }) => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    hours_per_day: 8,
    description: '',
    enabled: true
  });

  // 表单错误状态
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (visible || standalone) {
      loadRules();
    }
  }, [visible, standalone]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBaseUrl()}/conversion-rules`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        if (data.data.length === 0) {
          await createDefaultRule();
        } else {
          setRules(data.data);
        }
      } else {
        toast.error(data.message || '加载规则失败');
      }
    } catch (error) {
      toast.error('加载规则失败');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultRule = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBaseUrl()}/conversion-rules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: '默认转换规则',
          ratio: 0.125, // 8小时 = 1天
          description: '8小时加班 = 1天假期',
          enabled: true
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('已自动创建默认转换规则：8小时 = 1天假期');
        loadRules();
      }
    } catch (error) {
      console.error('创建默认规则失败:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入规则名称';
    }

    if (!formData.hours_per_day || formData.hours_per_day <= 0) {
      newErrors.hours_per_day = '小时数必须大于0';
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
      const url = editingRule
        ? `${getApiBaseUrl()}/conversion-rules/${editingRule.id}`
        : `${getApiBaseUrl()}/conversion-rules`;

      const method = editingRule ? 'PUT' : 'POST';

      // 将小时数转换为比例：ratio = 1 / hours_per_day
      const ratio = 1 / formData.hours_per_day;

      const ruleData = {
        name: formData.name || '转换规则',
        ratio: ratio,
        description: formData.description,
        enabled: formData.enabled
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ruleData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(editingRule ? '更新成功' : '创建成功');
        setModalVisible(false);
        loadRules();
      } else {
        toast.error(data.message || '保存失败');
      }
    } catch (error) {
      toast.error('保存失败');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这条规则吗？')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${getApiBaseUrl()}/conversion-rules/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          toast.success('删除成功');
          loadRules();
        } else {
          toast.error(data.message || '删除失败');
        }
      } catch (error) {
        toast.error('删除失败');
      }
    }
  };

  const renderTableRows = () => {
    return rules.map((record) => (
      <TableRow key={record.id}>
        <TableCell>{record.name}</TableCell>
        <TableCell>
          {(() => {
            const hoursPerDay = Math.round(1 / record.ratio);
            return `1 天 = ${hoursPerDay} 小时`;
          })()}
        </TableCell>
        <TableCell>{record.description}</TableCell>
        <TableCell>
          <span className={record.enabled ? 'text-green-600' : 'text-gray-400'}>
            {record.enabled ? '✓ 启用' : '✗ 禁用'}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingRule(record);
                // 将ratio转换为hours_per_day显示
                const formValues = {
                  ...record,
                  hours_per_day: Math.round(1 / record.ratio)
                };
                setFormData(formValues);
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

  if (standalone) {
    return (
      <div className="p-6">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">加班转换规则配置</h2>
            <p className="text-gray-600 text-sm mt-1">配置加班时长转换为假期的规则（只能有一个规则启用）</p>
          </div>
          <Button
            onClick={() => {
              setEditingRule(null);
              setFormData({
                name: '转换规则',
                hours_per_day: 8,
                description: '8小时加班 = 1天假期',
                enabled: true
              });
              setModalVisible(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            新增规则
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>规则名称</TableHead>
              <TableHead>转换比例</TableHead>
              <TableHead>说明</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderTableRows()}
          </TableBody>
        </Table>

        <Dialog open={modalVisible} onOpenChange={setModalVisible}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingRule ? '编辑规则' : '新增规则'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  规则名称
                </Label>
                <div className="col-span-3">
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="例如：默认转换规则"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="hours_per_day" className="text-right">
                  转换比例
                </Label>
                <div className="col-span-3">
                  <Input
                    id="hours_per_day"
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    value={formData.hours_per_day}
                    onChange={(e) => setFormData({...formData, hours_per_day: parseFloat(e.target.value) || 0})}
                    placeholder="8"
                    className={errors.hours_per_day ? 'border-red-500' : ''}
                  />
                  <span className="ml-2">小时 = 1天</span>
                  {errors.hours_per_day && <p className="text-red-500 text-sm mt-1">{errors.hours_per_day}</p>}
                  <p className="text-gray-500 text-xs mt-1">输入多少小时等于1天假期</p>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  规则说明
                </Label>
                <div className="col-span-3">
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    placeholder="例如：8小时加班 = 1天假期"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="enabled" className="text-right">
                  状态
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData({...formData, enabled: checked})}
                  />
                  <span>{formData.enabled ? '启用' : '禁用'}</span>
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                <p>💡 提示：</p>
                <ul className="list-disc list-inside">
                  <li>启用新规则时，其他规则会自动禁用</li>
                  <li>输入小时数，系统自动计算转换比例</li>
                  <li>例如：输入 8，表示 8小时加班 = 1天假期</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>转换规则设置</DialogTitle>
        </DialogHeader>
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">加班转换规则配置</h2>
            <p className="text-gray-600 text-sm mt-1">配置加班时长转换为假期的规则（只能有一个规则启用）</p>
          </div>
          <Button
            onClick={() => {
              setEditingRule(null);
              setFormData({
                name: '转换规则',
                hours_per_day: 8,
                description: '8小时加班 = 1天假期',
                enabled: true
              });
              setModalVisible(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            新增规则
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>规则名称</TableHead>
              <TableHead>转换比例</TableHead>
              <TableHead>说明</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderTableRows()}
          </TableBody>
        </Table>

        <Dialog open={modalVisible} onOpenChange={setModalVisible}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingRule ? '编辑规则' : '新增规则'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  规则名称
                </Label>
                <div className="col-span-3">
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="例如：默认转换规则"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="hours_per_day" className="text-right">
                  转换比例
                </Label>
                <div className="col-span-3">
                  <Input
                    id="hours_per_day"
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    value={formData.hours_per_day}
                    onChange={(e) => setFormData({...formData, hours_per_day: parseFloat(e.target.value) || 0})}
                    placeholder="8"
                    className={errors.hours_per_day ? 'border-red-500' : ''}
                  />
                  <span className="ml-2">小时 = 1天</span>
                  {errors.hours_per_day && <p className="text-red-500 text-sm mt-1">{errors.hours_per_day}</p>}
                  <p className="text-gray-500 text-xs mt-1">输入多少小时等于1天假期</p>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  规则说明
                </Label>
                <div className="col-span-3">
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    placeholder="例如：8小时加班 = 1天假期"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="enabled" className="text-right">
                  状态
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData({...formData, enabled: checked})}
                  />
                  <span>{formData.enabled ? '启用' : '禁用'}</span>
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                <p>💡 提示：</p>
                <ul className="list-disc list-inside">
                  <li>启用新规则时，其他规则会自动禁用</li>
                  <li>输入小时数，系统自动计算转换比例</li>
                  <li>例如：输入 8，表示 8小时加班 = 1天假期</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default ConversionRulesSettings;
