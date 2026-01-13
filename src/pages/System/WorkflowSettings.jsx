import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table, Card, Tag, Space, Modal, Tabs,
  Form, Input, Select, Switch, message, Divider, List, Avatar, Typography, Tooltip as AntTooltip,
  Badge, Popconfirm
} from 'antd';
import { 
  PlusOutlined, SettingOutlined, BranchesOutlined, 
  ArrowDownOutlined, UserOutlined, EditOutlined, DeleteOutlined,
  MenuOutlined, InfoCircleOutlined, CheckCircleOutlined, PlayCircleOutlined, NotificationOutlined
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/apiClient';

const { Option } = Select;
const { Text } = Typography;

// 自定义纯色按钮组件
const StyledButton = ({ children, onClick, variant = 'primary', icon, className = '', ...props }) => {
  const baseStyle = "flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all active:scale-95 shadow-sm border-none cursor-pointer";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    success: "bg-emerald-500 text-white hover:bg-emerald-600",
    danger: "bg-red-500 text-white hover:bg-red-600",
    ghost: "bg-blue-50 text-blue-700 hover:bg-blue-100"
  };
  
  return (
    <button 
      onClick={onClick} 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

const WorkflowSettings = () => {
  const [activeTab, setActiveTab] = useState('definition'); // definition | groups
  const [loading, setLoading] = useState(false);
  
  // Data
  const [workflows, setWorkflows] = useState([]);
  const [approvalGroups, setApprovalGroups] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);

  // Modals
  const [isEditModalOpen, setIsAddModalOpen] = useState(false);
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [currentGroup, setCurrentGroup] = useState(null);
  
  const [form] = Form.useForm();
  const [groupForm] = Form.useForm();
  const [nodes, setNodes] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchBaseData();
    if (activeTab === 'definition') fetchWorkflows();
    else fetchGroups();
  }, [activeTab]);

  const fetchBaseData = async () => {
      try {
          // 修正接口路径：/api/roles 和 /api/employees
          const [rolesRes, usersRes] = await Promise.all([
              apiGet('/api/roles'),
              apiGet('/api/employees')
          ]);
          
          setRoles(rolesRes.data || []);
          
          // 彻底修复用户数据解析
          let userData = [];
          if (Array.isArray(usersRes)) {
              userData = usersRes;
          } else if (usersRes && Array.isArray(usersRes.data)) {
              userData = usersRes.data;
          }
          // 映射字段确保显示名正确
          const normalizedUsers = userData.map(u => ({
              id: u.user_id || u.id,
              name: u.real_name || u.name || u.username,
              dept: u.department_name || ''
          }));
          setUsers(normalizedUsers);
          
          console.log('Loaded Roles:', rolesRes.data?.length);
          console.log('Loaded Users:', normalizedUsers.length);
      } catch (err) {
          console.error('Failed to fetch base data:', err);
      }
  }

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await apiGet(`/api/approval-workflow?type=asset_request`);
      if (res.success) setWorkflows(res.data);
    } catch (err) {
      message.error('获取流程失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
      setLoading(true);
      try {
          const res = await apiGet('/api/approval-groups');
          if (res.success) setApprovalGroups(res.data);
      } catch (err) {
          message.error('获取审批组失败');
      } finally {
          setLoading(false);
      }
  }

  // --- Actions ---
  const handleSaveWorkflow = async (values) => {
      try {
          // 如果当前保存的流程设为启用，逻辑上它应该互斥其他流程（后端已有 handle，此处确保 payload 完整）
          const payload = { 
              ...values, 
              type: 'asset_request', 
              is_default: values.is_default ? 1 : 0,
              status: values.is_default ? 'active' : values.status, // 默认流程必须启用
              created_by: currentUser?.id 
          };
          
          let res;
          if (currentWorkflow) res = await apiPut(`/api/approval-workflow/${currentWorkflow.id}`, payload);
          else res = await apiPost('/api/approval-workflow', payload);
          
          if (res.success) {
              message.success('保存成功');
              setIsAddModalOpen(false);
              fetchWorkflows();
          }
      } catch (err) { message.error('操作失败'); }
  };

  const handleConfigNodes = async (record) => {
      setCurrentWorkflow(record);
      try {
          const res = await apiGet(`/api/approval-workflow/${record.id}`);
          if (res.success) {
              const fetchedNodes = (res.data.nodes || []).map((n, i) => ({ 
                  ...n, 
                  dnd_id: `node-${Date.now()}-${i}` 
              }));
              setNodes(fetchedNodes);
              setIsNodeModalOpen(true);
          }
      } catch (err) {}
  };

  const saveNodes = async () => {
      try {
          const res = await apiPost(`/api/approval-workflow/${currentWorkflow.id}/nodes`, { nodes });
          if (res.success) {
              message.success('节点配置已更新');
              setIsNodeModalOpen(false);
              fetchWorkflows();
          }
      } catch (err) { message.error('保存失败'); }
  }

  const openGroupModal = async (group = null) => {
      if (group) {
          const res = await apiGet(`/api/approval-groups/${group.id}`);
          if (res.success) {
              setCurrentGroup(res.data);
              groupForm.setFieldsValue({
                  ...res.data,
                  members: res.data.members.map(m => `${m.member_type}:${m.member_id}`)
              });
          }
      } else {
          setCurrentGroup(null);
          groupForm.resetFields();
      }
      setIsGroupModalOpen(true);
  }

  const handleSaveGroup = async (values) => {
      try {
          const members = (values.members || []).map(m => {
              const [type, id] = m.split(':');
              return { member_type: type, member_id: parseInt(id) };
          });
          const payload = { ...values, id: currentGroup?.id, members };
          const res = await apiPost('/api/approval-groups', payload);
          if (res.success) {
              message.success('审批组已更新');
              setIsGroupModalOpen(false);
              fetchGroups();
          }
      } catch (err) { message.error('操作失败'); }
  }

  const deleteGroup = async (id) => {
      try {
          const res = await apiDelete(`/api/approval-groups/${id}`);
          if (res.success) {
              message.success('已删除');
              fetchGroups();
          }
      } catch (err) {}
  }

  const onDragEnd = (result) => {
      if (!result.destination) return;
      const reordered = Array.from(nodes);
      const [removed] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, removed);
      setNodes(reordered);
  };

  const workflowColumns = [
    { title: '流程名称', dataIndex: 'name', key: 'name', render: (t, r) => <Space>{t} {r.is_default ? <Tag color="blue">生效中</Tag> : null}</Space> },
    { title: '说明', dataIndex: 'description', key: 'description' },
    { title: '环节数', dataIndex: 'node_count', key: 'node_count', render: n => <Badge count={n} showZero color="#108ee9" /> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s, r) => <Tag color={r.is_default ? 'green' : (s === 'active' ? 'blue' : 'default')}>{r.is_default ? '启用 (默认)' : (s === 'active' ? '启用' : '已停用')}</Tag> },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <div className="flex gap-2">
          <StyledButton variant="secondary" className="px-3 py-1 h-8" icon={<EditOutlined className="text-xs" />} onClick={() => { setCurrentWorkflow(record); form.setFieldsValue(record); setIsAddModalOpen(true); }}>编辑</StyledButton>
          <StyledButton variant="ghost" className="px-3 py-1 h-8" icon={<SettingOutlined className="text-xs" />} onClick={() => handleConfigNodes(record)}>配置环节</StyledButton>
        </div>
      )
    }
  ];

  const groupColumns = [
      { title: '审批组名称', dataIndex: 'name', key: 'name', render: t => <Text strong>{t}</Text> },
      { title: '描述', dataIndex: 'description', key: 'description' },
      { title: '成员总数', dataIndex: 'member_count', key: 'member_count' },
      { 
          title: '操作', 
          key: 'action', 
          render: (_, record) => (
              <Space>
                  <StyledButton variant="ghost" className="h-8" icon={<EditOutlined />} onClick={() => openGroupModal(record)}>管理</StyledButton>
                  <Popconfirm title="确定删除吗？" onConfirm={() => deleteGroup(record.id)}>
                      <StyledButton variant="secondary" className="h-8 text-red-500 hover:bg-red-50" icon={<DeleteOutlined />}>删除</StyledButton>
                  </Popconfirm>
              </Space>
          )
      }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <BranchesOutlined className="mr-3 text-blue-600" />
                资产申请审批中心
            </h1>
            <p className="text-gray-500 mt-1">全局唯一生效流程机制，支持跨部门特殊审批组配置</p>
          </div>
          {activeTab === 'definition' ? (
            <StyledButton variant="primary" icon={<PlusOutlined />} onClick={() => { setCurrentWorkflow(null); form.resetFields(); setIsAddModalOpen(true); }}>新建资产流程</StyledButton>
          ) : (
            <StyledButton variant="success" icon={<PlusOutlined />} onClick={() => openGroupModal()}>新建审批组</StyledButton>
          )}
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        type="card"
        className="workflow-tabs"
        items={[
            {
                key: 'definition',
                label: <span className="px-6 font-bold">流程定义</span>,
                children: (
                    <Card className="shadow-sm border-0">
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded text-amber-700 text-xs flex items-center gap-2">
                            <InfoCircleOutlined />
                            提示：标记为“生效中”的流程将作为全系统资产申请的唯一执行逻辑。启用一个流程将自动停用其他流程。
                        </div>
                        <Table columns={workflowColumns} dataSource={workflows} rowKey="id" loading={loading} pagination={false} />
                    </Card>
                )
            },
            {
                key: 'groups',
                label: <span className="px-6 font-bold">审批组管理</span>,
                children: (
                    <Card className="shadow-sm border-0">
                        <Table columns={groupColumns} dataSource={approvalGroups} rowKey="id" loading={loading} pagination={false} />
                    </Card>
                )
            }
        ]}
      />

      {/* Workflow Edit Modal */}
      <Modal
        title={currentWorkflow ? "流程属性配置" : "创建新资产申请流程"}
        open={isEditModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={
            <div className="flex justify-end gap-2 px-4 pb-4">
                <StyledButton variant="secondary" onClick={() => setIsAddModalOpen(false)}>取消</StyledButton>
                <StyledButton variant="primary" onClick={() => form.submit()}>确定并生效</StyledButton>
            </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSaveWorkflow} className="py-4 px-2">
            <Form.Item name="name" label="流程名称" rules={[{ required: true, message: '请输入名称' }]}>
                <Input placeholder="例如：标准资产审批流程" />
            </Form.Item>
            <Form.Item name="description" label="详细描述">
                <Input.TextArea rows={3} />
            </Form.Item>
            <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between mb-4 border border-blue-100">
                <div>
                    <div className="font-bold text-blue-800 text-sm italic">设为系统生效流程</div>
                    <div className="text-[11px] text-blue-600">开启此开关，系统将立即切换至此流程并停用其他流程</div>
                </div>
                <Form.Item name="is_default" valuePropName="checked" noStyle><Switch /></Form.Item>
            </div>
            <Form.Item name="status" label="流程可用状态" initialValue="active">
                <Select>
                    <Option value="active">启用 (正常运行)</Option>
                    <Option value="inactive">停用 (不可见)</Option>
                </Select>
            </Form.Item>
        </Form>
      </Modal>

      {/* Nodes Modal */}
      <Modal
        title={<div className="flex items-center gap-2"><SettingOutlined className="text-blue-600" /><span>配置环节逻辑 - {currentWorkflow?.name}</span></div>}
        open={isNodeModalOpen}
        onCancel={() => setIsNodeModalOpen(false)}
        width={800}
        footer={<div className="flex justify-end gap-2 px-4 pb-4"><StyledButton variant="secondary" onClick={() => setIsNodeModalOpen(false)}>取消</StyledButton><StyledButton variant="success" onClick={saveNodes}>应用配置</StyledButton></div>}
      >
        <div className="py-4 px-2">
            <div className="flex items-center gap-4 mb-4 opacity-60">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500"><PlayCircleOutlined /></div>
                <div className="flex-1 bg-gray-100 p-3 rounded-lg border border-gray-200">
                    <span className="font-bold text-gray-600 text-sm italic">起点：员工发起资产/升级申请</span>
                </div>
            </div>
            <div className="text-center py-1"><ArrowDownOutlined className="text-gray-300 text-xs" /></div>
            <div className="mb-6">
                <StyledButton variant="ghost" className="w-full border-dashed border-2 border-blue-200 py-3 bg-blue-50/20" icon={<PlusOutlined />} onClick={() => {
                    setNodes([...nodes, { dnd_id: `new-${Date.now()}`, node_name: `审批环节 ${nodes.length + 1}`, approver_type: 'dept_manager' }]);
                }}>插入新的审批环节</StyledButton>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="nodes-list">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {nodes.map((node, index) => (
                                <Draggable key={node.dnd_id || `node-${index}`} draggableId={node.dnd_id || `node-${index}`} index={index}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps} className="group">
                                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:border-blue-400 transition-all">
                                                <div className="bg-gray-50/80 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div {...provided.dragHandleProps} className="mr-3 cursor-move text-gray-400 group-hover:text-blue-500"><MenuOutlined /></div>
                                                        <span className="font-bold text-gray-700">审批环节 {index + 1}</span>
                                                    </div>
                                                    <button onClick={() => setNodes(nodes.filter((_, i) => i !== index))} className="text-gray-400 hover:text-red-500 border-none bg-transparent cursor-pointer"><DeleteOutlined /></button>
                                                </div>
                                                <div className="p-4 flex gap-4">
                                                    <div className="flex-1">
                                                        <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1">环节名称</label>
                                                        <Input value={node.node_name} variant="borderless" className="bg-gray-50 px-3 py-2 rounded" onChange={e => {
                                                            const newNodes = [...nodes];
                                                            newNodes[index].node_name = e.target.value;
                                                            setNodes(newNodes);
                                                        }} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1">审批人类型</label>
                                                        <Select className="w-full" variant="borderless" value={node.approver_type} onChange={val => {
                                                            const newNodes = [...nodes];
                                                            newNodes[index].approver_type = val;
                                                            newNodes[index].approver_id = null;
                                                            newNodes[index].role_id = null;
                                                            newNodes[index].special_group_id = null;
                                                            setNodes(newNodes);
                                                        }}>
                                                            <Option value="dept_manager">发起人所属主管</Option>
                                                            <Option value="special_group">特殊审批组</Option>
                                                            <Option value="role">指定系统角色</Option>
                                                            <Option value="user">指定具体员工</Option>
                                                        </Select>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1">审批对象</label>
                                                        {node.approver_type === 'dept_manager' && <Input disabled value="系统实时自动匹配" className="bg-gray-50" />}
                                                        {node.approver_type === 'special_group' && (
                                                            <Select className="w-full" variant="borderless" value={node.special_group_id} placeholder="选择审批组" onChange={val => {
                                                                const newNodes = [...nodes];
                                                                newNodes[index].special_group_id = val;
                                                                setNodes(newNodes);
                                                            }}>
                                                                {approvalGroups.map(g => <Option key={g.id} value={g.id}>{g.name}</Option>)}
                                                            </Select>
                                                        )}
                                                        {node.approver_type === 'role' && (
                                                            <Select className="w-full" variant="borderless" value={node.role_id} placeholder="请选择角色" onChange={val => {
                                                                const newNodes = [...nodes];
                                                                newNodes[index].role_id = val;
                                                                setNodes(newNodes);
                                                            }}>
                                                                {roles.map(r => <Option key={r.id} value={r.id}>{r.name}</Option>)}
                                                            </Select>
                                                        )}
                                                        {node.approver_type === 'user' && (
                                                            <Select className="w-full" variant="borderless" value={node.approver_id} showSearch optionFilterProp="children" placeholder="搜索姓名" onChange={val => {
                                                                const newNodes = [...nodes];
                                                                newNodes[index].approver_id = val;
                                                                setNodes(newNodes);
                                                            }}>
                                                                {users.map(u => <Option key={u.id} value={u.id}>{u.name} ({u.dept})</Option>)}
                                                            </Select>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {index < nodes.length - 1 && <div className="text-center py-2"><ArrowDownOutlined className="text-gray-300 text-xs" /></div>}
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
            <div className="flex items-center gap-4 mt-4 opacity-80">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-100"><CheckCircleOutlined /></div>
                <div className="flex-1 bg-emerald-50/30 p-3 rounded-lg border border-emerald-100 flex justify-between items-center">
                    <div><span className="font-bold text-emerald-700 text-sm italic">终点：完成申请并同步资产状态</span></div>
                    <AntTooltip title="所有环节通过后实时生效"><NotificationOutlined className="text-emerald-400" /></AntTooltip>
                </div>
            </div>
        </div>
      </Modal>

      {/* Group Modal */}
      <Modal
        title={currentGroup ? "编辑审批组" : "创建新审批组"}
        open={isGroupModalOpen}
        onCancel={() => setIsGroupModalOpen(false)}
        footer={<div className="flex justify-end gap-2 px-4 pb-4"><StyledButton variant="secondary" onClick={() => setIsGroupModalOpen(false)}>取消</StyledButton><StyledButton variant="success" onClick={() => groupForm.submit()}>保存组配置</StyledButton></div>}
      >
        <Form groupForm={groupForm} form={groupForm} layout="vertical" onFinish={handleSaveGroup} className="py-4 px-2">
            <Form.Item name="name" label="组名称" rules={[{ required: true, message: '请输入名称' }]}>
                <Input placeholder="如：资产联审核心组" />
            </Form.Item>
            <Form.Item name="description" label="组描述">
                <Input.TextArea />
            </Form.Item>
            <Form.Item name="members" label="组成员集合" rules={[{ required: true, message: '请至少添加一个成员' }]}>
                <Select mode="multiple" placeholder="请选择角色或人员" optionFilterProp="children" className="w-full">
                    <Select.OptGroup label="按系统角色添加">
                        {roles.map(r => <Option key={`role:${r.id}`} value={`role:${r.id}`}>[角色] {r.name}</Option>)}
                    </Select.OptGroup>
                    <Select.OptGroup label="按具体人员添加">
                        {users.map(u => <Option key={`user:${u.id}`} value={`user:${u.id}`}>[员工] {u.name} ({u.dept})</Option>)}
                    </Select.OptGroup>
                </Select>
            </Form.Item>
        </Form>
      </Modal>

      <style jsx="true">{`
        .workflow-tabs .ant-tabs-nav-list { background: #f9fafb; padding: 4px; border-radius: 8px; }
        .ant-modal-content { border-radius: 12px; overflow: hidden; }
        .ant-modal-header { padding: 16px 24px; margin-bottom: 0; border-bottom: 1px solid #f0f0f0; }
      `}</style>
    </div>
  );
};

export default WorkflowSettings;
