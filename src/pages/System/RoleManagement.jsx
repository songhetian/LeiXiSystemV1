import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { getApiUrl } from '../../utils/apiConfig';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/apiClient';
import RoleDepartmentModal from '../../components/RoleDepartmentModal';
import { Plus, Edit, Trash2, User, Users, Lock, Eye, RefreshCw, Check, X } from 'lucide-react';

// 导入 shadcn UI 组件
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow, TableCell } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '../../components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';



const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]); // 添加用户状态
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false); // 添加抽屉状态
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null); // 用于分配用户的选中角色
  const [selectedUsers, setSelectedUsers] = useState([]); // 用于分配用户的选中用户
  const [form] = Form.useForm();
  const [userForm] = Form.useForm(); // 用户分配表单
  const [checkedKeys, setCheckedKeys] = useState([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('');
  const [templateApplyMode, setTemplateApplyMode] = useState('merge');
  const [customTemplates, setCustomTemplates] = useState([]);
  const [isTemplateManageOpen, setIsTemplateManageOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({ name: '', description: '', permission_ids: [] });
  const [departments, setDepartments] = useState([]);
  const [isBatchDeptOpen, setIsBatchDeptOpen] = useState(false);
  const [batchSelectedDepartments, setBatchSelectedDepartments] = useState([]);
  const [clonePrefix, setClonePrefix] = useState('');
  const [cloneSuffix, setCloneSuffix] = useState('副本');
  const [cloneCopyDepartments, setCloneCopyDepartments] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);

  // 部门权限状态
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [selectedRoleForDepartment, setSelectedRoleForDepartment] = useState(null);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    fetchPermissionTemplates();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await apiGet('/api/roles');
      if (response.success) {
        // 获取每个角色的部门权限信息
        const rolesWithDepartments = await Promise.all(response.data.map(async (role) => {
          try {
            const deptResponse = await apiGet(`/api/roles/${role.id}/departments`);
            if (deptResponse.success) {
              return { ...role, departments: deptResponse.data };
            }
          } catch (error) {
            console.error(`获取角色 ${role.name} 的部门权限失败:`, error);
          }
          return { ...role, departments: [] };
        }));
        setRoles(rolesWithDepartments);
      }
    } catch (error) {
      toast.error('获取角色列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await apiGet('/api/permissions');
      if (response.success) {
        setPermissions(response.data);
      }
    } catch (error) {
      toast.error('获取权限列表失败');
    }
  };

  const fetchPermissionTemplates = async () => {
    try {
      const res = await apiGet('/api/permission-templates');
      const data = res.success && Array.isArray(res.data) ? res.data : [];
      setCustomTemplates(data);
    } catch {
      setCustomTemplates([]);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await apiGet('/api/departments');
      const data = res.success ? (res.data || []) : (Array.isArray(res) ? res : []);
      setDepartments((data || []).filter(d => d.status === 'active'));
    } catch {
      setDepartments([]);
    }
  };

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      const response = await apiGet('/api/users-with-roles');
      if (response.success) {
        setUsers(response.data);
      } else if (Array.isArray(response)) {
        // 兼容旧的API格式
        setUsers(response);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      toast.error('获取用户列表失败');
    }
  };

  const moduleNames = {
    system: '系统管理',
    user: '用户管理',
    attendance: '考勤管理',
    leave: '请假管理',
    schedule: '排班管理',
    exam: '考试管理',
    training: '培训管理',
    assessment: '考核管理',
    quality: '质检管理',
    memo: '备忘录管理',
    learning: '学习中心',
    device: '设备管理'
  };

  const permissionTreeData = useMemo(() => {
    const modules = {};
    permissions.forEach(p => {
      const mod = p.module || 'system';
      if (!modules[mod]) {
        modules[mod] = {
          title: moduleNames[mod] || '系统管理',
          key: `module-${mod}`,
          children: []
        };
      }
      modules[mod].children.push({
        title: `${p.description || '未命名权限'}`,
        key: p.id.toString(),
        isLeaf: true
      });
    });
    return Object.values(modules);
  }, [permissions]);

  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    setCheckedKeys([]);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRole(record);
    form.setFieldsValue(record);
    // 设置已选权限
    const keys = record.permissions ? record.permissions.map(p => p.id.toString()) : [];
    setCheckedKeys(keys);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await apiDelete(`/api/roles/${id}`);
      if (response.success) {
        toast.success('删除成功');
        fetchRoles();
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // 部门权限管理
  const handleManageDepartments = (role) => {
    setSelectedRoleForDepartment(role);
    setIsDepartmentModalOpen(true);
  };

  const handleDepartmentSuccess = () => {
    fetchRoles();
  };

  // 分配用户给角色
  const handleAssignUsers = async (role) => {
    setSelectedRole(role);
    setDrawerVisible(true);

    // 获取当前已分配给该角色的用户
    try {
      const response = await apiGet(`/api/roles/${role.id}/users`);
      if (response.success && Array.isArray(response.data)) {
        const userIds = response.data.map(user => user.id);
        setSelectedUsers(userIds);
        userForm.setFieldsValue({ users: userIds });
      }
    } catch (error) {
      console.error('获取角色用户失败:', error);
      toast.error('获取角色用户失败');
    }
  };

  // 保存用户分配
  const handleSaveUserAssignment = async () => {
    try {
      const values = await userForm.validateFields();

      // 调用API保存用户分配
      await apiPut(`/api/roles/${selectedRole.id}/users`, {
        userIds: values.users
      });

      toast.success('用户分配成功');
      setDrawerVisible(false);
      fetchRoles(); // 刷新角色列表
    } catch (error) {
      toast.error('分配失败: ' + (error.message || '未知错误'));
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      // 过滤掉模块节点，只保留实际的权限 ID
      const permissionIds = checkedKeys.filter(key => !key.startsWith('module-')).map(Number);

      const payload = {
        ...values,
        permissionIds
      };

      if (editingRole) {
        await apiPut(`/api/roles/${editingRole.id}`, payload);
        toast.success('更新成功');
      } else {
        await apiPost('/api/roles', payload);
        toast.success('创建成功');
      }
      setModalVisible(false);
      fetchRoles(); // 刷新角色列表，包括部门权限信息
    } catch (error) {
      toast.error('保存失败');
    }
  };

  const onCheck = (checkedKeysValue) => {
    setCheckedKeys(checkedKeysValue);
  };

  const columns = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div className="inline-flex items-center gap-1">
          <span className="font-medium text-gray-900">{text}</span>
          {record.is_system && <Badge variant="secondary">系统</Badge>}
        </div>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text) => (
        <span className="text-gray-600">{text || '-'}</span>
      )
    },
    {
      title: '可查看部门',
      key: 'departments',
      render: (_, record) => {
        if (!record.departments || record.departments.length === 0) {
          return <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
            <Eye className="mr-1 h-3 w-3" />
            未设置
          </span>;
        }

        // 优化部门显示，最多显示2个完整部门名称，其余以数字显示
        const displayDeps = record.departments.slice(0, 2);
        const remainingCount = record.departments.length - 2;

        return (
          <div className="flex flex-wrap gap-1">
            {displayDeps.map(dept => (
              <span
                key={dept.id}
                className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800"
              >
                <Eye className="mr-1 h-3 w-3" />
                {dept.name}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                +{remainingCount}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: '权限数量',
      key: 'permissions',
      render: (_, record) => {
        const count = record.permissions ? record.permissions.length : 0;
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
            <Lock className="mr-1 h-3 w-3" />
            {count}
          </span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <div className="flex flex-wrap gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAssignUsers(record)}
            title="分配用户"
            className="flex items-center gap-1"
          >
            <User className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleManageDepartments(record)}
            title="部门权限"
            className="flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(record)}
            disabled={record.name === '超级管理员'}
            title="编辑角色"
            className="flex items-center gap-1"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {!record.is_system && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDelete(record.id)}
              title="删除角色"
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const wait = (ms) => new Promise(res => setTimeout(res, ms));
  const withRetry = async (fn, retries = 2, delayMs = 300) => {
    let lastErr;
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (e) {
        lastErr = e;
        if (i < retries) await wait(delayMs);
      }
    }
    throw lastErr;
  };

  const BUILTIN_TEMPLATES = [
    { key: 'customer_basic', name: '客服基础', modules: ['quality', 'learning', 'memo'] },
    { key: 'attendance_admin', name: '考勤管理员', modules: ['attendance', 'schedule'] },
    { key: 'qa_manager', name: '质检管理员', modules: ['quality'] },
    { key: 'org_admin', name: '组织管理员', modules: ['system', 'user'] },
    { key: 'full_access', name: '全权限', modules: Object.keys(moduleNames) }
  ];

  const getTemplatePermissionIds = (tplKey) => {
    if (!tplKey) return [];
    if (tplKey.startsWith('custom:')) {
      const id = parseInt(tplKey.split(':')[1]);
      const tpl = customTemplates.find(t => t.id === id);
      return Array.isArray(tpl?.permission_ids) ? tpl.permission_ids : [];
    }
    const tpl = BUILTIN_TEMPLATES.find(t => t.key === tplKey);
    if (!tpl) return [];
    return permissions
      .filter(p => tpl.modules.includes(p.module))
      .map(p => p.id);
  };

  const handleBatchDeleteRoles = async () => {
    if (selectedRoleIds.length === 0) return;
    setIsProcessingBatch(true);
    setBatchProgress({ done: 0, total: selectedRoleIds.length });
    try {
      for (const roleId of selectedRoleIds) {
        await withRetry(() => apiDelete(`/api/roles/${roleId}`));
        setBatchProgress(prev => ({ ...prev, done: prev.done + 1 }));
      }
      toast.success('批量删除完成');
      setSelectedRoleIds([]);
      fetchRoles();
    } catch {
      toast.error('批量删除失败');
    } finally {
      setIsProcessingBatch(false);
      setBatchProgress({ done: 0, total: 0 });
    }
  };

  const openBatchDepartmentModal = async () => {
    await fetchDepartments();
    setIsBatchDeptOpen(true);
  };

  const handleBatchDepartmentsSave = async () => {
    setIsProcessingBatch(true);
    setBatchProgress({ done: 0, total: selectedRoleIds.length });
    try {
      for (const roleId of selectedRoleIds) {
        await withRetry(() => apiPut(`/api/roles/${roleId}/departments`, { department_ids: batchSelectedDepartments }));
        setBatchProgress(prev => ({ ...prev, done: prev.done + 1 }));
      }
      setIsBatchDeptOpen(false);
      setSelectedRoleIds([]);
      fetchRoles();
      toast.success('批量设置部门权限完成');
    } catch {
      toast.error('批量设置失败');
    } finally {
      setIsProcessingBatch(false);
      setBatchProgress({ done: 0, total: 0 });
    }
  };

  const handleApplyTemplateToSelectedRoles = async () => {
    if (!selectedTemplateKey) {
      toast.error('请选择权限模板');
      return;
    }
    if (selectedRoleIds.length === 0) {
      toast.error('请选择至少一个角色');
      return;
    }

    setIsProcessingBatch(true);
    setBatchProgress({ done: 0, total: selectedRoleIds.length });
    try {
      const templatePermissionIds = getTemplatePermissionIds(selectedTemplateKey);
      for (const roleId of selectedRoleIds) {
        try {
          // 获取角色当前权限
          const roleRes = await apiGet(`/api/roles/${roleId}`);
          let currentPermissionIds = [];
          if (roleRes.success && roleRes.data && roleRes.data.permissions) {
            currentPermissionIds = roleRes.data.permissions.map(p => p.id);
          } else if (Array.isArray(roleRes) && roleRes.length > 0) {
            // 兼容旧的API格式
            currentPermissionIds = roleRes[0].permissions.map(p => p.id);
          }

          // 根据模式决定最终权限ID列表
          let finalPermissionIds;
          if (templateApplyMode === 'replace') {
            finalPermissionIds = templatePermissionIds;
          } else {
            // merge模式：合并现有权限和模板权限
            finalPermissionIds = [...new Set([...currentPermissionIds, ...templatePermissionIds])];
          }

          // 更新角色权限
          await apiPut(`/api/roles/${roleId}`, {
            name: roleRes.data?.name || roleRes[0]?.name,
            description: roleRes.data?.description || roleRes[0]?.description,
            permissionIds: finalPermissionIds
          });
        } catch (e) {
          console.error(`应用模板到角色 ${roleId} 失败:`, e);
        }
        setBatchProgress(prev => ({ ...prev, done: prev.done + 1 }));
      }
      setIsTemplateModalOpen(false);
      setSelectedRoleIds([]);
      setSelectedTemplateKey('');
      fetchRoles();
      toast.success('模板应用完成');
    } catch {
      toast.error('应用模板失败');
    } finally {
      setIsProcessingBatch(false);
      setBatchProgress({ done: 0, total: 0 });
    }
  };

  const [searchText, setSearchText] = useState('');

  // 过滤角色
  const filteredRoles = useMemo(() => {
    if (!searchText) return roles;
    return roles.filter(role =>
      role.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchText.toLowerCase()))
    );
  }, [roles, searchText]);

  // 清空搜索
  const clearSearch = () => {
    setSearchText('');
  };

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        {/* 头部 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">角色权限管理</h2>
            <p className="text-gray-500 text-sm mt-1">管理系统中的角色及其权限配置</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleAdd}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">新增角色</span>
            </Button>
            <Button
              onClick={fetchRoles}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">刷新</span>
            </Button>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="mb-4 flex flex-col sm:flex-row gap-2">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="搜索角色名称或描述..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          {searchText && (
            <Button onClick={clearSearch}>
              清空
            </Button>
          )}
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="text-blue-800 font-medium">总角色数</div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{roles.length}</div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="text-purple-800 font-medium">系统角色</div>
            <div className="text-2xl font-bold text-purple-900 mt-1">{roles.filter(r => r.is_system).length}</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="text-green-800 font-medium">自定义角色</div>
            <div className="text-2xl font-bold text-green-900 mt-1">{roles.filter(r => !r.is_system).length}</div>
          </div>
        </div>

        {/* 批量操作栏 */}
        {selectedRoleIds.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-sm text-blue-800">
              已选择 {selectedRoleIds.length} 个角色
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => setIsTemplateModalOpen(true)}
                className="flex items-center gap-1"
              >
                <Users className="h-4 w-4" />
                应用模板
              </Button>
              <Button
                size="sm"
                onClick={openBatchDepartmentModal}
                className="flex items-center gap-1"
              >
                <Users className="h-4 w-4" />
                部门权限
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBatchDeleteRoles}
                disabled={isProcessingBatch}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                删除
              </Button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">选择</TableHead>
              <TableHead>角色名称</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>可查看部门</TableHead>
              <TableHead>权限数量</TableHead>
              <TableHead className="w-40">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoles.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedRoleIds.includes(record.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRoleIds([...selectedRoleIds, record.id]);
                      } else {
                        setSelectedRoleIds(selectedRoleIds.filter(id => id !== record.id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{record.name}</span>
                    {record.is_system && <Badge variant="secondary">系统</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-gray-600">{record.description || '-'}</span>
                </TableCell>
                <TableCell>
                  {(!record.departments || record.departments.length === 0) ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                      <Eye className="mr-1 text-xs h-3 w-3" />
                      未设置
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {record.departments.slice(0, 2).map(dept => (
                        <span
                          key={dept.id}
                          className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800"
                        >
                          <Eye className="mr-1 text-xs h-3 w-3" />
                          {dept.name}
                        </span>
                      ))}
                      {record.departments.length > 2 && (
                        <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                          +{record.departments.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    <Lock className="mr-1 text-xs h-3 w-3" />
                    {record.permissions ? record.permissions.length : 0}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAssignUsers(record)}
                      title="分配用户"
                      className="flex items-center gap-1"
                    >
                      <User className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleManageDepartments(record)}
                      title="部门权限"
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(record)}
                      disabled={record.name === '超级管理员'}
                      title="编辑角色"
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!record.is_system && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(record.id)}
                        title="删除角色"
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRole ? '编辑角色' : '新增角色'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="role-name" className="text-sm font-medium mb-1 block">角色名称</Label>
              <Input
                id="role-name"
                value={form.getFieldValue('name') || ''}
                onChange={(e) => form.setFieldsValue({ name: e.target.value })}
                placeholder="请输入角色名称"
              />
            </div>
            <div>
              <Label htmlFor="role-description" className="text-sm font-medium mb-1 block">描述</Label>
              <textarea
                id="role-description"
                value={form.getFieldValue('description') || ''}
                onChange={(e) => form.setFieldsValue({ description: e.target.value })}
                placeholder="请输入角色描述"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">权限配置</Label>
              <div className="border rounded-lg p-3 max-h-80 overflow-y-auto bg-gray-50">
                {/* 这里需要替换为自定义树形组件或使用其他方式展示权限 */}
                <div>权限配置区域</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalVisible(false)}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 用户分配抽屉 */}
      <Drawer open={drawerVisible} onOpenChange={setDrawerVisible}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>为 "{selectedRole?.name}" 角色分配用户</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <div>
              <Label htmlFor="user-select" className="text-sm font-medium mb-1 block">选择用户</Label>
              <Select
                value={selectedUsers.map(String)}
                onValueChange={(value) => {
                  const numericValues = value.map(Number);
                  setSelectedUsers(numericValues);
                  userForm.setFieldsValue({ users: numericValues });
                }}
                multiple
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择用户" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      <div className="flex items-center">
                        <User className="mr-2 text-gray-500 h-4 w-4" />
                        <div>
                          <div className="font-medium">{user.real_name}</div>
                          <div className="text-xs text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DrawerFooter>
            <Button variant="outline" onClick={() => setDrawerVisible(false)}>
              取消
            </Button>
            <Button onClick={handleSaveUserAssignment}>
              保存
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* 部门权限管理模态框 */}
      <RoleDepartmentModal
        isOpen={isDepartmentModalOpen}
        onClose={() => {
          setIsDepartmentModalOpen(false);
          setSelectedRoleForDepartment(null);
        }}
        role={selectedRoleForDepartment}
        onSuccess={handleDepartmentSuccess}
      />

      {/* 模板管理模态框 */}
      <Dialog open={isTemplateManageOpen} onOpenChange={setIsTemplateManageOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? '编辑模板' : '新建模板'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-1 block">模板名称</Label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="请输入模板名称"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">模板描述</Label>
                <Input
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  placeholder="请输入模板描述"
                />
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700">选择权限</div>
            <div className="max-h-64 overflow-y-auto space-y-3">
              {Object.entries(moduleNames).map(([key, name]) => {
                const modulePerms = permissions.filter(p => p.module === key);
                if (modulePerms.length === 0) return null;

                return (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle>{name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {modulePerms.map(perm => {
                          const checked = templateForm.permission_ids.includes(perm.id);
                          return (
                            <label key={perm.id} className="flex items-center gap-2 text-sm p-2 hover:bg-gray-50 rounded">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(checked) => {
                                  setTemplateForm({
                                    ...templateForm,
                                    permission_ids: checked
                                      ? [...templateForm.permission_ids, perm.id]
                                      : templateForm.permission_ids.filter(id => id !== perm.id)
                                  });
                                }}
                              />
                              <span>{perm.description}</span>
                            </label>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">已选择 {templateForm.permission_ids.length} 项</div>
              <div className="flex gap-2">
                {editingTemplate && (
                  <Button variant="destructive" onClick={async () => {
                    try {
                      await apiDelete(`/api/permission-templates/${editingTemplate.id}`);
                      await fetchPermissionTemplates();
                      setIsTemplateManageOpen(false);
                      setEditingTemplate(null);
                      toast.success('模板已删除');
                    } catch {
                      toast.error('删除失败');
                    }
                  }}>删除</Button>
                )}
                <Button onClick={async () => {
                  if (!templateForm.name.trim()) {
                    toast.error('请输入模板名称');
                    return;
                  }
                  try {
                    if (editingTemplate) {
                      await apiPut(`/api/permission-templates/${editingTemplate.id}`, templateForm);
                    } else {
                      await apiPost('/api/permission-templates', templateForm);
                    }
                    await fetchPermissionTemplates();
                    setIsTemplateManageOpen(false);
                    setEditingTemplate(null);
                    setTemplateForm({ name: '', description: '', permission_ids: [] });
                    toast.success('已保存模板');
                  } catch {
                    toast.error('保存失败');
                  }
                }}>保存</Button>
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="text-sm font-medium text-gray-700 mb-2">已有模板</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {customTemplates.map(tpl => (
                  <label key={tpl.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="tplPick"
                      onChange={() => {
                        setEditingTemplate(tpl);
                        setTemplateForm({
                          name: tpl.name,
                          description: tpl.description || '',
                          permission_ids: tpl.permission_ids || []
                        });
                      }}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{tpl.name}</div>
                      <div className="text-xs text-gray-500">{tpl.description || ''}</div>
                    </div>
                    <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
                      {Array.isArray(tpl.permission_ids) ? tpl.permission_ids.length : 0} 项
                    </span>
                  </label>
                ))}
                {customTemplates.length === 0 && (
                  <div className="text-sm text-gray-400 col-span-2 text-center py-4">暂无模板</div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateManageOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>应用权限模板到选中角色</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              已选择 {selectedRoleIds.length} 个角色
            </div>

            <div className="text-sm font-medium text-gray-700">选择模板</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {BUILTIN_TEMPLATES.map(tpl => (
                <label
                  key={tpl.key}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedTemplateKey === tpl.key
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="permissionTemplate"
                    value={tpl.key}
                    checked={selectedTemplateKey === tpl.key}
                    onChange={(e) => setSelectedTemplateKey(e.target.value)}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{tpl.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {tpl.modules.map(m => moduleNames[m] || m).join('、')}
                    </div>
                  </div>
                </label>
              ))}
              {customTemplates.map(tpl => (
                <label
                  key={`custom-${tpl.id}`}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedTemplateKey === `custom:${tpl.id}`
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="permissionTemplate"
                    value={`custom:${tpl.id}`}
                    checked={selectedTemplateKey === `custom:${tpl.id}`}
                    onChange={(e) => setSelectedTemplateKey(e.target.value)}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{tpl.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{tpl.description || '自定义模板'}</div>
                  </div>
                  <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
                    {Array.isArray(tpl.permission_ids) ? tpl.permission_ids.length : 0} 项
                  </span>
                </label>
              ))}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">模板预览</div>
              <div className="max-h-40 overflow-y-auto text-sm text-gray-600">
                {getTemplatePermissionIds(selectedTemplateKey).map(pid => {
                  const p = permissions.find(x => x.id === pid);
                  return (
                    <div key={pid} className="py-1 border-b border-gray-100 last:border-0">
                      {p?.description || `权限 #${pid}`}
                    </div>
                  );
                })}
                {getTemplatePermissionIds(selectedTemplateKey).length === 0 && (
                  <div className="text-gray-400 py-2">未选择模板或模板为空</div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">应用方式</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="applyMode"
                    value="merge"
                    checked={templateApplyMode === 'merge'}
                    onChange={() => setTemplateApplyMode('merge')}
                  />
                  合并追加（不删除已有权限）
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="applyMode"
                    value="replace"
                    checked={templateApplyMode === 'replace'}
                    onChange={() => setTemplateApplyMode('replace')}
                  />
                  覆盖替换（将替换为模板权限）
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsTemplateModalOpen(false)}>取消</Button>
              <Button onClick={handleApplyTemplateToSelectedRoles}>应用模板</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchDeptOpen} onOpenChange={setIsBatchDeptOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>批量设置角色部门权限</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              已选择 {selectedRoleIds.length} 个角色
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                已选择 <span className="font-semibold text-gray-900">{batchSelectedDepartments.length}</span> / {departments.length} 个部门
              </div>
              <Button
                size="sm"
                onClick={() => {
                  if (batchSelectedDepartments.length === departments.length) {
                    setBatchSelectedDepartments([])
                  } else {
                    setBatchSelectedDepartments(departments.map(d => d.id))
                  }
                }}
              >
                {batchSelectedDepartments.length === departments.length ? '取消全选' : '全选'}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
              {departments.map(dept => (
                <label
                  key={dept.id}
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    batchSelectedDepartments.includes(dept.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Checkbox
                    checked={batchSelectedDepartments.includes(dept.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setBatchSelectedDepartments([...batchSelectedDepartments, dept.id])
                      } else {
                        setBatchSelectedDepartments(batchSelectedDepartments.filter(id => id !== dept.id))
                      }
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{dept.name}</div>
                    {dept.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{dept.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsBatchDeptOpen(false)} disabled={isProcessingBatch}>取消</Button>
              <Button
                onClick={handleBatchDepartmentsSave}
                disabled={isProcessingBatch}
              >
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCloneModalOpen} onOpenChange={setIsCloneModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量克隆选中角色</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              已选择 {selectedRoleIds.length} 个角色
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">前缀</Label>
                <Input
                  value={clonePrefix}
                  onChange={(e) => setClonePrefix(e.target.value)}
                  placeholder="如：复制-"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">后缀</Label>
                <Input
                  value={cloneSuffix}
                  onChange={(e) => setCloneSuffix(e.target.value)}
                  placeholder="如：-副本"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={cloneCopyDepartments}
                onCheckedChange={(checked) => setCloneCopyDepartments(checked)}
              />
              克隆时复制部门可见范围
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsCloneModalOpen(false)}>取消</Button>
              <Button>开始克隆</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagement;
