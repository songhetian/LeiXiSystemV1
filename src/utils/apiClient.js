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
 * 清理路径，移除开头的 /api 前缀，避免与 baseURL 中的 /api 重复
 * 例如: /api/roles -> /roles
 */
const cleanPath = (path) => {
  if (!path) return '';
  if (path.startsWith('/api/')) return path.substring(4);
  if (path.startsWith('api/')) return path.substring(3);
  return path;
};

/**
 * 规范化响应数据
 * 如果后端返回的是原始数组或没有 success 字段的对象，统一封装为 { success: true, data: ... }
 */
const normalizeResponse = (data) => {
  // 如果已经是标准格式，直接返回
  if (data && typeof data === 'object' && 'success' in data) {
    return data;
  }
  
  // 如果是数组，或者是不包含 success 的对象，封装它
  return {
    success: true,
    data: data
  };
};

/**
 * 统一的API请求封装 (Axios 版)
 * 为了兼容旧代码，这里需要捕获错误并返回 success: false 结构
 */
export const apiGet = async (path, options = {}) => {
  try {
    const res = await api.get(cleanPath(path), options);
    return normalizeResponse(res.data);
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const apiPost = async (path, data, options = {}) => {
  try {
    const res = await api.post(cleanPath(path), data, options);
    return normalizeResponse(res.data);
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const apiPut = async (path, data, options = {}) => {
  try {
    const res = await api.put(cleanPath(path), data, options);
    return normalizeResponse(res.data);
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const apiDelete = async (path, options = {}) => {
  try {
    const res = await api.delete(cleanPath(path), options);
    return normalizeResponse(res.data);
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const apiUpload = async (path, formData, options = {}) => {
  try {
    const res = await api.post(cleanPath(path), formData, {
      ...options,
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return normalizeResponse(res.data);
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