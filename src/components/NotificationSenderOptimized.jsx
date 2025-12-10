import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Upload, Users, Building, User, FileText, X } from 'lucide-react';

// Shadcn UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'react-toastify';

const NotificationSenderOptimized = () => {
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

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // 限制文件数量
    if (formData.attachments.length + files.length > 5) {
      toast.error('最多只能上传5个附件');
      return;
    }
    
    // 限制文件大小 (每个文件不超过5MB)
    for (let file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} 文件过大，最大支持5MB`);
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };
  
  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };
  
  const clearAttachments = () => {
    setFormData(prev => ({
      ...prev,
      attachments: []
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6"
    >
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">发送通知</CardTitle>
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
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
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
              </motion.div>
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
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  id="attachments"
                  name="attachments"
                  onChange={handleFileUpload}
                  className="hidden"
                  multiple
                />
                <Label htmlFor="attachments" className="cursor-pointer">
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    上传附件
                  </Button>
                </Label>
                <span className="text-sm text-gray-500">
                  {formData.attachments.length > 0 
                    ? `${formData.attachments.length} 个文件已选择` 
                    : '未选择文件'}
                </span>
                {formData.attachments.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearAttachments}
                    className="text-red-500 hover:text-red-700"
                  >
                    清除
                  </Button>
                )}
              </div>
              
              {/* 显示已选择的文件 */}
              {formData.attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm truncate">{file.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeAttachment(index)}
                          className="h-6 w-6"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="w-full sm:w-auto">
                <Send className="mr-2 h-4 w-4" />
                发送通知
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NotificationSenderOptimized;