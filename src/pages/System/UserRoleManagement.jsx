import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Card, Tag, Space, Modal, message, Input, Checkbox, Select, Form, Typography } from 'antd';
import { UserOutlined, TeamOutlined, ReloadOutlined, EyeOutlined, LockOutlined } from '@ant-design/icons';
import { getApiUrl } from '../../utils/apiConfig';
import { apiGet, apiPut, apiPost } from '../../utils/apiClient';
// 导入部门权限模态框组件
import UserDepartmentModal from '../../components/UserDepartmentModal';

const { Option } = Select;

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
      message.error('获取用户列表失败');
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
      message.error('获取角色列表失败');
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
      message.error('获取部门列表失败');
    }
  };

  const handleManageRoles = (user) => {
    setSelectedUser(user);
    // 提取用户当前的角色ID（单选）
    const userRoleId = user.roles && user.roles.length > 0 ? user.roles[0].id : null;
    setSelectedRoles(userRoleId ? [userRoleId] : []);
    setModalVisible(true);
  };

  const handleSaveRoles = async () => {
    try {
      await apiPut(`/api/users/${selectedUser.id}/roles`, {
        roleIds: selectedRoles
      });

      message.success('角色分配成功');
      setModalVisible(false);
      fetchUsers(); // 刷新用户列表
    } catch (error) {
      message.error('分配失败: ' + (error.message || '未知错误'));
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
    message.success('员工部门权限设置成功');
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

    return result;
  }, [users, searchText, searchDepartment, searchRole]);

  

  const columns = [
    {
      title: '用户信息',
      key: 'user-info',
      align: 'center',
      render: (_, record) => (
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <UserOutlined className="text-blue-600 text-sm" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{record.real_name}</div>
            <div className="text-xs text-gray-500">@{record.username}</div>
          </div>
        </div>
      ),
    },
    {
      title: '部门',
      dataIndex: 'department_name',
      key: 'department_name',
      align: 'center',
      render: (text) => (
        <span className="text-sm text-gray-600">{text || '未分配'}</span>
      ),
    },
    {
      title: '角色',
      key: 'roles',
      align: 'center',
      render: (_, record) => (
        <div>
          {record.roles && record.roles.length > 0 ? (
            <Tag 
              color="blue" 
              className="cursor-pointer"
              onClick={() => handleManageRoles(record)}
            >
              {record.roles[0].name}
            </Tag>
          ) : (
            <Button 
              type="link" 
              size="small"
              onClick={() => handleManageRoles(record)}
              className="text-blue-600 hover:text-blue-700 p-0"
            >
              + 分配角色
            </Button>
          )}
        </div>
      ),
    },
    {
      title: '可查看部门',
      key: 'view-departments',
      align: 'center',
      render: (_, record) => {
        if (record.departments && record.departments.length > 0) {
          const displayDeps = record.departments.slice(0, 2);
          const remainingCount = record.departments.length - 2;

          return (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {displayDeps.map(dept => (
                <span
                  key={dept.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg"
                >
                  <EyeOutlined className="text-xs" />
                  {dept.name}
                </span>
              ))}
              {remainingCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg">
                  +{remainingCount}
                </span>
              )}
            </div>
          );
        } else {
          if (record.roles && record.roles.length > 0) {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-yellow-700 bg-yellow-50 rounded-lg">
                <EyeOutlined className="text-xs" />
                默认权限
              </span>
            );
          } else {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg">
                <EyeOutlined className="text-xs" />
                未分配
              </span>
            );
          }
        }
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleManageRoles(record)}
            className="text-blue-600 hover:text-blue-700"
          >
            分配角色
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleManageUserDepartments(record)}
            className="text-purple-600 hover:text-purple-700"
          >
            部门权限
          </Button>
        </Space>
      ),
    },
  ];

  const handleBatchAssignRoles = async () => {
    if (selectedUserIds.length === 0 || !batchAssignRoleId) {
      message.error('请选择用户和角色');
      return;
    }
    setIsProcessingBatch(true);
    setBatchProgress({ done: 0, total: selectedUserIds.length });
    try {
      let failCount = 0;
      for (let i = 0; i < selectedUserIds.length; i++) {
        const userId = selectedUserIds[i];
        try {
          await apiPut(`/api/users/${userId}/roles`, { roleIds: [batchAssignRoleId] });
        } catch (e) {
          console.error(`为用户${userId}分配角色失败:`, e);
          failCount += 1;
        }
        setBatchProgress(prev => ({ ...prev, done: i + 1 }));
      }
      if (failCount === 0) {
        message.success('分配角色成功');
      } else {
        message.error(`分配角色完成，但有 ${failCount} 人失败`);
      }
      setIsBatchAssignOpen(false);
      setBatchAssignRoleId(null);
      setSelectedUserIds([]);
      fetchUsers();
    } catch (error) {
      console.error('批量分配失败:', error);
      message.error('批量分配失败: ' + (error.message || '未知错误'));
    } finally {
      setIsProcessingBatch(false);
      setBatchProgress({ done: 0, total: 0 });
    }
  };

  const handleBatchRemoveRoles = async () => {
    if (selectedUserIds.length === 0) {
      message.error('请选择员工');
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
        message.success('删除角色成功');
      } else {
        message.error(`删除角色完成，但有 ${failCount} 人失败`);
      }
      setIsBatchRemoveOpen(false);
      setSelectedUserIds([]);
      fetchUsers();
    } catch (error) {
      console.error('批量移除失败:', error);
      message.error('批量移除失败: ' + (error.message || '未知错误'));
    } finally {
      setIsProcessingBatch(false);
      setBatchProgress({ done: 0, total: 0 });
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        {/* 头部 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">员工角色管理</h2>
            <p className="text-gray-500 text-sm mt-1">管理员工的角色分配和部门权限</p>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">总员工数</div>
                <div className="text-3xl font-bold text-gray-900">{filteredUsers.length}</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <UserOutlined className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">已选员工</div>
                <div className="text-3xl font-bold text-gray-900">{selectedUserIds.length}</div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TeamOutlined className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">角色数量</div>
                <div className="text-3xl font-bold text-gray-900">{roles.length}</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <LockOutlined className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Input
            placeholder="搜索姓名、用户名、邮箱或手机号..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 250 }}
          />
          <Select
            value={searchDepartment}
            onChange={setSearchDepartment}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="">全部部门</Option>
            {departments.map(dept => (
              <Option key={dept.id} value={dept.id}>{dept.name}</Option>
            ))}
          </Select>
        </div>

        {/* 批量操作栏 */}
        {selectedUserIds.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-sm text-blue-800">
              已选择 {selectedUserIds.length} 名员工
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="small"
                type="primary"
                onClick={() => setIsBatchAssignOpen(true)}
              >
                分配角色
              </Button>
              <Button
                size="small"
                style={{ backgroundColor: '#fca5a5', borderColor: '#fca5a5', color: '#7f1d1d' }}
                onClick={() => setIsBatchRemoveOpen(true)}
                disabled={isProcessingBatch}
              >
                移除角色
              </Button>
            </div>
          </div>
        )}

        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          rowSelection={{ selectedRowKeys: selectedUserIds, onChange: setSelectedUserIds, preserveSelectedRowKeys: true, columnWidth: 40 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          scroll={{ x: 'max-content' }}
        />
      </div>

      {/* 角色分配模态框 */}
      <Modal
        title={`分配角色 - ${selectedUser?.real_name}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveRoles}>
            保存
          </Button>
        ]}
        width={500}
        centered
      >
        <div className="py-4">
          <Select
            placeholder="请选择角色"
            value={selectedRoles.length > 0 ? selectedRoles[0] : null}
            onChange={(value) => handleRoleChange(value ? [value] : [])}
            style={{ width: '100%' }}
            size="large"
            allowClear
          >
            {roles.map(role => (
              <Option key={role.id} value={role.id}>
                <div className="flex items-center justify-between">
                  <span>{role.name}</span>
                  {role.is_system && <Tag color="red" size="small">系统</Tag>}
                </div>
              </Option>
            ))}
          </Select>
        </div>
      </Modal>

      <Modal
        title="批量分配角色"
        open={isBatchAssignOpen}
        onCancel={() => setIsBatchAssignOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsBatchAssignOpen(false)}>
            取消
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            onClick={handleBatchAssignRoles}
            disabled={isProcessingBatch || !batchAssignRoleId}
          >
            保存
          </Button>
        ]}
        width={500}
        centered
      >
        <div className="py-4">
          <p className="text-sm text-gray-600 mb-3">
            为选中的 <span className="font-semibold text-gray-900">{selectedUserIds.length}</span> 名员工分配角色
          </p>
          <Select
            placeholder="选择角色"
            value={batchAssignRoleId}
            onChange={setBatchAssignRoleId}
            style={{ width: '100%' }}
            size="large"
          >
            {roles.map(role => (
              <Option key={role.id} value={role.id}>{role.name}</Option>
            ))}
          </Select>
        </div>
      </Modal>

      <Modal
        title="批量移除角色"
        open={isBatchRemoveOpen}
        onCancel={() => setIsBatchRemoveOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsBatchRemoveOpen(false)}>
            取消
          </Button>,
          <Button 
            key="remove" 
            type="primary" 
            danger
            onClick={handleBatchRemoveRoles}
            disabled={isProcessingBatch}
          >
            确认移除
          </Button>
        ]}
        width={500}
        centered
      >
        <div className="py-4">
          <p className="text-sm text-gray-600 mb-3">
            确定要从选中的 <span className="font-semibold text-gray-900">{selectedUserIds.length}</span> 名员工移除角色吗？
          </p>
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            此操作不可撤销，请谨慎执行
          </div>
        </div>
      </Modal>

      {/* 部门权限模态框 */}
      <UserDepartmentModal
        isOpen={isDepartmentModalOpen}
        onClose={() => setIsDepartmentModalOpen(false)}
        onSuccess={handleUserDepartmentSuccess}
        user={selectedUserForDepartment}
      />
    </div>
  );
};

export default UserRoleManagement;
