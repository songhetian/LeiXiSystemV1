import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
	Badge,
	Tag,
	Modal,
	Form,
	Input,
	Select,
	Table,
	Avatar,
	Space,
	Tabs,
	Card,
	Row,
	Col,
	Button,
	Tooltip
} from 'antd';
import {
	SwapOutlined
} from '@ant-design/icons';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../utils/apiClient';
import Breadcrumb from '../../../components/Breadcrumb';
import { getImageUrl } from '../../../utils/fileUtils';
import DeviceModelEditor from './DeviceModelEditor';

const AssetManagement = () => {
	const [form] = Form.useForm();
	const [activeTab, setActiveTab] = useState('employees');
	const [loading, setLoading] = useState(false);
	const [filters, setFilters] = useState({
		keyword: '',
		department_id: null,
		position_id: null
	});

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
	const [assignedFilters, setAssignedFilters] = useState({
		keyword: '',
		department_id: null
	});

	const [isEditorOpen, setIsEditorOpen] = useState(false);
	const [isBaseModalOpen, setIsBaseModalOpen] = useState(false);
	const [baseModalConfig, setBaseModalConfig] = useState({
		type: '',
		title: ''
	});
	const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
	const [isCompEntryOpen, setIsCompEntryOpen] = useState(false);
	const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
	const [isAssignedModalOpen, setIsAssignedModalOpen] = useState(false);

	const [assignMode, setAssignMode] = useState('new');

	useEffect(() => {
		fetchMainData();
	}, [activeTab, filters]);
	useEffect(() => {
		fetchBaseConfig();
		fetchFilterData();
	}, []);
	useEffect(() => {
		if (isAssignedModalOpen && selectedDevice) fetchAssignedUsers();
	}, [isAssignedModalOpen, assignedFilters]);

	const fetchFilterData = async () => {
		try {
			const [deptRes, posRes] = await Promise.all([
				apiGet('/api/departments'),
				apiGet('/api/positions')
			]);
			setDepartments(deptRes.success ? deptRes.data : []);
			setPositions(posRes.success ? posRes.data : []);
		} catch (e) {}
	};

	const fetchBaseConfig = async () => {
		try {
			const [catRes, typeRes, formRes] = await Promise.all([
				apiGet('/api/assets/categories'),
				apiGet('/api/assets/component-types'),
				apiGet('/api/assets/forms')
			]);
			if (catRes.success) setCategories(catRes.data);
			if (formRes.success) setForms(formRes.data);
			if (typeRes.success) setCompTypes(typeRes.data);
		} catch (e) {}
	};

	const fetchMainData = async () => {
		setLoading(true);
		try {
			if (activeTab === 'employees') {
				const res = await apiGet('/api/assets/employee-centric', {
					params: filters
				});
				if (res.success) setEmployees(res.data);
			} else if (activeTab === 'devices') {
				const res = await apiGet('/api/assets/devices');
				if (res.success) setDevices(res.data);
			} else if (activeTab === 'components') {
				const res = await apiGet('/api/assets/components');
				if (res.success) setComponents(res.data);
			}
		} catch (e) {
			toast.error('加载失败');
		} finally {
			setLoading(false);
		}
	};

	const fetchAssignedUsers = async () => {
		try {
			const res = await apiGet(`/api/assets/devices/${selectedDevice.id}/users`, {
				params: assignedFilters
			});
			if (res.success) setAssignedUsers(res.data);
		} catch (e) {}
	};

	const fetchIdleAssets = async () => {
		try {
			const res = await apiGet('/api/assets/idle');
			if (res.success) setIdleAssets(res.data);
		} catch (e) {}
	};

	const handleUserDetail = async user => {
		setSelectedUser(user);
		setLoading(true);
		try {
			const res = await apiGet(`/api/assets/employee/${user.user_id}`);
			if (res.success) {
				setUserAssets(res.data);
				setIsUserDetailOpen(true);
			}
		} catch (e) {
		} finally {
			setLoading(false);
		}
	};

	const handleAssignSubmit = async () => {
		try {
			const values = await form.validateFields();
			await apiPost('/api/assets/assign', {
				...values,
				user_id: selectedUser.user_id
			});
			toast.success('分配成功');
			setIsAssignModalOpen(false);
			fetchMainData();
		} catch (e) {}
	};

	const handleCompEntry = async () => {
		try {
			const values = await form.validateFields();
			await apiPost('/api/assets/components', values);
			toast.success('规格已保存');
			setIsCompEntryOpen(false);
			fetchMainData();
		} catch (e) {}
	};

	const handleBaseSubmit = async () => {
		try {
			const values = await form.validateFields();
			const endpoint =
				baseModalConfig.type === 'category'
					? '/api/assets/categories'
					: baseModalConfig.type === 'form'
						? '/api/assets/forms'
						: '/api/assets/component-types';
			await apiPost(endpoint, values);
			toast.success('配置已更新');
			setIsBaseModalOpen(false);
			fetchBaseConfig();
		} catch (e) {}
	};

	const handleDeleteItem = (type, record) => {
		const endpointMap = {
			category: `/api/assets/categories/${record.id}`,
			form: `/api/assets/forms/${record.id}`,
			type: `/api/assets/component-types/${record.id}`,
			component: `/api/assets/components/${record.id}`
		};

		Modal.confirm({
			title: '确认删除',
			content: '删除后无法恢复，确定要删除吗？',
			okText: '删除',
			cancelText: '取消',
			okButtonProps: { danger: true },
			onOk: async () => {
				try {
					const res = await apiDelete(endpointMap[type]);
					if (res.success) {
						toast.success('删除成功');
						type === 'component' ? fetchMainData() : fetchBaseConfig();
					}
				} catch (e) {
					toast.error(e.message || '删除失败');
				}
			}
		});
	};

	// 员工列表
	const employeeColumns = [
		{
			title: '员工',
			dataIndex: 'real_name',
			render: (text, r) => (
				<Space>
					<Avatar
						size={32}
						src={getImageUrl(r.avatar)}
						icon={<UserOutlined />}
					/>
					<span>{text}</span>
				</Space>
			)
		},
		{ title: '部门', dataIndex: 'department_name' },
		{ title: '职位', dataIndex: 'position_name' },
		{
			title: '设备数',
			dataIndex: 'device_count',
			width: 100,
			align: 'center',
			render: (count, r) => (
				<Button 
					type="link" 
					onClick={() => handleUserDetail(r)}
					style={{ fontWeight: 'bold', fontSize: 15 }}
				>
					{count}
				</Button>
			)
		},
		{
			title: '操作',
			width: 100,
			render: (_, r) => (
				<Space size="small">
					<Button
						size="small"
						icon={<EyeOutlined />}
						onClick={() => handleUserDetail(r)}
					>
						查看
					</Button>
				</Space>
			)
		}
	];

	// 设备型号列表
	const deviceColumns = [
		{
			title: '型号名称',
			dataIndex: 'name',
			render: t => <span style={{ fontWeight: 500 }}>{t}</span>
		},
		{ title: '分类', dataIndex: 'category_name', width: 120 },
		{
			title: '形态',
			dataIndex: 'form_name',
			width: 120,
			render: t => <Tag>{t}</Tag>
		},
		{
			title: '在用数量',
			dataIndex: 'assigned_count',
			width: 100,
			align: 'center',
			render: (count, r) => (
				<a
					onClick={() => {
						setSelectedDevice(r);
						setIsAssignedModalOpen(true);
					}}
				>
					{count}
				</a>
			)
		},
		{
			title: '操作',
			width: 140,
			render: (_, r) => (
				<Space size="small">
					<Button
						size="small"
						icon={<EditOutlined />}
						onClick={() => {
							setSelectedDevice(r);
							setIsEditorOpen(true);
						}}
					>
						编辑
					</Button>
					<Button
						size="small"
						danger
						icon={<DeleteOutlined />}
						onClick={() => {
							Modal.confirm({
								title: '删除型号',
								content: '仅可删除无设备绑定的型号',
								okText: '删除',
								okButtonProps: { danger: true },
								onOk: async () => {
									await apiDelete(`/api/assets/devices/${r.id}`);
									fetchMainData();
								}
							});
						}}
					>
						删除
					</Button>
				</Space>
			)
		}
	];

	// 配件规格列表
	const componentColumns = [
		{ title: '规格名称', dataIndex: 'name' },
		{ title: '类型', dataIndex: 'type_name', width: 120 },
		{
			title: '型号参数',
			dataIndex: 'model',
			width: 180,
			render: t =>
				t ? (
					<code
						style={{
							fontSize: 12,
							background: '#f5f5f5',
							padding: '2px 6px',
							borderRadius: 4
						}}
					>
						{t}
					</code>
				) : (
					'-'
				)
		},
		{
			title: '操作',
			width: 80,
			render: (_, r) => (
				<Button
					size="small"
					danger
					type="text"
					icon={<DeleteOutlined />}
					onClick={() => handleDeleteItem('component', r)}
				/>
			)
		}
	];

	// 配置表格通用列
	const configColumns = type => [
		{ title: '名称', dataIndex: 'name' },
		{
			title: '操作',
			width: 60,
			render: (_, r) => (
				<Button
					size="small"
					danger
					type="text"
					icon={<DeleteOutlined />}
					onClick={() => handleDeleteItem(type, r)}
				/>
			)
		}
	];

	const tabItems = [
		{
			key: 'employees',
			label: (
				<span>
					<UserOutlined style={{ marginRight: 8 }} />
					员工设备
				</span>
			),
			children: (
				<div>
					{/* 筛选栏 */}
					<div
						style={{
							marginBottom: 16,
							display: 'flex',
							gap: 12,
							alignItems: 'center'
						}}
					>
						<Input
							placeholder="搜索员工姓名"
							prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
							allowClear
							style={{ width: 200 }}
							value={filters.keyword}
							onChange={e =>
								setFilters({ ...filters, keyword: e.target.value })
							}
						/>
						<Select
							placeholder="部门"
							style={{ width: 150 }}
							allowClear
							options={departments.map(d => ({ label: d.name, value: d.id }))}
							onChange={val => setFilters({ ...filters, department_id: val })}
						/>
						<Select
							placeholder="职位"
							style={{ width: 150 }}
							allowClear
							options={positions.map(p => ({ label: p.name, value: p.id }))}
							onChange={val => setFilters({ ...filters, position_id: val })}
						/>
						<Button icon={<SyncOutlined />} onClick={fetchMainData}>
							刷新
						</Button>
					</div>
					<Table
						columns={employeeColumns}
						dataSource={employees}
						loading={loading}
						rowKey="user_id"
						pagination={{ pageSize: 10, showSizeChanger: false }}
						size="middle"
					/>
				</div>
			)
		},
		{
			key: 'devices',
			label: (
				<span>
					<DesktopOutlined style={{ marginRight: 8 }} />
					设备型号
				</span>
			),
			children: (
				<div>
					<div style={{ marginBottom: 16, textAlign: 'right' }}>
						<Button
							type="primary"
							icon={<PlusOutlined />}
							onClick={() => {
								setSelectedDevice(null);
								setIsEditorOpen(true);
							}}
						>
							新增型号
						</Button>
					</div>
					<Table
						columns={deviceColumns}
						dataSource={devices}
						loading={loading}
						rowKey="id"
						size="middle"
					/>
				</div>
			)
		},
		{
			key: 'components',
			label: (
				<span>
					<AppstoreOutlined style={{ marginRight: 8 }} />
					配件规格
				</span>
			),
			children: (
				<div>
					<div style={{ marginBottom: 16, textAlign: 'right' }}>
						<Button
							type="primary"
							icon={<PlusOutlined />}
							onClick={() => setIsCompEntryOpen(true)}
						>
							新增规格
						</Button>
					</div>
					<Table
						columns={componentColumns}
						dataSource={components}
						loading={loading}
						rowKey="id"
						size="middle"
					/>
				</div>
			)
		},
		{
			key: 'settings',
			label: (
				<span>
					<SettingOutlined style={{ marginRight: 8 }} />
					基础配置
				</span>
			),
			children: (
				<Row gutter={16}>
					<Col span={8}>
						<Card
							title="业务分类"
							size="small"
							extra={
								<Button
									type="link"
									size="small"
									onClick={() => {
										setBaseModalConfig({ type: 'category', title: '新增分类' });
										setIsBaseModalOpen(true);
									}}
								>
									添加
								</Button>
							}
						>
							<Table
								size="small"
								pagination={false}
								dataSource={categories}
								rowKey="id"
								columns={configColumns('category')}
							/>
						</Card>
					</Col>
					<Col span={8}>
						<Card
							title="设备形态"
							size="small"
							extra={
								<Button
									type="link"
									size="small"
									onClick={() => {
										setBaseModalConfig({ type: 'form', title: '新增形态' });
										setIsBaseModalOpen(true);
									}}
								>
									添加
								</Button>
							}
						>
							<Table
								size="small"
								pagination={false}
								dataSource={forms}
								rowKey="id"
								columns={configColumns('form')}
							/>
						</Card>
					</Col>
					<Col span={8}>
						<Card
							title="配件类型"
							size="small"
							extra={
								<Button
									type="link"
									size="small"
									onClick={() => {
										setBaseModalConfig({ type: 'type', title: '新增类型' });
										setIsBaseModalOpen(true);
									}}
								>
									添加
								</Button>
							}
						>
							<Table
								size="small"
								pagination={false}
								dataSource={compTypes}
								rowKey="id"
								columns={configColumns('type')}
							/>
						</Card>
					</Col>
				</Row>
			)
		}
	];

	return (
		<div style={{ padding: 24, background: '#fff', minHeight: '100%' }}>
			<Breadcrumb items={['首页', '后勤管理', '设备管理']} />

			<div style={{ marginBottom: 24, marginTop: 16 }}>
				<h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>设备管理</h2>
				<p style={{ margin: '8px 0 0', color: '#666', fontSize: 14 }}>
					管理公司设备型号、配件规格及员工设备分配
				</p>
			</div>

			<Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

			{/* 设备型号编辑器 */}
			<DeviceModelEditor
				isOpen={isEditorOpen}
				deviceId={selectedDevice?.id}
				onClose={() => {
					setIsEditorOpen(false);
					setSelectedDevice(null);
				}}
				onSave={fetchMainData}
				categories={categories}
				forms={forms}
			/>

			{/* 领用人员清单 */}
			<Modal
				title={`${selectedDevice?.name || ''} - 领用人员`}
				open={isAssignedModalOpen}
				onCancel={() => setIsAssignedModalOpen(false)}
				footer={null}
				width={800}
			>
				<div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
					<Input
						placeholder="搜索姓名"
						prefix={<SearchOutlined />}
						style={{ width: 200 }}
						allowClear
						onChange={e =>
							setAssignedFilters({
								...assignedFilters,
								keyword: e.target.value
							})
						}
					/>
					<Select
						placeholder="部门"
						style={{ width: 150 }}
						allowClear
						options={departments.map(d => ({ label: d.name, value: d.id }))}
						onChange={val =>
							setAssignedFilters({ ...assignedFilters, department_id: val })
						}
					/>
				</div>
				<Table
					dataSource={assignedUsers}
					rowKey="user_id"
					size="small"
					pagination={{ pageSize: 5 }}
					columns={[
						{
							title: '领用人',
							dataIndex: 'real_name',
							render: (text, r) => (
								<Space>
									<Avatar
										size="small"
										src={getImageUrl(r.avatar)}
										icon={<UserOutlined />}
									/>
									<span>{text}</span>
								</Space>
							)
						},
						{ title: '部门', dataIndex: 'department_name' },
						{
							title: '设备编号',
							dataIndex: 'asset_no',
							render: t => <code>{t}</code>
						},
						{
							title: '领用时间',
							dataIndex: 'assigned_at',
							render: d => new Date(d).toLocaleDateString()
						}
					]}
				/>
			</Modal>

			{/* 员工设备档案 */}
			<Modal
				title={
					<div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
						<Avatar size={40} src={getImageUrl(selectedUser?.avatar)} icon={<UserOutlined />} style={{ border: '2px solid #1890ff' }} />
						<div>
							<div style={{ fontSize: 18, fontWeight: 600, color: '#262626' }}>{selectedUser?.real_name} - 设备档案</div>
							<div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>{selectedUser?.department_name} / {selectedUser?.position_name}</div>
						</div>
					</div>
				}
				open={isUserDetailOpen}
				onCancel={() => setIsUserDetailOpen(false)}
				footer={null}
				width={1000}
				centered
				styles={{ body: { padding: '24px' } }}
			>
				{/* 统计概览栏 */}
				<div style={{ background: '#fafafa', padding: '16px 24px', borderRadius: 8, marginBottom: 24, display: 'flex', gap: 40, border: '1px solid #f0f0f0' }}>
					<div>
						<div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>领用设备总数</div>
						<div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>{userAssets.length} <span style={{ fontSize: 14, fontWeight: 'normal', color: '#595959' }}>台</span></div>
					</div>
					<div style={{ width: 1, background: '#f0f0f0', height: 40 }} />
					<div>
						<div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>状态分布</div>
						<Space size="large">
							<Badge color="green" text={`使用中: ${userAssets.filter(a => a.device_status === 'in_use').length}`} />
							<Badge color="red" text={`故障: ${userAssets.filter(a => a.device_status === 'damaged').length}`} />
						</Space>
					</div>
				</div>

				<Table
					dataSource={userAssets}
					rowKey="id"
					size="middle"
					pagination={false}
					columns={[
						{
							title: '序号',
							width: 60,
							align: 'center',
							render: (_, __, i) => <span style={{ color: '#bfbfbf' }}>{i + 1}</span>
						},
						{
							title: '设备编号',
							dataIndex: 'asset_no',
							width: 180,
							render: t => <code style={{ color: '#096dd9', fontWeight: 'bold', background: '#e6f7ff', padding: '2px 8px', borderRadius: 4 }}>{t}</code>
						},
						{ 
							title: '设备型号', 
							dataIndex: 'model_name',
							width: 150,
							render: t => <span style={{ fontWeight: 500, color: '#262626' }}>{t}</span>
						},
						{
							title: '硬件配置',
							render: r => (
								<Space wrap size={[4, 8]}>
									{(r.components || []).map((c, i) => (
										<Tag key={i} color="blue" bordered={false} style={{ margin: 0, padding: '2px 8px', background: '#f0f5ff', color: '#2f54eb' }}>
											{c.component_model || c.component_name}
										</Tag>
									))}
								</Space>
							)
						},
						{
							title: '状态',
							dataIndex: 'device_status',
							width: 100,
							render: s => {
								const config = {
									in_use: { color: 'success', text: '使用中' },
									damaged: { color: 'error', text: '故障' },
									maintenance: { color: 'warning', text: '维修中' }
								};
								const item = config[s] || { color: 'default', text: '闲置' };
								return <Badge status={item.color} text={item.text} />;
							}
						},
						{
							title: '操作',
							width: 100,
							align: 'right',
							render: (_, r) => (
								<Button
									size="small"
									danger
									type="link"
									onClick={() => {
										Modal.confirm({
											title: '确认回收设备？',
											content: `确认要回收编号为 [${r.asset_no}] 的设备吗？回收后该设备将进入闲置库。`,
											okText: '确认回收',
											cancelText: '取消',
											okButtonProps: { danger: true },
											onOk: async () => {
												await apiPost('/api/assets/return', { asset_id: r.id });
												handleUserDetail(selectedUser);
												fetchMainData();
											}
										});
									}}
								>
									回收
								</Button>
							)
						}
					]}
				/>
			</Modal>

			{/* 设备分配弹窗 */}
			<Modal
				title="分配设备"
				open={isAssignModalOpen}
				onCancel={() => setIsAssignModalOpen(false)}
				onOk={handleAssignSubmit}
				okText="确定"
				cancelText="取消"
				width={480}
				destroyOnClose
			>
				<Form form={form} layout="vertical" style={{ marginTop: 16 }}>
					<Tabs
						activeKey={assignMode}
						onChange={setAssignMode}
						items={[
							{ key: 'new', label: '新发设备' },
							{ key: 'existing', label: '从闲置库选择' }
						]}
						size="small"
					/>
					<div style={{ marginTop: 16 }}>
						{assignMode === 'new' ? (
							<Form.Item
								name="model_id"
								label="设备型号"
								rules={[{ required: true, message: '请选择型号' }]}
							>
								<Select
									placeholder="请选择"
									options={devices.map(d => ({ label: d.name, value: d.id }))}
								/>
							</Form.Item>
						) : (
							<Form.Item
								name="asset_id"
								label="闲置设备"
								rules={[{ required: true, message: '请选择设备' }]}
							>
								<Select
									placeholder="请选择"
									options={idleAssets.map(a => ({
										label: `${a.asset_no} - ${a.model_name}`,
										value: a.id
									}))}
								/>
							</Form.Item>
						)}
					</div>
				</Form>
			</Modal>

			{/* 基础配置弹窗 */}
			<Modal
				title={baseModalConfig.title}
				open={isBaseModalOpen}
				onCancel={() => setIsBaseModalOpen(false)}
				onOk={handleBaseSubmit}
				okText="保存"
				cancelText="取消"
				width={400}
				destroyOnClose
			>
				<Form form={form} layout="vertical" style={{ marginTop: 16 }}>
					<Form.Item
						name="name"
						label="名称"
						rules={[{ required: true, message: '请输入名称' }]}
					>
						<Input placeholder="请输入" />
					</Form.Item>
					{baseModalConfig.type === 'category' && (
						<Form.Item name="code" label="编码">
							<Input placeholder="可选，不填则自动生成" />
						</Form.Item>
					)}
				</Form>
			</Modal>

			{/* 配件规格弹窗 */}
			<Modal
				title="新增配件规格"
				open={isCompEntryOpen}
				onCancel={() => setIsCompEntryOpen(false)}
				onOk={handleCompEntry}
				okText="保存"
				cancelText="取消"
				width={480}
				destroyOnClose
			>
				<Form form={form} layout="vertical" style={{ marginTop: 16 }}>
					<Form.Item
						name="type_id"
						label="配件类型"
						rules={[{ required: true, message: '请选择类型' }]}
					>
						<Select
							placeholder="请选择"
							options={compTypes.map(t => ({ label: t.name, value: t.id }))}
						/>
					</Form.Item>
					<Form.Item
						name="name"
						label="规格名称"
						rules={[{ required: true, message: '请输入名称' }]}
					>
						<Input placeholder="如：金士顿 16G DDR4" />
					</Form.Item>
					<Form.Item name="model" label="型号参数">
						<Input placeholder="如：KVR32N22S8/16" />
					</Form.Item>
					<Form.Item name="notes" label="备注">
						<Input.TextArea rows={3} placeholder="可选" />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
};

export default AssetManagement;
