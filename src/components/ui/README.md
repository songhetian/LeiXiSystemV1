# Shadcn UI Components 使用指南

本目录包含了基于 Shadcn UI 设计系统的 React 组件，结合 Framer Motion 实现了流畅的动画效果。

## 组件列表

### 1. Button (按钮)
基础按钮组件，支持多种样式变体。

```jsx
import { Button } from '../components/ui/button';

// 默认按钮
<Button>点击我</Button>

// 不同样式变体
<Button variant="default">默认</Button>
<Button variant="destructive">危险</Button>
<Button variant="outline">边框</Button>
<Button variant="secondary">次要</Button>
<Button variant="ghost">幽灵</Button>
<Button variant="link">链接</Button>

// 不同尺寸
<Button size="default">默认尺寸</Button>
<Button size="sm">小尺寸</Button>
<Button size="lg">大尺寸</Button>
```

### 2. Card (卡片)
通用卡片容器组件。

```jsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>卡片标题</CardTitle>
    <CardDescription>卡片描述</CardDescription>
  </CardHeader>
  <CardContent>
    <p>卡片内容</p>
  </CardContent>
  <CardFooter>
    <p>卡片底部</p>
  </CardFooter>
</Card>
```

### 3. Badge (徽章)
小型状态指示组件。

```jsx
import { Badge } from '../components/ui/badge';

<Badge>默认</Badge>
<Badge variant="secondary">次要</Badge>
<Badge variant="destructive">危险</Badge>
<Badge variant="outline">边框</Badge>
```

### 4. Dialog (对话框)
模态对话框组件。

```jsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';

<Dialog>
  <DialogTrigger>打开对话框</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>标题</DialogTitle>
      <DialogDescription>描述</DialogDescription>
    </DialogHeader>
    <div>对话框内容</div>
    <DialogFooter>
      <Button>确认</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 5. Avatar (头像)
用户头像组件。

```jsx
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';

<Avatar>
  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>
```

### 6. Input (输入框)
文本输入组件。

```jsx
import { Input } from '../components/ui/input';

<Input placeholder="请输入内容..." />
```

### 7. Textarea (多行文本框)
多行文本输入组件。

```jsx
import { Textarea } from '../components/ui/textarea';

<Textarea placeholder="请输入详细内容..." />
```

### 8. Select (下拉选择框)
下拉选择组件。

```jsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="请选择" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="apple">苹果</SelectItem>
    <SelectItem value="banana">香蕉</SelectItem>
  </SelectContent>
</Select>
```

### 9. Switch (切换开关)
开关切换组件。

```jsx
import { Switch } from '../components/ui/switch';

<Switch />
```

### 10. Tabs (标签页)
标签页组件。

```jsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">账户</TabsTrigger>
    <TabsTrigger value="password">密码</TabsTrigger>
  </TabsList>
  <TabsContent value="account">账户内容</TabsContent>
  <TabsContent value="password">密码内容</TabsContent>
</Tabs>
```

### 11. Toast (提示消息)
提示消息组件。

```jsx
import { Toast, ToastProvider, ToastViewport } from '../components/ui/toast';

<ToastProvider>
  <Toast>
    <ToastTitle>提示标题</ToastTitle>
    <ToastDescription>提示内容</ToastDescription>
  </Toast>
  <ToastViewport />
</ToastProvider>
```

### 12. Calendar (日历)
日期选择组件。

```jsx
import { Calendar } from '../components/ui/calendar';

<Calendar />
```

### 13. Popover (弹出框)
弹出框组件。

```jsx
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';

<Popover>
  <PopoverTrigger>打开</PopoverTrigger>
  <PopoverContent>这里是弹出内容</PopoverContent>
</Popover>
```

### 14. Table (表格)
数据表格组件，适用于展示结构化数据。

```jsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

<Table>
  <TableCaption>员工列表</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>姓名</TableHead>
      <TableHead>部门</TableHead>
      <TableHead>职位</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>张三</TableCell>
      <TableCell>技术部</TableCell>
      <TableCell>前端工程师</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### 15. MotionCard (带动画的卡片)
基于 Framer Motion 的动画卡片组件。

```jsx
import { MotionCard } from '../components/ui/motion-card';

<MotionCard>
  <CardContent>
    <h3>带动画的卡片</h3>
    <p>这个卡片具有悬停和点击动画效果</p>
  </CardContent>
</MotionCard>
```

### 16. MotionTable (带动画的表格)
基于 Framer Motion 的动画表格组件。

```jsx
import {
  MotionTable,
  MotionTableBody,
  MotionTableCell,
  MotionTableHead,
  MotionTableHeader,
  MotionTableRow,
} from '../components/ui/motion-table';

<MotionTable>
  <MotionTableHeader>
    <MotionTableRow>
      <MotionTableHead>姓名</MotionTableHead>
      <MotionTableHead>部门</MotionTableHead>
    </MotionTableRow>
  </MotionTableHeader>
  <MotionTableBody>
    <MotionTableRow>
      <MotionTableCell>张三</MotionTableCell>
      <MotionTableCell>技术部</MotionTableCell>
    </MotionTableRow>
  </MotionTableBody>
</MotionTable>
```

## 动画使用指南

### 1. 页面级动画
使用 Framer Motion 的 `motion` 组件创建页面级动画：

```jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  <h1>带动画的标题</h1>
</motion.div>
```

### 2. 列表动画
使用 `AnimatePresence` 和 `motion` 创建列表项动画：

```jsx
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence>
  {items.map((item, index) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
    >
      {item.content}
    </motion.div>
  ))}
</AnimatePresence>
```

### 3. 悬停和点击效果
为交互元素添加悬停和点击效果：

```jsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  点击我
</motion.button>
```

## 最佳实践

1. **性能优化**：避免在列表中过度使用复杂动画
2. **一致性**：在整个应用中保持动画风格一致
3. **可访问性**：确保动画不会影响用户体验，提供禁用动画的选项
4. **响应式**：在移动设备上适当减少动画复杂度

## 自定义主题

可以通过修改 `tailwind.config.js` 来自定义主题颜色：

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf9',
          100: '#ccfbef',
          // ... 其他色阶
          900: '#134e4a',
        }
      }
    },
  },
}
```