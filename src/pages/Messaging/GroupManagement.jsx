import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Modal, Input, Tag,
  message, Tooltip, Popconfirm, Avatar, Badge,
  Checkbox, List as AntList
} from 'antd';
import {
  TeamOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  SearchOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { apiGet, apiPost, apiPut } from '../../utils/apiClient';

const GroupManagement = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [memberSearchText, setMemberSearchText] = useState('');
  const [newGroupData, setNewGroupData] = useState({ name: '', memberIds: [] });

  // Filtered Users for selection
  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(memberSearchText.toLowerCase())
  );

  // Toggle All Members
  const toggleAllMembers = () => {
    if (newGroupData.memberIds.length === filteredUsers.length) {
      setNewGroupData({ ...newGroupData, memberIds: [] });
    } else {
      setNewGroupData({ ...newGroupData, memberIds: filteredUsers.map(u => u.id) });
    }
  };

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [newName, setNewName] = useState('');

  // Filtered Groups for display
  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (g.department_name && g.department_name.toLowerCase().includes(searchText.toLowerCase()))
  );

  useEffect(() => {
    fetchGroups();
    fetchUsers();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/api/chat/admin/groups');
      if (res.success) setGroups(res.data);
    } catch (err) {
      message.error('获取群组列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiGet('/api/chat/users');
      if (res.success) setAllUsers(res.data);
    } catch (err) { console.error(err); }
  };

  const handleCreateGroup = async () => {
    if (!newGroupData.name || newGroupData.memberIds.length === 0) {
      return message.warning('请填写群名称并选择成员');
    }
    try {
      const res = await apiPost('/api/chat/groups', newGroupData);
      if (res.success) {
        message.success('群组创建成功');
        setIsCreateModalOpen(false);
        setNewGroupData({ name: '', memberIds: [] });
        fetchGroups();
      }
    } catch (err) { message.error('创建失败'); }
  };

  const handleUpdate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await apiPut(`/api/chat/groups/${editingGroup.id}`, { name: newName });
      if (res.success) {
        message.success('群组信息已更新');
        setIsEditModalOpen(false);
        fetchGroups();
      }
    } catch (err) { message.error('更新失败'); }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/chat/groups/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        message.success('群组已解散');
        fetchGroups();
      } else {
        message.error(data.message || '删除失败');
      }
    } catch (err) { message.error('操作失败'); }
  };

  // --- Render Helpers (WeChat Style) ---
  const renderAvatar = (item, size = 40, className = '') => {
    const name = item.name || 'Group';
    const avatarUrl = item.avatar;

    if (avatarUrl) {
      return (
        <Avatar
          shape="square"
          src={avatarUrl}
          size={size}
          className={`rounded-[4px] shadow-sm ${className}`}
          icon={<TeamOutlined />}
        />
      );
    }

    // Generate a background color based on name
    const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#1890ff', '#13c2c2', '#eb2f96'];
    const color = colors[name.length % colors.length];
    const initial = name.charAt(0).toUpperCase();

    return (
      <Avatar
        shape="square"
        size={size}
        className={`rounded-[4px] shadow-sm ${className}`}
        style={{ backgroundColor: color, border: 'none' }}
      >
        {initial}
      </Avatar>
    );
  };

  const columns = [
    {
      title: '群组名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space size="middle">
          {renderAvatar(record, 42)}
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800 text-[14px]">{text}</span>
            {record.department_id ? (
              <span className="text-[11px] text-blue-500 font-medium">官方部门群</span>
            ) : (
              <span className="text-[11px] text-gray-400">外部讨论组</span>
            )}
          </div>
        </Space>
      )
    },
    {
      title: '所属部门',
      dataIndex: 'department_name',
      key: 'department_name',
      render: (text) => text ? (
        <Tag color="blue" className="border-none rounded-md px-2 bg-blue-50 text-blue-600 font-medium">
          {text}
        </Tag>
      ) : (
        <span className="text-gray-300 text-xs italic">私有群组</span>
      )
    },
    {
      title: '成员规模',
      dataIndex: 'member_count',
      key: 'member_count',
      render: (count) => (
        <Space size="small">
          <Badge
            count={count}
            showZero
            overflowCount={999}
            style={{ backgroundColor: '#07c160', boxShadow: 'none' }}
          />
          <span className="text-gray-400 text-xs">人</span>
        </Space>
      )
    },
    {
      title: '群主/创建人',
      dataIndex: 'owner_name',
      key: 'owner_name',
      render: (text) => (
        <Space>
          <UserOutlined />
          {text || '系统生成'}
        </Space>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="重命名">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => { setEditingGroup(record); setNewName(record.name); setIsEditModalOpen(true); }}
            />
          </Tooltip>

          {!record.department_id && (
            <Popconfirm
              title="解散群组"
              description="确定要解散该群组吗？所有聊天记录将被删除且无法恢复。"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Tooltip title="解散群组">
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">聊天群组管理</h2>
          <p className="text-gray-500">监控和管理系统内的所有部门群组及自定义讨论组</p>
        </div>
        <div className="flex gap-3">
          <div className="w-64">
            <Input
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder="搜索群组或部门..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="rounded-lg"
            />
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 h-9"
          >
            创建群组
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredGroups}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        className="bg-white rounded-lg shadow-sm overflow-hidden"
      />

      {/* 创建群组 Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 border-b pb-3 mb-0">
            <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
              <TeamOutlined />
            </div>
            <span className="text-lg font-bold">发起群聊</span>
          </div>
        }
        open={isCreateModalOpen}
        onOk={handleCreateGroup}
        onCancel={() => setIsCreateModalOpen(false)}
        width={560}
        okText="立即创建"
        cancelText="取消"
        className="premium-modal-rs"
        okButtonProps={{
          className: "bg-[#07c160] hover:bg-[#06ad56] border-none h-10 px-6 font-bold rounded-lg shadow-md shadow-green-100"
        }}
        cancelButtonProps={{ className: "h-10 px-6 rounded-lg font-medium" }}
      >
        <div className="space-y-6 pt-6 pb-2">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <label className="block text-[13px] font-bold text-gray-500 mb-3 uppercase tracking-wider">群组基本信息</label>
            <Input
              placeholder="请输入群组名称，如：售后技术支持一组"
              value={newGroupData.name}
              onChange={e => setNewGroupData({ ...newGroupData, name: e.target.value })}
              className="h-12 text-base rounded-xl border-gray-200 focus:shadow-sm"
              prefix={<TeamOutlined className="text-gray-400 mr-2" />}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3 px-1">
              <label className="block text-[13px] font-bold text-gray-500 uppercase tracking-wider">
                选择群成员 <span className="ml-2 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">已选 {newGroupData.memberIds.length}</span>
              </label>
              <Button type="link" size="small" onClick={toggleAllMembers} className="text-blue-500 font-medium">
                {newGroupData.memberIds.length === filteredUsers.length ? '取消全选' : '选择全部'}
              </Button>
            </div>

            <div className="relative mb-3">
              <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="快速搜索成员姓名..."
                value={memberSearchText}
                onChange={e => setMemberSearchText(e.target.value)}
                className="pl-10 h-10 rounded-xl border-gray-100 bg-gray-50/50"
              />
            </div>

            <div className="border border-gray-100 rounded-2xl p-2 bg-white max-h-[320px] overflow-y-auto scrollbar-thin">
              <AntList
                dataSource={filteredUsers}
                locale={{ emptyText: <div className="py-10 text-gray-400">未找到相关人员</div> }}
                renderItem={u => {
                  const isSelected = newGroupData.memberIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      className={`flex items-center justify-between p-3 my-0.5 cursor-pointer rounded-xl transition-all ${isSelected ? 'bg-green-50/50' : 'hover:bg-gray-50'
                        }`}
                      onClick={() => {
                        const ids = isSelected
                          ? newGroupData.memberIds.filter(id => id !== u.id)
                          : [...newGroupData.memberIds, u.id];
                        setNewGroupData({ ...newGroupData, memberIds: ids });
                      }}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-md border mr-4 flex items-center justify-center transition-colors ${isSelected ? 'bg-[#07c160] border-[#07c160]' : 'border-gray-300 bg-white'
                          }`}>
                          {isSelected && <div className="w-1.5 h-2.5 border-r-2 border-b-2 border-white rotate-45 transform translate-y-[-1px]" />}
                        </div>
                        {renderAvatar({ name: u.name, avatar: u.avatar }, 36, "mr-3")}
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{u.name}</div>
                          <div className="text-[11px] text-gray-400">{u.department_name || '未选部门'}</div>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        title="修改群组信息"
        open={isEditModalOpen}
        onOk={handleUpdate}
        onCancel={() => setIsEditModalOpen(false)}
      >
        <div className="py-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">群组名称</label>
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="请输入新群名"
            prefix={<TeamOutlined />}
          />
        </div>
      </Modal>
    </div>
  );
};

export default GroupManagement;