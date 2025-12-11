import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getApiBaseUrl } from '../utils/apiConfig';

// 导入 shadcn UI 组件
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const VacationQuotaEditModal = ({ visible, onClose, employee, year, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState([]);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, employee, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // 1. Load vacation types
      const typesRes = await fetch(`${getApiBaseUrl()}/vacation-types`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const typesData = await typesRes.json();

      if (typesData.success) {
        const activeTypes = typesData.data.filter(t => t.enabled);
        setTypes(activeTypes);

        // 2. Load current balance for the employee
        if (employee) {
          // We might need a specific endpoint to get balance details or just use the list endpoint filtered
          // Since we don't have a direct single-balance endpoint, we use the list one
          const balanceRes = await fetch(`${getApiBaseUrl()}/vacation/balance?employee_id=${employee.id}&year=${year}`, {
             headers: { 'Authorization': `Bearer ${token}` }
          });
          const balanceData = await balanceRes.json();

          if (balanceData.success && balanceData.data.length > 0) {
             const balance = balanceData.data[0];
             // Map balance fields to form values
             const formValues = {};
             activeTypes.forEach(type => {
               // Mapping: annual_leave -> annual_leave_total
               // For now we only support editing specific hardcoded columns in DB unless we made it dynamic
               // The backend update logic handles: annual_leave, compensatory, sick_leave
               // We should map type.code to the expected form field name

               let fieldName = `${type.code}_total`;
               // Handle special cases if DB column names don't match pattern exactly
               if (type.code === 'compensatory') fieldName = 'compensatory_leave_total';

               // Check if balance object has this key
               if (balance[fieldName] !== undefined) {
                 formValues[type.code] = balance[fieldName];
               } else {
                 // If not found in balance (maybe new type not in DB columns yet), default to 0 or base_days
                 formValues[type.code] = 0;
               }
             });
             // Set form data with loaded values
             setFormData(formValues);
          } else {
            // No balance record yet, set defaults from types
            const defaults = {};
            activeTypes.forEach(t => defaults[t.code] = t.base_days);
            setFormData(defaults);
          }
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && types.length > 0) {
      const initialData = {};
      types.filter(t => supportedTypes.includes(t.code)).forEach(type => {
        // Get current value from form or set default
        initialData[type.code] = 0;
      });
      setFormData(initialData);
    }
  }, [visible, types]);

  const handleInputChange = (typeCode, value) => {
    setFormData(prev => ({
      ...prev,
      [typeCode]: value
    }));
  };

  const handleOk = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      // Transform form values to the format expected by API
      // API expects: { year, quotas: [{ type: 'annual_leave', days: 10 }, ...] }
      const quotas = Object.keys(formData).map(key => ({
        type: key,
        days: formData[key]
      }));

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

      const data = await response.json();
      if (data.success) {
        toast.success('额度更新成功');
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || '更新失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  // Filter types that we can actually edit (those that have corresponding columns in DB)
  // Currently DB has: annual_leave_total, compensatory_leave_total, sick_leave_total, overtime_leave_total
  // The backend `vacation-optimization.js` supports: annual_leave, compensatory, sick_leave, overtime_leave
  const supportedTypes = ['annual_leave', 'sick_leave', 'overtime_leave'];

  const leaveTypeNames = {
    'annual_leave': '年假',
    'sick_leave': '病假',
    'overtime_leave': '加班假'
  };

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>编辑假期额度 - {employee?.real_name} ({year}年)</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Alert variant="destructive">
            <AlertTitle>注意</AlertTitle>
            <AlertDescription>
              修改额度会直接更新员工的假期总额，并记录一条'调整'类型的变更历史。
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 py-4">
            {types.filter(t => supportedTypes.includes(t.code)).map(type => (
              <div key={type.id} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={`input-${type.code}`} className="text-right">
                  {type.name}
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Input
                    id={`input-${type.code}`}
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData[type.code] || ''}
                    onChange={(e) => handleInputChange(type.code, parseFloat(e.target.value) || 0)}
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">天</span>
                </div>
              </div>
            ))}
          </div>

          {types.some(t => !supportedTypes.includes(t.code)) && (
            <div className="text-gray-400 text-sm text-center mt-4">
              * 部分假期类型暂不支持在此编辑（需数据库字段支持）
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={handleOk}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            {loading ? '更新中...' : '确定'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VacationQuotaEditModal;
