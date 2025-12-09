import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Tag, Space, Modal, Select, message } from 'antd';
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
  const [searchKeyword, setSearchKeyword] = useState('');
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
        setUsers(response.data);
      } else if (Array.isArray(response)) {
        setUsers(response);
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
  const filteredUsers = users.filter(user => {
    // 关键词搜索
    if (searchKeyword) {
      const searchLower = searchKeyword.toLowerCase();
      const matchesKeyword = (
        (user.real_name && user.real_name.toLowerCase().includes(searchLower)) ||
        (user.username && user.username.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.phone && user.phone.includes(searchKeyword))
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

  const columns = [
    {
      title: '用户信息',
      key: 'user-info',
      render: (_, record) => (
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <UserOutlined className="text-blue-500" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{record.real_name}</div>
            <div className="text-sm text-gray-500">@{record.username}</div>
          </div>
        </div>
      ),
    },
    {
      title: '部门',
      dataIndex: 'department_name',
      key: 'department_name',
      render: (text) => (
        <span className="text-gray-600">{text || '未分配'}</span>
      ),
    },
    {
      title: '角色',
      key: 'roles',
      render: (_, record) => (
        <div>
          {record.roles && record.roles.length > 0 ? (
            <Space wrap>
              {record.roles.map(role => (
                <Tag key={role.id} color="blue">
                  {role.name}
                </Tag>
              ))}
            </Space>
          ) : (
            <span className="text-gray-400 text-sm">未分配角色</span>
          )}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="small"
            type="primary"
            ghost
            icon={<TeamOutlined />}
            onClick={() => handleManageRoles(record)}
            className="flex items-center"
          >
            分配角色
          </Button>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleManageUserDepartments(record)}
            className="flex items-center"
          >
            部门权限
          </Button>
        </div>
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
          await apiPost(`/api/users/${userId}/roles`, { role_id: batchAssignRoleId });
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
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* 头部 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">员工角色管理</h2>
            <p className="text-gray-500 text-sm mt-1">管理员工的角色分配和部门权限</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchUsers}
              className="flex items-center"
            >
              刷新
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="text-blue-800 font-medium">总员工数</div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{filteredUsers.length}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <div className="text-purple-800 font-medium">已选员工</div>
            <div className="text-2xl font-bold text-purple-900 mt-1">{selectedUserIds.length}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="text-green-800 font-medium">角色数量</div>
            <div className="text-2xl font-bold text-green-900 mt-1">{roles.length}</div>
          </div>
        </div>

        {/* 搜索筛选区 */}
        <div className="mb-6">
          <Card size="small" className="rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">关键词搜索</label>
                <input
                  type="text"
                  placeholder="姓名/用户名/邮箱/手机"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">部门筛选</label>
                <select
                  value={searchDepartment}
                  onChange={(e) => setSearchDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="">全部部门</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色筛选</label>
                <select
                  value={searchRole}
                  onChange={(e) => setSearchRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="">全部角色</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Space>
                <Button
                  onClick={() => {
                    setSearchKeyword('');
                    setSearchDepartment('');
                    setSearchRole('');
                  }}
                >
                  重置筛选
                </Button>
                <Button
                  type="primary"
                  onClick={fetchUsers}
                >
                  应用筛选
                </Button>
              </Space>
            </div>
          </Card>
        </div>

        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-sm text-gray-600">
            已选 {selectedUserIds.length} / {filteredUsers.length} 名员工
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="primary"
              disabled={selectedUserIds.length === 0}
              onClick={() => setIsBatchAssignOpen(true)}
              className="flex items-center"
            >
              <TeamOutlined className="mr-1" />
              批量分配角色
            </Button>
            <Button
              danger
              disabled={selectedUserIds.length === 0}
              onClick={() => setIsBatchRemoveOpen(true)}
              className="flex items-center"
            >
              <LockOutlined className="mr-1" />
              批量移除角色
            </Button>
            {isProcessingBatch && (
              <span className="text-sm text-gray-600 flex items-center">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></span>
                处理中 {batchProgress.done} / {batchProgress.total}
              </span>
            )}
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          rowSelection={{ selectedRowKeys: selectedUserIds, onChange: setSelectedUserIds, preserveSelectedRowKeys: true }}
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
        title={`为 "${selectedUser?.real_name}" 分配角色`}
        open={modalVisible}
        onOk={handleSaveRoles}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <div className="py-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择角色
            </label>
            <Select
              mode="multiple"
              placeholder="请选择角色"
              value={selectedRoles}
              onChange={handleRoleChange}
              style={{ width: '100%' }}
              size="large"
            >
              {roles.map(role => (
                <Option key={role.id} value={role.id}>
                  <div className="flex items-center">
                    <span className="mr-2">{role.name}</span>
                    {role.is_system && <Tag color="red">系统</Tag>}
                  </div>
                </Option>
              ))}
            </Select>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start">
              <span className="text-blue-500 text-lg mr-2">ℹ️</span>
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
      </Modal>

      <Modal
        title={"批量为选中员工分配角色"}
        open={isBatchAssignOpen}
        onCancel={() => setIsBatchAssignOpen(false)}
        footer={null}
        width={600}
      >
        <div className="py-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              为选中的 <span className="font-semibold text-gray-900">{selectedUserIds.length}</span> 名员工分配一个角色：
            </p>
            <Select
              placeholder="选择要分配的角色"
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
          <div className="flex justify-end gap-3">
            <Button onClick={() => setIsBatchAssignOpen(false)}>取消</Button>
            <Button
              type="primary"
              onClick={handleBatchAssignRoles}
              disabled={isProcessingBatch || !batchAssignRoleId}
            >
              保存
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title={"批量从选中员工移除角色"}
        open={isBatchRemoveOpen}
        onCancel={() => setIsBatchRemoveOpen(false)}
        footer={null}
        width={600}
      >
        <div className="py-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              将从选中的 <span className="font-semibold text-gray-900">{selectedUserIds.length}</span> 名员工移除全部角色。
            </p>
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              此操作会清空所选员工的所有角色，请谨慎执行。
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button onClick={() => setIsBatchRemoveOpen(false)}>取消</Button>
            <Button
              type="primary"
              danger
              onClick={handleBatchRemoveRoles}
              disabled={isProcessingBatch}
            >
              移除
            </Button>
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
