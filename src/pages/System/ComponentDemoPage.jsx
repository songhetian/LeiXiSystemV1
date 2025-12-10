import React, { useState } from 'react';
import { motion } from 'framer-motion';

// 导入所有 Shadcn UI 组件
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Toast, ToastProvider, ToastViewport } from '../../components/ui/toast';

// 导入图标
import { CalendarIcon, Search, Plus, Edit, Trash } from 'lucide-react';

export default function ComponentDemoPage() {
  const [date, setDate] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('form');

  return (
    <ToastProvider>
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>组件演示页面</CardTitle>
              <CardDescription>展示各种 Shadcn UI 组件的使用方式</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="form">表单组件</TabsTrigger>
                  <TabsTrigger value="data">数据展示</TabsTrigger>
                  <TabsTrigger value="feedback">反馈组件</TabsTrigger>
                </TabsList>
                
                <TabsContent value="form" className="mt-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 输入框示例 */}
                      <Card>
                        <CardHeader>
                          <CardTitle>输入框</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Input placeholder="普通输入框" />
                          <Input type="email" placeholder="邮箱输入框" />
                          <Input type="password" placeholder="密码输入框" />
                        </CardContent>
                      </Card>
                      
                      {/* 文本域示例 */}
                      <Card>
                        <CardHeader>
                          <CardTitle>多行文本框</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Textarea placeholder="请输入详细信息..." rows={4} />
                        </CardContent>
                      </Card>
                      
                      {/* 下拉选择框示例 */}
                      <Card>
                        <CardHeader>
                          <CardTitle>下拉选择框</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择部门" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tech">技术部</SelectItem>
                              <SelectItem value="hr">人事部</SelectItem>
                              <SelectItem value="finance">财务部</SelectItem>
                              <SelectItem value="marketing">市场部</SelectItem>
                            </SelectContent>
                          </Select>
                        </CardContent>
                      </Card>
                      
                      {/* 开关示例 */}
                      <Card>
                        <CardHeader>
                          <CardTitle>开关组件</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                          <span>启用通知</span>
                          <Switch />
                        </CardContent>
                      </Card>
                      
                      {/* 日历示例 */}
                      <Card className="md:col-span-2">
                        <CardHeader>
                          <CardTitle>日期选择器</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? date.toISOString().split('T')[0] : "选择日期"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="flex justify-end gap-3">
                      <Button variant="outline">取消</Button>
                      <Button>提交</Button>
                    </div>
                  </motion.div>
                </TabsContent>
                
                <TabsContent value="data" className="mt-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>徽章组件</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2">
                        <Badge>默认</Badge>
                        <Badge variant="secondary">次要</Badge>
                        <Badge variant="destructive">危险</Badge>
                        <Badge variant="outline">边框</Badge>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>按钮组件</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-3">
                        <Button>默认按钮</Button>
                        <Button variant="destructive">危险按钮</Button>
                        <Button variant="outline">边框按钮</Button>
                        <Button variant="secondary">次要按钮</Button>
                        <Button variant="ghost">幽灵按钮</Button>
                        <Button variant="link">链接按钮</Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
                
                <TabsContent value="feedback" className="mt-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>对话框组件</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                          <DialogTrigger asChild>
                            <Button>打开对话框</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>确认操作</DialogTitle>
                              <DialogDescription>
                                您确定要执行此操作吗？此操作不可撤销。
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <p>这里是对话框的内容区域。</p>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsOpen(false)}>
                                取消
                              </Button>
                              <Button onClick={() => setIsOpen(false)}>
                                确认
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>提示消息</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Toast>
                            <div className="grid gap-1">
                              <div className="font-semibold">提示消息</div>
                              <div className="text-sm">这是一条普通的提示消息。</div>
                            </div>
                          </Toast>
                          
                          <Toast variant="destructive">
                            <div className="grid gap-1">
                              <div className="font-semibold">错误消息</div>
                              <div className="text-sm">这是一条错误提示消息。</div>
                            </div>
                          </Toast>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
        
        <ToastViewport />
      </div>
    </ToastProvider>
  );
}