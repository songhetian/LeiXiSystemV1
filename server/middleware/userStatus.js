const jwt = require('jsonwebtoken');

/**
 * 用户状态验证中间件
 * 验证当前用户的status字段，如果不是'active'状态则拒绝请求
 */
async function checkUserStatus(request, reply) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return reply.code(401).send({ success: false, message: '未登录' });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET);

    // 获取数据库连接池
    const pool = request.server.mysql;

    // 查询用户状态
    const [users] = await pool.query(
      'SELECT id, status FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return reply.code(401).send({ success: false, message: '用户不存在' });
    }

    const user = users[0];

    // 检查用户状态
    if (user.status !== 'active') {
      let message = '该用户无法登录系统';

      // 根据具体状态提供更详细的提示
      switch (user.status) {
        case 'inactive':
          message = '该用户已被停用，无法登录系统';
          break;
        case 'resigned':
          message = '该用户已离职，无法登录系统';
          break;
        case 'pending':
          message = '该用户账号正在审核中，暂时无法登录';
          break;
        case 'rejected':
          message = '该用户账号审核未通过，无法登录系统';
          break;
      }

      return reply.code(401).send({ success: false, message });
    }

    // 将用户信息附加到请求对象上，供后续处理使用
    request.currentUser = {
      id: user.id,
      status: user.status
    };
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return reply.code(401).send({ success: false, message: '登录凭证无效或已过期' });
    }
    console.error('用户状态验证失败:', error);
    return reply.code(500).send({ success: false, message: '服务器内部错误' });
  }
}

module.exports = {
  checkUserStatus
};
