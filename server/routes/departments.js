module.exports = async function (fastify, opts) {
  const pool = fastify.mysql;

  // 1. 获取部门列表
  fastify.get('/api/departments', async (request, reply) => {
    try {
      const { includeDeleted, forManagement } = request.query;
      const { extractUserPermissions } = require('../middleware/checkPermission');
      const permissions = await extractUserPermissions(request, pool);

      let query = 'SELECT * FROM departments WHERE 1=1';
      const params = [];

      if (includeDeleted !== 'true') query += ' AND status != "deleted"';

      if (forManagement !== 'true') {
        if (!permissions) {
          query += ' AND 1=0';
        } else if (permissions.viewableDepartmentIds && permissions.viewableDepartmentIds.length > 0) {
          const placeholders = permissions.viewableDepartmentIds.map(() => '?').join(',');
          query += ` AND id IN (${placeholders})`;
          params.push(...permissions.viewableDepartmentIds);
        } else if (permissions.departmentId) {
          query += ' AND id = ?';
          params.push(permissions.departmentId);
        } else if (!permissions.canViewAllDepartments) {
          query += ' AND 1=0';
        }
      }

      query += ' ORDER BY sort_order, created_at DESC';
      const [rows] = await pool.query(query, params);
      return rows; // 直接返回数组
    } catch (error) {
      console.error('Fetch Depts Error:', error);
      return [];
    }
  });

  // 2. 创建部门
  fastify.post('/api/departments', {
    config: { audit: { module: 'organization', action: '创建部门: :name' } }
  }, async (request, reply) => {
    const { name, description, status } = request.body;
    try {
      const [result] = await pool.query(
        'INSERT INTO departments (name, description, status) VALUES (?, ?, ?)',
        [name, description, status]
      );
      return { success: true, id: result.insertId };
    } catch (error) {
      return reply.code(500).send({ error: '创建部门失败' });
    }
  });

  // 3. 更新部门
  fastify.put('/api/departments/:id', {
    config: { audit: { module: 'organization', action: '更新部门信息 (ID: :id)' } }
  }, async (request, reply) => {
    const { id } = request.params;
    const { name, description, status } = request.body;
    try {
      const [oldDept] = await pool.query('SELECT status FROM departments WHERE id = ?', [id]);
      const oldStatus = oldDept[0]?.status;

      await pool.query('UPDATE departments SET name = ?, description = ?, status = ? WHERE id = ?', [name, description, status, id]);

      if (oldStatus && oldStatus !== status) {
        const [employees] = await pool.query('SELECT e.id FROM employees e LEFT JOIN users u ON e.user_id = u.id WHERE u.department_id = ?', [id]);
        if (employees.length > 0) {
          const employeeStatus = status === 'active' ? 'active' : 'inactive';
          await pool.query(`UPDATE employees SET status = ? WHERE id IN (${employees.map(() => '?').join(',')})`, [employeeStatus, ...employees.map(e => e.id)]);
        }
      }
      return { success: true };
    } catch (error) {
      return reply.code(500).send({ error: '更新部门失败' });
    }
  });

  // 4. 删除部门 (软删除)
  fastify.delete('/api/departments/:id', {
    config: { audit: { module: 'organization', action: '删除部门 (ID: :id)' } }
  }, async (request, reply) => {
    const { id } = request.params;
    try {
      await pool.query('UPDATE departments SET status = ? WHERE id = ?', ['deleted', id]);
      await pool.query('UPDATE employees e LEFT JOIN users u ON e.user_id = u.id SET e.status = "deleted" WHERE u.department_id = ?', [id]);
      return { success: true, message: '部门删除成功' };
    } catch (error) {
      return reply.code(500).send({ error: '删除部门失败' });
    }
  });

  // 5. 恢复部门
  fastify.post('/api/departments/:id/restore', {
    config: { audit: { module: 'organization', action: '恢复部门 (ID: :id)' } }
  }, async (request, reply) => {
    const { id } = request.params;
    try {
      await pool.query('UPDATE departments SET status = ? WHERE id = ?', ['active', id]);
      await pool.query('UPDATE employees e LEFT JOIN users u ON e.user_id = u.id SET e.status = "active" WHERE u.department_id = ? AND e.status = "deleted"', [id]);
      return { success: true, message: '部门恢复成功' };
    } catch (error) {
      return reply.code(500).send({ error: '恢复部门失败' });
    }
  });
};