import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getApiBaseUrl } from '../utils/apiConfig';

// 导入 shadcn UI 组件
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ArrowLeftRight, Calculator } from 'lucide-react';

const OvertimeConversionModal = ({ visible, onClose, onSuccess, employeeId, overtimeHours }) => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [activeRule, setActiveRule] = useState(null);
  const [calculationResult, setCalculationResult] = useState(null);

  // 表单状态
  const [formData, setFormData] = useState({
    overtime_hours: overtimeHours || 0
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadActiveRule();
    }
  }, [visible]);

  const loadActiveRule = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBaseUrl()}/conversion-rules?source_type=overtime&enabled=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();

      console.log('加载的转换规则:', result);

      if (result.success && result.data.length > 0) {
        const rule = result.data[0];
        console.log('使用规则:', rule);
        setActiveRule(rule);

        if (overtimeHours) {
          form.setFieldsValue({ overtime_hours: overtimeHours });
          handleCalculate(overtimeHours, rule);
        }
      } else {
        toast.error('未找到启用的转换规则，请联系管理员');
      }
    } catch (error) {
      console.error('加载转换规则失败:', error);
      toast.error('加载转换规则失败');
    }
  };

  const handleCalculate = (hours, rule) => {
    if (!rule) rule = activeRule;
    if (!rule || !hours) return;

    const ratio = parseFloat(rule.ratio || rule.conversion_rate || 0.125);
    const hoursPerDay = Math.round(1 / ratio); // 例如：8小时/天

    // 计算可以转换成多少整天
    const totalHours = parseFloat(hours);
    const wholeDays = Math.floor(totalHours / hoursPerDay); // 例如：23 / 8 = 2天

    // 计算实际需要转换的小时数（整天对应的小时）
    const hoursToConvert = wholeDays * hoursPerDay; // 例如：2 * 8 = 16小时

    // 计算剩余的小时数
    const remainderHours = totalHours - hoursToConvert; // 例如：23 - 16 = 7小时

    console.log('计算结果:', {
      ratio,
      totalHours,
      hoursPerDay,
      wholeDays,
      hoursToConvert,
      remainderHours
    });

    setCalculationResult({
      converted_days: wholeDays,
      conversion_ratio: ratio,
      source_hours: hoursToConvert, // 实际转换的小时数
      decimal_remainder: remainderHours, // 保留的小时数
      rule_name: rule.name || '默认规则',
      hours_per_day: hoursPerDay
    });
  };

  const handleSubmit = async () => {
    if (!calculationResult) {
      toast.error('请先计算转换结果');
      return;
    }

    if (window.confirm(`确定要将 ${calculationResult.source_hours} 小时的加班时长转换为 ${calculationResult.converted_days} 天的假期吗?`)) {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${getApiBaseUrl()}/vacation/convert-from-overtime`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            employee_id: employeeId,
            user_id: user?.id,
            overtime_hours: calculationResult.source_hours, // 使用取整后的小时数
            notes: calculationResult.decimal_remainder > 0
              ? `从加班时长转换（原始: ${formData.overtime_hours}h，保留: ${calculationResult.decimal_remainder.toFixed(1)}h）`
              : '从加班时长转换'
          })
        });

        const result = await response.json();
        if (result.success) {
          const message = calculationResult.decimal_remainder > 0
            ? `成功转换 ${calculationResult.source_hours} 小时为 ${result.data.converted_days} 天假期！剩余 ${calculationResult.decimal_remainder} 小时已保留`
            : `成功转换 ${calculationResult.source_hours} 小时为 ${result.data.converted_days} 天假期！`;
          toast.success(message);
          setFormData({ overtime_hours: overtimeHours || 0 });
          setCalculationResult(null);
          onSuccess?.();
          onClose();
        } else {
          toast.error(result.message || '转换失败');
        }
      } catch (error) {
        console.error('转换失败:', error);
        toast.error('转换失败');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ overtime_hours: overtimeHours || 0 });
    setCalculationResult(null);
    onClose();
  };

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-blue-500" />
              <span>加班时长转换为假期</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTitle>转换说明</AlertTitle>
            <AlertDescription>
              将您的加班时长转换为通用假期天数。转换后，您可以在请假时选择使用这些假期。
            </AlertDescription>
          </Alert>

          {calculationResult && calculationResult.decimal_remainder > 0 && (
            <Alert variant="destructive">
              <AlertTitle>提示</AlertTitle>
              <AlertDescription>
                将转换 {calculationResult.source_hours} 小时为 {calculationResult.converted_days} 天假期，剩余 {calculationResult.decimal_remainder} 小时将保留在加班余额中供下次转换使用。
              </AlertDescription>
            </Alert>
          )}

          {activeRule && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="text-sm text-gray-700">
                <strong>当前转换规则：</strong>{activeRule.name || '默认规则'}
              </div>
              <div className="text-sm text-blue-600 font-medium mt-1">
                1 天 = {calculationResult?.hours_per_day || Math.round(1 / (activeRule.ratio || activeRule.conversion_rate || 0.125))} 小时
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="overtime_hours">加班时长（小时）</Label>
            <Input
              id="overtime_hours"
              type="number"
              min="0"
              step="1"
              value={formData.overtime_hours}
              onChange={(e) => setFormData({ ...formData, overtime_hours: parseFloat(e.target.value) || 0 })}
              placeholder="请输入加班时长"
              disabled
            />
            <span className="text-sm text-gray-500">小时</span>
          </div>

          {calculationResult && (
            <div className="mt-4 p-4 bg-blue-50 rounded">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-500">转换天数</div>
                  <div className="text-2xl font-bold text-blue-600">{calculationResult.converted_days} <span className="text-base">天</span></div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">使用规则</div>
                  <div className="text-lg font-semibold">{calculationResult.rule_name}</div>
                </div>
              </div>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">加班时长:</span> {calculationResult.source_hours} 小时</div>
                <div><span className="font-medium">转换比例:</span> 1 天 = {calculationResult.hours_per_day} 小时</div>
                <div><span className="font-medium">计算结果:</span> {calculationResult.source_hours} 小时 ÷ {calculationResult.hours_per_day} = {calculationResult.converted_days} 天</div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!calculationResult || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? '转换中...' : '确认转换'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OvertimeConversionModal;
