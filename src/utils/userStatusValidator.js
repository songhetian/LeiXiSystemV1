/**
 * 用户状态验证工具函数
 * 用于验证当前登录用户的账户状态，如果用户状态不是active，则跳转到登录页面
 */

const verifyUserStatus = async () => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      // 验证token是否仍然有效
      const response = await fetch(`${window.location.origin}/api/auth/verify-token`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // 尝试解析响应为JSON
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // 如果解析失败，检查响应状态码
        console.warn('解析JSON响应失败:', parseError);
        if (response.status === 401 || response.status === 403) {
          // 如果是认证相关的错误状态码，清除本地存储并跳转到登录页面
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          alert('会话已过期，请重新登录');
          window.location.href = '/login';
          return false;
        } else {
          // 其他情况，允许用户继续操作
          return true;
        }
      }

      // 如果token无效或用户状态不是active，则跳转到登录页面
      if (!data.valid || (data.message && data.message.includes('无法登录系统'))) {
        // 清除本地存储
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // 显示提示信息
        alert(data.message || '您的账号状态已变更，请重新登录');

        // 跳转到登录页面
        window.location.href = '/login';
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('验证用户状态时出错:', error);
    // 即使验证失败，我们也允许用户继续操作
    return true;
  }
};

export default verifyUserStatus;
