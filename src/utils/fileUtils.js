import { getApiUrl } from './apiConfig';

/**
 * 辅助函数: 将相对路径转换为完整 URL，并可选添加缓存破坏参数
 * @param {string} url - 原始 URL 或路径
 * @param {Object} options - 选项
 * @param {boolean} options.bustCache - 是否添加时间戳参数防止缓存
 * @returns {string|null} - 转换后的完整 URL
 */
export const getImageUrl = (url, options = {}) => {
  if (!url) return null;

  // 如果已经是完整 URL
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    if (options.bustCache && !url.startsWith('data:')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}t=${Date.now()}`;
    }
    return url;
  }

  // 获取后端基础地址 (移除 /api)
  const baseUrl = getApiUrl('').replace('/api', '').replace(/\/$/, '');

  // 确保路径以 / 开头
  const path = url.startsWith('/') ? url : `/${url}`;
  let finalUrl = `${baseUrl}${path}`;

  // 添加缓存破坏参数
  if (options.bustCache) {
    finalUrl += `?t=${Date.now()}`;
  }

  return finalUrl;
};

/**
 * 辅助函数: 为文档附件构建完整 URL
 * @param {string} url - 附件路径
 * @returns {string} - 完整的附件访问 URL
 */
export const getAttachmentUrl = (url) => {
  if (!url) return '';

  // 完整 URL 直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 获取后端主机地址
  const host = getApiUrl('').replace('/api', '').replace(/\/$/, '');

  // 如果已经是带 / 的相对路径
  if (url.startsWith('/')) {
    return `${host}${url}`;
  }

  // 如果是纯文件名或需要补全 uploads 路径
  // 后端返回的路径通常已经包含 uploads，但以防万一
  if (url.includes('uploads/')) {
    return `${host}/${url}`;
  }

  // 默认补全 uploads
  return `${host}/uploads/${url}`;
};

export default {
  getImageUrl,
  getAttachmentUrl
};
