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

// Icons
import { 
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';

import { getApiBaseUrl } from '../utils/apiConfig';

const ConversionRulesSettingsOptimized = ({ visible, onClose, standalone = false }) => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    hours_per_day: 8,
    description: '',
    enabled: true
  });

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
        // 使用浏览器原生alert替代message
        alert(data.message || '加载规则失败');
      }
    } catch (error) {
      alert('加载规则失败');
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
        alert('已自动创建默认转换规则：8小时 = 1天假期');
        loadRules();
      }
    } catch (error) {
      console.error('创建默认规则失败:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.hours_per_day || formData.hours_per_day <= 0) {
      alert('小时数必须大于0');
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
        alert(editingRule ? '更新成功' : '创建成功');
        setModalVisible(false);
        loadRules();
      } else {
        alert(data.message || '保存失败');
      }
    } catch (error) {
      alert('保存失败');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('确定要删除这条规则吗？')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${getApiBaseUrl()}/conversion-rules/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          alert('删除成功');
          loadRules();
        } else {
          alert(data.message || '删除失败');
        }
      } catch (error) {
        alert('删除失败');
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const openModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      // 将ratio转换为hours_per_day显示
      const formValues = {
        ...rule,
        hours_per_day: Math.round(1 / rule.ratio)
      };
      setFormData(formValues);
    } else {
      setEditingRule(null);
      setFormData({
        name: '转换规则',
        hours_per_day: 8,
        description: '8小时加班 = 1天假期',
        enabled: true
      });
    }
    setModalVisible(true);
  };

  const content = (
    <>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">加班转换规则配置</h2>
          <p className="text-gray-600 text-sm mt-1">配置加班时长转换为假期的规则（只能有一个规则启用）</p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={() => openModal()}
        >
          <Plus className="w-4 h-4" />
          新增规则
        </Button>
      </div>

      <MotionCard>
        <MotionTable>
          <MotionTableHeader>
            <MotionTableRow>
              <MotionTableHead>规则名称</MotionTableHead>
              <MotionTableHead>转换比例</MotionTableHead>
              <MotionTableHead>说明</MotionTableHead>
              <MotionTableHead>状态</MotionTableHead>
              <MotionTableHead>操作</MotionTableHead>
            </MotionTableRow>
          </MotionTableHeader>
          <MotionTableBody>
            {rules.map((record, index) => (
              <MotionTableRow 
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <MotionTableCell>{record.name}</MotionTableCell>
                <MotionTableCell>
                  {(() => {
                    const hoursPerDay = Math.round(1 / record.ratio);
                    return `1 天 = ${hoursPerDay} 小时`;
                  })()}
                </MotionTableCell>
                <MotionTableCell>{record.description}</MotionTableCell>
                <MotionTableCell>
                  {record.enabled ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>启用</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400">
                      <XCircle className="w-4 h-4" />
                      <span>禁用</span>
                    </div>
                  )}
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
            <DialogTitle>{editingRule ? '编辑规则' : '新增规则'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">规则名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="例如：默认转换规则"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours_per_day">转换比例</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="hours_per_day"
                  type="number"
                  min="1"
                  max="24"
                  step="0.5"
                  value={formData.hours_per_day}
                  onChange={(e) => handleInputChange('hours_per_day', parseFloat(e.target.value) || 0)}
                  placeholder="8"
                />
                <span>小时 = 1天</span>
              </div>
              <p className="text-sm text-gray-500">输入多少小时等于1天假期</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">规则说明</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                placeholder="例如：8小时加班 = 1天假期"
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
            <Button variant="outline" onClick={() => setModalVisible(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              保存
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

export default ConversionRulesSettingsOptimized;