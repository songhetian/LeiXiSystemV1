import axios from 'axios'
import { tokenManager } from './apiClient'

// 创建 axios 实例
const axiosInstance = axios.create()

// 请求拦截器：自动添加 Authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    // 自动清洗 URL
    if (config.url && config.url.startsWith('/api/')) {
      config.url = config.url.substring(4);
    } else if (config.url && config.url.startsWith('api/')) {
      config.url = config.url.substring(3);
    }

    const token = tokenManager.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：处理 401 错误
axiosInstance.interceptors.response.use(
  (response) => {
    // 自动规范化响应数据
    if (response.data && typeof response.data === 'object' && !('success' in response.data)) {
      response.data = {
        success: true,
        data: response.data
      };
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config

    // 如果是 401 错误且还没有重试过
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // 尝试刷新 token
        const newToken = await tokenManager.refreshToken()

        // 更新请求头
        originalRequest.headers.Authorization = `Bearer ${newToken}`

        // 重试原始请求
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        // 刷新失败，清除 token 并跳转到登录页
        tokenManager.clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
