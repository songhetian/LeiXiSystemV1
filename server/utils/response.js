/**
 * 统一响应处理工具
 */

const sendSuccess = (data = null, message = '操作成功') => {
  return {
    success: true,
    data,
    message
  };
};

const sendError = (message = '操作失败', code = 500, detail = null) => {
  const error = new Error(message);
  error.statusCode = code;
  error.detail = detail;
  throw error; // 让 Fastify 全局错误处理器捕获
};

module.exports = {
  sendSuccess,
  sendError
};
