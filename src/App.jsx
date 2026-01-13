import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { showNotificationToast } from './utils/notificationUtils';
import './styles/sonner-toast.css';
import { useTokenVerification } from './hooks/useTokenVerification';
import { getApiUrl } from './utils/apiConfig';
import { tokenManager, apiPost } from './utils/apiClient';
import { clearPermissions } from './utils/permission';
import { Spin } from 'antd'; // Import Spin for fallback
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';
import { wsManager } from './services/websocket';
import { soundManager } from './utils/soundManager';
import useUserStore from './store/userStore';
import {
	usePermission,
	PermissionProvider
} from './contexts/PermissionContext';
import { routes } from './routes/config';

// Lazy-loaded components
const Login = lazy(() => import('./pages/Login'));
const Sidebar = lazy(() => import('./components/Sidebar'));

import DatabaseCheck from './components/DatabaseCheck';
import TopNavbar from './components/TopNavbar';

const originalToastSuccess = toast.success;
toast.success = (message, options) => {
	const next = { ...(options || {}) };
	if (!next.position) next.position = 'top-center';
	return originalToastSuccess(message, next);
};

function App() {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [user, setUser] = useState(null);
	const [activeTab, setActiveTab] = useState(() => {
		const saved = localStorage.getItem('activeTab');
		if (saved) {
			try {
				return JSON.parse(saved);
			} catch (e) {
				return { name: 'dashboard', params: {} };
			}
		}
		return { name: 'dashboard', params: {} };
	});
	const [showMemoPopup, setShowMemoPopup] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0); // 未读通知数

	// 用于去重通知，防止重复弹窗
	const shownNotificationsRef = useRef(new Set());

	const [contentZoom, setContentZoom] = useState(() => {
		const saved = localStorage.getItem('contentZoom');
		return saved ? parseInt(saved) : 90;
	});

	const handleZoomChange = value => {
		setContentZoom(value);
		localStorage.setItem('contentZoom', value);
	};

	useEffect(() => {
		console.log('Current Active Tab:', activeTab);
	}, []);

	useEffect(() => { }, [activeTab]);

	useEffect(() => {
		// 检查本地存储的登录状态
		const token = localStorage.getItem('token');
		const savedUser = localStorage.getItem('user');

		if (token && savedUser) {
			setIsLoggedIn(true);
			setUser(JSON.parse(savedUser));
			// 登录后检查未读备忘录
			checkUnreadMemos();
			// 获取未读通知数
			checkUnreadNotifications();
			// 连接WebSocket
			connectWebSocket();
			// 初始化全局用户映射表
			useUserStore.getState().fetchUsers();
		}

		// 清理函数 - 不再断开WebSocket连接
		// return () => {
		//   wsManager.disconnect()
		// }
	}, []);

	// 连接WebSocket
	const connectWebSocket = () => {
		console.log('🔌 正在连接WebSocket...');
		// 使用setTimeout确保WebSocket连接不会阻塞主流程
		setTimeout(() => {
			wsManager.connect();
		}, 0);

		// 初始化声音管理器（需要用户交互后才能初始化AudioContext）
		soundManager.init();

		// 监听新通知
		const handleNotification = notification => {
			console.log('📨 收到新通知:', notification);

			// 避免重复提醒：如果通知类型是 'memo' 或已由其他监听器处理，则忽略
			if (
				notification.type === 'memo' ||
				notification.type === 'new_memo'
			) {
				return;
			}

			// 去重检查：使用 id 或生成唯一标识
			const notificationKey =
				notification.id ||
				`${notification.type}_${notification.title}_${Date.now()}`;
			if (shownNotificationsRef.current.has(notificationKey)) {
				console.log('⏭️ 跳过重复通知:', notificationKey);
				return;
			}
			shownNotificationsRef.current.add(notificationKey);
			// 5秒后清除记录，允许相同通知再次显示
			setTimeout(
				() => shownNotificationsRef.current.delete(notificationKey),
				5000
			);

			// 🔔 播放提示音
			soundManager.playNotification();

			// 显示Toast提示
			toast.info(notification.title, {
				description: notification.content,
				duration: 5000,
				position: 'bottom-right',
				action: {
					label: '查看',
					onClick: () => {
						console.log('🔔 点击通知:', notification);
						// 根据通知类型跳转到相应页面
						if (
							['leave', 'overtime', 'makeup'].includes(
								notification.related_type
							) ||
							[
								'leave_approval',
								'leave_rejection',
								'overtime_approval',
								'overtime_rejection',
								'makeup_approval',
								'makeup_rejection'
							].includes(notification.type)
						) {
							handleSetActiveTab('attendance-approval');
						} else if (
							notification.related_type === 'compensatory_leave' ||
							[
								'compensatory_apply',
								'compensatory_approval',
								'compensatory_rejection'
							].includes(notification.type)
						) {
							// 跳转到调休申请审批页面
							handleSetActiveTab('compensatory-approval');
						} else if (notification.type === 'system_broadcast') {
							handleSetActiveTab('messaging-broadcast');
						} else if (
							notification.type === 'schedule_update' ||
							notification.related_type === 'schedule'
						) {
							handleSetActiveTab('my-schedule');
						} else if (
							notification.type === 'role_assignment' ||
							notification.related_type === 'user_role'
						) {
							handleSetActiveTab('user-role-management');
						} else if (
							notification.type === 'new_assessment_plan' ||
							notification.type === 'assessment_plan' ||
							notification.title?.includes('考核计划') ||
							notification.content?.includes('考核计划')
						) {
							handleSetActiveTab('my-exams');
						} else if (
							notification.type === 'payslip' ||
							notification.related_type === 'payslip' ||
							notification.title?.includes('工资条') ||
							notification.content?.includes('工资条')
						) {
							// 跳转到我的工资条页面
							handleSetActiveTab('my-payslips');
						} else if (
							notification.type?.startsWith('reimbursement') ||
							notification.related_type === 'reimbursement'
						) {
							// 跳转到报销审批页面
							handleSetActiveTab('reimbursement-approval');
						} else if (
							notification.type?.startsWith('asset') ||
							notification.related_type === 'asset_request'
						) {
							// 跳转到资产审批页面 (根据用户角色)
							const savedUser = localStorage.getItem('user');
							const role = savedUser ? JSON.parse(savedUser).role : '';
							if (role === '超级管理员' || role === 'admin') {
								handleSetActiveTab('asset-request-audit');
							} else {
								handleSetActiveTab('my-assets');
							}
						}
					}
				}
			});
			// 📊 更新未读数
			setUnreadCount(prev => prev + 1);
		};

		// 监听新备忘录
		const handleMemo = memo => {
			console.log('📝 收到新备忘录:', memo);

			// 去重检查
			const memoKey = `memo_${memo.id || memo.title}_${Date.now()}`;
			if (shownNotificationsRef.current.has(memoKey)) {
				return;
			}
			shownNotificationsRef.current.add(memoKey);
			setTimeout(() => shownNotificationsRef.current.delete(memoKey), 5000);

			// 🔔 播放成功提示音
			soundManager.playSuccess();

			toast.success('新备忘录', {
				description: memo.title,
				duration: 4000,
				position: 'bottom-right'
			});
			// 刷新备忘录未读数
			checkUnreadMemos();
		};

		// 监听系统广播
		const handleBroadcast = broadcast => {
			console.log('📣 收到系统广播:', broadcast);

			// 🔔 根据类型播放不同声音
			if (broadcast.type === 'warning' || broadcast.type === 'error') {
				soundManager.playWarning();
			} else {
				soundManager.playNotification();
			}

			// 去重检查
			const broadcastKey = `broadcast_${broadcast.id || broadcast.title}`;
			if (shownNotificationsRef.current.has(broadcastKey)) {
				return;
			}
			shownNotificationsRef.current.add(broadcastKey);
			setTimeout(
				() => shownNotificationsRef.current.delete(broadcastKey),
				5000
			);

			const typeConfig = {
				info: toast.info,
				warning: toast.warning,
				success: toast.success,
				error: toast.error,
				announcement: toast.info
			};
			const toastMethod = typeConfig[broadcast.type] || typeConfig.info;
			toastMethod(broadcast.title, {
				description: broadcast.content,
				duration: 4000,
				position: 'bottom-right',
				className: 'broadcast-toast',
				action: {
					label: '查看',
					onClick: () => handleSetActiveTab('messaging-broadcast')
				}
			});
		};

		// 监听下线指令
		const handleKickedOut = data => {
			console.log('🚨 账号被强制下线:', data.message);
			toast.error('登录失效', {
				description: data.message || '您的账号已被管理员强制下线',
				duration: null, // 永久显示直到用户点击
				action: {
					label: '确定',
					onClick: () => handleLogout()
				}
			});
			// 3秒后自动执行退出
			setTimeout(() => {
				handleLogout();
			}, 3000);
		};

		// 清除旧的监听器，防止重复注册
		wsManager.removeAllListeners('notification');
		wsManager.removeAllListeners('memo');
		wsManager.removeAllListeners('broadcast');
		wsManager.removeAllListeners('unread_count');
		wsManager.removeAllListeners('kicked_out');

		// 注册事件监听器
		wsManager.on('notification', handleNotification);
		wsManager.on('memo', handleMemo);
		wsManager.on('broadcast', handleBroadcast);
		wsManager.on('kicked_out', handleKickedOut);

		// --- 新增：即时通讯全局监听 ---
		wsManager.on('receive_message', msg => {
			const chatStore = useChatStore.getState();
			// 如果当前不是在跟这个群聊天，则增加未读数
			if (chatStore.activeGroupId !== msg.group_id) {
				const myName = user?.real_name || user?.username;
				const isMentioned = msg.content && myName && msg.content.includes(`@${myName}`);
				chatStore.incrementUnread(msg.group_id, msg, isMentioned);

				// 如果用户当前不在即时通讯页面，播放提示音
				if (activeTab.name !== 'messaging-chat') {
					soundManager.playNotification();
				}
			}
		});

		// 监听未读数更新
		wsManager.on('unread_count', data => {
			console.log('📊 收到未读数更新:', data.count);
			setUnreadCount(data.count);
		});
	};

	// 检查未读备忘录
	const checkUnreadMemos = async () => {
		try {
			const response = await fetch(getApiUrl('/api/memos/unread-count'), {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`
				}
			});
			const data = await response.json();
			if (data.success && data.count > 0) {
				// 延迟1秒显示弹窗，避免与其他初始化冲突
				setTimeout(() => {
					setShowMemoPopup(true);
				}, 1000);
			}
		} catch (error) {
			console.error('检查未读备忘录失败:', error);
		}
	};

	// 检查未读通知数
	const checkUnreadNotifications = async () => {
		try {
			const savedUser = localStorage.getItem('user');
			const userId = savedUser ? JSON.parse(savedUser).id : null;
			if (!userId) return;

			const response = await fetch(
				getApiUrl(`/api/notifications/unread-count?userId=${userId}`),
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`
					}
				}
			);
			const data = await response.json();
			if (data.success) {
				setUnreadCount(data.count || 0);
				console.log('📊 初始未读通知数:', data.count);
			}
		} catch (error) {
			console.error('获取未读通知数失败:', error);
		}
	};

	const handleLoginSuccess = userData => {
		setIsLoggedIn(true);
		setUser(userData);
		// 登录成功后清除旧的权限缓存
		clearPermissions();
		// 登录成功后连接WebSocket，但不阻塞主流程
		Promise.resolve().then(() => {
			connectWebSocket();
			checkUnreadMemos();
			checkUnreadNotifications();
		});
	};

	const handleLogout = React.useCallback(async () => {
		// 调用后端API清除session
		try {
			await apiPost('/api/auth/logout', {});
		} catch (error) {
			console.error('退出登录API调用失败:', error);
			// 即使API调用失败，也继续清除本地存储
		}

		// 清除本地存储 - 更彻底的清理
		tokenManager.clearTokens();
		useUserStore.getState().clearStore();
		localStorage.removeItem('user');
		localStorage.removeItem('userId');
		localStorage.removeItem('userInfo');
		localStorage.removeItem('activeTab'); // Clear persisted tab on logout
		// 清除所有可能的会话数据
		const keysToRemove = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (
				key &&
				(key.startsWith('attendance_') ||
					key.startsWith('exam_') ||
					key.startsWith('cache_'))
			) {
				keysToRemove.push(key);
			}
		}
		keysToRemove.forEach(key => localStorage.removeItem(key));

		setIsLoggedIn(false);
		setUser(null);
		toast.info('已退出登录');
	}, []);

	// 使用token验证hook，实现单设备登录
	useTokenVerification(handleLogout, user?.id);

	const handleSetActiveTab = (tabName, params = {}) => {
		console.trace('Trace for handleSetActiveTab');
		const newTab = { name: tabName, params };
		setActiveTab(newTab);
		localStorage.setItem('activeTab', JSON.stringify(newTab));
	};

	const renderContent = () => {
		const route = routes.find(r => r.id === activeTab.name);
		if (!route) return <NotFound />;

		const Component = route.component;

		// 处理特殊传参的组件
		const specialProps = {
			'dashboard': { onNavigate: handleSetActiveTab },
			'reimbursement-apply': { user, onSuccess: () => handleSetActiveTab('reimbursement-list') },
			'reimbursement-list': { user, onViewDetail: record => handleSetActiveTab('reimbursement-detail', { id: record.id, from: 'reimbursement-list' }) },
			'reimbursement-approval': { user, onViewDetail: record => handleSetActiveTab('reimbursement-detail', { id: record.id, from: 'reimbursement-approval' }) },
			'reimbursement-detail': { reimbursementId: activeTab.params?.id, onBack: () => handleSetActiveTab(activeTab.params?.from || 'reimbursement-list') },
			'my-todo': { onNavigate: handleSetActiveTab },
			'my-exams': { onNavigate: handleSetActiveTab },
			'my-exam-results': { onNavigate: handleSetActiveTab },
			'exam-results': { onNavigate: handleSetActiveTab },
			'exam-taking': { resultId: activeTab.params?.resultId, sourceType: activeTab.params?.sourceType, onExamEnd: resultId => handleSetActiveTab('exam-result', { resultId }) },
			'exam-result': { resultId: activeTab.params?.resultId, sourceType: activeTab.params?.sourceType, onBackToMyExams: () => handleSetActiveTab('my-exams') },
			'attendance-home': { onNavigate: handleSetActiveTab },
			'attendance-leave-records': { onNavigate: handleSetActiveTab },
			'attendance-overtime-records': { onNavigate: handleSetActiveTab },
		};

		return <Component {...(specialProps[route.id] || { onNavigate: handleSetActiveTab })} />;
	};

	// 加载主题
	const [appTheme, setAppTheme] = useState({
		background: '#F3F4F6'
	});

	useEffect(() => {
		const savedTheme = localStorage.getItem('personalInfoTheme');
		if (savedTheme) {
			try {
				setAppTheme(JSON.parse(savedTheme));
			} catch (e) {
				console.error('Theme parse error', e);
				setAppTheme({ background: '#F3F4F6' });
			}
		}
	}, []);

	// 监听localStorage变化，确保主题更新能及时反映到侧边栏
	useEffect(() => {
		const handleStorageChange = e => {
			if (e.key === 'personalInfoTheme') {
				try {
					const newTheme = JSON.parse(e.newValue);
					setAppTheme(newTheme);
				} catch (error) {
					console.error('Failed to parse theme from storage event', error);
					setAppTheme({ background: '#F3F4F6' });
				}
			}
		};

		// 监听自定义主题变化事件
		const handleThemeChange = e => {
			setAppTheme(e.detail);
		};

		window.addEventListener('storage', handleStorageChange);
		window.addEventListener('themeChange', handleThemeChange);

		return () => {
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener('themeChange', handleThemeChange);
		};
	}, []);

	if (!isLoggedIn) {
		return <Login onLoginSuccess={handleLoginSuccess} />;
	}

	return (
		<ErrorBoundary>
			<DatabaseCheck>
				<PermissionProvider>
					<div className="flex h-screen bg-gray-50">
						<Sidebar
							activeTab={activeTab.name}
							setActiveTab={handleSetActiveTab}
							user={user}
							onLogout={handleLogout}
							theme={appTheme} // 传递主题信息
						/>
						<main
							className="flex-1 flex flex-col"
							style={{ backgroundColor: appTheme.background }}
						>
							<TopNavbar
								activeTab={activeTab.name}
								user={user}
								onLogout={handleLogout}
								unreadCount={unreadCount}
								onUpdateUnread={setUnreadCount}
								onNavigate={handleSetActiveTab}
								zoomLevel={contentZoom}
								onZoomChange={handleZoomChange}
							/>
							<div
								className="flex-1 overflow-auto"
								style={{ zoom: contentZoom / 100 }}
							>
								<Suspense
									fallback={
										<div className="flex justify-center items-center h-full">
											<Spin size="large" />
										</div>
									}
								>
									{renderContent()}
								</Suspense>
							</div>
						</main>
						<Toaster
							position="bottom-right"
							expand={false}
							richColors
							closeButton
							duration={4000}
							visibleToasts={4}
							toastOptions={{
								className: 'sonner-toast-custom'
							}}
						/>

						{/* 未读备忘录弹窗 */}
						{showMemoPopup && (
							<Suspense fallback={null}>
								<UnreadMemoPopup onClose={() => setShowMemoPopup(false)} />
							</Suspense>
						)}
					</div>
				</PermissionProvider>
			</DatabaseCheck>
		</ErrorBoundary>
	);
}

export default App;
