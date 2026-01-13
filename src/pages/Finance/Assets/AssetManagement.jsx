import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Badge, Tag, Modal, Form, Input, Select, 
  Table, Avatar, Space, Tabs, Card, Row, Col
} from 'antd';
import { 
  UserOutlined, 
  ToolOutlined,
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  DesktopOutlined,
  SettingOutlined,
  BuildOutlined,
  LayoutOutlined
} from '@ant-design/icons';
import api from '../../../api';
import Breadcrumb from '../../../components/Breadcrumb';
import { getImageUrl } from '../../../utils/fileUtils';
import DeviceModelEditor from './DeviceModelEditor';

// --- Reusable Shadcn Style Button ---
const ShadcnButton = ({ children, onClick, variant = 'default', icon, className = '', danger = false, size = 'md' }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 gap-2 active:scale-95 shadow-sm";
  const sizes = { sm: "h-8 px-3 text-xs", md: "h-9 px-4 py-2 text-sm", lg: "h-10 px-8 text-base" };
  const variants = {
    default: "bg-slate-900 text-white hover:bg-slate-800",
    indigo: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200",
    warning: "bg-orange-500 text-white hover:bg-orange-600",
    danger: "bg-red-500 text-white hover:bg-red-600",
    outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-600",
    ghost: "hover:bg-slate-100 text-slate-600",
    dangerGhost: "hover:bg-red-50 text-red-600 font-bold",
    link: "text-indigo-600 underline-offset-4 hover:underline shadow-none"
  };
  const v = danger && variant === 'ghost' ? 'dangerGhost' : variant;
  const styleClass = variants[v] || variants.default;
  
  return (<button onClick={onClick} className={`${baseStyles} ${sizes[size]} ${styleClass} ${className}`}>{icon}{children}</button>);
};

const AssetManagement = () => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('employees');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ keyword: '', department_id: null, position_id: null });

  // 数据状态
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [compTypes, setCompTypes] = useState([]);
  const [forms, setForms] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [devices, setDevices] = useState([]);
  const [components, setComponents] = useState([]);
  const [idleAssets, setIdleAssets] = useState([]);
  const [userAssets, setUserAssets] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [assignedFilters, setAssignedFilters] = useState({ keyword: '', department_id: null });

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isBaseModalOpen, setIsBaseModalOpen] = useState(false);
  const [baseModalConfig, setBaseModalConfig] = useState({ type: '', title: '' });
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isCompEntryOpen, setIsCompEntryOpen] = useState(false);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [isAssignedModalOpen, setIsAssignedModalOpen] = useState(false);
  
  const [assignMode, setAssignMode] = useState('new');

  useEffect(() => { fetchMainData(); }, [activeTab, filters]);
  useEffect(() => { fetchBaseConfig(); fetchFilterData(); }, []);
  useEffect(() => { if (isAssignedModalOpen && selectedDevice) fetchAssignedUsers(); }, [isAssignedModalOpen, assignedFilters]);

  const fetchFilterData = async () => {
    try {
      const [deptRes, posRes] = await Promise.all([api.get('/departments'), api.get('/positions')]);
      setDepartments(Array.isArray(deptRes.data) ? deptRes.data : (deptRes.data.data || []));
      setPositions(Array.isArray(posRes.data) ? posRes.data : (posRes.data.data || []));
    } catch (e) {}
  };

  const fetchBaseConfig = async () => {
    try {
      const [catRes, typeRes, formRes] = await Promise.all([api.get('/assets/categories'), api.get('/assets/component-types'), api.get('/assets/forms')]);
      if (catRes.data.success) setCategories(catRes.data.data);
      if (formRes.data.success) setForms(formRes.data.data);
      if (typeRes.data.success) setCompTypes(typeRes.data.data);
    } catch (e) {}
  };

  const fetchMainData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'employees') {
        const res = await api.get('/assets/employee-centric', { params: filters });
        if (res.data.success) setEmployees(res.data.data);
      } else if (activeTab === 'devices') {
        const res = await api.get('/assets/devices');
        if (res.data.success) setDevices(res.data.data);
      } else if (activeTab === 'components') {
        const res = await api.get('/assets/components');
        if (res.data.success) setComponents(res.data.data);
      }
    } catch (e) { toast.error('加载失败'); } finally { setLoading(false); }
  };

  const fetchAssignedUsers = async () => {
    try {
      const res = await api.get(`/assets/devices/${selectedDevice.id}/users`, { params: assignedFilters });
      if (res.data.success) setAssignedUsers(res.data.data);
    } catch (e) {}
  };

  const fetchIdleAssets = async () => {
    try {
      const res = await api.get('/assets/idle');
      if (res.data.success) setIdleAssets(res.data.data);
    } catch (e) {}
  };

  const handleUserDetail = async (user) => {
    setSelectedUser(user);
    setLoading(true);
    try {
      const res = await api.get(`/assets/employee/${user.user_id}`);
      if (res.data.success) { setUserAssets(res.data.data); setIsUserDetailOpen(true); }
    } catch (e) {} finally { setLoading(false); }
  };

  const handleAssignSubmit = async () => {
    try {
      const values = await form.validateFields();
      await api.post('/assets/assign', { ...values, user_id: selectedUser.user_id });
      toast.success('分配成功');
      setIsAssignModalOpen(false);
      fetchMainData();
    } catch (e) {}
  };

  const handleCompEntry = async () => {
    try {
      const values = await form.validateFields();
      await api.post('/assets/components', values);
      toast.success('规格已保存');
      setIsCompEntryOpen(false);
      fetchMainData();
    } catch (e) {}
  };

  const handleBaseSubmit = async () => {
    try {
      const values = await form.validateFields();
      const endpoint = baseModalConfig.type === 'category' ? '/assets/categories' : 
                       baseModalConfig.type === 'form' ? '/assets/forms' : '/assets/component-types';
      await api.post(endpoint, values);
      toast.success('配置已更新');
      setIsBaseModalOpen(false);
      fetchBaseConfig();
    } catch (e) {}
  };

  const handleDeleteItem = (type, record) => {
    const endpointMap = {
      category: `/assets/categories/${record.id}`,
      form: `/assets/forms/${record.id}`,
      type: `/assets/component-types/${record.id}`,
      component: `/assets/components/${record.id}`
    };
    
    Modal.confirm({
      title: '确认删除该项？',
      content: '系统将检查依赖关系，若该项正在被设备或型号使用，则无法删除。',
      centered: true,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await api.delete(endpointMap[type]);
          if (res.data.success) {
            toast.success('已成功删除');
            type === 'component' ? fetchMainData() : fetchBaseConfig();
          }
        } catch (e) {
          toast.error(e.response?.data?.message || '删除失败，该项可能正在被使用');
        }
      }
    });
  };

  const employeeColumns = [
    {
      title: '员工姓名', dataIndex: 'real_name', align: 'center',
      render: (text, r) => <Space><Avatar size="small" src={getImageUrl(r.avatar)} icon={<UserOutlined />} /><span className="font-semibold">{text}</span></Space>
    },
    { title: '部门', dataIndex: 'department_name', align: 'center' },
    { title: '职位', dataIndex: 'position_name', align: 'center' },
    { 
      title: '持有设备', dataIndex: 'device_count', align: 'center',
      render: count => <span className={`font-bold ${count > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>{count} 台</span>
    },
    {
      title: '操作', align: 'center',
      render: (_, r) => (
        <div className="flex justify-center gap-2">
          <ShadcnButton variant="outline" size="sm" onClick={() => handleUserDetail(r)}>明细</ShadcnButton>
          <ShadcnButton variant="indigo" size="sm" onClick={() => { setSelectedUser(r); setIsAssignModalOpen(true); fetchIdleAssets(); }}>配属</ShadcnButton>
        </div>
      )
    }
  ];

  const deviceColumns = [
    { title: '型号名称', dataIndex: 'name', align: 'center', render: t => <span className="font-bold text-slate-800">{t}</span> },
    { title: '业务分类', dataIndex: 'category_name', align: 'center' },
    { title: '硬件形态', dataIndex: 'form_name', align: 'center', render: t => <Tag className="rounded-full">{t}</Tag> },
    { 
      title: '在用实机', dataIndex: 'assigned_count', align: 'center',
      render: (count, r) => (
        <button onClick={() => { setSelectedDevice(r); setIsAssignedModalOpen(true); }} className="font-bold text-indigo-600 hover:underline">
          {count} 台
        </button>
      )
    },
    {
      title: '操作', align: 'center',
      render: (_, r) => (
        <div className="flex justify-center gap-2">
          <ShadcnButton variant="secondary" size="sm" onClick={() => { setSelectedDevice(r); setIsEditorOpen(true); }}>编辑</ShadcnButton>
          <ShadcnButton variant="ghost" danger size="sm" onClick={() => {
             Modal.confirm({ title: '删除型号', content: '仅支持删除无实机绑定的型号', onOk: async () => { await api.delete(`/assets/devices/${r.id}`); fetchMainData(); } });
          }}>删除</ShadcnButton>
        </div>
      )
    }
  ];

  const componentColumns = [
    { title: '规格名称', dataIndex: 'name', align: 'center', render: t => <span className="font-medium">{t}</span> },
    { title: '类型', dataIndex: 'type_name', align: 'center' },
    { title: '参数/型号', dataIndex: 'model', align: 'center', render: t => <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">{t || '-'}</code> },
    { title: '操作', align: 'center', render: (_, r) => <ShadcnButton variant="ghost" size="sm" danger onClick={() => handleDeleteItem('component', r)}>删除</ShadcnButton> }
  ];

  const tabItems = [
    {
      key: 'employees',
      label: <div className="flex items-center gap-2 px-2"><UserOutlined />员工配属</div>,
      children: (
        <div className="space-y-4">
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
            <Row gutter={12} align="middle">
              <Col span={6}><Input placeholder="搜索姓名..." prefix={<SearchOutlined />} allowClear className="rounded-md" value={filters.keyword} onChange={e => setFilters({...filters, keyword: e.target.value})} /></Col>
              <Col span={5}><Select placeholder="所属部门" className="w-full" allowClear options={departments.map(d => ({ label: d.name, value: d.id }))} onChange={val => setFilters({...filters, department_id: val})} /></Col>
              <Col span={5}><Select placeholder="职位" className="w-full" allowClear options={positions.map(p => ({ label: p.name, value: p.id }))} onChange={val => setFilters({...filters, position_id: val})} /></Col>
              <Col span={8} className="text-right"><ShadcnButton variant="outline" onClick={fetchMainData} icon={<ReloadOutlined />}>同步数据</ShadcnButton></Col>
            </Row>
          </div>
          <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-sm">
            <Table columns={employeeColumns} dataSource={employees} loading={loading} rowKey="user_id" pagination={{ pageSize: 10 }} />
          </div>
        </div>
      )
    },
    {
      key: 'devices',
      label: <div className="flex items-center gap-2 px-2"><BuildOutlined />设备库 (SKU)</div>,
      children: (
        <div className="space-y-4">
          <div className="flex justify-end"><ShadcnButton variant="indigo" icon={<PlusOutlined />} onClick={() => { setSelectedDevice(null); setIsEditorOpen(true); }}>发布新型号</ShadcnButton></div>
          <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-sm">
            <Table columns={deviceColumns} dataSource={devices} loading={loading} rowKey="id" />
          </div>
        </div>
      )
    },
    {
      key: 'components',
      label: <div className="flex items-center gap-2 px-2"><LayoutOutlined />规格库 (Specs)</div>,
      children: (
        <div className="space-y-4">
          <div className="flex justify-end"><ShadcnButton variant="indigo" icon={<PlusOutlined />} onClick={() => setIsCompEntryOpen(true)}>定义新规格</ShadcnButton></div>
          <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-sm">
            <Table columns={componentColumns} dataSource={components} loading={loading} rowKey="id" />
          </div>
        </div>
      )
    },
    {
      key: 'settings',
      label: <div className="flex items-center gap-2 px-2"><SettingOutlined />配置中心</div>,
      children: (
        <Row gutter={24}>
          <Col span={8}>
            <Card title={<span className="text-sm font-bold">业务分类</span>} size="small" extra={<ShadcnButton variant="link" size="sm" onClick={() => { setBaseModalConfig({ type: 'category', title: '定义业务分类' }); setIsBaseModalOpen(true); }}>添加</ShadcnButton>}>
              <Table size="small" pagination={false} dataSource={categories} rowKey="id" columns={[{ title: '名称', dataIndex: 'name', align: 'center' }, { title: '操作', align: 'center', render: (_, r) => <ShadcnButton variant="ghost" size="sm" danger onClick={() => handleDeleteItem('category', r)}>删除</ShadcnButton> }]} />
            </Card>
          </Col>
          <Col span={8}>
            <Card title={<span className="text-sm font-bold">设备形态</span>} size="small" extra={<ShadcnButton variant="link" size="sm" onClick={() => { setBaseModalConfig({ type: 'form', title: '定义形态' }); setIsBaseModalOpen(true); }}>添加</ShadcnButton>}>
              <Table size="small" pagination={false} dataSource={forms} rowKey="id" columns={[{ title: '名称', dataIndex: 'name', align: 'center' }, { title: '操作', align: 'center', render: (_, r) => <ShadcnButton variant="ghost" size="sm" danger onClick={() => handleDeleteItem('form', r)}>删除</ShadcnButton> }]} />
            </Card>
          </Col>
          <Col span={8}>
            <Card title={<span className="text-sm font-bold">配件大类</span>} size="small" extra={<ShadcnButton variant="link" size="sm" onClick={() => { setBaseModalConfig({ type: 'type', title: '定义类型' }); setIsBaseModalOpen(true); }}>添加</ShadcnButton>}>
              <Table size="small" pagination={false} dataSource={compTypes} rowKey="id" columns={[{ title: '名称', dataIndex: 'name', align: 'center' }, { title: '操作', align: 'center', render: (_, r) => <ShadcnButton variant="ghost" size="sm" danger onClick={() => handleDeleteItem('type', r)}>删除</ShadcnButton> }]} />
            </Card>
          </Col>
        </Row>
      )
    }
  ];

  return (
    <div className="p-8 bg-white min-h-screen text-slate-900">
      <div className="mb-4"><Breadcrumb items={['首页', '后勤管理', '设备管理']} /></div>
      <div className="mb-8 border-b border-slate-100 pb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">设备配置中心</h1>
        <p className="text-slate-500 mt-2 text-sm font-medium">定义标准硬件型号、管理配件规格及全员设备配属逻辑</p>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} type="card" className="asset-tabs" />

      <DeviceModelEditor isOpen={isEditorOpen} deviceId={selectedDevice?.id} onClose={() => { setIsEditorOpen(false); setSelectedDevice(null); }} onSave={fetchMainData} categories={categories} forms={forms} />

      {/* 领用名单详情 */}
      <Modal title={`${selectedDevice?.name} - 领用人员清单`} open={isAssignedModalOpen} onCancel={() => setIsAssignedModalOpen(false)} footer={null} width={900} centered>
        <div className="mb-4 bg-slate-50 p-4 rounded-lg flex gap-4">
          <Input placeholder="搜索人名/编号..." prefix={<SearchOutlined />} style={{ width: 300 }} allowClear onChange={e => setAssignedFilters({...assignedFilters, keyword: e.target.value})} />
          <Select placeholder="筛选部门" style={{ width: 200 }} allowClear options={departments.map(d => ({ label: d.name, value: d.id }))} onChange={val => setAssignedFilters({...assignedFilters, department_id: val})} />
        </div>
        <Table dataSource={assignedUsers} rowKey="user_id" pagination={{ pageSize: 5 }} columns={[
          { title: '领用人', dataIndex: 'real_name', align: 'center', render: (text, r) => <Space><Avatar size="small" src={getImageUrl(r.avatar)} /><b>{text}</b></Space> },
          { title: '部门', dataIndex: 'department_name', align: 'center' },
          { title: '物理编号', dataIndex: 'asset_no', align: 'center', render: t => <code className="text-indigo-600 font-bold">{t}</code> },
          { title: '领用时间', dataIndex: 'assigned_at', align: 'center', render: d => new Date(d).toLocaleDateString() }
        ]} />
      </Modal>

      {/* 员工设备档案 */}
      <Modal title={`${selectedUser?.real_name} 的设备档案`} open={isUserDetailOpen} onCancel={() => setIsUserDetailOpen(false)} footer={null} width={900} centered>
        <Table dataSource={userAssets} rowKey="id" pagination={false} columns={[
          { title: '物理编号', dataIndex: 'asset_no', align: 'center', render: t => <code className="font-bold">{t}</code> },
          { title: '型号名称', dataIndex: 'model_name', align: 'center' },
          { title: '配置快照', align: 'center', render: r => <div className="flex flex-wrap justify-center gap-1">{(r.components||[]).map((c, i) => <Tag key={i} className="text-[10px] m-0">{c.component_model || c.component_name}</Tag>)}</div> },
          { title: '状态', dataIndex: 'device_status', align: 'center', render: s => <Badge status={s==='in_use'?'processing':s==='damaged'?'error':'default'} text={s==='in_use'?'使用中':s==='damaged'?'故障':'闲置'} /> },
          { title: '操作', align: 'center', render: (_, r) => <ShadcnButton variant="outline" size="sm" onClick={() => { Modal.confirm({ title: '确认回收', content: '回收后该物理实体将进入闲置库', onOk: async() => { await api.post('/assets/return',{asset_id:r.id}); handleUserDetail(selectedUser); fetchMainData(); } }); }}>回收设备</ShadcnButton> }
        ]} />
      </Modal>

      {/* 分配/建模/基础弹窗 */}
      <Modal title="执行设备配属" open={isAssignModalOpen} onCancel={() => setIsAssignModalOpen(false)} onOk={handleAssignSubmit} centered width={450} okText="确定分配" cancelText="取消">
        <Form form={form} layout="vertical" className="mt-4">
          <Tabs activeKey={assignMode} onChange={setAssignMode} items={[{ key: 'new', label: '新发设备 (自动编号)' }, { key: 'existing', label: '库存闲置挑选' }]} />
          {assignMode === 'new' ? (
            <div className="mt-4"><Form.Item name="model_id" label="选择标准型号" rules={[{ required: true }]}><Select placeholder="型号库" options={devices.map(d => ({ label: d.name, value: d.id }))} /></Form.Item></div>
          ) : (
            <div className="mt-4"><Form.Item name="asset_id" label="选择闲置机器" rules={[{ required: true }]}><Select placeholder="闲置库" options={idleAssets.map(a => ({ label: `${a.asset_no} - ${a.model_name}`, value: a.id }))} /></Form.Item></div>
          )}
        </Form>
      </Modal>

      <Modal title={baseModalConfig.title} open={isBaseModalOpen} onCancel={() => setIsBaseModalOpen(false)} onOk={handleBaseSubmit} centered okText="保存" cancelText="取消">
        <Form form={form} layout="vertical" className="mt-4"><Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>{baseModalConfig.type === 'category' && <Form.Item name="code" label="自定义识别码 (可选)" ><Input placeholder="不填则自动生成" /></Form.Item>}</Form>
      </Modal>

      <Modal title="配件规格定义" open={isCompEntryOpen} onCancel={() => setIsCompEntryOpen(false)} onOk={handleCompEntry} centered okText="确认发布" cancelText="取消">
        <Form form={form} layout="vertical"><Form.Item name="type_id" label="所属分类" rules={[{ required: true }]}><Select options={compTypes.map(t => ({ label: t.name, value: t.id }))} /></Form.Item><Form.Item name="name" label="规格名称" rules={[{ required: true }]}><Input placeholder="如: 金士顿 16G DDR4" /></Form.Item><Form.Item name="model" label="型号参数"><Input placeholder="如: KVR32N22S8/16" /></Form.Item><Form.Item name="notes" label="备注"><Input.TextArea /></Form.Item></Form>
      </Modal>
    </div>
  );
};

export default AssetManagement;