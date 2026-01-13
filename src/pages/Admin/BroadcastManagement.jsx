import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../utils/apiConfig';
import {
	Table,
	Button,
	Modal,
	Form,
	Input,
	Select,
	Tag,
	message,
	Space,
	DatePicker,
	Typography,
	Progress,
	Card,
	Tooltip,
	Empty
} from 'antd';
import {
	PlusOutlined,
	ReloadOutlined,
	EyeOutlined,
	SendOutlined,
	SoundOutlined,
	InfoCircleOutlined,
	WarningOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	NotificationOutlined,
	HistoryOutlined,
	GlobalOutlined,
	TeamOutlined,
	UserOutlined,
	SafetyCertificateOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { formatDate, getBeijingDate } from '../../utils/date';
import Breadcrumb from '../../components/Breadcrumb';
import './BroadcastManagement.css';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;

const BroadcastManagement = () => {
	const [broadcasts, setBroadcasts] = useState([]);
	const [loading, setLoading] = useState(false);
	const [modalVisible, setModalVisible] = useState(false);
	const [previewVisible, setPreviewVisible] = useState(false);
	const [previewData, setPreviewData] = useState(null);
	const [departments, setDepartments] = useState([]);
	const [employees, setEmployees] = useState([]);
	const [submitting, setSubmitting] = useState(false);
	const [form] = Form.useForm();

	const [quickFilter, setQuickFilter] = useState('');
	const [queryParams, setQueryParams] = useState({
		startDate: undefined,
		endDate: undefined
	});

	const token = localStorage.getItem('token');

	useEffect(() => {
		loadBroadcasts();
		loadDepartments();
		loadEmployees();
	}, [queryParams]);

	const loadBroadcasts = async () => {
		setLoading(true);
		try {
			const response = await axios.get(getApiUrl('/api/broadcasts/created'), {
				headers: { Authorization: `Bearer ${token}` },
				params: queryParams
			});
			if (response.data.success) setBroadcasts(response.data.data);
		} catch (error) {
			message.error('加载广播列表失败');
		} finally {
			setLoading(false);
		}
	};

	const loadDepartments = async () => {
		try {
			const response = await axios.get(getApiUrl('/api/departments'), {
				headers: { Authorization: `Bearer ${token}` }
			});
			if (Array.isArray(response.data)) setDepartments(response.data);
		} catch (e) { }
	};

	const loadEmployees = async () => {
		try {
			const response = await axios.get(getApiUrl('/api/employees'), {
				headers: { Authorization: `Bearer ${token}` }
			});
			if (Array.isArray(response.data)) setEmployees(response.data);
		} catch (e) { }
	};

	const handleQuickFilter = type => {
		setQuickFilter(type);
		if (!type) {
			setQueryParams({ startDate: undefined, endDate: undefined });
			return;
		}
		const getFormattedDate = date => formatDate(date, false);
		let startStr, endStr;
		const d = getBeijingDate();
		const dateStr = getFormattedDate(d);

		if (type === 'today') {
			startStr = `${dateStr} 00:00:00`;
			endStr = `${dateStr} 23:59:59`;
		} else if (type === 'yesterday') {
			d.setDate(d.getDate() - 1);
			const yDateStr = getFormattedDate(d);
			startStr = `${yDateStr} 00:00:00`;
			endStr = `${yDateStr} 23:59:59`;
		} else if (type === 'last7days') {
			const start = getBeijingDate();
			start.setDate(start.getDate() - 6);
			startStr = `${getFormattedDate(start)} 00:00:00`;
			endStr = `${dateStr} 23:59:59`;
		}
		setQueryParams({ startDate: startStr, endDate: endStr });
	};

	const handleOpenPreview = async () => {
		try {
			const values = await form.validateFields();
			setPreviewData(values);
			setPreviewVisible(true);
		} catch (e) { }
	};

	const handleFinalSubmit = async () => {
		setSubmitting(true);
		try {
			const payload = {
				...previewData,
				targetDepartments:
					previewData.targetType === 'department'
						? JSON.stringify(previewData.targetDepartments)
						: null,
				targetRoles:
					previewData.targetType === 'role'
						? JSON.stringify(previewData.targetRoles)
						: null,
				targetUsers:
					previewData.targetType === 'individual'
						? JSON.stringify(previewData.targetUsers)
						: null
			};
			const response = await axios.post(getApiUrl('/api/broadcasts'), payload, {
				headers: { Authorization: `Bearer ${token}` }
			});
			if (response.data.success) {
				message.success('广播发布成功');
				setPreviewVisible(false);
				setModalVisible(false);
				form.resetFields();
				loadBroadcasts();
			}
		} catch (error) {
			message.error('发布失败');
		} finally {
			setSubmitting(false);
		}
	};

	const typeConfig = {
		info: {
			label: '信息',
			color: '#1677ff',
			bg: 'bg-blue-50',
			icon: <InfoCircleOutlined />,
			tagColor: 'blue'
		},
		warning: {
			label: '警告',
			color: '#fa8c16',
			bg: 'bg-orange-50',
			icon: <WarningOutlined />,
			tagColor: 'orange'
		},
		success: {
			label: '成功',
			color: '#52c41a',
			bg: 'bg-green-50',
			icon: <CheckCircleOutlined />,
			tagColor: 'green'
		},
		error: {
			label: '错误',
			color: '#f5222d',
			bg: 'bg-red-50',
			icon: <CloseCircleOutlined />,
			tagColor: 'red'
		},
		announcement: {
			label: '公告',
			color: '#722ed1',
			bg: 'bg-purple-50',
			icon: <NotificationOutlined />,
			tagColor: 'purple'
		}
	};

	const priorityConfig = {
		low: { label: '低', color: 'default' },
		normal: { label: '普通', color: 'blue' },
		high: { label: '高', color: 'orange' },
		urgent: { label: '紧急', color: 'red' }
	};

	const columns = [
		{
			title: '广播主题',
			dataIndex: 'title',
			render: (text, record) => {
				const config = typeConfig[record.type] || typeConfig.info;
				return (
					<div className="flex items-center gap-3">
						<div
							className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${config.bg} `}
							style={{ color: config.color }}
						>
							{config.icon}
						</div>
						<div>
							<div className="font-semibold text-gray-800 leading-tight">
								{text}
							</div>
							<div className="text-xs text-gray-400 mt-0.5">ID: {record.id}</div>
						</div>
					</div>
				);
			}
		},
		{
			title: '类型',
			dataIndex: 'type',
			width: 100,
			render: t => {
				const config = typeConfig[t] || typeConfig.info;
				return (
					<Tag
						color={config.tagColor}
						className="px-2 py-0 border-0 rounded-sm font-medium"
					>
						{config.label}
					</Tag>
				);
			}
		},
		{
			title: '优先级',
			dataIndex: 'priority',
			width: 100,
			render: p => {
				const config = priorityConfig[p] || priorityConfig.normal;
				return (
					<Tag color={config.color} className="border-0 bg-gray-100 text-gray-600">
						{config.label}
					</Tag>
				);
			}
		},
		{
			title: '送达情况',
			key: 'stats',
			width: 180,
			render: (_, r) => {
				const percent = Math.round(
					(r.read_count / (r.recipient_count || 1)) * 100
				);
				return (
					<div className="pr-4">
						<div className="flex justify-between text-xs text-gray-500 mb-1.5">
							<span className="font-medium">已读率</span>
							<span>
								{r.read_count} / {r.recipient_count}
							</span>
						</div>
						<Progress
							percent={percent}
							size="small"
							strokeColor={
								percent > 80 ? '#52c41a' : percent > 40 ? '#1677ff' : '#fa8c16'
							}
							trailColor="#f0f0f0"
							className="m-0"
						/>
					</div>
				);
			}
		},
		{
			title: '发布时间',
			dataIndex: 'created_at',
			width: 180,
			render: t => (
				<div className="flex flex-col text-xs">
					<span className="text-gray-700 font-medium">
						{dayjs(t).format('YYYY-MM-DD')}
					</span>
					<span className="text-gray-400">{dayjs(t).format('HH:mm:ss')}</span>
				</div>
			)
		}
	];

	const filterButtons = [
		{ id: '', label: '全部' },
		{ id: 'today', label: '今天' },
		{ id: 'yesterday', label: '昨天' },
		{ id: 'last7days', label: '近7天' }
	];

	return (
		<div className="min-h-screen bg-[#f8fafc] p-8">
			<Breadcrumb items={['首页', '办公协作', '广播管理']} className="mb-6" />

			<div className="max-w-7xl mx-auto space-y-6">
				{/* 顶部统计卡片 */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
					<Card className="shadow-none border border-gray-100 rounded-xl">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 text-xl">
								<HistoryOutlined />
							</div>
							<div>
								<div className="text-gray-400 text-sm">发布总计</div>
								<div className="text-2xl font-bold text-gray-800">
									{broadcasts.length}
								</div>
							</div>
						</div>
					</Card>
					<Card className="shadow-none border border-gray-100 rounded-xl">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-500 text-xl">
								<CheckCircleOutlined />
							</div>
							<div>
								<div className="text-gray-400 text-sm">今日发布</div>
								<div className="text-2xl font-bold text-gray-800">
									{
										broadcasts.filter(b =>
											dayjs(b.created_at).isSame(dayjs(), 'day')
										).length
									}
								</div>
							</div>
						</div>
					</Card>
				</div>

				<div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
					{/* 页头 */}
					<div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-white">
						<div>
							<h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
								广播管理
								<span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-full font-normal">
									ADMIN
								</span>
							</h1>
							<p className="text-gray-500 mt-1 text-sm font-medium">
								发布全员或定向消息通知，支持实时推送到所有客户端
							</p>
						</div>
						<Button
							type="primary"
							icon={<PlusOutlined />}
							size="large"
							className="h-12 px-8 rounded-xl shadow-lg shadow-blue-100 border-0 flex items-center"
							onClick={() => setModalVisible(true)}
						>
							发布新广播
						</Button>
					</div>

					{/* 筛选区 */}
					<div className="px-8 py-4 bg-[#fcfcfc] border-b border-gray-50 flex items-center justify-between">
						<div className="flex items-center gap-4 overflow-x-auto pb-1 no-scrollbar">
							<Space.Compact className="shadow-sm rounded-lg bg-white overflow-hidden p-0.5">
								{filterButtons.map(item => (
									<Button
										key={item.id}
										type={quickFilter === item.id ? 'primary' : 'text'}
										onClick={() => handleQuickFilter(item.id)}
										className={`px-4 ${quickFilter === item.id
												? 'shadow-sm'
												: 'text-gray-500 hover:text-gray-800'
											}`}
									>
										{item.label}
									</Button>
								))}
							</Space.Compact>

							<RangePicker
								className="rounded-lg border-gray-200"
								onChange={dates => {
									setQuickFilter('');
									if (dates) {
										setQueryParams({
											startDate: dates[0].format('YYYY-MM-DD 00:00:00'),
											endDate: dates[1].format('YYYY-MM-DD 23:59:59')
										});
									} else {
										setQueryParams({
											startDate: undefined,
											endDate: undefined
										});
									}
								}}
							/>
						</div>

						<div className="flex items-center gap-2">
							<Tooltip title="刷新列表">
								<Button
									className="rounded-lg hover:bg-white shadow-sm border-gray-200"
									icon={<ReloadOutlined spin={loading} />}
									onClick={loadBroadcasts}
								/>
							</Tooltip>
						</div>
					</div>

					{/* 表格 */}
					<div className="p-0">
						<Table
							columns={columns}
							dataSource={broadcasts}
							rowKey="id"
							loading={loading}
							className="custom-broadcast-table"
							pagination={{
								pageSize: 8,
								showTotal: t => (
									<span className="text-gray-400 mr-4">共 {t} 条记录</span>
								),
								showSizeChanger: false,
								position: ['bottomCenter']
							}}
							locale={{
								emptyText: (
									<Empty
										image={Empty.PRESENTED_IMAGE_SIMPLE}
										description="暂无广播记录"
									/>
								)
							}}
						/>
					</div>
				</div>
			</div>

			{/* 发布弹窗 */}
			<Modal
				title={
					<div className="flex items-center gap-3 py-1">
						<div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center">
							<SoundOutlined />
						</div>
						<span className="text-lg font-bold">创建广播通知</span>
					</div>
				}
				open={modalVisible}
				onCancel={() => setModalVisible(false)}
				footer={null}
				width={680}
				destroyOnClose
				centered
				bodyStyle={{ padding: '24px 32px' }}
				className="broadcast-modal"
			>
				<Form
					form={form}
					layout="vertical"
					initialValues={{
						type: 'info',
						priority: 'normal',
						targetType: 'all'
					}}
				>
					<Form.Item
						name="title"
						label={<span className="font-semibold text-gray-700">广播主题</span>}
						rules={[{ required: true, message: '请输入广播主题' }]}
					>
						<Input
							placeholder="例如：系统维护通知、春节放假安排..."
							className="rounded-lg h-10"
						/>
					</Form.Item>

					<Form.Item
						name="content"
						label={<span className="font-semibold text-gray-700">广播内容</span>}
						rules={[{ required: true, message: '请输入广播内容' }]}
					>
						<TextArea
							placeholder="请输入详细的广播内容..."
							rows={4}
							className="rounded-lg"
						/>
					</Form.Item>

					<div className="grid grid-cols-2 gap-6">
						<Form.Item
							name="type"
							label={<span className="font-semibold text-gray-700">消息类型</span>}
						>
							<Select className="h-10 rounded-lg">
								{Object.keys(typeConfig).map(k => (
									<Option key={k} value={k}>
										<div className="flex items-center gap-2">
											<span style={{ color: typeConfig[k].color }}>
												{typeConfig[k].icon}
											</span>
											{typeConfig[k].label}
										</div>
									</Option>
								))}
							</Select>
						</Form.Item>
						<Form.Item
							name="priority"
							label={<span className="font-semibold text-gray-700">优先级</span>}
						>
							<Select className="h-10 rounded-lg">
								{Object.keys(priorityConfig).map(k => (
									<Option key={k} value={k}>
										<Tag color={priorityConfig[k].color} className="m-0 border-0">
											{priorityConfig[k].label}
										</Tag>
									</Option>
								))}
							</Select>
						</Form.Item>
					</div>

					<div className="p-5 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-4">
						<Form.Item
							name="targetType"
							label={
								<span className="font-semibold text-gray-700 flex items-center gap-2">
									<TeamOutlined /> 发送范围
								</span>
							}
							className="m-0"
						>
							<Select
								className="h-10"
								onChange={() =>
									form.setFieldsValue({
										targetDepartments: [],
										targetRoles: [],
										targetUsers: []
									})
								}
							>
								<Option value="all">
									<div className="flex items-center gap-2">
										<GlobalOutlined className="text-blue-500" /> 全体员工
									</div>
								</Option>
								<Option value="department">
									<div className="flex items-center gap-2">
										<TeamOutlined className="text-orange-500" /> 指定部门
									</div>
								</Option>
								<Option value="role">
									<div className="flex items-center gap-2">
										<SafetyCertificateOutlined className="text-purple-500" />{' '}
										指定角色
									</div>
								</Option>
								<Option value="individual">
									<div className="flex items-center gap-2">
										<UserOutlined className="text-green-500" /> 指定个人
									</div>
								</Option>
							</Select>
						</Form.Item>

						<Form.Item
							noStyle
							shouldUpdate={(p, c) => p.targetType !== c.targetType}
						>
							{({ getFieldValue }) => {
								const t = getFieldValue('targetType');
								if (t === 'department') {
									return (
										<Form.Item
											name="targetDepartments"
											rules={[{ required: true, message: '请选择部门' }]}
											className="m-0 animate-slide-up"
										>
											<Select
												mode="multiple"
												placeholder="搜索并选择部门..."
												className="rounded-lg"
												options={departments.map(d => ({
													label: d.name,
													value: d.id
												}))}
											/>
										</Form.Item>
									);
								}
								if (t === 'role') {
									return (
										<Form.Item
											name="targetRoles"
											rules={[{ required: true, message: '请选择角色' }]}
											className="m-0 animate-slide-up"
										>
											<Select
												mode="multiple"
												placeholder="选择角色..."
												className="rounded-lg"
												options={['超级管理员', '部门管理员', '普通员工'].map(
													r => ({ label: r, value: r })
												)}
											/>
										</Form.Item>
									);
								}
								if (t === 'individual') {
									return (
										<Form.Item
											name="targetUsers"
											rules={[{ required: true, message: '请选择员工' }]}
											className="m-0 animate-slide-up"
										>
											<Select
												mode="multiple"
												placeholder="搜索并选择员工姓名/账号..."
												className="rounded-lg"
												showSearch
												optionFilterProp="label"
												options={employees.map(e => ({
													label: `${e.real_name} (${e.username})`,
													value: e.user_id
												}))}
											/>
										</Form.Item>
									);
								}
								return null;
							}}
						</Form.Item>
					</div>

					<div className="flex justify-end gap-3 pt-8 mt-4 border-t border-gray-50">
						<Button
							className="rounded-lg h-11 px-6 border-gray-200"
							onClick={() => setModalVisible(false)}
						>
							取消
						</Button>
						<Button
							icon={<EyeOutlined />}
							className="rounded-lg h-11 px-6 border-gray-200"
							onClick={handleOpenPreview}
						>
							效果预览
						</Button>
						<Button
							type="primary"
							className="rounded-lg h-11 px-8 shadow-md shadow-blue-50 border-0"
							onClick={handleOpenPreview}
						>
							立即发布
						</Button>
					</div>
				</Form>
			</Modal>

			{/* 预览确认弹窗 */}
			<Modal
				title={null}
				open={previewVisible}
				onCancel={() => setPreviewVisible(false)}
				footer={null}
				centered
				width={480}
				zIndex={2000}
				bodyStyle={{ padding: 0 }}
				className="notification-preview-modal overflow-hidden rounded-2xl"
			>
				<div className="p-8">
					<div className="text-center mb-8">
						<div className="text-gray-900 text-lg font-bold mb-1">预览广播效果</div>
						<div className="text-gray-400 text-sm">确认以下内容推送到客户端：</div>
					</div>

					{/* 模拟系统通知 */}
					<div className="notification-preview-glass p-6 rounded-2xl border border-gray-100 flex gap-4 animate-slide-up mb-8 relative">
						<div
							className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl ${typeConfig[previewData?.type]?.bg || 'bg-blue-50'
								}`}
							style={{ color: typeConfig[previewData?.type]?.color }}
						>
							{typeConfig[previewData?.type]?.icon}
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-center justify-between mb-1">
								<span className="font-bold text-gray-800 truncate pr-2">
									{previewData?.title || '未填写主题'}
								</span>
								<span className="text-[10px] uppercase font-bold text-gray-300">
									Now
								</span>
							</div>
							<p className="text-gray-600 text-sm leading-relaxed m-0 break-words">
								{previewData?.content || '未填写内容'}
							</p>
						</div>

						{/* 模拟按钮 */}
						<div className="absolute -bottom-3 right-6 px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-bold text-blue-500 shadow-sm">
							查看详情
						</div>
					</div>

					<div className="space-y-3">
						<div className="flex items-center justify-between px-2 text-xs text-gray-500">
							<div className="flex items-center gap-1.5">
								<TeamOutlined /> 目标范围：
								<span className="text-gray-800 font-medium">
									{previewData?.targetType === 'all'
										? '全体员工'
										: previewData?.targetType === 'department'
											? `指定部门(${previewData.targetDepartments?.length})`
											: previewData?.targetType === 'role'
												? `指定角色(${previewData.targetRoles?.length})`
												: `指定个人(${previewData?.targetUsers?.length})`}
								</span>
							</div>
							<div className="flex items-center gap-1.5">
								<span>优先级：</span>
								<span
									className={`font-bold ${previewData?.priority === 'urgent'
											? 'text-red-500'
											: 'text-gray-800'
										}`}
								>
									{priorityConfig[previewData?.priority]?.label}
								</span>
							</div>
						</div>

						<div className="flex gap-4 pt-4">
							<Button
								block
								size="large"
								className="rounded-xl h-12 border-gray-200 text-gray-600"
								onClick={() => setPreviewVisible(false)}
							>
								返回修改
							</Button>
							<Button
								block
								type="primary"
								size="large"
								className="rounded-xl h-12 shadow-lg shadow-blue-100 border-0 transition-transform active:scale-95"
								loading={submitting}
								onClick={handleFinalSubmit}
							>
								确认并发布
							</Button>
						</div>
					</div>
				</div>
			</Modal>
		</div>
	);
};

export default BroadcastManagement;
