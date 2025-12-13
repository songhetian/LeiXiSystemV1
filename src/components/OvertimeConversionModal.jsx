import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Button, Alert, Statistic, Row, Col, Descriptions } from 'antd';
import { SwapOutlined, CalculatorOutlined } from '@ant-design/icons';
import { toast } from 'sonner';
import { getApiBaseUrl } from '../utils/apiConfig';

const OvertimeConversionModal = ({ visible, onClose, onSuccess, employeeId, overtimeHours }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [activeRule, setActiveRule] = useState(null);
  const [calculationResult, setCalculationResult] = useState(null);

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
    try {
      const values = await form.validateFields();

      if (!calculationResult) {
        toast.error('请先计算转换结果');
        return;
      }

      Modal.confirm({
        title: '确认转换',
        content: (
          <div>
            <p>确定要将 <strong>{calculationResult.source_hours} 小时</strong> 的加班时长转换为 <strong>{calculationResult.converted_days} 天</strong> 的假期吗?</p>
            {calculationResult.decimal_remainder > 0 && (
              <p style={{ color: '#ff9800', fontSize: '13px', marginTop: '8px' }}>
                ⚠️ 剩余 <strong>{calculationResult.decimal_remainder} 小时</strong> 将保留在加班余额中
              </p>
            )}
            <p style={{ color: '#8c8c8c', fontSize: '12px', marginTop: '4px' }}>转换后可在请假时选择使用</p>
          </div>
        ),
        onOk: async () => {
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
                  ? `从加班时长转换（原始: ${values.overtime_hours}h，保留: ${calculationResult.decimal_remainder.toFixed(1)}h）`
                  : '从加班时长转换'
              })
            });

            const result = await response.json();
            if (result.success) {
              const message = calculationResult.decimal_remainder > 0
                ? `成功转换 ${calculationResult.source_hours} 小时为 ${result.data.converted_days} 天假期！剩余 ${calculationResult.decimal_remainder} 小时已保留`
                : `成功转换 ${calculationResult.source_hours} 小时为 ${result.data.converted_days} 天假期！`;
              toast.success(message);
              form.resetFields();
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
      });
    } catch (error) {
      console.error('验证失败:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setCalculationResult(null);
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SwapOutlined style={{ color: '#1890ff' }} />
          <span>加班时长转换为假期</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={loading}
          disabled={!calculationResult}
        >
          确认转换
        </Button>
      ]}
      width={600}
    >
      <Alert
        message="转换说明"
        description="将您的加班时长转换为通用假期天数。转换后，您可以在请假时选择使用这些假期。"
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {calculationResult && calculationResult.decimal_remainder > 0 && (
        <Alert
          message="提示"
          description={`将转换 ${calculationResult.source_hours} 小时为 ${calculationResult.converted_days} 天假期，剩余 ${calculationResult.decimal_remainder} 小时将保留在加班余额中供下次转换使用。`}
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
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

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          overtime_hours: overtimeHours || 0
        }}
      >
        <Form.Item
          label="加班时长（小时）"
          name="overtime_hours"
          rules={[
            { required: true, message: '请输入加班时长' },
            { type: 'number', min: 0.1, message: '加班时长必须大于0' }
          ]}
        >
          <InputNumber
            min={0}
            step={1}
            precision={1}
            placeholder="请输入加班时长"
            style={{ width: '100%' }}
            addonAfter="小时"
            disabled
          />
        </Form.Item>

        {calculationResult && (
          <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f0f5ff', borderRadius: '4px' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="转换天数"
                  value={calculationResult.converted_days}
                  suffix="天"
                  precision={2}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="使用规则"
                  value={calculationResult.rule_name}
                  valueStyle={{ fontSize: '16px' }}
                />
              </Col>
            </Row>
            <Descriptions size="small" column={1} style={{ marginTop: '12px' }}>
              <Descriptions.Item label="加班时长">
                {calculationResult.source_hours} 小时
              </Descriptions.Item>
              <Descriptions.Item label="转换比例">
                1 天 = {calculationResult.hours_per_day} 小时
              </Descriptions.Item>
              <Descriptions.Item label="计算结果">
                {calculationResult.source_hours} 小时 ÷ {calculationResult.hours_per_day} = {calculationResult.converted_days} 天
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default OvertimeConversionModal;
