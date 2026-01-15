import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import App from './App'
import './index.css'
import './styles/business-theme.css'
import './styles/antd-custom.css'

dayjs.locale('zh-cn')

// --- 全局 Fetch 补丁 (解决旧代码中的 URL 重复和响应格式不统一问题) ---
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;

  // 1. URL 清洗：解决 getApiUrl 可能导致的 /api/api/ 重复问题
  if (typeof resource === 'string' && resource.includes('/api/api/')) {
    resource = resource.replace('/api/api/', '/api/');
  }

  const response = await originalFetch(resource, config);

  // 2. 响应劫持：自动规范化 .json() 的返回结果
  const originalJson = response.json;
  response.json = async () => {
    const data = await originalJson.call(response);
    
    // 如果已经是标准格式，直接返回
    if (data && typeof data === 'object' && 'success' in data) {
      return data;
    }
    
    // 否则自动包装为 { success: true, data: ... }
    // 注意：只针对成功的请求或正常的业务数据进行包装
    if (response.ok) {
      return {
        success: true,
        data: data
      };
    }
    
    return data;
  };

  return response;
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <ConfigProvider locale={zhCN}>
      <App />
    </ConfigProvider>,
)
