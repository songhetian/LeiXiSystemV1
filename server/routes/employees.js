const { recordLog } = require('../utils/logger');

module.exports = async function (fastify, opts) {
  const pool = fastify.mysql;
  const redis = fastify.redis;

  // 1. 获取员工列表 (恢复直接返回数组，确保前端兼容)
  fastify.get('/api/employees', async (request, reply) => {
    try {
      const { includeDeleted, department_id, keyword, status } = request.query;
      const { extractUserPermissions, applyDepartmentFilter } = require('../middleware/checkPermission');
      const permissions = await extractUserPermissions(request, pool);

      let query = `
        SELECT e.*, u.id as user_id, u.username, u.real_name, u.email, u.phone, u.avatar, u.department_id,
               u.is_department_manager, d.name as department_name, pos.name as position_name
        FROM employees e
        LEFT JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN positions pos ON e.position_id = pos.id
        WHERE 1=1
      `;
      const params = [];

      if (includeDeleted !== 'true') query += ' AND e.status != "deleted"';
      if (department_id) { query += ' AND u.department_id = ?'; params.push(department_id); }
      if (keyword) {
        query += ' AND (u.real_name LIKE ? OR u.username LIKE ? OR e.employee_no LIKE ? OR pos.name LIKE ?)';
        const search = `%${keyword}%`;
        params.push(search, search, search, search);
      }
      if (status) { query += ' AND e.status = ?'; params.push(status); }

      const filtered = applyDepartmentFilter(permissions, query, [...params], 'u.department_id');
      query = filtered.query + ' ORDER BY e.created_at DESC';

      const [rows] = await pool.query(query, filtered.params);
      
      // 直接返回数组，对齐原始 index.js 逻辑
      return rows;
    } catch (error) {
      console.error('Fetch Employees Error:', error);
      return []; // 报错也返回空数组防止前端崩溃
    }
  });

  // 2. 创建员工 (带 Schema 校验和自动审计)
  fastify.post('/api/employees', {
    schema: {
      body: {
        type: 'object',
        required: ['real_name', 'department_id'],
        properties: {
          real_name: { type: 'string', minLength: 2 },
          employee_no: { type: 'string' },
          department_id: { type: 'number' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', pattern: '^\\d{11}$' },
          status: { type: 'string', enum: ['active', 'inactive', 'pending'] }
        }
      }
    },
    config: { audit: { module: 'user', action: '创建新员工: :real_name' } }
  }, async (request, reply) => {
    const { employee_no, real_name, email, phone, department_id, position, hire_date, rating, status, username: providedUsername } = request.body;
    
    // 自动生成工号逻辑
    let finalEmployeeNo = employee_no;
    if (!finalEmployeeNo) {
      const [maxEmpRows] = await pool.query('SELECT employee_no FROM employees WHERE employee_no REGEXP "^EMP[0-9]+" ORDER BY LENGTH(employee_no) DESC, employee_no DESC LIMIT 1');
      const numPart = maxEmpRows.length > 0 ? parseInt(maxEmpRows[0].employee_no.replace(/\D/g, '')) : 0;
      finalEmployeeNo = `EMP${String(numPart + 1).padStart(4, '0')}`;
    }

    const username = providedUsername || real_name || finalEmployeeNo;
    const passwordHash = '$2b$12$KIXxLQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNqYq'; // 123456

    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      const [userResult] = await connection.query(
        'INSERT INTO users (username, password_hash, real_name, email, phone, department_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [username, passwordHash, real_name, email || null, phone || null, department_id, status || 'active']
      );
      
      const [empResult] = await connection.query(
        'INSERT INTO employees (user_id, employee_no, hire_date, rating, status) VALUES (?, ?, ?, ?, ?)',
        [userResult.insertId, finalEmployeeNo, hire_date || new Date(), rating || 3, status || 'active']
      );

      await connection.commit();
      
      // 清理缓存
      if (redis) {
        const keys = await redis.keys('list:employees:default:*');
        if (keys.length > 0) await redis.del(...keys);
      }

      return { success: true, id: userResult.insertId };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  });

  // 3. 更新员工
  fastify.put('/api/employees/:id', {
    config: { audit: { module: 'user', action: '更新员工信息 (ID: :id)' } }
  }, async (request, reply) => {
    const { id } = request.params;
    const {
      employee_no, real_name, email, phone, department_id, position,
      hire_date, rating, status, avatar, emergency_contact, emergency_phone,
      address, education, skills, remark
    } = request.body;

    try {
      const [empRows] = await pool.query('SELECT user_id FROM employees WHERE id = ?', [id]);
      if (empRows.length === 0) return reply.code(404).send({ error: '员工不存在' });
      const userId = empRows[0].user_id;

      await pool.query(
        'UPDATE users SET real_name = ?, email = ?, phone = ?, department_id = ?, avatar = ?, status = ? WHERE id = ?',
        [real_name, email || null, phone || null, department_id, avatar || null, status || 'active', userId]
      );

      // 职位处理逻辑
      let positionId = null;
      if (position) {
        const [existing] = await pool.query('SELECT id FROM positions WHERE name = ?', [position]);
        if (existing.length > 0) positionId = existing[0].id;
        else {
          const [res] = await pool.query('INSERT INTO positions (name, status) VALUES (?, "active")', [position]);
          positionId = res.insertId;
        }
      }

      await pool.query(
        `UPDATE employees SET employee_no = ?, position_id = ?, hire_date = ?, rating = ?, status = ?, 
         emergency_contact = ?, emergency_phone = ?, address = ?, education = ?, skills = ?, remark = ? WHERE id = ?`,
        [employee_no, positionId, hire_date, rating || 3, status || 'active', emergency_contact, emergency_phone, address, education, skills, remark, id]
      );

      if (redis) {
        const keys = await redis.keys('*employees*');
        if (keys.length > 0) await redis.del(...keys);
        await redis.del(`user:profile:${userId}`);
        await redis.del(`user:identity:${userId}`);
      }

      return { success: true };
    } catch (error) {
      console.error(error);
      return reply.code(500).send({ error: '更新失败' });
    }
  });

  // 4. 获取单个员工
  fastify.get('/api/employees/:id', async (request, reply) => {
    const { id } = request.params;
    const [rows] = await pool.query(`
      SELECT e.*, u.real_name, u.username, u.email, u.phone, u.department_id, d.name as department_name, pos.name as position_name
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN positions pos ON e.position_id = pos.id
      WHERE e.id = ?`, [id]);
    return rows.length > 0 ? rows[0] : reply.code(404).send({ error: 'Not found' });
  });
};
