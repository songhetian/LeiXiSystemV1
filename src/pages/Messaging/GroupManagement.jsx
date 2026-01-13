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
      setNewGroupData({...newGroupData, memberIds: []});
    } else {
      setNewGroupData({...newGroupData, memberIds: filteredUsers.map(u => u.id)});
    }
  };

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [newName, setNewName] = useState('');

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

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (g.department_name && g.department_name.toLowerCase().includes(searchText.toLowerCase()))
  );

  const columns = [
    {
      title: '群组名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar shape="square" src={record.avatar} icon={<TeamOutlined />} className="bg-green-600" />
          <span className="font-medium">{text}</span>
          {record.department_id && <Tag color="blue">部门群</Tag>}
        </Space>
      )
    },
    {
      title: '所属部门',
      dataIndex: 'department_name',
      key: 'department_name',
      render: (text) => text || <span className="text-gray-400">自定义群组</span>
    },
    {
      title: '成员数',
      dataIndex: 'member_count',
      key: 'member_count',
      render: (count) => <Badge count={count} showZero color="#52c41a" />
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
        title="创建新群组"
        open={isCreateModalOpen}
        onOk={handleCreateGroup}
        onCancel={() => setIsCreateModalOpen(false)}
        width={500}
        okText="创建"
        cancelText="取消"
      >
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">群组名称</label>
            <Input 
              placeholder="请输入群名称" 
              value={newGroupData.name}
              onChange={e => setNewGroupData({...newGroupData, name: e.target.value})}
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">选择成员 ({newGroupData.memberIds.length})</label>
              <Button type="link" size="small" onClick={toggleAllMembers}>
                {newGroupData.memberIds.length === filteredUsers.length ? '取消全选' : '选择全部结果'}
              </Button>
            </div>
            <div className="mb-2">
              <Input 
                prefix={<SearchOutlined />} 
                placeholder="搜索成员姓名..." 
                value={memberSearchText}
                onChange={e => setMemberSearchText(e.target.value)}
                size="small"
              />
            </div>
            <div className="border rounded-md max-h-64 overflow-y-auto p-2">
              <AntList
                dataSource={filteredUsers}
                renderItem={u => (
                  <div 
                    key={u.id}
                    className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded"
                    onClick={() => {
                      const ids = newGroupData.memberIds.includes(u.id)
                        ? newGroupData.memberIds.filter(id => id !== u.id)
                        : [...newGroupData.memberIds, u.id];
                      setNewGroupData({...newGroupData, memberIds: ids});
                    }}
                  >
                    <Checkbox checked={newGroupData.memberIds.includes(u.id)} className="mr-3" />
                    <Avatar size="small" src={u.avatar} icon={<UserOutlined />} className="mr-2" />
                    <span className="text-sm">{u.name}</span>
                  </div>
                )}
              />
              {filteredUsers.length === 0 && (
                <div className="p-4 text-center text-gray-400">未找到匹配成员</div>
              )}
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