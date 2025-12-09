import React, { useState, useEffect, lazy, Suspense } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import { showNotificationToast } from './utils/notificationUtils';
import 'react-toastify/dist/ReactToastify.css'
import './styles/toast.css'
import { useTokenVerification } from './hooks/useTokenVerification'
import { getApiUrl } from './utils/apiConfig'
import { tokenManager, apiPost } from './utils/apiClient'
import { clearPermissions } from './utils/permission'
import { Spin } from 'antd'; // Import Spin for fallback
import ErrorBoundary from './components/ErrorBoundary'
import NotFound from './pages/NotFound'
import { wsManager } from './services/websocket'
import { soundManager } from './utils/soundManager'
import { PermissionProvider, usePermission } from './contexts/PermissionContext'

// Lazy-loaded components
const Login = lazy(() => import('./pages/Login'));
const Sidebar = lazy(() => import('./components/Sidebar'));
const CustomerList = lazy(() => import('./components/CustomerList'));
const SessionManagement = lazy(() => import('./components/SessionManagement'));
const QualityInspection = lazy(() => import('./components/QualityInspection'));
const DepartmentManagement = lazy(() => import('./components/DepartmentManagement'));
const PositionManagement = lazy(() => import('./components/PositionManagement'));
const EmployeeManagement = lazy(() => import('./components/EmployeeManagement'));
const EmployeeChanges = lazy(() => import('./components/EmployeeChanges'));
const EmployeeApproval = lazy(() => import('./components/EmployeeApproval'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const RoleManagement = lazy(() => import('./pages/System/RoleManagement'));
const UserRoleManagement = lazy(() => import('./pages/System/UserRoleManagement'));
const KnowledgeManagement = lazy(() => import('./components/KnowledgeManagement'));
const KnowledgeBase = lazy(() => import('./components/KnowledgeBase'));
const KnowledgeFolderView = lazy(() => import('./components/KnowledgeFolderView'));
const MyKnowledgeBase = lazy(() => import('./components/MyKnowledgeBase'));
const Win11KnowledgeBase = lazy(() => import('./components/Win11KnowledgeBase'));
const Win11MyKnowledgeBase = lazy(() => import('./components/Win11MyKnowledgeBase'));
const Win11KnowledgeFolderView = lazy(() => import('./components/Win11KnowledgeFolderView'));
const AssessmentManagement = lazy(() => import('./components/AssessmentManagement'));
const ExamManagement = lazy(() => import('./components/ExamManagement'));
const AssessmentPlanManagement = lazy(() => import('./components/AssessmentPlanManagement'));
const CategoryManagement = lazy(() => import('./components/CategoryManagement'));
const ExamResultsManagement = lazy(() => import('./components/ExamResultsManagement'));
const MyExamList = lazy(() => import('./components/MyExamList'));
const ExamTaking = lazy(() => import('./components/ExamTaking'));
const ExamResult = lazy(() => import('./components/ExamResult'));
const MyExams = lazy(() => import('./components/MyExams'));
const MyExamResults = lazy(() => import('./components/MyExamResults'));
const PersonalInfo = lazy(() => import('./components/PersonalInfo'));
const MySchedule = lazy(() => import('./pages/Personal/MySchedule'));
const MyNotifications = lazy(() => import('./pages/Personal/MyNotifications'));
const MyMemos = lazy(() => import('./pages/Personal/MyMemos'));
const EmployeeMemos = lazy(() => import('./pages/Employee/EmployeeMemos'));
const UnreadMemoPopup = lazy(() => import('./components/UnreadMemoPopup'));

const CaseLibraryPage = lazy(() => import('./pages/CaseLibraryPage'));
const CaseCategoryManagementPage = lazy(() => import('./pages/CaseCategoryManagementPage'));
const QualityRuleManagementPage = lazy(() => import('./pages/QualityRuleManagementPage'));
const QualityStatisticsPage = lazy(() => import('./pages/QualityStatisticsPage'));
const QualityReportPage = lazy(() => import('./pages/QualityReportPage'));
const CaseRecommendationPage = lazy(() => import('./pages/CaseRecommendationPage'));
const NotificationCenter = lazy(() => import('./components/NotificationCenter'));
const NotificationSender = lazy(() => import('./components/NotificationSender'));
const NotificationSettings = lazy(() => import('./components/NotificationSettings'));
const BroadcastManagement = lazy(() => import('./pages/Admin/BroadcastManagement'));


const LeaveRecords = lazy(() => import('./pages/Attendance').then(module => ({ default: module.LeaveRecords })));
const OvertimeApply = lazy(() => import('./pages/Attendance').then(module => ({ default: module.OvertimeApply })));
const OvertimeRecords = lazy(() => import('./pages/Attendance').then(module => ({ default: module.OvertimeRecords })));
const MakeupApply = lazy(() => import('./pages/Attendance').then(module => ({ default: module.MakeupApply })));
const AttendanceStats = lazy(() => import('./pages/Attendance').then(module => ({ default: module.AttendanceStats })));
const DepartmentStats = lazy(() => import('./pages/Attendance').then(module => ({ default: module.DepartmentStats })));

const ShiftManagement = lazy(() => import('./pages/Attendance').then(module => ({ default: module.ShiftManagement })));
const ScheduleManagement = lazy(() => import('./pages/Attendance').then(module => ({ default: module.ScheduleManagement })));
const Notifications = lazy(() => import('./pages/Attendance').then(module => ({ default: module.Notifications })));
const SmartSchedule = lazy(() => import('./pages/Attendance').then(module => ({ default: module.SmartSchedule })));
const ApprovalManagement = lazy(() => import('./pages/Attendance').then(module => ({ default: module.ApprovalManagement })));
const AttendanceSettings = lazy(() => import('./pages/Attendance').then(module => ({ default: module.AttendanceSettings })));
const CompensatoryApply = lazy(() => import('./components/CompensatoryApply'));
const VacationDetails = lazy(() => import('./components/VacationDetails'));
const VacationDetailsNew = lazy(() => import('./components/VacationDetailsNew'));
const VacationSummary = lazy(() => import('./components/VacationSummary'));
const CompensatoryApproval = lazy(() => import('./components/CompensatoryApproval'));
const VacationQuotaSettings = lazy(() => import('./components/VacationQuotaSettings'));
const VacationManagement = lazy(() => import('./components/VacationManagement'));
const QuotaConfigLayout = lazy(() => import('./components/QuotaConfigLayout'));
const VacationPermissions = lazy(() => import('./components/VacationPermissions'));
const AttendanceHome = lazy(() => import('./pages/Attendance').then(module => ({ default: module.AttendanceHome })));
const AttendanceRecords = lazy(() => import('./pages/Attendance').then(module => ({ default: module.AttendanceRecords })));
const LeaveApply = lazy(() => import('./pages/Attendance').then(module => ({ default: module.LeaveApply })));
const PlatformShopManagement = lazy(() => import('./components/PlatformShopManagement'));
const QualityTagManagement = lazy(() => import('./components/QualityTagManagement'));
const WeChatPage = lazy(() => import('./pages/Messaging').then(module => ({ default: module.WeChatPage })));
const CreateGroupPage = lazy(() => import('./pages/Messaging').then(module => ({ default: module.CreateGroupPage })));
const BroadcastList = lazy(() => import('./pages/Messaging').then(module => ({ default: module.BroadcastList })));
import DatabaseCheck from './components/DatabaseCheck';
import TopNavbar from './components/TopNavbar';

function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState({ name: 'user-employee', params: {} })
  const [showMemoPopup, setShowMemoPopup] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0) // 未读通知数

  useEffect(() => {

    console.log('Current Active Tab:', activeTab);
  }, []);

  useEffect(() => {

  }, [activeTab]);

  useEffect(() => {
    // 检查本地存储的登录状态
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (token && savedUser) {
      setIsLoggedIn(true)
      setUser(JSON.parse(savedUser))
      // 登录后检查未读备忘录
      checkUnreadMemos()
      // 获取未读通知数
      checkUnreadNotifications()
      // 连接WebSocket
      connectWebSocket()
    }

    // 清理函数 - 不再断开WebSocket连接
    // return () => {
    //   wsManager.disconnect()
    // }
  }, [])

  // 连接WebSocket
  const connectWebSocket = () => {
    console.log('🔌 正在连接WebSocket...')
    // 使用setTimeout确保WebSocket连接不会阻塞主流程
    setTimeout(() => {
      wsManager.connect()
    }, 0)

    // 初始化声音管理器（需要用户交互后才能初始化AudioContext）
    soundManager.init()

    // 监听新通知
    const handleNotification = (notification) => {
      console.log('📨 收到新通知:', notification)

      // 🔔 播放提示音
      soundManager.playNotification()

      // 显示Toast提示
      toast.info(
        <div className="notification-toast-content">
          <div className="notification-toast-icon">📨</div>
          <div className="notification-toast-text">
            <div className="notification-toast-title">{notification.title}</div>
            <p className="notification-toast-message">{notification.content}</p>
          </div>
        </div>,
        {
          position: 'bottom-right',
          autoClose: 10000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          containerId: 'notification-toast',
          onClick: () => {
            console.log('🔔 点击通知:', notification);
            // 根据通知类型跳转到相应页面
            if (['leave', 'overtime', 'makeup'].includes(notification.related_type) ||
                ['leave_approval', 'leave_rejection', 'overtime_approval', 'overtime_rejection', 'makeup_approval', 'makeup_rejection'].includes(notification.type)) {
              handleSetActiveTab('attendance-approval');
            } else if (notification.type === 'system_broadcast') {
              handleSetActiveTab('messaging-broadcast');
            } else if (notification.type === 'schedule_update' || notification.related_type === 'schedule') {
              handleSetActiveTab('my-schedule');
            } else if (notification.type === 'role_assignment' || notification.related_type === 'user_role') {
              handleSetActiveTab('user-role-management');
            }
          },
          className: 'cursor-pointer'
        }
      )
      // 📊 更新未读数
      setUnreadCount(prev => prev + 1)
    }

    // 监听新备忘录
    const handleMemo = (memo) => {
      console.log('📝 收到新备忘录:', memo)

      // 🔔 播放成功提示音
      soundManager.playSuccess()

      toast.success(
        <div className="notification-toast-content">
          <div className="notification-toast-icon">📝</div>
          <div className="notification-toast-text">
            <div className="notification-toast-title">新备忘录</div>
            <p className="notification-toast-message">{memo.title}</p>
          </div>
        </div>,
        {
          position: 'bottom-right',
          autoClose: 10000,
          closeOnClick: false,
          containerId: 'notification-toast'
        }
      )
      // 刷新备忘录未读数
      checkUnreadMemos()
    }

    // 监听系统广播
    const handleBroadcast = (broadcast) => {
      console.log('📣 收到系统广播:', broadcast)

      // 🔔 根据类型播放不同声音
      if (broadcast.type === 'warning' || broadcast.type === 'error') {
        soundManager.playWarning()
      } else {
        soundManager.playNotification()
      }

      const typeConfig = {
        info: { icon: '📢', method: toast.info },
        warning: { icon: '⚠️', method: toast.warning },
        success: { icon: '✅', method: toast.success },
        error: { icon: '❌', method: toast.error },
        announcement: { icon: '📣', method: toast.info }
      }
      const config = typeConfig[broadcast.type] || typeConfig.info
      config.method(
        <div className="notification-toast-content">
          <div className="notification-toast-icon">{config.icon}</div>
          <div className="notification-toast-text">
            <div className="notification-toast-title">{broadcast.title}</div>
            <p className="notification-toast-message">{broadcast.content}</p>
          </div>
        </div>,
        {
          position: 'bottom-right',
          autoClose: 10000,
          hideProgressBar: false,
          closeOnClick: false,
          className: 'broadcast-toast',
          onClick: () => handleSetActiveTab('messaging-broadcast'),
          containerId: 'notification-toast'
        }
      )
    }

    // 清除旧的监听器，防止重复注册
    wsManager.removeAllListeners('notification')
    wsManager.removeAllListeners('memo')
    wsManager.removeAllListeners('broadcast')
    wsManager.removeAllListeners('unread_count')

    // 注册事件监听器
    wsManager.on('notification', handleNotification)
    wsManager.on('memo', handleMemo)
    wsManager.on('broadcast', handleBroadcast)

    // 监听未读数更新
    wsManager.on('unread_count', (data) => {
      console.log('📊 收到未读数更新:', data.count)
      setUnreadCount(data.count)
    })
  }

  // 检查未读备忘录
  const checkUnreadMemos = async () => {
    try {
      const response = await fetch(getApiUrl('/api/memos/unread-count'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      if (data.success && data.count > 0) {
        // 延迟1秒显示弹窗，避免与其他初始化冲突
        setTimeout(() => {
          setShowMemoPopup(true)
        }, 1000)
      }
    } catch (error) {
      console.error('检查未读备忘录失败:', error)
    }
  }

  // 检查未读通知数
  const checkUnreadNotifications = async () => {
    try {
      const response = await fetch(getApiUrl('/api/notifications/unread-count'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setUnreadCount(data.count || 0)
        console.log('📊 初始未读通知数:', data.count)
      }
    } catch (error) {
      console.error('获取未读通知数失败:', error)
    }
  }


  const handleLoginSuccess = (userData) => {
    setIsLoggedIn(true)
    setUser(userData)
    // 登录成功后清除旧的权限缓存
    clearPermissions()
    // 登录成功后连接WebSocket，但不阻塞主流程
    Promise.resolve().then(() => {
      connectWebSocket()
      checkUnreadMemos()
      checkUnreadNotifications()
    })
  }

  const handleLogout = React.useCallback(async () => {
    // 调用后端API清除session
    try {
      await apiPost('/api/auth/logout')
    } catch (error) {
      console.error('退出登录API调用失败:', error)
      // 即使API调用失败，也继续清除本地存储
    }

    // 清除本地存储 - 更彻底的清理
    tokenManager.clearTokens()
    localStorage.removeItem('user')
    localStorage.removeItem('userId')
    localStorage.removeItem('userInfo')
    // 清除所有可能的会话数据
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('attendance_') || key.startsWith('exam_') || key.startsWith('cache_'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))

    setIsLoggedIn(false)
    setUser(null)
    toast.info('已退出登录')
  }, [])

  // 使用token验证hook，实现单设备登录
  useTokenVerification(handleLogout, user?.id)

  const handleSetActiveTab = (tabName, params = {}) => {

    console.trace('Trace for handleSetActiveTab');
    setActiveTab({ name: tabName, params });
  };

  const renderContent = () => {
    switch (activeTab.name) {
      // 员工管理
      case 'user-employee':
        return <EmployeeManagement />
      case 'user-changes':
        return <EmployeeChanges />
      case 'user-approval':
        return <EmployeeApproval />
      case 'user-reset-password':
        return <ResetPassword />
      case 'user-permission':
        return <RoleManagement />
      case 'user-role-management':
        return <UserRoleManagement />
      // 组织架构
      case 'org-department':
        return <DepartmentManagement />
      case 'org-position':
        return <PositionManagement />

      // 信息系统
      case 'messaging-chat':
        return <WeChatPage />
      case 'messaging-create-group':
        return <CreateGroupPage />
      case 'messaging-broadcast':
        return <BroadcastList />

      // 考勤管理
      case 'attendance-home':
        return <AttendanceHome onNavigate={handleSetActiveTab} />
      case 'attendance-records':
        return <AttendanceRecords />
      case 'attendance-makeup':
        return <MakeupApply />
      case 'attendance-leave-apply':
        return <LeaveApply />
      case 'attendance-leave-records':
        return <LeaveRecords onNavigate={handleSetActiveTab} />
      case 'attendance-overtime-apply':
        return <OvertimeApply />
      case 'attendance-overtime-records':
        return <OvertimeRecords onNavigate={handleSetActiveTab} />
      case 'attendance-stats':
        return <AttendanceStats />
      case 'attendance-department':
        return <DepartmentStats />


      case 'attendance-shift':
        return <ShiftManagement />
      case 'attendance-schedule':
        return <ScheduleManagement />
      case 'attendance-smart-schedule':
        return <SmartSchedule />
      case 'attendance-approval':
        return <ApprovalManagement />
      case 'attendance-settings':
        return <AttendanceSettings />

      // 假期管理
      case 'compensatory-apply':
        return <CompensatoryApply />
      case 'vacation-details':
        return <VacationDetailsNew />
      case 'quota-config':
        return <QuotaConfigLayout />
      case 'vacation-summary':
        return <VacationSummary />
      case 'compensatory-approval':
        return <CompensatoryApproval />
      case 'vacation-permissions':
        return <VacationPermissions />


      // 质检管理
      case 'quality-rule':
        return <QualityRuleManagementPage />
      case 'quality-score':
        return <QualityInspection />
      case 'quality-tags':
        return <QualityTagManagement />
      case 'quality-platform-shop':
        return <PlatformShopManagement />
      case 'quality-report':
        return <QualityStatisticsPage />
      case 'quality-report-summary': // New case for QualityReportPage
        return <QualityReportPage />
      case 'quality-case-library': // New case for CaseLibraryPage
        return <CaseLibraryPage />
      case 'quality-case-categories': // New case for CaseCategoryManagementPage
        return <CaseCategoryManagementPage />
      case 'quality-recommendation': // New case for CaseRecommendationPage
        return <CaseRecommendationPage />

      // 知识库
      case 'knowledge-articles':
        return <Win11KnowledgeBase />
      case 'knowledge-articles-win11':
        return <Win11KnowledgeFolderView />
      case 'knowledge-base':
        return <Win11KnowledgeFolderView />
      case 'knowledge-base-win11':
        return <Win11KnowledgeBase />
      case 'my-knowledge':
        return <Win11MyKnowledgeBase />
      case 'my-knowledge-win11':
        return <Win11MyKnowledgeBase />

      // 考核系统
      case 'assessment-exams':
        return <ExamManagement />
      case 'assessment-plans':
        return <AssessmentPlanManagement />
      case 'assessment-categories':
        return <CategoryManagement />
      case 'exam-plans':
        // 统一使用 assessment-plans
        return <AssessmentPlanManagement />
      case 'my-exams':
        return <MyExams onNavigate={handleSetActiveTab} />
      case 'my-exam-results':
        return <MyExamResults onNavigate={handleSetActiveTab} />;
      case 'exam-results':
        return <ExamResultsManagement onNavigate={handleSetActiveTab} />;
      // 已移除拖拽组卷功能，创建试卷在试卷管理中进行
      case 'exam-taking':
        return <ExamTaking
          resultId={activeTab.params.resultId}
          sourceType={activeTab.params.sourceType}
          onExamEnd={(resultId) => handleSetActiveTab('exam-result', { resultId })}
        />;
      case 'exam-result':
        return <ExamResult
          resultId={activeTab.params.resultId}
          sourceType={activeTab.params.sourceType}
          onBackToMyExams={() => handleSetActiveTab('my-exams')}
        />;
      case 'assessment-management':
        return <AssessmentManagement />;

      // 消息通知
      case 'notification-center':
        return <NotificationCenter />;
      case 'notification-sender':
        return <NotificationSender />;
      case 'notification-settings': // New case for NotificationSettings
        return <NotificationSettings />;

      // 个人中心
      case 'personal-info':
        return <PersonalInfo />;
      case 'my-schedule':
        return <MySchedule />;
      case 'my-notifications':
        return <MyNotifications />;
      case 'my-memos':
        return <MyMemos />;
      case 'employee-memos':
        return <EmployeeMemos />;

      // 系统管理
      case 'broadcast-management':
        return <BroadcastManagement />

      default:
        return <NotFound />
    }
  }

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />
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
            />
            <main className="flex-1 bg-gray-50 flex flex-col">
              <TopNavbar
                activeTab={activeTab.name}
                user={user}
                onLogout={handleLogout}
                unreadCount={unreadCount}
                onNavigate={handleSetActiveTab}
              />
              <div className="flex-1 overflow-auto">
                <Suspense fallback={<div className="flex justify-center items-center h-full"><Spin size="large" /></div>}>
                  {renderContent()}
                </Suspense>
              </div>
            </main>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
              limit={3}
            />
            <ToastContainer
              position="bottom-right"
              autoClose={10000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick={false}
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
              limit={3}
              containerId="notification-toast"
              enableMultiContainer
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
  )
}

export default App
