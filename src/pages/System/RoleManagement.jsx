import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, Tree, message, Card, Tag, Space, Popconfirm, Drawer, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { getApiUrl } from '../../utils/apiConfig';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/apiClient';
import RoleDepartmentModal from '../../components/RoleDepartmentModal';

const { Option } = Select;

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
        setRoles(response.data);
      }
    } catch (error) {
      message.error('获取角色列表失败');
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
      message.error('获取权限列表失败');
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
      message.error('获取用户列表失败');
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
        message.success('删除成功');
        fetchRoles();
      }
    } catch (error) {
      message.error('删除失败');
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
    fetchUsers(); // 获取用户列表

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
      message.error('获取角色用户失败');
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

      message.success('用户分配成功');
      setDrawerVisible(false);
      fetchRoles(); // 刷新角色列表
    } catch (error) {
      message.error('分配失败: ' + (error.message || '未知错误'));
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
        message.success('更新成功');
      } else {
        await apiPost('/api/roles', payload);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchRoles();
    } catch (error) {
      message.error('保存失败');
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
        <Space>
          {text}
          {record.is_system && <Tag color="blue">系统</Tag>}
        </Space>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            onClick={() => handleAssignUsers(record)}
          >
            分配用户
          </Button>
          <Button
            type="link"
            onClick={() => handleManageDepartments(record)}
          >
            部门权限
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={record.name === '超级管理员'} // 超级管理员不可编辑权限，防止把自己锁死
          >
            编辑
          </Button>
          {!record.is_system && (
            <Popconfirm title="确定删除吗?" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
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
      message.success('批量删除完成');
      setSelectedRoleIds([]);
      fetchRoles();
    } catch {
      message.error('批量删除失败');
    } finally {
      setIsProcessingBatch(false);
      setBatchProgress({ done: 0, total: 0 });
    }
  };

  const handleApplyTemplateToSelectedRoles = async () => {
    if (!selectedTemplateKey) {
      message.error('请选择模板');
      return;
    }
    if (selectedRoleIds.length === 0) {
      message.error('请先选择角色');
      return;
    }
    const tplPermIds = getTemplatePermissionIds(selectedTemplateKey);
    if (tplPermIds.length === 0) {
      message.error('模板没有可用权限');
      return;
    }
    setIsProcessingBatch(true);
    setBatchProgress({ done: 0, total: selectedRoleIds.length });
    try {
      for (const roleId of selectedRoleIds) {
        const role = roles.find(r => r.id === roleId);
        if (!role) continue;
        if (templateApplyMode === 'replace') {
          await withRetry(() => apiPut(`/api/roles/${roleId}`, { name: role.name, description: role.description, permissionIds: tplPermIds }));
        } else {
          const existingIds = (role.permissions || []).map(p => p.id);
          const toAdd = tplPermIds.filter(id => !existingIds.includes(id));
          for (const pid of toAdd) {
            await withRetry(() => apiPost(`/api/roles/${roleId}/permissions`, { permission_id: pid }));
          }
        }
        setBatchProgress(prev => ({ ...prev, done: prev.done + 1 }));
      }
      fetchRoles();
      setIsTemplateModalOpen(false);
      setSelectedTemplateKey('');
      message.success(templateApplyMode === 'replace' ? '模板已覆盖到选中角色' : '模板已应用到选中角色');
    } catch {
      message.error('应用模板失败');
    } finally {
      setIsProcessingBatch(false);
      setBatchProgress({ done: 0, total: 0 });
    }
  };

  const handleCloneSelectedRoles = async () => {
    if (selectedRoleIds.length === 0) return;
    setIsProcessingBatch(true);
    setBatchProgress({ done: 0, total: selectedRoleIds.length });
    try {
      for (const roleId of selectedRoleIds) {
        const role = roles.find(r => r.id === roleId);
        if (!role) continue;
        const newName = `${clonePrefix || ''}${role.name}${cloneSuffix || ''}`;
        const permissionIds = (role.permissions || []).map(p => p.id);
        const res = await withRetry(() => apiPost('/api/roles', { name: newName, description: role.description, permissionIds }));
        const newRoleId = res?.roleId || res?.id;
        if (cloneCopyDepartments && newRoleId) {
          try {
            const deptRes = await withRetry(() => apiGet(`/api/roles/${roleId}/departments`));
            const deptIds = (deptRes?.data || []).map(d => d.id);
            if (deptIds.length > 0) {
              await withRetry(() => apiPut(`/api/roles/${newRoleId}/departments`, { department_ids: deptIds }));
            }
          } catch {}
        }
        setBatchProgress(prev => ({ ...prev, done: prev.done + 1 }));
      }
      fetchRoles();
      setClonePrefix('');
      setCloneSuffix('副本');
      setCloneCopyDepartments(false);
      setSelectedRoleIds([]);
      setIsTemplateModalOpen(false);
      message.success('克隆完成');
    } catch {
      message.error('克隆失败');
    } finally {
      setIsProcessingBatch(false);
      setBatchProgress({ done: 0, total: 0 });
    }
  };

  const openBatchDepartmentModal = async () => {
    if (selectedRoleIds.length === 0) {
      message.error('请先选择角色');
      return;
    }
    await fetchDepartments();
    setBatchSelectedDepartments([]);
    setIsBatchDeptOpen(true);
  };

  const handleBatchDepartmentsSave = async () => {
    if (!batchSelectedDepartments) return;
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
      message.success('批量设置部门权限完成');
    } catch {
      message.error('批量设置失败');
    } finally {
      setIsProcessingBatch(false);
      setBatchProgress({ done: 0, total: 0 });
    }
  };

  return (
    <div className="p-8">
      <div className="bg-white rounded-xl shadow-md p-6">
        {/* 头部 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">角色管理</h2>
            <p className="text-gray-500 text-sm mt-1">共 {roles.length} 个角色</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAdd}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              <span>新增角色</span>
            </button>
            <Button
              onClick={() => setIsTemplateManageOpen(true)}
              className="border"
            >模板管理</Button>
            <Button
              disabled={selectedRoleIds.length === 0}
              onClick={() => setIsTemplateModalOpen(true)}
              type="primary"
            >应用模板</Button>
            <Button
              disabled={selectedRoleIds.length === 0}
              onClick={() => setIsCloneModalOpen(true)}
            >批量克隆</Button>
            <Button
              danger
              disabled={selectedRoleIds.length === 0 || isProcessingBatch}
              onClick={handleBatchDeleteRoles}
            >批量删除</Button>
            <Button
              disabled={selectedRoleIds.length === 0}
              onClick={openBatchDepartmentModal}
            >批量部门权限</Button>
            {isProcessingBatch && (
              <span className="text-sm text-gray-600">处理中 {batchProgress.done} / {batchProgress.total}</span>
            )}
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
          pagination={false}
          rowSelection={{
            selectedRowKeys: selectedRoleIds,
            onChange: (keys) => setSelectedRoleIds(keys),
            preserveSelectedRowKeys: true
          }}
        />
      </div>

      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item label="权限配置">
            <div className="border rounded p-4 max-h-96 overflow-y-auto">
              <Tree
                checkable
                defaultExpandAll
                onCheck={onCheck}
                checkedKeys={checkedKeys}
                treeData={permissionTreeData}
              />
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* 用户分配抽屉 */}
      <Drawer
        title={`为 "${selectedRole?.name}" 角色分配用户`}
        width={480}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <Form form={userForm} layout="vertical">
          <Form.Item
            name="users"
            label="选择用户"
            rules={[{ required: true, message: '请选择至少一个用户' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择用户"
              optionLabelProp="label"
            >
              {users.map(user => (
                <Option
                  key={user.id}
                  value={user.id}
                  label={`${user.real_name} (${user.username})`}
                >
                  <div className="flex items-center">
                    <UserOutlined className="mr-2" />
                    <div>
                      <div>{user.real_name}</div>
                      <div className="text-xs text-gray-500">{user.username}</div>
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
        <div className="flex justify-end">
          <Button onClick={() => setDrawerVisible(false)} style={{ marginRight: 8 }}>
            取消
          </Button>
          <Button type="primary" onClick={handleSaveUserAssignment}>
            保存
          </Button>
        </div>
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

      <Modal
        title={editingTemplate ? '编辑模板' : '新建模板'}
        open={isTemplateManageOpen}
        onCancel={() => setIsTemplateManageOpen(false)}
        footer={null}
        width={720}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">模板名称</label>
              <Input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">模板描述</label>
              <Input value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} />
            </div>
          </div>
          <div className="text-sm font-medium text-gray-700">选择权限</div>
          <div className="max-h-64 overflow-y-auto space-y-3">
            {Object.values(moduleNames).map((name, idx) => (
              <Card key={idx} size="small" title={name} className="mb-2">
                <div className="grid grid-cols-2 gap-2">
                  {permissions.filter(p => moduleNames[p.module] === name).map(perm => {
                    const checked = templateForm.permission_ids.includes(perm.id);
                    return (
                      <label key={perm.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={checked} onChange={(e) => {
                          setTemplateForm({
                            ...templateForm,
                            permission_ids: e.target.checked
                              ? [...templateForm.permission_ids, perm.id]
                              : templateForm.permission_ids.filter(id => id !== perm.id)
                          })
                        }} />
                        <span>{perm.description}</span>
                      </label>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">已选择 {templateForm.permission_ids.length} 项</div>
            <div className="flex gap-2">
              {editingTemplate && (
                <Button danger onClick={async () => {
                  try {
                    await apiDelete(`/api/permission-templates/${editingTemplate.id}`);
                    await fetchPermissionTemplates();
                    setIsTemplateManageOpen(false);
                    setEditingTemplate(null);
                    message.success('模板已删除');
                  } catch {
                    message.error('删除失败');
                  }
                }}>删除</Button>
              )}
              <Button type="primary" onClick={async () => {
                if (!templateForm.name.trim()) {
                  message.error('请输入模板名称');
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
                  message.success('已保存模板');
                } catch {
                  message.error('保存失败');
                }
              }}>保存</Button>
            </div>
          </div>
          <div className="pt-4 border-t">
            <div className="text-sm font-medium text-gray-700 mb-2">已有模板</div>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {customTemplates.map(tpl => (
                <label key={tpl.id} className="flex items-center gap-3 p-3 border rounded cursor-pointer">
                  <input type="radio" name="tplPick" onChange={() => {
                    setEditingTemplate(tpl);
                    setTemplateForm({ name: tpl.name, description: tpl.description || '', permission_ids: tpl.permission_ids || [] });
                  }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{tpl.name}</div>
                    <div className="text-xs text-gray-500">{tpl.description || ''}</div>
                  </div>
                  <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">{Array.isArray(tpl.permission_ids) ? tpl.permission_ids.length : 0} 项</span>
                </label>
              ))}
              {customTemplates.length === 0 && (
                <div className="text-sm text-gray-400">暂无模板</div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        title={"应用权限模板到选中角色"}
        open={isTemplateModalOpen}
        onCancel={() => setIsTemplateModalOpen(false)}
        footer={null}
        width={720}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {BUILTIN_TEMPLATES.map(tpl => (
              <label key={tpl.key} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${selectedTemplateKey === tpl.key ? 'border-primary-500' : 'border-gray-200'}`}>
                <input type="radio" name="permissionTemplate" value={tpl.key} checked={selectedTemplateKey === tpl.key} onChange={(e) => setSelectedTemplateKey(e.target.value)} />
                <div>
                  <div className="text-sm font-medium text-gray-900">{tpl.name}</div>
                  <div className="text-xs text-gray-500">{tpl.modules.map(m => moduleNames[m] || m).join('、')}</div>
                </div>
              </label>
            ))}
            {customTemplates.map(tpl => (
              <label key={`custom-${tpl.id}`} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${selectedTemplateKey === `custom:${tpl.id}` ? 'border-primary-500' : 'border-gray-200'}`}>
                <input type="radio" name="permissionTemplate" value={`custom:${tpl.id}`} checked={selectedTemplateKey === `custom:${tpl.id}`} onChange={(e) => setSelectedTemplateKey(e.target.value)} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{tpl.name}</div>
                  <div className="text-xs text-gray-500">{tpl.description || '自定义模板'}</div>
                </div>
                <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">{Array.isArray(tpl.permission_ids) ? tpl.permission_ids.length : 0} 项</span>
              </label>
            ))}
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded p-3">
            <div className="text-sm font-medium text-gray-700 mb-2">模板预览</div>
            <div className="max-h-40 overflow-y-auto text-sm text-gray-600">
              {getTemplatePermissionIds(selectedTemplateKey).map(pid => {
                const p = permissions.find(x => x.id === pid);
                return (
                  <div key={pid}>{p?.description || `权限 #${pid}`}</div>
                );
              })}
              {getTemplatePermissionIds(selectedTemplateKey).length === 0 && (
                <div className="text-gray-400">未选择模板或模板为空</div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">应用方式</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="applyMode" value="merge" checked={templateApplyMode === 'merge'} onChange={() => setTemplateApplyMode('merge')} />
                合并追加（不删除已有权限）
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="applyMode" value="replace" checked={templateApplyMode === 'replace'} onChange={() => setTemplateApplyMode('replace')} />
                覆盖替换（将替换为模板权限）
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button onClick={() => setIsTemplateModalOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleApplyTemplateToSelectedRoles}>应用模板</Button>
          </div>
        </div>
      </Modal>

      <Modal
        title={"批量设置角色部门权限"}
        open={isBatchDeptOpen}
        onCancel={() => setIsBatchDeptOpen(false)}
        footer={null}
        width={720}
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">已选择 {selectedRoleIds.length} 个角色</div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">已选择 <span className="font-semibold text-gray-900">{batchSelectedDepartments.length}</span> / {departments.length} 个部门</div>
            <Button onClick={() => {
              if (batchSelectedDepartments.length === departments.length) {
                setBatchSelectedDepartments([])
              } else {
                setBatchSelectedDepartments(departments.map(d => d.id))
              }
            }}>全选/取消</Button>
          </div>
          <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
            {departments.map(dept => (
              <label key={dept.id} className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${batchSelectedDepartments.includes(dept.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                <input type="checkbox" checked={batchSelectedDepartments.includes(dept.id)} onChange={() => {
                  if (batchSelectedDepartments.includes(dept.id)) {
                    setBatchSelectedDepartments(batchSelectedDepartments.filter(id => id !== dept.id))
                  } else {
                    setBatchSelectedDepartments([...batchSelectedDepartments, dept.id])
                  }
                }} />
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
            <Button onClick={() => setIsBatchDeptOpen(false)} disabled={isProcessingBatch}>取消</Button>
            <Button type="primary" onClick={handleBatchDepartmentsSave} disabled={isProcessingBatch}>保存</Button>
          </div>
        </div>
      </Modal>

      <Modal
        title={"批量克隆选中角色"}
        open={isCloneModalOpen}
        onCancel={() => setIsCloneModalOpen(false)}
        footer={null}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">前缀</label>
              <Input value={clonePrefix} onChange={(e) => setClonePrefix(e.target.value)} placeholder="如：复制-" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">后缀</label>
              <Input value={cloneSuffix} onChange={(e) => setCloneSuffix(e.target.value)} placeholder="如：-副本" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={cloneCopyDepartments} onChange={(e) => setCloneCopyDepartments(e.target.checked)} />
            克隆时复制部门可见范围
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button onClick={() => setIsCloneModalOpen(false)}>取消</Button>
            <Button type="primary" onClick={() => { setIsCloneModalOpen(false); handleCloneSelectedRoles(); }}>开始克隆</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RoleManagement;
