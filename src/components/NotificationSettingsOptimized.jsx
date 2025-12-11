// [SHADCN-REPLACED]
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Save, User, Users, FileText, Clock } from 'lucide-react';

// Shadcn UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'react-toastify';

const NotificationSettingsOptimized = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState([]);
  const [roles, setRoles] = useState([]);
  const [saving, setSaving] = useState(false);

  // 事件类型映射
  const eventTypeMap = {
    'leave_apply': '请假申请',
    'leave_approval': '请假审批通过',
    'leave_rejection': '请假审批拒绝',
    'exam_publish': '考试发布',
    'exam_result': '考试结果发布'
  };

  // 模拟获取数据
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟设置数据
      const mockSettings = [
        { event_type: 'leave_apply', target_roles: ['申请人', '部门经理'] },
        { event_type: 'leave_approval', target_roles: ['申请人'] },
        { event_type: 'leave_rejection', target_roles: ['申请人'] },
        { event_type: 'exam_publish', target_roles: ['考生', '培训师'] },
        { event_type: 'exam_result', target_roles: ['考生', '部门经理'] }
      ];
      
      // 模拟角色数据
      const mockRoles = ['申请人', '考生', '部门经理', '人事专员', '培训师', '管理员'];
      
      setSettings(mockSettings);
      setRoles(mockRoles);
    } catch (error) {
      console.error('获取数据失败:', error);
      toast.error('获取配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (eventType, newRoles) => {
    const newSettings = [...settings];
    const index = newSettings.findIndex(s => s.event_type === eventType);

    if (index > -1) {
      newSettings[index].target_roles = newRoles;
      setSettings(newSettings);
    } else {
      newSettings.push({
        event_type: eventType,
        target_roles: newRoles
      });
      setSettings(newSettings);
    }
  };

  const handleSave = async (record) => {
    setSaving(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(`${eventTypeMap[record.event_type] || record.event_type} 设置已保存`);
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };
  
  const resetToDefault = (eventType) => {
    const defaultRoles = getDefaultRoles(eventType);
    handleRoleChange(eventType, defaultRoles);
    toast.info(`${eventTypeMap[eventType] || eventType} 已重置为默认设置`);
  };
  
  const getDefaultRoles = (eventType) => {
    // 根据事件类型返回默认角色
    switch (eventType) {
      case 'leave_apply':
        return ['申请人', '部门经理'];
      case 'leave_approval':
        return ['申请人'];
      case 'leave_rejection':
      case 'exam_result':
        return ['申请人', '部门经理'];
      case 'exam_publish':
        return ['考生', '培训师'];
      default:
        return [];
    }
  };
  
  const resetAllToDefault = () => {
    if (window.confirm('确定要将所有设置重置为默认值吗？')) {
      const defaultSettings = Object.keys(eventTypeMap).map(type => ({
        event_type: type,
        target_roles: getDefaultRoles(type)
      }));
      setSettings(defaultSettings);
      toast.success('所有设置已重置为默认值');
    }
  };

  // 确保所有定义的事件类型都显示，即使数据库中没有记录
  const displayData = Object.keys(eventTypeMap).map(type => {
    const existing = settings.find(s => s.event_type === type);
    return existing || { event_type: type, target_roles: [] };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6"
    >
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">通知设置</CardTitle>
              <CardDescription>配置各类系统事件触发时，哪些角色的用户会收到通知弹窗。</CardDescription>
            </div>
            <Button variant="outline" onClick={resetAllToDefault}>
              重置所有
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">事件类型</TableHead>
                <TableHead>接收通知角色</TableHead>
                <TableHead className="w-[120px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((record) => (
                <TableRow key={record.event_type}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Bell className="mr-2 h-4 w-4 text-blue-500" />
                      {eventTypeMap[record.event_type] || record.event_type}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select 
                      onValueChange={(value) => handleRoleChange(record.event_type, value.split(','))}
                      value={record.target_roles.join(',')}
                      multiple
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="请选择接收角色" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSave(record)}
                        disabled={saving}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        保存
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resetToDefault(record.event_type)}
                      >
                        重置
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NotificationSettingsOptimized;
