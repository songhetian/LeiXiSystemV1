import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import axios from 'axios'
import { getApiUrl } from '../utils/apiConfig'
import { tokenManager } from '../utils/apiClient'
import { pinyin } from 'pinyin-pro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Check, X, AlertCircle } from 'lucide-react'

const Login = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    real_name: '',
    email: '',
    phone: '',
    department_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [sessionInfo, setSessionInfo] = useState(null)
  const [rememberPassword, setRememberPassword] = useState(false)
  const [usernameSuggestions, setUsernameSuggestions] = useState([])
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [departments, setDepartments] = useState([])

  // 组件加载时，从localStorage读取记住的密码
  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername')
    const savedPassword = localStorage.getItem('rememberedPassword')
    const isRemembered = localStorage.getItem('rememberPassword') === 'true'

    if (isRemembered && savedUsername && savedPassword) {
      // 简单的Base64解码（注意：这不是安全的加密，只是混淆）
      try {
        const decodedPassword = atob(savedPassword)
        setFormData(prev => ({
          ...prev,
          username: savedUsername,
          password: decodedPassword
        }))
        setRememberPassword(true)
      } catch (error) {
        console.error('解码密码失败:', error)
      }
    }
  }, [])

  // 获取部门列表
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(getApiUrl('/api/departments?forManagement=true'))
        setDepartments(response.data || [])
      } catch (error) {
        console.error('获取部门列表失败:', error)
      }
    }
    fetchDepartments()
  }, [])

  // 自动生成用户名（拼音）
  useEffect(() => {
    if (!isLogin && formData.real_name && formData.real_name.trim()) {
      const pinyinUsername = pinyin(formData.real_name, { toneType: 'none', type: 'array' }).join('').toLowerCase()
      setFormData(prev => ({ ...prev, username: pinyinUsername }))
      // 自动检查用户名
      checkUsername(pinyinUsername, formData.real_name)
    }
  }, [formData.real_name, isLogin])

  // 检查用户名是否可用
  const checkUsername = async (username, realName) => {
    if (!username || username.trim().length === 0) {
      setUsernameAvailable(null)
      setUsernameSuggestions([])
      return
    }

    setIsCheckingUsername(true)
    try {
      const response = await axios.post(getApiUrl('/api/auth/check-username'), {
        username: username.trim(),
        realName: realName || formData.real_name
      })

      if (response.data.available) {
        setUsernameAvailable(true)
        setUsernameSuggestions([])
      } else {
        setUsernameAvailable(false)
        setUsernameSuggestions(response.data.suggestions || [])
      }
    } catch (error) {
      console.error('检查用户名失败:', error)
      setUsernameAvailable(null)
      setUsernameSuggestions([])
    } finally {
      setIsCheckingUsername(false)
    }
  }

  // 验证表单
  const validateForm = () => {
    const errors = {}

    if (!isLogin) {
      // 注册验证
      if (!formData.real_name || formData.real_name.trim().length === 0) {
        errors.real_name = '请输入真实姓名'
      }
      if (!formData.username || formData.username.trim().length === 0) {
        errors.username = '请输入用户名'
      } else if (usernameAvailable === false) {
        errors.username = '用户名已存在，请选择建议或修改'
      }
      if (!formData.password || formData.password.length < 6) {
        errors.password = '密码长度至少6位'
      }
      if (!formData.department_id) {
        errors.department_id = '请选择部门'
      }
    } else {
      // 登录验证
      if (!formData.username) {
        errors.username = '请输入用户名'
      }
      if (!formData.password) {
        errors.password = '请输入密码'
      }
    }

    setFieldErrors(errors)

    // 如果有错误，显示第一个错误的toast
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0]
      toast.error(firstError)
      return false
    }

    return true
  }


  // 执行登录
  const performLogin = async (forceLogin = false) => {
    console.log('执行登录，forceLogin:', forceLogin);
    try {
      const response = await axios.post(getApiUrl('/api/auth/login'), {
        username: formData.username,
        password: formData.password,
        forceLogin
      }, {
        timeout: 10000 // 10秒超时
      })

      console.log('登录API响应:', response.data);

      if (response.data.success) {
        tokenManager.setToken(response.data.token, response.data.expiresIn || 3600)
        if (response.data.refresh_token) {
          tokenManager.setRefreshToken(response.data.refresh_token)
        }
        localStorage.setItem('user', JSON.stringify(response.data.user))

        // 处理记住密码
        if (rememberPassword) {
          // 简单的Base64编码（注意：这不是安全的加密，只是混淆）
          const encodedPassword = btoa(formData.password)
          localStorage.setItem('rememberedUsername', formData.username)
          localStorage.setItem('rememberedPassword', encodedPassword)
          localStorage.setItem('rememberPassword', 'true')
        } else {
          // 如果不记住密码，清除之前保存的
          localStorage.removeItem('rememberedUsername')
          localStorage.removeItem('rememberedPassword')
          localStorage.removeItem('rememberPassword')
        }

        toast.success('登录成功！')
        setShowConfirmModal(false)
        onLoginSuccess(response.data.user)
      }
    } catch (error) {
      console.error('登录API错误:', error);
      throw error
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('.handleSubmit开始执行');
    setLoading(true)
    setErrorMessage('') // 清除之前的错误

    // 表单验证
    if (!validateForm()) {
      console.log('表单验证失败');
      setLoading(false)
      return
    }

    console.log('开始登录流程，用户名:', formData.username);

    try {
      if (isLogin) {
        console.log('检查活跃会话');
        // 先检查是否有活跃会话
        console.log('发送检查会话请求到:', getApiUrl('/api/auth/check-session'));
        const checkResponse = await axios.post(getApiUrl('/api/auth/check-session'), {
          username: formData.username
        }, {
          timeout: 10000 // 10秒超时
        })

        console.log('检查会话响应:', checkResponse.data);

        if (checkResponse.data.hasActiveSession) {
          // 有活跃会话，显示确认对话框
          console.log('检测到活跃会话，显示确认对话框');
          setSessionInfo(checkResponse.data)
          setShowConfirmModal(true)
          setLoading(false)
          return
        }

        console.log('没有活跃会话，直接登录');
        // 没有活跃会话，直接登录
        await performLogin(false)
        // 确保在任何情况下都关闭loading状态
        if (loading) {
          setLoading(false)
        }
      } else {
        console.log('注册流程');
        // 注册
        const response = await axios.post(getApiUrl('/api/auth/register'), formData, {
          timeout: 10000 // 10秒超时
        })

        console.log('注册响应:', response.data);

        if (response.data.success) {
          setShowSuccessModal(true)
          setFormData({ username: '', password: '', real_name: '', email: '', phone: '', department_id: '' })
          setFieldErrors({})
        }
        // 确保在任何情况下都关闭loading状态
        if (loading) {
          setLoading(false)
        }
      }
    } catch (error) {
      console.error('登录/注册错误:', error)
      // 添加更详细的错误信息
      if (error.code === 'ECONNABORTED') {
        console.error('请求超时');
        toast.error('请求超时，请检查网络连接');
      } else if (error.message === 'Network Error') {
        console.error('网络错误');
        toast.error('网络错误，请检查服务器是否运行');
      } else if (error.response) {
        const status = error.response.status
        const message = error.response.data?.message

        let errorMsg = ''

        if (isLogin) {
          // 登录错误
          if (status === 401) {
            errorMsg = '用户名或密码错误，请检查后重试'
            toast.error('❌ ' + errorMsg, {
              autoClose: 5000,
              position: 'top-center'
            })
          } else if (status === 403) {
            errorMsg = '账号已被禁用，请联系管理员'
            toast.error('❌ ' + errorMsg, {
              autoClose: 5000
            })
          } else if (message) {
            errorMsg = message
            toast.error(`❌ ${message}`)
          } else {
            errorMsg = '登录失败，请稍后重试'
            toast.error('❌ ' + errorMsg)
          }
        } else {
          // 注册错误
          if (status === 400) {
            errorMsg = message || '注册信息有误，请检查'
            toast.error(`❌ ${errorMsg}`, {
              autoClose: 5000
            })
          } else if (message) {
            errorMsg = message
            toast.error(`❌ ${message}`)
          } else {
            errorMsg = '注册失败，请稍后重试'
            toast.error('❌ ' + errorMsg)
          }
        }

        setErrorMessage(errorMsg)
      } else if (error.request) {
        // 网络错误
        const errorMsg = '无法连接到服务器，请检查网络连接或确认后端服务器正在运行'
        setErrorMessage(errorMsg)
        toast.error('❌ ' + errorMsg, {
          autoClose: 5000,
          position: 'top-center'
        })
      } else {
        // 其他错误
        const errorMsg = error.message || (isLogin ? '登录失败' : '注册失败')
        setErrorMessage(errorMsg)
        toast.error(`❌ ${errorMsg}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-primary-100 rounded-full mb-4">
            <span className="text-4xl">💬</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">雷犀客服系统</h1>
          <p className="text-gray-500 mt-2">企业级客服管理平台</p>
        </div>

        {/* 切换登录/注册 */}
        <div className="flex mb-6 bg-primary-50 rounded-lg p-1">
          <Button
            onClick={() => setIsLogin(true)}
            variant={isLogin ? "default" : "ghost"}
            className="flex-1"
          >
            登录
          </Button>
          <Button
            onClick={() => {
              setIsLogin(false)
              setFormData({ username: '', password: '', real_name: '', email: '', phone: '' })
              setFieldErrors({})
              setUsernameAvailable(null)
              setUsernameSuggestions([])
            }}
            variant={!isLogin ? "default" : "ghost"}
            className="flex-1"
          >
            注册
          </Button>
        </div>

        {/* 错误提示框 */}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg animate-shake">
            <div className="flex items-start gap-3">
              <span className="text-red-600 text-2xl flex-shrink-0">❌</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 mb-1">登录失败</p>
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
              <Button
                onClick={() => setErrorMessage('')}
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="real_name">真实姓名</Label>
              <Input
                id="real_name"
                type="text"
                value={formData.real_name}
                onChange={(e) => {
                  setFormData({...formData, real_name: e.target.value})
                  setFieldErrors({...fieldErrors, real_name: ''})
                }}
                className={fieldErrors.real_name ? 'border-red-500' : ''}
                placeholder="请输入真实姓名"
              />
              {fieldErrors.real_name && (
                <p className="text-sm text-red-600">{fieldErrors.real_name}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => {
                  setFormData({...formData, username: e.target.value})
                  setFieldErrors({...fieldErrors, username: ''})
                  if (!isLogin) {
                    checkUsername(e.target.value, formData.real_name)
                  }
                }}
                className={`${
                  fieldErrors.username ? 'border-red-500' :
                  !isLogin && usernameAvailable === false ? 'border-red-500' :
                  !isLogin && usernameAvailable === true ? 'border-green-500' : ''
                }`}
                placeholder="请输入用户名"
              />
              {!isLogin && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isCheckingUsername && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                  {!isCheckingUsername && usernameAvailable === true && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                  {!isCheckingUsername && usernameAvailable === false && (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {fieldErrors.username && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.username}</p>
            )}
            {/* 用户名建议 */}
            {!isLogin && usernameSuggestions.length > 0 && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2">该用户名已被使用，以下是建议：</p>
                <div className="flex flex-wrap gap-2">
                  {usernameSuggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData({...formData, username: suggestion})
                        checkUsername(suggestion, formData.real_name)
                      }}
                      className="border-yellow-300 hover:bg-yellow-100"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>


          {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="department">部门</Label>
                <Select
                  value={formData.department_id}
                  onValueChange={(value) => {
                    setFormData({...formData, department_id: value})
                    setFieldErrors({...fieldErrors, department_id: ''})
                  }}
                >
                  <SelectTrigger className={fieldErrors.department_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="请选择部门" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.department_id && (
                  <p className="text-sm text-red-600">{fieldErrors.department_id}</p>
                )}
              </div>

          )}

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({...formData, password: e.target.value})
                setFieldErrors({...fieldErrors, password: ''})
              }}
              className={fieldErrors.password ? 'border-red-500' : ''}
              placeholder="请输入密码"
            />
            {fieldErrors.password && (
              <p className="text-sm text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          {/* 记住密码选项 */}
          {isLogin && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberPassword}
                onCheckedChange={setRememberPassword}
              />
              <Label
                htmlFor="remember"
                className="text-sm font-normal cursor-pointer"
              >
                记住密码
              </Label>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </Button>
        </form>
      </div>

      {/* 确认登录对话框 */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 m-4 animate-fadeIn">
            {/* 图标 */}
            <div className="text-center mb-6">
              <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4">
                <span className="text-5xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">检测到活跃会话</h2>
              <p className="text-gray-600">该账号已在其他设备登录</p>
            </div>

            {/* 会话信息 */}
            {sessionInfo && sessionInfo.sessionCreatedAt && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-blue-600 text-xl">ℹ️</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-1">会话信息</p>
                    <p className="text-sm text-blue-800">
                      登录时间：{new Date(sessionInfo.sessionCreatedAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 提示信息 */}
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-red-600 text-xl">🚨</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900 mb-2">重要提示</p>
                  <p className="text-sm text-red-800 leading-relaxed">
                    如果继续登录，之前登录的设备将被强制退出。
                    <br />
                    请确认这是您本人的操作。
                  </p>
                </div>
              </div>
            </div>

            {/* 按钮组 */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setLoading(false)
                }}
                className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  setLoading(true)
                  try {
                    await performLogin(true)
                    // 确保在任何情况下都关闭loading状态
                    if (loading) {
                      setLoading(false)
                    }
                  } catch (error) {
                    console.error('强制登录失败:', error)
                    setShowConfirmModal(false)

                    // 显示错误信息
                    if (error.response) {
                      const message = error.response.data?.message
                      if (error.response.status === 401) {
                        setErrorMessage('用户名或密码错误')
                        toast.error('❌ 用户名或密码错误')
                      } else if (message) {
                        setErrorMessage(message)
                        toast.error(`❌ ${message}`)
                      }
                    } else {
                      setErrorMessage('登录失败，请稍后重试')
                      toast.error('❌ 登录失败')
                    }
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '登录中...' : '确认登录'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 注册成功模态框 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
            <div className="text-center">
              {/* 成功图标 */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>

              {/* 标题 */}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">注册成功！</h3>

              {/* 说明文字 */}
              <div className="mb-6 space-y-2">
                <p className="text-gray-600">您的账号已成功提交注册申请</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <p className="text-sm text-blue-800 mb-2">
                    <span className="font-semibold">📋 下一步：</span>
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1 ml-4">
                    <li>• 您的账号正在等待管理员审核</li>
                    <li>• 审核通过后，您将可以登录系统</li>
                    <li>• 请耐心等待，通常会在1个工作日内完成审核</li>
                  </ul>
                </div>
              </div>

              {/* 按钮 */}
              <button
                onClick={() => {
                  setShowSuccessModal(false)
                  setIsLogin(true)
                }}
                className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                好的，我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
