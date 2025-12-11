import React from 'react';

// 导入 shadcn UI 组件
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow, TableCell } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const VacationPermissions = () => {
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [editingRecord, setEditingRecord] = React.useState(null);

  const columns = [
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: '权限类型',
      dataIndex: 'permissionType',
      key: 'permissionType',
      render: (text) => (
        <Badge variant={text === '查看' ? 'default' : text === '编辑' ? 'secondary' : 'outline'}>
          {text}
        </Badge>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <div className="flex space-x-2">
          <Button variant="link" onClick={() => handleEdit(record)}>编辑</Button>
          <Button variant="link" className="text-red-500" onClick={() => handleDelete(record)}>删除</Button>
        </div>
      ),
    },
  ];

  const renderTableRows = () => {
    return data.map((record) => (
      <TableRow key={record.key}>
        <TableCell>{record.role}</TableCell>
        <TableCell>
          <Badge variant={record.permissionType === '查看' ? 'default' : record.permissionType === '编辑' ? 'secondary' : 'outline'}>
            {record.permissionType}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex space-x-2">
            <Button variant="link" onClick={() => handleEdit(record)}>编辑</Button>
            <Button variant="link" className="text-red-500" onClick={() => handleDelete(record)}>删除</Button>
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setIsModalVisible(true);
  };

  const handleDelete = (record) => {
    if (window.confirm(`确定要删除角色 "${record.role}" 的权限设置吗？`)) {
      // 删除逻辑
      console.log('删除记录:', record);
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    // 保存逻辑
    setIsModalVisible(false);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>假期权限管理</CardTitle>
          <Button onClick={handleAdd}>添加权限</Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>角色</TableHead>
                  <TableHead>权限类型</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderTableRows()}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalVisible} onOpenChange={setIsModalVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRecord ? "编辑权限" : "添加权限"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="role">角色</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="请选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="管理员">管理员</SelectItem>
                  <SelectItem value="人事专员">人事专员</SelectItem>
                  <SelectItem value="部门经理">部门经理</SelectItem>
                  <SelectItem value="普通员工">普通员工</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="permissionType">权限类型</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="请选择权限类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="查看">查看</SelectItem>
                  <SelectItem value="编辑">编辑</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleModalCancel}>取消</Button>
            <Button onClick={handleModalOk}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VacationPermissions;
