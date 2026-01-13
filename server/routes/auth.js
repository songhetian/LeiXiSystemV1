const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { recordLog } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

module.exports = async function (fastify, opts) {
  const pool = fastify.mysql;
  const redis = fastify.redis;

  // 0. 检查用户是否已有活跃会话
  fastify.post('/api/auth/check-session', {
    schema: {
      body: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { username } = request.body;
    try {
      const [users] = await pool.query(
        'SELECT id, session_token, session_created_at FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) return { hasActiveSession: false };
      const user = users[0];

      if (user.session_token) {
        try {
          jwt.verify(user.session_token, JWT_SECRET);
          return {
            hasActiveSession: true,
            sessionCreatedAt: user.session_created_at,
            message: '该账号已在其他设备登录'
          };
        } catch (error) {
          return { hasActiveSession: false };
        }
      }
      return { hasActiveSession: false };
    } catch (error) {
      return reply.code(500).send({ success: false, message: '检查会话失败' });
    }
  });

  // 1. 检查用户名是否可用
  fastify.post('/api/auth/check-username', {
    schema: {
      body: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { type: 'string', minLength: 2 },
          realName: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { username, realName } = request.body;
    try {
      const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
      if (existing.length === 0) return { available: true, suggestions: [] };

      const suggestions = [];
      const baseUsername = username.toLowerCase();
      const currentYear = new Date().getFullYear();
      suggestions.push(`${baseUsername}${Math.floor(100 + Math.random() * 900)}`);
      suggestions.push(`${baseUsername}${currentYear}`);
      
      return { available: false, suggestions: suggestions.slice(0, 5) };
    } catch (error) {
      return reply.code(500).send({ success: false, message: '检查用户名失败' });
    }
  });

  // 2. 用户注册
  fastify.post('/api/auth/register', {
    schema: {
      body: {
        type: 'object',
        required: ['username', 'password', 'real_name'],
        properties: {
          username: { type: 'string', minLength: 3 },
          password: { type: 'string', minLength: 6 },
          real_name: { type: 'string', minLength: 2 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', pattern: '^\\d{11}$' },
          department_id: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    const { username, password, real_name, email, phone, department_id } = request.body;
    try {
      const [existingUsername] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
      if (existingUsername.length > 0) return reply.code(400).send({ success: false, message: '用户名已存在' });

      const passwordHash = await bcrypt.hash(password, 10);
      const emailToSave = email && email.trim() ? email : null;
      const phoneToSave = phone && phone.trim() ? phone : null;

      const [result] = await pool.query(
        'INSERT INTO users (username, password_hash, real_name, email, phone, department_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [username, passwordHash, real_name, emailToSave, phoneToSave, department_id || null, 'pending']
      );
      return { success: true, message: '注册成功', userId: result.insertId };
    } catch (error) {
      return reply.code(500).send({ success: false, message: '注册失败' });
    }
  });

  // 3. 用户登录
  fastify.post('/api/auth/login', {
    schema: {
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string' },
          password: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { username, password } = request.body;
    try {
      const [users] = await pool.query(
        'SELECT id, username, password_hash, real_name, email, phone, status, department_id FROM users WHERE username = ?',
        [username]
      );
      if (users.length === 0) return reply.code(401).send({ success: false, message: 'Invalid username or password' });

      const user = users[0];
      if (user.status === 'pending') return reply.code(403).send({ success: false, message: '账号待审核' });
      if (user.status !== 'active') return reply.code(403).send({ success: false, message: '账号已禁用' });

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) return reply.code(401).send({ success: false, message: 'Invalid username or password' });

      const sessionId = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const tokenPayload = { id: user.id, username: user.username, sessionId };
      if (user.department_id) tokenPayload.department_id = user.department_id;

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
      const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

      await pool.query('UPDATE users SET last_login = NOW(), session_token = ?, session_created_at = NOW() WHERE id = ?', [token, user.id]);
      if (redis) await redis.set(`user:session:${user.id}`, token, 'EX', 7 * 24 * 3600);

      const { password_hash, ...userInfo } = user;
      return { success: true, token, refresh_token: refreshToken, user: userInfo };
    } catch (error) {
      return reply.code(500).send({ success: false, message: '登录失败' });
    }
  });

  // 4. 用户退出
  fastify.post('/api/auth/logout', async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) return { success: true };
      const decoded = jwt.decode(token);
      if (decoded && decoded.id) {
        await pool.query('UPDATE users SET session_token = NULL, session_created_at = NULL WHERE id = ?', [decoded.id]);
        if (redis) await redis.del(`user:session:${decoded.id}`);
      }
      return { success: true, message: '退出成功' };
    } catch (error) {
      return { success: true };
    }
  });

  // 5. 刷新 Token
  fastify.post('/api/auth/refresh', async (request, reply) => {
    const { refresh_token } = request.body;
    if (!refresh_token) return reply.code(400).send({ error: 'Refresh token is required' });
    try {
      const decoded = jwt.verify(refresh_token, JWT_REFRESH_SECRET);
      const [users] = await pool.query('SELECT id, username, status, department_id FROM users WHERE id = ?', [decoded.id]);
      if (users.length === 0 || users[0].status !== 'active') return reply.code(401).send({ error: 'User inactive' });

      const user = users[0];
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
      return { token, expires_in: 3600 };
    } catch (error) {
      return reply.code(401).send({ error: 'Invalid refresh token' });
    }
  });

  // 6. 验证 Token 有效性 (单设备检查)
  fastify.get('/api/auth/verify-token', async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) return reply.code(401).send({ valid: false });
      const decoded = jwt.verify(token, JWT_SECRET);
      const [users] = await pool.query('SELECT session_token FROM users WHERE id = ?', [decoded.id]);
      if (users.length === 0 || users[0].session_token !== token) {
        return reply.code(401).send({ valid: false, kicked: true });
      }
      return { success: true, valid: true };
    } catch (error) {
      return reply.code(401).send({ valid: false });
    }
  });
};
