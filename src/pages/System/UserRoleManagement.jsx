import React, { useState, useEffect, useMemo } from 'react';
import { getApiUrl } from '../../utils/apiConfig';
import { apiGet, apiPut, apiPost } from '../../utils/apiClient';
// 导入部门权限模态框组件
import UserDepartmentModal from '../../components/UserDepartmentModal';

// 导入 Shadcn UI 组件
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';

// 导入图标
import { User, Users, RefreshCw, Eye, Lock, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const UserRoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);

  // 部门权限状态
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [selectedUserForDepartment, setSelectedUserForDepartment] = useState(null);

  // 搜索状态
  const [searchText, setSearchText] = useState('');
  const [searchDepartment, setSearchDepartment] = useState('');
  const [searchRole, setSearchRole] = useState('');

  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const [isBatchAssignOpen, setIsBatchAssignOpen] = useState(false);
  const [isBatchRemoveOpen, setIsBatchRemoveOpen] = useState(false);
  const [batchAssignRoleId, setBatchAssignRoleId] = useState(null);

  // 添加排序状态
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiGet('/api/users-with-roles');
      if (response.success) {
        // 获取每个用户的部门权限信息
        const usersWithDepartments = await Promise.all(response.data.map(async (user) => {
          try {
            const deptResponse = await apiGet(`/api/users/${user.id}/departments`);
            if (deptResponse.success) {
              // 确保部门数据格式正确
              const departments = Array.isArray(deptResponse.data) ? deptResponse.data : [];
              return { ...user, departments: departments };
            }
          } catch (error) {
            console.error(`获取用户 ${user.real_name} 的部门权限失败:`, error);
          }
          return { ...user, departments: [] };
        }));
        setUsers(usersWithDepartments);
      } else if (Array.isArray(response)) {
        // 兼容旧的API格式，也需要获取部门权限
        const usersWithDepartments = await Promise.all(response.map(async (user) => {
          try {
            const deptResponse = await apiGet(`/api/users/${user.id}/departments`);
            if (deptResponse.success) {
              // 确保部门数据格式正确
              const departments = Array.isArray(deptResponse.data) ? deptResponse.data : [];
              return { ...user, departments: departments };
            }
          } catch (error) {
            console.error(`获取用户 ${user.real_name} 的部门权限失败:`, error);
          }
          return { ...user, departments: [] };
        }));
        setUsers(usersWithDepartments);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      // 使用浏览器原生alert替代message.error
      alert('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await apiGet('/api/roles');
      if (response.success) {
        const rolesData = response.data || [];
        const rolesWithDepartments = await Promise.all(
          rolesData.map(async (role) => {
            try {
              const deptResponse = await apiGet(`/api/roles/${role.id}/departments`);
              if (deptResponse.success) {
                return { ...role, departments: deptResponse.data };
              }
            } catch (e) {}
            return { ...role, departments: [] };
          })
        );
        setRoles(rolesWithDepartments);
      } else if (Array.isArray(response)) {
        const rolesData = response || [];
        const rolesWithDepartments = await Promise.all(
          rolesData.map(async (role) => {
            try {
              const deptResponse = await apiGet(`/api/roles/${role.id}/departments`);
              if (deptResponse.success) {
                return { ...role, departments: deptResponse.data };
              }
            } catch (e) {}
            return { ...role, departments: [] };
          })
        );
        setRoles(rolesWithDepartments);
      }
    } catch (error) {
      console.error('获取角色列表失败:', error);
      // 使用浏览器原生alert替代message.error
      alert('获取角色列表失败');
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiGet('/api/departments');
      if (response.success) {
        setDepartments(response.data || []);
      } else if (Array.isArray(response)) {
        setDepartments(response);
      }
    } catch (error) {
      console.error('获取部门列表失败:', error);
      // 使用浏览器原生alert替代message.error
      alert('获取部门列表失败');
    }
  };

  const handleManageRoles = (user) => {
    setSelectedUser(user);
    // 提取用户当前的角色ID
    const userRoleIds = user.roles ? user.roles.map(role => role.id) : [];
    setSelectedRoles(userRoleIds);
    setModalVisible(true);
  };

  const handleSaveRoles = async () => {
    try {
      await apiPut(`/api/users/${selectedUser.id}/roles`, {
        roleIds: selectedRoles
      });

      // 使用浏览器原生alert替代message.success
      alert('角色分配成功');
      setModalVisible(false);
      fetchUsers(); // 刷新用户列表
    } catch (error) {
      // 使用浏览器原生alert替代message.error
      alert('分配失败: ' + (error.message || '未知错误'));
    }
  };

  const handleRoleChange = (roleIds) => {
    setSelectedRoles(roleIds);
  };

  // 处理员工部门权限管理
  const handleManageUserDepartments = (user) => {
    setSelectedUserForDepartment(user);
    setIsDepartmentModalOpen(true);
  };

  // 员工部门权限设置成功回调
  const handleUserDepartmentSuccess = () => {
    // 可以在这里添加刷新逻辑或其他操作
    // 使用浏览器原生alert替代message.success
    alert('员工部门权限设置成功');
    fetchUsers(); // 刷新用户列表
  };

  // 过滤用户
  const filteredUsers = useMemo(() => {
    let result = users.filter(user => {
      // 关键词搜索
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchesKeyword = (
          (user.real_name && user.real_name.toLowerCase().includes(searchLower)) ||
          (user.username && user.username.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower)) ||
          (user.phone && user.phone.includes(searchText))
        );
        if (!matchesKeyword) return false;
      }

      // 部门搜索
      if (searchDepartment && user.department_id !== parseInt(searchDepartment)) {
        return false;
      }

      // 角色搜索
      if (searchRole) {
        const hasRole = user.roles && user.roles.some(role => role.id === parseInt(searchRole));
        if (!hasRole) return false;
      }

      return true;
    });

    // 排序
    if (sortField) {
      result.sort((a, b) => {
        let aValue, bValue;

        switch (sortField) {
          case 'real_name':
            aValue = a.real_name || '';
            bValue = b.real_name || '';
            break;
          case 'username':
            aValue = a.username || '';
            bValue = b.username || '';
            break;
          case 'department_name':
            aValue = a.department_name || '';
            bValue = b.department_name || '';
            break;
          default:
            return 0;
        }

        if (sortOrder === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    return result;
  }, [users, searchText, searchDepartment, searchRole, sortField, sortOrder]);

  // 清空搜索
  const clearSearch = () => {
    setSearchText('');
  };

  const handleBatchAssignRoles = async () => {
    if (selectedUserIds.length === 0 || !batchAssignRoleId) {
      alert('请选择用户和角色');
      return;
    }
    setIsProcessingBatch(true);
    setBatchProgress({ done: 0, total: selectedUserIds.length });
    try {
      let failCount = 0;
      for (let i = 0; i < selectedUserIds.length; i++) {
        const userId = selectedUserIds[i];
        try {
          await apiPost(`/api/users/${userId}/roles`, { role_id: batchAssignRoleId });
        } catch (e) {
          console.error(`为用户${userId}分配角色失败:`, e);
          failCount += 1;
        }
        setBatchProgress(prev => ({ ...prev, done: i + 1 }));
      }
      if (failCount === 0) {
        alert('分配角色成功');
      } else {
        alert(`分配角色完成，但有 ${failCount} 人失败`);
      }
      setIsBatchAssignOpen(false);
      setBatchAssignRoleId(null);
      setSelectedUserIds([]);
      fetchUsers();
    } catch (error) {
      console.error('批量分配失败:', error);
      alert('批量分配失败: ' + (error.message || '未知错误'));
    } finally {
      setIsProcessingBatch(false);
      setBatchProgress({ done: 0, total: 0 });
    }
  };

  const handleBatchRemoveRoles = async () => {
    if (selectedUserIds.length === 0) {
      alert('请选择员工');
      return;
    }
    setIsProcessingBatch(true);
    setBatchProgress({ done: 0, total: selectedUserIds.length });
    try {
      let failCount = 0;
      for (let i = 0; i < selectedUserIds.length; i++) {
        const userId = selectedUserIds[i];
        try {
          await apiPut(`/api/users/${userId}/roles`, { roleIds: [] });
        } catch (e) {
          console.error(`从用户${userId}移除角色失败:`, e);
          failCount += 1;
        }
        setBatchProgress(prev => ({ ...prev, done: i + 1 }));
      }
      if (failCount === 0) {
        alert('删除角色成功');
      } else {
        alert(`删除角色完成，但有 ${failCount} 人失败`);
      }
      setIsBatchRemoveOpen(false);
      setSelectedUserIds([]);
      fetchUsers();
    } catch (error) {
      console.error('批量移除失败:', error);
      alert('批量移除失败: ' + (error.message || '未知错误'));
    } finally {
      setIsProcessingBatch(false);
      setBatchProgress({ done: 0, total: 0 });
    }
  };

  // 获取角色显示名称
  const getRoleBadges = (userRoles) => {
    if (userRoles && userRoles.length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          {userRoles.map(role => (
            <Badge key={role.id} variant="default">
              {role.name}
            </Badge>
          ))}
        </div>
      );
    }
    return <span className="text-gray-400 text-sm">未分配角色</span>;
  };

  // 获取部门权限显示
  const getViewDepartmentBadges = (record) => {
    // 检查用户是否有特定的部门权限
    if (record.departments && record.departments.length > 0) {
      // 显示前2个部门，其余以数字显示
      const displayDeps = record.departments.slice(0, 2);
      const remainingCount = record.departments.length - 2;

      return (
        <div className="flex flex-wrap gap-1">
          {displayDeps.map(dept => (
            <Badge key={dept.id} variant="secondary" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {dept.name}
            </Badge>
          ))}
          {remainingCount > 0 && (
            <Badge variant="secondary">+{remainingCount}</Badge>
          )}
        </div>
      );
    } else {
      // 如果没有特定部门权限，显示默认状态
      // 检查用户是否有角色，如果有角色则显示默认权限，否则显示未分配
      if (record.roles && record.roles.length > 0) {
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            默认权限
          </Badge>
        );
      } else {
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            未分配
          </Badge>
        );
      }
    }
  };

  return (
    <motion.div 
      className="p-4 md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="rounded-xl shadow-sm border border-gray-200">
        <CardHeader>
          {/* 头部 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl md:text-2xl">员工角色管理</CardTitle>
              <CardDescription className="text-gray-500 text-sm mt-1">管理员工的角色分配和部门权限</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={fetchUsers}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">刷新</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 搜索框 */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Input
                type="text"
                placeholder="搜索员工姓名、用户名、邮箱或手机号..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={searchDepartment} onValueChange={setSearchDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="所有部门" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">所有部门</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(searchText || searchDepartment) && (
                <Button onClick={clearSearch} variant="outline">
                  清空
                </Button>
              )}
            </div>
          </div>

          {/* 统计卡片 */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-blue-50 border-blue-100">
              <CardContent className="p-4">
                <div className="text-blue-800 font-medium">总员工数</div>
                <div className="text-2xl font-bold text-blue-900 mt-1">{filteredUsers.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-100">
              <CardContent className="p-4">
                <div className="text-purple-800 font-medium">已选员工</div>
                <div className="text-2xl font-bold text-purple-900 mt-1">{selectedUserIds.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-100">
              <CardContent className="p-4">
                <div className="text-green-800 font-medium">角色数量</div>
                <div className="text-2xl font-bold text-green-900 mt-1">{roles.length}</div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 批量操作栏 */}
          {selectedUserIds.length > 0 && (
            <motion.div 
              className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-sm text-blue-800">
                已选择 {selectedUserIds.length} 名员工
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => setIsBatchAssignOpen(true)}
                  className="flex items-center gap-1"
                >
                  <Users className="h-4 w-4" />
                  分配角色
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setIsBatchRemoveOpen(true)}
                  disabled={isProcessingBatch}
                  className="flex items-center gap-1"
                >
                  <Lock className="h-4 w-4" />
                  移除角色
                </Button>
              </div>
            </motion.div>
          )}

          {/* 用户表格 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户信息</TableHead>
                  <TableHead>部门</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>可查看部门</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                        加载中...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((record) => (
                    <TableRow key={record.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <User className="text-blue-500 h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{record.real_name}</div>
                            <div className="text-sm text-gray-500">@{record.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-600">{record.department_name || '未分配'}</span>
                      </TableCell>
                      <TableCell>
                        {getRoleBadges(record.roles)}
                      </TableCell>
                      <TableCell>
                        {getViewDepartmentBadges(record)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleManageRoles(record)}
                            title="分配角色"
                            className="flex items-center gap-1"
                          >
                            <Users className="h-4 w-4" />
                            <span className="hidden sm:inline">分配</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleManageUserDepartments(record)}
                            title="部门权限"
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">权限</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </motion.div>
        </CardContent>
      </Card>

      {/* 角色分配对话框 */}
      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>为 "{selectedUser?.real_name}" 分配角色</DialogTitle>
            <DialogDescription>
              选择要分配给该用户的角色
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择角色
              </label>
              <Select 
                value={selectedRoles.join(',')} 
                onValueChange={(value) => handleRoleChange(value.split(',').filter(v => v !== ""))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择角色" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem 
                      key={role.id} 
                      value={role.id.toString()}
                      disabled={selectedRoles.includes(role.id)}
                    >
                      <div className="flex items-center">
                        <span className="mr-2">{role.name}</span>
                        {role.is_system && <Badge variant="destructive">系统</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedRoles.map(roleId => {
                  const role = roles.find(r => r.id === roleId);
                  return role ? (
                    <Badge 
                      key={roleId} 
                      variant="secondary" 
                      className="flex items-center gap-1"
                      onClick={() => handleRoleChange(selectedRoles.filter(id => id !== roleId))}
                    >
                      {role.name}
                      <span className="cursor-pointer">×</span>
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <Info className="text-blue-500 h-5 w-5 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">操作说明</p>
                  <ul className="text-xs text-blue-700 mt-1 list-disc pl-4 space-y-1">
                    <li>可以选择多个角色分配给用户</li>
                    <li>系统角色具有特殊权限，请谨慎分配</li>
                    <li>不选择任何角色将移除用户的所有角色</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalVisible(false)}>取消</Button>
            <Button onClick={handleSaveRoles}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量分配角色对话框 */}
      <Dialog open={isBatchAssignOpen} onOpenChange={setIsBatchAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>批量为选中员工分配角色</DialogTitle>
            <DialogDescription>
              为选中的 {selectedUserIds.length} 名员工分配一个角色
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择角色
              </label>
              <Select value={batchAssignRoleId || ""} onValueChange={setBatchAssignRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择要分配的角色" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBatchAssignOpen(false)}>取消</Button>
            <Button
              onClick={handleBatchAssignRoles}
              disabled={isProcessingBatch || !batchAssignRoleId}
            >
              {isProcessingBatch ? '处理中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量移除角色对话框 */}
      <Dialog open={isBatchRemoveOpen} onOpenChange={setIsBatchRemoveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>批量从选中员工移除角色</DialogTitle>
            <DialogDescription>
              将从选中的 {selectedUserIds.length} 名员工移除全部角色
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              此操作会清空所选员工的所有角色，请谨慎执行。
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBatchRemoveOpen(false)}>取消</Button>
            <Button
              variant="destructive"
              onClick={handleBatchRemoveRoles}
              disabled={isProcessingBatch}
            >
              {isProcessingBatch ? '处理中...' : '移除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 部门权限模态框 */}
      <UserDepartmentModal
        isOpen={isDepartmentModalOpen}
        onClose={() => setIsDepartmentModalOpen(false)}
        onSuccess={handleUserDepartmentSuccess}
        user={selectedUserForDepartment}
      />
    </motion.div>
  );
};

export default UserRoleManagement;