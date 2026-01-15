// src/api.js
import axios from 'axios';
import { getApiBaseUrl } from './utils/apiConfig';
import { toast } from 'sonner';

// 创建 axios 实例
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRrefreshed = (token) => {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
};

// 请求拦截器 - 添加 token
api.interceptors.request.use(
  (config) => {
    // 自动清洗 URL，防止重复的 /api 前缀
    if (config.url && config.url.startsWith('/api/')) {
      config.url = config.url.substring(4);
    } else if (config.url && config.url.startsWith('api/')) {
      config.url = config.url.substring(3);
    }

    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 统一错误处理与自动刷新 Token
api.interceptors.response.use(
  (response) => {
    // 自动规范化响应数据格式
    if (response.data && typeof response.data === 'object' && !('success' in response.data)) {
      response.data = {
        success: true,
        data: response.data
      };
    } else if (Array.isArray(response.data)) {
      response.data = {
        success: true,
        data: response.data
      };
    }
    return response;
  },
  async (error) => {
    const { config, response } = error;
    const originalRequest = config;
    const errorMsg = response?.data?.message || error.message || '未知错误';
    
    if (response) {
      if (response.status === 401 && !originalRequest._retry) {
        // 如果是登录请求报错，直接返回
        if (originalRequest.url.includes('/auth/login')) {
          return Promise.reject(error);
        }

        // 处理二级密码逻辑
        const message = response.data?.message || '';
        if (message.includes('二级密码') || message.includes('需要验证')) {
          toast.error(errorMsg);
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve) => {
            subscribeTokenRefresh((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) throw new Error('No refresh token');

          const res = await axios.post(`${getApiBaseUrl()}/auth/refresh`, { refresh_token: refreshToken });
          if (res.data.token) {
            const newToken = res.data.token;
            localStorage.setItem('token', newToken);
            if (res.data.refresh_token) localStorage.setItem('refresh_token', res.data.refresh_token);
            
            onRrefreshed(newToken);
            isRefreshing = false;
            
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          isRefreshing = false;
          localStorage.clear();
          window.location.href = '/';
          return Promise.reject(refreshErr);
        }
      }

      switch (response.status) {
        case 403:
          toast.error('权限不足：' + errorMsg);
          break;
        case 404:
          // 仅记录到控制台，不再弹窗显示 404
          console.warn('API 404 Not Found:', originalRequest.url);
          break;
        case 500:
          toast.error('服务器错误：' + errorMsg);
          break;
        default:
          if (response.status !== 401) toast.error('操作失败：' + errorMsg);
      }
    } else if (error.request) {
      toast.error('网络错误，请检查网络连接');
    }
    
    return Promise.reject(error);
  }
);

export default api;

// 导出各个模块的API
export { default as qualityAPI } from './api/qualityAPI.js';
export { default as sessionAPI } from './api/sessionAPI.js';
export { default as customerAPI } from './api/customerAPI.js';
