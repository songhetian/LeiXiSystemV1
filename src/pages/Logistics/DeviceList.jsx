import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
	Badge,
	Tag,
	Modal,
	Input,
	Select,
	Form,
	Table,
	Avatar,
	Space,
	Card,
	Row,
	Col,
	Timeline,
	Typography,
	Empty,
	Button
} from 'antd';
import {
	SearchOutlined,
	ReloadOutlined,
	InfoCircleOutlined,
	ToolOutlined,
	StopOutlined,
	CheckCircleOutlined,
	HistoryOutlined,
	DesktopOutlined,
	UserOutlined,
	PlusOutlined,
	SwapOutlined,
	EyeOutlined
} from '@ant-design/icons';
import api from '../../api';
import Breadcrumb from '../../components/Breadcrumb';
import { getImageUrl } from '../../utils/fileUtils';

const { Text, Title } = Typography;

const DeviceList = () => {
	const [form] = Form.useForm();
	const [configForm] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [instances, setInstances] = useState([]);
	const [filters, setFilters] = useState({
		keyword: '',
		device_status: null,
		department_id: null,
		model_id: null
	});

	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [isConfigViewOpen, setIsConfigViewOpen] = useState(false);
	const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
	const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
	const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

	const [currentDevice, setCurrentDevice] = useState(null);
	const [devices, setDevices] = useState([]);
	const [allEmployees, setAllEmployees] = useState([]);
	const [departments, setDepartments] = useState([]);
	const [compTypes, setCompTypes] = useState([]);
	const [availableComps, setAvailableComps] = useState([]);

	useEffect(() => {
		fetchInstances();
	}, [filters]);
	useEffect(() => {
		fetchOptions();
	}, []);

	const fetchInstances = async () => {
		setLoading(true);
		try {
			const res = await api.get('/assets/instances', { params: filters });
			if (res.data.success) setInstances(res.data.data);
		} catch (e) {
			toast.error('获取库存失败');
		} finally {
			setLoading(false);
		}
	};

	const fetchOptions = async () => {
		try {
			const [devRes, empRes, typeRes, deptRes] = await Promise.all([
				api.get('/assets/devices'),
				api.get('/assets/employee-centric'),
				api.get('/assets/component-types'),
				api.get('/departments')
			]);
			setDevices(devRes.data.data || []);
			setAllEmployees(empRes.data.data || []);
			setCompTypes(typeRes.data.data || []);
			setDepartments(
				Array.isArray(deptRes.data) ? deptRes.data : deptRes.data.data || []
			);
		} catch (e) {}
	};

	const fetchCompsByType = async typeId => {
		try {
			const res = await api.get(`/assets/components?type_id=${typeId}`);
			if (res.data.success) setAvailableComps(res.data.data);
		} catch (e) {}
	};

	const showDetail = async record => {
		setLoading(true);
		try {
			const res = await api.get(`/assets/instances/${record.id}`);
			if (res.data.success) {
				setCurrentDevice(res.data.data);
				setIsDetailOpen(true);
			}
		} catch (e) {
			toast.error('获取详情失败');
		} finally {
			setLoading(false);
		}
	};

	const showQuickConfig = async record => {
		setLoading(true);
		try {
			const res = await api.get(`/assets/instances/${record.id}`);
			if (res.data.success) {
				setCurrentDevice(res.data.data);
				setIsConfigViewOpen(true);
			}
		} catch (e) {
			toast.error('获取配置失败');
		} finally {
			setLoading(false);
		}
	};

	const handleConfigSubmit = async () => {
		try {
			const values = await configForm.validateFields();
			const res = await api.post(
				`/assets/instances/${currentDevice.id}/config`,
				values
			);
			if (res.data.success) {
				toast.success('配置已更新');
				setIsConfigModalOpen(false);
				showDetail(currentDevice);
				fetchInstances();
			}
		} catch (e) {}
	};

	const updateStatus = (id, status, label) => {
		Modal.confirm({
			title: `确认${label}`,
			content: `确定将设备状态变更为「${label}」吗？`,
			centered: true,
			onOk: async () => {
				try {
					await api.put(`/assets/instances/${id}/status`, {
						device_status: status
					});
					toast.success('状态已更新');
					if (isDetailOpen) showDetail(currentDevice);
					fetchInstances();
				} catch (e) {}
			}
		});
	};

	const handleAssignSubmit = async () => {
		try {
			const values = await form.validateFields();
			const res = await api.post('/assets/assign', values);
			if (res.data.success) {
				toast.success(`分配成功，设备编号: ${res.data.data.asset_no}`);
				setIsAssignModalOpen(false);
				setIsQuickModalOpen(false);
				fetchInstances();
			}
		} catch (e) {}
	};

	const statusMap = {
		idle: { color: 'default', text: '闲置' },
		in_use: { color: 'green', text: '使用中' },
		damaged: { color: 'red', text: '故障' },
		maintenance: { color: 'orange', text: '维修中' }
	};

	const columns = [
		{
			title: '设备编号',
			dataIndex: 'asset_no',
			align: 'center',
			render: t => <span className="font-mono text-slate-800">{t}</span>
		},
		{
			title: '型号',
			dataIndex: 'model_name',
			align: 'center',
			render: t => <span className="text-slate-700">{t}</span>
		},
		{
			title: '状态',
			dataIndex: 'device_status',
			align: 'center',
			render: s => {
				const cfg = statusMap[s] || { color: 'default', text: s };
				return <Tag color={cfg.color}>{cfg.text}</Tag>;
			}
		},
		{
			title: '当前使用者',
			dataIndex: 'user_name',
			align: 'center',
			render: (u, r) =>
				u ? (
					<div className="flex items-center justify-center gap-2">
						<Avatar
							size={24}
							src={getImageUrl(r.user_avatar)}
							icon={<UserOutlined />}
						/>
						<span className="text-slate-700">{u}</span>
					</div>
				) : (
					<span className="text-slate-400">未领用</span>
				)
		},
		{
			title: '所属部门',
			dataIndex: 'department_name',
			align: 'center'
		},
		{
			title: '操作',
			align: 'center',
			width: 260,
			render: (_, record) => (
				<Space size="small">
					<Button
						size="small"
						icon={<EyeOutlined />}
						onClick={() => showQuickConfig(record)}
					>
						配置
					</Button>
					<Button
						size="small"
						icon={<InfoCircleOutlined />}
						onClick={() => showDetail(record)}
					>
						档案
					</Button>
					{record.device_status === 'in_use' && (
						<Button
							size="small"
							icon={<ReloadOutlined />}
							onClick={() => updateStatus(record.id, 'idle', '归还入库')}
							className="text-orange-600 border-orange-300 hover:text-orange-700 hover:border-orange-400"
						>
							回收
						</Button>
					)}
					{record.device_status === 'idle' && (
						<Button
							size="small"
							type="primary"
							icon={<CheckCircleOutlined />}
							onClick={() => {
								setCurrentDevice(record);
								form.setFieldsValue({ asset_id: record.id });
								setIsAssignModalOpen(true);
							}}
						>
							分配
						</Button>
					)}
				</Space>
			)
		}
	];

	return (
		<div className="p-6 bg-gray-50 min-h-screen">
			<div className="mb-4">
				<Breadcrumb items={['首页', '后勤管理', '设备明细']} />
			</div>

			<div className="bg-white rounded-lg shadow-sm">
				{/* 页头 */}
				<div className="px-6 py-5 border-b border-gray-100">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-xl font-semibold text-gray-800 m-0">
								设备档案管理
							</h1>
							<p className="text-gray-500 mt-1 text-sm m-0">
								管理设备状态、硬件配置及使用记录
							</p>
						</div>
						<Button
							type="primary"
							icon={<PlusOutlined />}
							onClick={() => {
								form.resetFields();
								setIsQuickModalOpen(true);
							}}
						>
							分配新设备
						</Button>
					</div>
				</div>

				{/* 筛选区 */}
				<div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
					<Row gutter={16} align="middle">
						<Col flex="200px">
							<Input
								placeholder="搜索编号/使用者"
								prefix={<SearchOutlined className="text-gray-400" />}
								allowClear
								onChange={e =>
									setFilters({ ...filters, keyword: e.target.value })
								}
							/>
						</Col>
						<Col flex="160px">
							<Select
								placeholder="选择部门"
								className="w-full"
								allowClear
								onChange={val => setFilters({ ...filters, department_id: val })}
								options={departments.map(d => ({ label: d.name, value: d.id }))}
							/>
						</Col>
						<Col flex="160px">
							<Select
								placeholder="选择型号"
								className="w-full"
								allowClear
								onChange={val => setFilters({ ...filters, model_id: val })}
								options={devices.map(d => ({ label: d.name, value: d.id }))}
							/>
						</Col>
						<Col flex="140px">
							<Select
								placeholder="设备状态"
								className="w-full"
								allowClear
								onChange={val => setFilters({ ...filters, device_status: val })}
								options={[
									{ label: '闲置', value: 'idle' },
									{ label: '使用中', value: 'in_use' },
									{ label: '故障', value: 'damaged' },
									{ label: '维修中', value: 'maintenance' }
								]}
							/>
						</Col>
						<Col>
							<Button icon={<ReloadOutlined />} onClick={fetchInstances}>
								刷新
							</Button>
						</Col>
					</Row>
				</div>

				{/* 表格 */}
				<Table
					columns={columns}
					dataSource={instances}
					loading={loading}
					rowKey="id"
					pagination={{
						pageSize: 10,
						showTotal: t => `共 ${t} 台设备`,
						showSizeChanger: false
					}}
				/>
			</div>

			{/* 配置快览弹窗 */}
			<Modal
				title="设备配置清单"
				open={isConfigViewOpen}
				onCancel={() => setIsConfigViewOpen(false)}
				footer={null}
				width={500}
				centered
				destroyOnClose
			>
				<div className="py-4">
					<div className="mb-5 pb-4 border-b border-gray-100">
						<h3 className="text-lg font-medium text-gray-800 m-0">
							{currentDevice?.model_name}
						</h3>
						<div className="flex items-center gap-2 mt-2">
							<Tag>{currentDevice?.category_name}</Tag>
							<span className="text-gray-400 text-sm">
								{currentDevice?.form_name}
							</span>
						</div>
					</div>

					<div className="text-sm text-gray-500 mb-3">硬件配置</div>

					{(currentDevice?.components || []).length > 0 ? (
						<div className="space-y-2">
							{currentDevice.components.map((c, i) => (
								<div
									key={i}
									className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded"
								>
									<span className="text-gray-500">{c.type_name}</span>
									<span className="text-gray-800">
										{c.component_model || c.component_name}
										{c.quantity > 1 && (
											<span className="text-blue-600 ml-1">×{c.quantity}</span>
										)}
									</span>
								</div>
							))}
						</div>
					) : (
						<Empty
							image={Empty.PRESENTED_IMAGE_SIMPLE}
							description="暂无配置信息"
						/>
					)}

					<div className="mt-5 p-3 bg-blue-50 rounded text-sm text-gray-600">
						<InfoCircleOutlined className="text-blue-500 mr-2" />
						此清单显示设备当前的硬件配置快照
					</div>
				</div>
			</Modal>

			{/* 设备档案弹窗 */}
			<Modal
				title={
					<Space>
						<DesktopOutlined />
						<span>设备档案 - {currentDevice?.asset_no}</span>
					</Space>
				}
				open={isDetailOpen}
				onCancel={() => setIsDetailOpen(false)}
				footer={null}
				width={900}
				centered
				destroyOnClose
			>
				{currentDevice && (
					<div className="py-4">
						<Row gutter={24}>
							<Col span={14}>
								<Card size="small" className="mb-4">
									<div className="flex justify-between items-start mb-4">
										<div>
											<Title level={5} className="m-0">
												{currentDevice.model_name}
											</Title>
											<Text type="secondary" className="text-xs">
												{currentDevice.category_name} ·{' '}
												{currentDevice.form_name}
											</Text>
										</div>
										<Button
											size="small"
											icon={<SwapOutlined />}
											onClick={() => {
												configForm.resetFields();
												setIsConfigModalOpen(true);
											}}
										>
											调整配置
										</Button>
									</div>

									<div className="grid grid-cols-2 gap-2">
										{(currentDevice.components || []).map((c, i) => (
											<div
												key={i}
												className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded text-sm"
											>
												<Text type="secondary">{c.type_name}</Text>
												<Text>
													{c.component_model || c.component_name} ×{c.quantity}
												</Text>
											</div>
										))}
									</div>
								</Card>

								<Space>
									<Button
										icon={<ToolOutlined />}
										onClick={() =>
											updateStatus(currentDevice.id, 'damaged', '报告故障')
										}
									>
										标记故障
									</Button>
									<Button
										icon={<CheckCircleOutlined />}
										onClick={() =>
											updateStatus(currentDevice.id, 'idle', '设为闲置')
										}
										className="text-orange-600 border-orange-300 hover:text-orange-700 hover:border-orange-400"
									>
										回收入库
									</Button>
									<Button
										danger
										icon={<StopOutlined />}
										onClick={() =>
											updateStatus(currentDevice.id, 'scrapped', '报废处理')
										}
									>
										报废
									</Button>
								</Space>
							</Col>

							<Col span={10}>
								<div className="border-l border-gray-200 pl-6 h-full">
									<div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
										<HistoryOutlined /> 变更记录
									</div>
									<div className="max-h-96 overflow-y-auto">
										{currentDevice.history?.length > 0 ? (
											<Timeline>
												{currentDevice.history.map((h, i) => (
													<Timeline.Item
														key={i}
														color={
															h.upgrade_type === 'upgrade' ? 'green' : 'blue'
														}
													>
														<div className="text-xs text-gray-400 mb-1">
															{new Date(h.upgrade_date).toLocaleDateString()}
														</div>
														<div className="text-sm">
															<span className="font-medium">{h.type_name}</span>
															<span className="text-gray-500 ml-1">
																{h.upgrade_type === 'upgrade' ? '升级' : '更换'}
															</span>
														</div>
														<div className="text-sm mt-1">
															{h.old_model && (
																<Text
																	delete
																	type="secondary"
																	className="mr-2 text-xs"
																>
																	{h.old_model}
																</Text>
															)}
															<Text type="success">{h.new_model}</Text>
														</div>
														{h.reason && (
															<div className="text-xs text-gray-400 mt-1 bg-gray-50 p-2 rounded">
																{h.reason}
															</div>
														)}
													</Timeline.Item>
												))}
												<Timeline.Item color="gray">
													<div className="text-xs text-gray-400">
														{new Date(
															currentDevice.created_at
														).toLocaleDateString()}
													</div>
													<div className="text-sm text-gray-500">设备入库</div>
												</Timeline.Item>
											</Timeline>
										) : (
											<Empty
												image={Empty.PRESENTED_IMAGE_SIMPLE}
												description="暂无变更记录"
											/>
										)}
									</div>
								</div>
							</Col>
						</Row>
					</div>
				)}
			</Modal>

			{/* 配置调整弹窗 */}
			<Modal
				title="调整设备配置"
				open={isConfigModalOpen}
				onCancel={() => setIsConfigModalOpen(false)}
				onOk={handleConfigSubmit}
				centered
				width={450}
				okText="确认"
				cancelText="取消"
			>
				<Form form={configForm} layout="vertical" className="mt-4">
					<Form.Item
						name="component_type_id"
						label="配件类型"
						rules={[{ required: true, message: '请选择配件类型' }]}
					>
						<Select
							placeholder="选择配件类型"
							options={compTypes.map(t => ({ label: t.name, value: t.id }))}
							onChange={fetchCompsByType}
						/>
					</Form.Item>
					<Form.Item name="old_component_id" label="替换旧件">
						<Select
							placeholder="选择要替换的配件（可选）"
							allowClear
							options={currentDevice?.components?.map(c => ({
								label: `${c.type_name}: ${c.component_model || c.component_name}`,
								value: c.component_id
							}))}
						/>
					</Form.Item>
					<Form.Item
						name="new_component_id"
						label="新配件"
						rules={[{ required: true, message: '请选择新配件' }]}
					>
						<Select
							placeholder="选择新配件"
							options={availableComps.map(c => ({
								label: `${c.name} (${c.model})`,
								value: c.id
							}))}
						/>
					</Form.Item>
					<Form.Item
						name="change_type"
						label="变更类型"
						initialValue="upgrade"
						rules={[{ required: true }]}
					>
						<Select
							options={[
								{ label: '升级', value: 'upgrade' },
								{ label: '更换/维修', value: 'downgrade' }
							]}
						/>
					</Form.Item>
					<Form.Item
						name="reason"
						label="变更原因"
						rules={[{ required: true, message: '请填写变更原因' }]}
					>
						<Input.TextArea placeholder="请说明变更原因" rows={3} />
					</Form.Item>
				</Form>
			</Modal>

			{/* 分配设备弹窗 */}
			<Modal
				title="分配设备"
				open={isAssignModalOpen}
				onCancel={() => setIsAssignModalOpen(false)}
				onOk={handleAssignSubmit}
				centered
				width={420}
				okText="确认分配"
				cancelText="取消"
			>
				<Form form={form} layout="vertical" className="mt-4">
					<Form.Item name="asset_id" hidden>
						<Input />
					</Form.Item>
					<div className="mb-4 p-3 bg-gray-100 rounded flex justify-between items-center">
						<span className="text-gray-500">设备编号</span>
						<span className="font-mono font-medium">
							{currentDevice?.asset_no}
						</span>
					</div>
					<Form.Item
						name="user_id"
						label="分配给"
						rules={[{ required: true, message: '请选择员工' }]}
					>
						<Select
							showSearch
							placeholder="选择员工"
							optionFilterProp="label"
							options={allEmployees.map(e => ({
								label: `${e.real_name} (${e.department_name})`,
								value: e.user_id
							}))}
						/>
					</Form.Item>
				</Form>
			</Modal>

			{/* 快速分配弹窗 */}
			<Modal
				title="分配新设备"
				open={isQuickModalOpen}
				onCancel={() => setIsQuickModalOpen(false)}
				onOk={handleAssignSubmit}
				centered
				width={420}
				okText="确认"
				cancelText="取消"
			>
				<Form form={form} layout="vertical" className="mt-4">
					<Form.Item
						name="model_id"
						label="设备型号"
						rules={[{ required: true, message: '请选择设备型号' }]}
					>
						<Select
							placeholder="选择型号"
							options={devices.map(d => ({ label: d.name, value: d.id }))}
						/>
					</Form.Item>
					<Form.Item
						name="user_id"
						label="分配给"
						rules={[{ required: true, message: '请选择员工' }]}
					>
						<Select
							showSearch
							placeholder="选择员工"
							optionFilterProp="label"
							options={allEmployees.map(e => ({
								label: `${e.real_name} (${e.department_name})`,
								value: e.user_id
							}))}
						/>
					</Form.Item>
					<div className="p-3 bg-blue-50 rounded text-sm text-gray-600">
						系统将自动创建设备实例并生成唯一编号
					</div>
				</Form>
			</Modal>
		</div>
	);
};

export default DeviceList;
