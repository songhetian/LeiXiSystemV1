/**
 * 真正意义的智能排班 (算法驱动)
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Card, Row, Col, Select, DatePicker, Button, Table, Tag, 
  Space, Modal, Typography, Empty, Badge, Tooltip, Alert, 
  InputNumber, Divider, Progress, Steps, Result
} from 'antd';
import { 
  RocketOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  ExportOutlined,
  TableOutlined,
  UsergroupAddOutlined,
  UndoOutlined
} from '@ant-design/icons';
import api from '../../api';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { toast } from 'sonner';

dayjs.extend(isBetween);

const { Title, Text } = Typography;
const { Option } = Select;

const SmartSchedule = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs().add(1, 'month').startOf('month'));
  
  const [targets, setTargets] = useState({}); 
  const [previewData, setPreviewData] = useState([]); 
  const [leaveData, setLeaveData] = useState([]); 

  useEffect(() => {
    fetchBaseData();
  }, []);

  useEffect(() => {
    if (selectedDept) fetchEmployees();
  }, [selectedDept]);

  const fetchBaseData = async () => {
    try {
      const [deptRes, shiftRes] = await Promise.all([
        api.get('/departments', { params: { forManagement: true } }),
        api.get('/shifts', { params: { is_active: 1, limit: 100 } })
      ]);
      if (Array.isArray(deptRes.data)) {
        setDepartments(deptRes.data);
        if (deptRes.data.length > 0) setSelectedDept(deptRes.data[0].id);
      }
      if (shiftRes.data.success) {
        const activeShifts = shiftRes.data.data.filter(s => s.work_hours > 0);
        setShifts(activeShifts);
        const initTargets = {};
        activeShifts.forEach(s => initTargets[s.id] = 2);
        setTargets(initTargets);
      }
    } catch (error) {
      toast.error('基础数据获取失败');
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees', { params: { department_id: selectedDept } });
      if (res.data) setEmployees(res.data.filter(e => e.status === 'active'));
    } catch (e) {}
  };

  // --- 核心算法 ---
  const runSmartAlgorithm = async () => {
    if (!selectedDept) return toast.error('请先选择部门');
    
    setLoading(true);
    try {
      const daysInMonth = currentMonth.daysInMonth();
      const startDate = currentMonth.startOf('month').format('YYYY-MM-DD');
      const endDate = currentMonth.endOf('month').format('YYYY-MM-DD');

      // 1. 获取已通过的请假数据 (修正后的路径)
      const leaveRes = await api.get('/attendance/leave/records', { 
        params: { department_id: selectedDept, start_date: startDate, end_date: endDate, status: 'approved', limit: 1000 }
      });
      const currentLeaves = leaveRes.data?.data || [];
      setLeaveData(currentLeaves);

      // 2. 初始化排班网格
      const newPreview = employees.map(emp => ({
        id: emp.id,
        name: emp.real_name,
        days: {} 
      }));

      const empStats = employees.reduce((acc, emp) => {
        acc[emp.id] = { consecutive: 0, total: 0 };
        return acc;
      }, {});

      // 3. 按日进行贪心分配
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = currentMonth.date(d).format('YYYY-MM-DD');
        
        shifts.forEach(shift => {
          let needed = targets[shift.id] || 0;
          const shuffledEmployees = [...newPreview].sort(() => Math.random() - 0.5);
          
          for (const empRow of shuffledEmployees) {
            if (needed <= 0) break;
            if (empRow.days[d]) continue; 

            // 检查请假冲突
            const hasLeave = currentLeaves.some(l => 
              l.employee_id === empRow.id && 
              dayjs(dateStr).isBetween(dayjs(l.start_date), dayjs(l.end_date), 'day', '[]')
            );
            if (hasLeave) continue;

            // 检查连班限制
            if (empStats[empRow.id].consecutive >= 6) {
              continue;
            }

            empRow.days[d] = shift.id;
            empStats[empRow.id].consecutive++;
            empStats[empRow.id].total++;
            needed--;
          }
        });
        
        // 没排班的人，连班计数清零
        newPreview.forEach(emp => {
          if (!emp.days[d]) empStats[emp.id].consecutive = 0;
        });
      }

      setPreviewData(newPreview);
      setCurrentStep(1);
      toast.success('智能排班计算完成');
    } catch (error) {
      console.error(error);
      toast.error('计算失败，请确保后端服务正常');
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => {
    if (previewData.length === 0) return [];
    const days = currentMonth.daysInMonth();
    const cols = [
      { title: '员工', dataIndex: 'name', key: 'name', width: 100, fixed: 'left', align: 'center' }
    ];
    for (let i = 1; i <= days; i++) {
      const date = currentMonth.date(i);
      const isWeekend = date.day() === 0 || date.day() === 6;
      cols.push({
        title: <span style={{ color: isWeekend ? '#ff4d4f' : 'inherit', fontSize: '11px' }}>{i}</span>,
        key: i,
        width: 45,
        align: 'center',
        render: (_, record) => {
          const shiftId = record.days[i];
          if (!shiftId) return <div style={{ color: '#eee' }}>-</div>;
          const shift = shifts.find(s => s.id === shiftId);
          return (
            <Tooltip title={shift?.name}>
              <div style={{ 
                width: '100%', height: '24px', 
                backgroundColor: shift?.color || '#667eea', 
                borderRadius: '4px' 
              }}></div>
            </Tooltip>
          );
        }
      });
    }
    return cols;
  }, [previewData, shifts, currentMonth]);

  const handleExport = async () => {
    setLoading(true);
    try {
      const textRules = [];
      previewData.forEach(emp => {
        Object.entries(emp.days).forEach(([day, shiftId]) => {
          const shift = shifts.find(s => s.id === shiftId);
          textRules.push({
            employee_id: emp.id,
            start_day: parseInt(day),
            end_day: parseInt(day),
            shift_id: shiftId,
            action: '排班',
            shift_name: shift?.name
          });
        });
      });

      const res = await api.post('/smart-schedule/generate-excel', {
        departmentId: selectedDept,
        startDate: currentMonth.startOf('month').format('YYYY-MM-DD'),
        endDate: currentMonth.endOf('month').format('YYYY-MM-DD'),
        textRules
      }, { responseType: 'blob' });

      const blob = new Blob([res.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `智能排班方案_${currentMonth.format('YYYY-MM')}.xlsx`;
      link.click();
      setCurrentStep(2);
    } catch (e) {
      toast.error('导出失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-white min-h-screen">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <Title level={2} style={{ margin: 0, fontWeight: 800 }}>智能排班中心 2.0</Title>
            <Text type="secondary">基于人力需求与约束算法自动生成最优排班方案</Text>
          </div>
          <Steps 
            size="small" 
            current={currentStep} 
            style={{ width: 500 }}
            items={[{ title: '配置需求' }, { title: '方案预览' }, { title: '导出发布' }]}
          />
        </div>

        {currentStep === 0 && (
          <Row gutter={32}>
            <Col span={10}>
              <Card title="第一步：选择范围" bordered={false} style={{ borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <div className="space-y-6">
                  <div>
                    <Text strong className="block mb-2">排班部门</Text>
                    <Select 
                      style={{ width: '100%' }} 
                      size="large"
                      value={selectedDept}
                      onChange={setSelectedDept}
                      options={departments.map(d => ({ value: d.id, label: d.name }))}
                    />
                  </div>
                  <div>
                    <Text strong className="block mb-2">目标月份</Text>
                    <DatePicker 
                      picker="month" 
                      size="large"
                      style={{ width: '100%' }} 
                      value={currentMonth}
                      onChange={val => val && setCurrentMonth(val)}
                      allowClear={false}
                    />
                  </div>
                  <Alert 
                    message="算法说明"
                    description="系统将自动读取选中月份所有已通过的请假申请，并在排班时自动避开冲突日期。"
                    type="info"
                    showIcon
                  />
                </div>
              </Card>
            </Col>
            <Col span={14}>
              <Card title="第二步：设定每日人力需求 (Headcount)" bordered={false} style={{ borderRadius: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <div className="space-y-4">
                  {shifts.map(shift => (
                    <div key={shift.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                      <Space>
                        <Badge color={shift.color} />
                        <div className="flex flex-col">
                          <Text strong>{shift.name}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>{shift.start_time} - {shift.end_time}</Text>
                        </div>
                      </Space>
                      <Space>
                        <Text type="secondary">每日需</Text>
                        <InputNumber 
                          min={0} 
                          max={employees.length} 
                          value={targets[shift.id]} 
                          onChange={val => setTargets({...targets, [shift.id]: val})}
                        />
                        <Text type="secondary">人</Text>
                      </Space>
                    </div>
                  ))}
                  <Divider />
                  <Button 
                    type="primary" 
                    block 
                    size="large" 
                    icon={<RocketOutlined />} 
                    loading={loading}
                    onClick={runSmartAlgorithm}
                    style={{ height: 55, borderRadius: 12, backgroundColor: '#667eea', border: 0, fontWeight: 700 }}
                  >
                    开始智能计算排班
                  </Button>
                </div>
              </Card>
            </Col>
          </Row>
        )}

        {currentStep === 1 && (
          <Card bordered={false} style={{ borderRadius: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <div className="flex justify-between items-center mb-6">
              <Title level={4} style={{ margin: 0 }}><TableOutlined /> 排班方案预览 - {currentMonth.format('YYYY年MM月')}</Title>
              <Space>
                <Button icon={<UndoOutlined />} onClick={() => setCurrentStep(0)}>重新配置</Button>
                <Button 
                  type="primary" 
                  icon={<ExportOutlined />} 
                  onClick={handleExport}
                  loading={loading}
                  style={{ backgroundColor: '#52c41a', border: 0 }}
                >
                  导出为 Excel
                </Button>
              </Space>
            </div>
            <Table
              dataSource={previewData}
              columns={columns}
              rowKey="id"
              pagination={false}
              bordered
              size="small"
              scroll={{ x: 'max-content', y: 500 }}
            />
          </Card>
        )}

        {currentStep === 2 && (
          <Result
            status="success"
            title="排班方案生成成功！"
            subTitle="Excel 文件已下载。您可以进行最后的细节核对，然后通过“排班管理”页面进行正式发布。"
            extra={[
              <Button type="primary" key="back" onClick={() => setCurrentStep(0)}>继续排班</Button>,
              <Button key="manage" onClick={() => window.location.reload()}>返回首页</Button>,
            ]}
          />
        )}
      </div>
    </div>
  );
};

export default SmartSchedule;