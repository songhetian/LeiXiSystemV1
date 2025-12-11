// [SHADCN-REPLACED]
import React, { useState } from 'react';
import { toast } from 'react-toastify';

// 导入 shadcn UI 组件
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const NotificationSender = () => {
  const [formData, setFormData] = useState({
    title: '',
    receivers: '',
    departments: [],
    content: '',
    attachments: []
  });

  const [selectedDepartments, setSelectedDepartments] = useState([]);

  const receivers = [
    { value: 'all', label: '所有用户' },
    { value: 'department', label: '按部门' },
    { value: 'position', label: '按职位' },
    { value: 'individual', label: '指定用户' },
  ];

  const departments = [
    { value: 'tech', label: '技术部' },
    { value: 'hr', label: '人事部' },
    { value: 'finance', label: '财务部' },
    { value: 'marketing', label: '市场部' },
    { value: 'support', label: '客服部' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReceiverChange = (value) => {
    setFormData(prev => ({
      ...prev,
      receivers: value
    }));
  };

  const handleDepartmentChange = (value) => {
    setSelectedDepartments(value);
    setFormData(prev => ({
      ...prev,
      departments: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 验证必填字段
    if (!formData.title.trim()) {
      toast.error('请输入通知标题');
      return;
    }

    if (!formData.receivers) {
      toast.error('请选择接收对象');
      return;
    }

    if (formData.receivers === 'department' && selectedDepartments.length === 0) {
      toast.error('请选择至少一个部门');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('请输入通知内容');
      return;
    }

    console.log('发送通知:', formData);
    toast.success('通知发送成功！');

    // 重置表单
    setFormData({
      title: '',
      receivers: '',
      departments: [],
      content: '',
      attachments: []
    });
    setSelectedDepartments([]);
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>发送通知</CardTitle>
          <CardDescription>向指定用户发送系统通知</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">通知标题</Label>
              <Input
                id="title"
                name="title"
                placeholder="请输入通知标题"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>接收对象</Label>
              <Select onValueChange={handleReceiverChange} value={formData.receivers}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择接收对象" />
                </SelectTrigger>
                <SelectContent>
                  {receivers.map(receiver => (
                    <SelectItem key={receiver.value} value={receiver.value}>
                      {receiver.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.receivers === 'department' && (
              <div className="space-y-2">
                <Label>部门选择</Label>
                <Select onValueChange={handleDepartmentChange} value={selectedDepartments} multiple>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择部门" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(department => (
                      <SelectItem key={department.value} value={department.value}>
                        {department.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="content">通知内容</Label>
              <Textarea
                id="content"
                name="content"
                placeholder="请输入通知内容"
                value={formData.content}
                onChange={handleInputChange}
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>附件</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  id="attachments"
                  name="attachments"
                  multiple
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit">
                发送通知
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSender;
