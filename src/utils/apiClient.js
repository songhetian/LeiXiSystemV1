import { toast } from 'sonner';
import api from '../api';

/**
 * Token管理工具类 (保留用于兼容性)
 */
class TokenManager {
  getToken() { return localStorage.getItem('token') || ''; }
  
  setToken(token, expiresIn = 3600) {
    localStorage.setItem('token', token);
    const expiryTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem('token_expiry', expiryTime.toString());
  }

  setRefreshToken(refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  }

  clearTokens() { localStorage.clear(); }
  
  parseToken(token) {
    try {
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length < 2) return null;
      return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch (e) { return null; }
  }
}

export const tokenManager = new TokenManager();

export const handleApiError = (error) => {
  console.error('API Error:', error);
  // api.js 已经处理了大部分通用错误提示
};

/**
 * 统一的API请求封装 (Axios 版)
 * 为了兼容旧代码，这里需要捕获错误并返回 success: false 结构
 */
export const apiGet = async (path, options = {}) => {
  try {
    // getApiUrl 会根据 baseURL 自动处理 /api 前缀，确保生成的 URL 是绝对路径且正确
    const res = await api.get(path, options);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const apiPost = async (path, data, options = {}) => {
  try {
    const res = await api.post(path, data, options);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const apiPut = async (path, data, options = {}) => {
  try {
    const res = await api.put(path, data, options);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const apiDelete = async (path, options = {}) => {
  try {
    const res = await api.delete(path, options);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const apiUpload = async (path, formData, options = {}) => {
  try {
    const res = await api.post(path, formData, {
      ...options,
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export default {
  tokenManager,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiUpload,
};
