const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

module.exports = async function (fastify, opts) {
  const pool = fastify.mysql;
  const { extractUserPermissions, applyDepartmentFilter } = require('../middleware/checkPermission');

  // 1. 获取所有角色列表
  fastify.get('/api/roles', async (request, reply) => {
    try {
      const [rows] = await pool.query(`
        SELECT r.*, COUNT(DISTINCT ur.user_id) as user_count, COUNT(DISTINCT rp.permission_id) as permission_count
        FROM roles r
        LEFT JOIN user_roles ur ON r.id = ur.role_id
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        GROUP BY r.id
        ORDER BY r.level DESC, r.created_at DESC
      `);
      return rows; // 直接返回数组
    } catch (error) {
      console.error('Fetch Roles Error:', error);
      return [];
    }
  });

  // 2. 创建角色
  fastify.post('/api/roles', {
    config: { audit: { module: 'permission', action: '创建角色: :name' } }
  }, async (request, reply) => {
    const { name, description, level, can_view_all_departments } = request.body;
    try {
      const [result] = await pool.query(
        'INSERT INTO roles (name, description, level, is_system, can_view_all_departments) VALUES (?, ?, ?, 0, ?)',
        [name, description || null, level || 1, can_view_all_departments || 0]
      );
      return { success: true, id: result.insertId };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to create role' });
    }
  });

  // 3. 更新角色
  fastify.put('/api/roles/:id', {
    config: { audit: { module: 'permission', action: '更新角色信息 (ID: :id)' } }
  }, async (request, reply) => {
    const { id } = request.params;
    const { name, description, level, can_view_all_departments } = request.body;
    try {
      const [roleRows] = await pool.query('SELECT is_system FROM roles WHERE id = ?', [id]);
      if (roleRows.length > 0 && roleRows[0].is_system === 1) {
        await pool.query('UPDATE roles SET can_view_all_departments = ? WHERE id = ?', [can_view_all_departments || 0, id]);
        return { success: true, message: '系统角色只能修改部门查看权限' };
      }
      await pool.query('UPDATE roles SET name = ?, description = ?, level = ?, can_view_all_departments = ? WHERE id = ?', [name, description || null, level || 1, can_view_all_departments || 0, id]);
      return { success: true };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to update role' });
    }
  });

  // 4. 获取所有权限列表
  fastify.get('/api/permissions', async (request, reply) => {
    try {
      const [rows] = await pool.query('SELECT * FROM permissions ORDER BY module, id');
      return rows; // 直接返回数组
    } catch (error) {
      console.error('Fetch Permissions Error:', error);
      return [];
    }
  });

  // 5. 获取角色的权限列表
  fastify.get('/api/roles/:id/permissions', async (request, reply) => {
    const { id } = request.params;
    try {
      const [rows] = await pool.query(`
        SELECT p.* FROM permissions p
        INNER JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
        ORDER BY p.module, p.id
      `, [id]);
      return rows; // 直接返回数组
    } catch (error) {
      console.error('Fetch Role Permissions Error:', error);
      return [];
    }
  });

  // 6. 批量设置角色的部门权限
  fastify.put('/api/roles/:id/departments', {
    config: { audit: { module: 'permission', action: '批量设置角色部门权限 (角色ID: :id)' } }
  }, async (request, reply) => {
    const { id } = request.params;
    const { department_ids } = request.body;
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      await connection.query('DELETE FROM role_departments WHERE role_id = ?', [id]);
      if (department_ids && department_ids.length > 0) {
        const values = department_ids.map(deptId => [id, deptId]);
        await connection.query('INSERT INTO role_departments (role_id, department_id) VALUES ?', [values]);
      }
      await connection.commit();
      return { success: true, count: department_ids?.length || 0 };
    } catch (error) {
      await connection.rollback();
      reply.code(500).send({ success: false, error: 'Failed to update department permissions' });
    } finally { connection.release(); }
  });

  // 7. 为角色分配权限 (增量)
  fastify.post('/api/roles/:id/permissions', async (request, reply) => {
    const { id } = request.params;
    const { permission_id } = request.body;
    try {
      await pool.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [id, permission_id]);
      return { success: true };
    } catch (error) { reply.code(500).send({ error: 'Failed' }); }
  });

  // 8. 获取用户列表（包含角色信息）
  fastify.get('/api/users-with-roles', async (request, reply) => {
    try {
      const permissions = await extractUserPermissions(request, pool);
      let query = `SELECT u.*, d.name as department_name FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.status != 'pending'`;
      let params = [];
      const filtered = applyDepartmentFilter(permissions, query, params, 'u.department_id');
      const [users] = await pool.query(filtered.query, filtered.params);
      for (const user of users) {
        const [roles] = await pool.query(`SELECT r.id, r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?`, [user.id]);
        user.roles = roles;
      }
      return users; // 直接返回数组
    } catch (error) { 
      console.error('Fetch Users with Roles Error:', error);
      return []; 
    }
  });

  // 9. 为用户分配角色
  fastify.post('/api/users/:id/roles', {
    config: { audit: { module: 'permission', action: '为用户 (ID: :id) 分配角色' } }
  }, async (request, reply) => {
    const { id } = request.params;
    const { role_id } = request.body;
    try {
      await pool.query('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [id, role_id]);
      if (fastify.redis) await fastify.redis.del(`user:permissions:${id}`);
      return { success: true };
    } catch (error) { reply.code(500).send({ error: 'Failed' }); }
  });
};