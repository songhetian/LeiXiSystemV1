import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getApiBaseUrl } from '../utils/apiConfig';
import { toast } from 'sonner';
import CustomModal from './CustomModal';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Loader2 } from 'lucide-react';

const BatchVacationQuotaEditModal = ({ visible, onClose, employees = [], year, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState([]);
  const [formData, setFormData] = useState({});
  const [mode, setMode] = useState('overwrite'); // 'overwrite' or 'add'

  useEffect(() => {
    if (visible) {
      loadTypes();
      // 初始化表单数据
      const initialData = {};
      types.filter(t => supportedTypes.includes(t.code)).forEach(type => {
        initialData[type.code] = '';
      });
      setFormData(initialData);
    }
  }, [visible]);

  const loadTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const typesRes = await fetch(`${getApiBaseUrl()}/vacation-types`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const typesData = await typesRes.json();

      if (typesData.success) {
        const activeTypes = typesData.data.filter(t => t.enabled);
        setTypes(activeTypes);

        // 初始化表单数据
        const initialData = {};
        activeTypes.filter(t => supportedTypes.includes(t.code)).forEach(type => {
          initialData[type.code] = '';
        });
        setFormData(initialData);
      }
    } catch (error) {
      toast.error('加载假期类型失败');
    }
  };

  const handleInputChange = (typeCode, value) => {
    setFormData({
      ...formData,
      [typeCode]: value
    });
  };

  const handleOk = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      const quotas = Object.keys(formData).map(key => ({
        type: key,
        days: formData[key] !== '' ? parseFloat(formData[key]) : undefined
      })).filter(q => q.days !== undefined && q.days !== null);

      if (quotas.length === 0) {
        toast.warn('请至少输入一项额度');
        setLoading(false);
        return;
      }

      // Process each employee sequentially (or parallel)
      // For better UX, we should probably have a batch API, but frontend loop is fine for small batches
      let successCount = 0;
      let failCount = 0;

      for (const employee of employees) {
        try {
          // If mode is 'add', we need to fetch current balance first?
          // The current API is PUT /balance/:id which sets the total.
          // So 'add' mode would require fetching first.
          // For now, let's stick to 'overwrite' as implemented in the single edit modal logic
          // But wait, the single edit modal logic (VacationQuotaEditModal) does a PUT with { quotas }.
          // The backend `vacation-optimization.js` -> `updateVacationBalance` uses `balance[field] = days`.
          // So it is an overwrite of the TOTAL quota.

          // If we want to support 'add', we need to know the current.
          // Let's just support 'overwrite' for now to be safe and consistent.

          const response = await fetch(`${getApiBaseUrl()}/vacation/balance/${employee.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              year,
              quotas
            })
          });

          const result = await response.json();
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (e) {
          failCount++;
        }
      }

      if (failCount === 0) {
        toast.success(`成功更新 ${successCount} 位员工的额度`);
        onSuccess();
        onClose();
      } else {
        toast.warn(`更新完成: ${successCount} 成功, ${failCount} 失败`);
        onSuccess(); // Still reload data
        onClose();
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const supportedTypes = ['annual_leave', 'sick_leave', 'overtime_leave'];

  const leaveTypeNames = {
    'annual_leave': '年假',
    'sick_leave': '病假',
    'overtime_leave': '加班假'
  };

  return (
    <CustomModal
      isOpen={visible}
      onClose={onClose}
      title={`批量编辑假期额度 - 已选 ${employees.length} 人 (${year}年)`}
      size="large"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleOk} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            确认
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Alert variant="warning">
          <AlertTitle>批量操作警告</AlertTitle>
          <AlertDescription>
            此操作将直接覆盖所选员工的假期总额度。请谨慎操作。
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {types.filter(t => supportedTypes.includes(t.code)).map(type => (
            <div key={type.id} className="space-y-2">
              <Label htmlFor={type.code}>{type.name}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id={type.code}
                  type="number"
                  min={0}
                  step={0.5}
                  value={formData[type.code] || ''}
                  onChange={(e) => handleInputChange(type.code, e.target.value)}
                  placeholder="保持不变"
                  className="flex-1"
                />
                <div className="text-sm text-gray-500 whitespace-nowrap">天</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-gray-400 text-xs text-center">
          注：留空则不修改该类型的额度
        </div>
      </div>
    </CustomModal>
  );
};

export default BatchVacationQuotaEditModal;
