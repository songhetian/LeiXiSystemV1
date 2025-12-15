const { requirePermission } = require('../middleware/auth')

const permissionRoutes = async (fastify, options) => {
  const connInit = await fastify.mysql.getConnection();
  try {
    await connInit.query(`
      CREATE TABLE IF NOT EXISTS permission_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        permission_ids TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  } finally {
    connInit.release();
  }
  // Create default employee template
  fastify.post('/api/permission-templates/create-default', {
    preHandler: requirePermission('system:role:manage')
  }, async (request, reply) => {
    const connection = await fastify.mysql.getConnection();
    try {
      // 检查是否已存在同名模板
      const [existing] = await connection.query(
        'SELECT id FROM permission_templates WHERE name = ?',
        ['员工基础权限']
      );

      if (existing.length > 0) {
        return { success: false, message: '员工基础权限模板已存在' };
      }

      // 获取所需权限的ID
      const [permissions] = await connection.query(`
        SELECT id, code FROM permissions WHERE code IN (
          'messaging:broadcast:view',
          'attendance:record:view',
          'vacation:record:view',
          'attendance:approval:manage',
          'vacation:approval:manage',
          'knowledge:article:view',
          'assessment:plan:view',
          'assessment:result:view',
          'user:profile:update',
          'user:memo:manage'
        )
      `);

      const permissionIds = permissions.map(p => p.id);

      // 创建模板
      const [result] = await connection.query(
        'INSERT INTO permission_templates (name, description, permission_ids) VALUES (?, ?, ?)',
        [
          '员工基础权限',
          '包含所有员工都需要的基本功能权限',
          JSON.stringify(permissionIds)
        ]
      );

      return { success: true, id: result.insertId, message: '员工基础权限模板创建成功' };
    } catch (error) {
      console.error('创建默认权限模板失败:', error);
      return reply.code(500).send({ success: false, message: '创建模板失败' });
    } finally {
      connection.release();
    }
  });

  // Get all roles with their permissions
  fastify.get('/api/roles', {
    preHandler: requirePermission('system:role:view')
  }, async (request, reply) => {
    const connection = await fastify.mysql.getConnection();
    try {
      const [roles] = await connection.query('SELECT id, name, description, level, is_system, created_at, updated_at FROM roles ORDER BY id');

      // Get permissions for each role
      for (let role of roles) {
        const [perms] = await connection.query(`
          SELECT p.*
          FROM permissions p
          JOIN role_permissions rp ON p.id = rp.permission_id
          WHERE rp.role_id = ?
        `, [role.id]);
        role.permissions = perms;
      }

      return { success: true, data: roles };
    } finally {
      connection.release();
    }
  });

  // Get all available permissions
  fastify.get('/api/permissions', {
    preHandler: requirePermission('system:role:view')
  }, async (request, reply) => {
    const connection = await fastify.mysql.getConnection();
    try {
      const [permissions] = await connection.query('SELECT * FROM permissions ORDER BY module, code');
      return { success: true, data: permissions };
    } finally {
      connection.release();
    }
  });

  // Create a new role
  fastify.post('/api/roles', {
    preHandler: requirePermission('system:role:manage')
  }, async (request, reply) => {
    const { name, description, permissionIds } = request.body;
    const connection = await fastify.mysql.getConnection();
    try {
      await connection.beginTransaction();

      // 检查是否尝试创建同名的超级管理员角色
      if (name === '超级管理员') {
        await connection.rollback();
        return reply.code(403).send({ success: false, message: '不能创建名称为超级管理员的角色' });
      }

      // 检查是否已存在同名角色
      const [existingRoles] = await connection.query(
        'SELECT id FROM roles WHERE name = ?',
        [name]
      );

      if (existingRoles.length > 0) {
        await connection.rollback();
        return reply.code(400).send({ success: false, message: '已存在同名角色' });
      }

      const [result] = await connection.query(
        'INSERT INTO roles (name, description) VALUES (?, ?)',
        [name, description]
      );
      const roleId = result.insertId;

      if (permissionIds && permissionIds.length > 0) {
        const values = permissionIds.map(pid => [roleId, pid]);
        await connection.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ?',
          [values]
        );
      }

      await connection.commit();
      return { success: true, message: '角色创建成功', roleId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });

  // Update role permissions
  fastify.put('/api/roles/:id', {
    preHandler: requirePermission('system:role:manage')
  }, async (request, reply) => {
    const { id } = request.params;
    const { name, description, permissionIds } = request.body;
    const connection = await fastify.mysql.getConnection();
    try {
      await connection.beginTransaction();

      // 检查是否为超级管理员角色
      const [roleRows] = await connection.query('SELECT name, is_system FROM roles WHERE id = ?', [id]);
      if (roleRows.length > 0) {
        const role = roleRows[0];
        // 如果是系统角色且原名称为'超级管理员'，不允许修改名称
        if (role.is_system === 1 && role.name === '超级管理员' && name !== '超级管理员') {
          await connection.rollback();
          return reply.code(403).send({ success: false, message: '不能修改超级管理员角色的名称' });
        }
      }

      await connection.query(
        'UPDATE roles SET name = ?, description = ? WHERE id = ?',
        [name, description, id]
      );

      // Delete existing permissions
      await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [id]);

      // Insert new permissions
      if (permissionIds && permissionIds.length > 0) {
        const values = permissionIds.map(pid => [id, pid]);
        await connection.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ?',
          [values]
        );
      }

      await connection.commit();
      return { success: true, message: '角色更新成功' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });

  // Get users with their roles
  fastify.get('/api/users/roles', {
    preHandler: requirePermission('system:role:view')
  }, async (request, reply) => {
    const connection = await fastify.mysql.getConnection();
    try {
      const [users] = await connection.query(`
        SELECT u.id, u.username, u.real_name, d.name as department_name
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        ORDER BY u.id
      `);

      for (let user of users) {
        const [roles] = await connection.query(`
          SELECT r.id, r.name, r.description, r.level, r.is_system, r.created_at, r.updated_at
          FROM roles r
          JOIN user_roles ur ON r.id = ur.role_id
          WHERE ur.user_id = ?
        `, [user.id]);
        user.roles = roles;
      }

      return { success: true, data: users };
    } finally {
      connection.release();
    }
  });

  // Get roles for a specific user
  fastify.get('/api/users/:id/roles', {
    preHandler: requirePermission('system:role:view')
  }, async (request, reply) => {
    const { id } = request.params;
    const connection = await fastify.mysql.getConnection();
    try {
      const [roles] = await connection.query(`
        SELECT r.id, r.name, r.description
        FROM roles r
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = ?
        ORDER BY r.id
      `, [id]);

      return roles;
    } finally {
      connection.release();
    }
  });

  // Add a role to a user
  fastify.post('/api/users/:id/roles', {
    preHandler: requirePermission('system:role:manage')
  }, async (request, reply) => {
    const { id } = request.params;
    const { role_id } = request.body;
    const connection = await fastify.mysql.getConnection();
    try {
      // Check if user already has this role
      const [existing] = await connection.query(
        'SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?',
        [id, role_id]
      );

      if (existing.length > 0) {
        return { success: false, message: '用户已拥有此角色' };
      }

      await connection.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
        [id, role_id]
      );

      return { success: true, message: '角色分配成功' };
    } finally {
      connection.release();
    }
  });

  // Remove a role from a user
  fastify.delete('/api/users/:id/roles/:roleId', {
    preHandler: requirePermission('system:role:manage')
  }, async (request, reply) => {
    const { id, roleId } = request.params;
    const connection = await fastify.mysql.getConnection();
    try {
      const [result] = await connection.query(
        'DELETE FROM user_roles WHERE user_id = ? AND role_id = ?',
        [id, roleId]
      );

      if (result.affectedRows === 0) {
        return { success: false, message: '用户没有此角色' };
      }

      return { success: true, message: '角色移除成功' };
    } finally {
      connection.release();
    }
  });

  // Update user roles (batch update)
  fastify.put('/api/users/:id/roles', {
    preHandler: requirePermission('system:role:manage')
  }, async (request, reply) => {
    const { id } = request.params;
    const { roleIds } = request.body;
    const connection = await fastify.mysql.getConnection();
    try {
      await connection.beginTransaction();

      // Delete existing roles
      await connection.query('DELETE FROM user_roles WHERE user_id = ?', [id]);

      // Insert new roles
      if (roleIds && roleIds.length > 0) {
        const values = roleIds.map(rid => [id, rid]);
        await connection.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ?',
          [values]
        );
      }

      await connection.commit();

      // 🔔 发送实时通知给用户
      try {
        // 获取用户信息
        const [users] = await fastify.mysql.query('SELECT id, username, real_name FROM users WHERE id = ?', [id]);
        if (users.length > 0) {
          const user = users[0];

          // 获取角色名称
          if (roleIds && roleIds.length > 0) {
            const [roles] = await fastify.mysql.query('SELECT name FROM roles WHERE id IN (?)', [roleIds]);
            const roleNames = roles.map(r => r.name).join(', ');

            // 发送WebSocket通知
            if (fastify.io) {
              const { sendNotificationToUser } = require('../websocket');
              sendNotificationToUser(fastify.io, id, {
                type: 'role_assignment',
                title: '角色变更通知',
                content: `您的角色已更新为: ${roleNames}`,
                related_id: id,
                related_type: 'user_role',
                created_at: new Date()
              });
            }
          }
        }
      } catch (notifyError) {
        console.error('发送角色变更通知失败:', notifyError);
      }

      return { success: true, message: '用户角色更新成功' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });

  // Delete role
  fastify.delete('/api/roles/:id', {
    preHandler: requirePermission('system:role:manage')
  }, async (request, reply) => {
    const { id } = request.params;
    const connection = await fastify.mysql.getConnection();
    try {
      await connection.beginTransaction();

      // 检查是否为系统角色
      const [roleRows] = await connection.query('SELECT name, is_system FROM roles WHERE id = ?', [id]);
      if (roleRows.length > 0) {
        const role = roleRows[0];
        // 特别保护超级管理员角色
        if (role.name === '超级管理员') {
          await connection.rollback();
          return reply.code(403).send({ success: false, message: '不能删除超级管理员角色' });
        }
        // 保护其他系统角色
        if (role.is_system === 1) {
          await connection.rollback();
          return reply.code(403).send({ success: false, message: '不能删除系统角色' });
        }
      }

      // 删除角色相关的所有关联数据
      await connection.query('DELETE FROM user_roles WHERE role_id = ?', [id]);
      await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [id]);
      await connection.query('DELETE FROM role_departments WHERE role_id = ?', [id]);

      // 删除角色本身
      const [result] = await connection.query('DELETE FROM roles WHERE id = ?', [id]);

      await connection.commit();

      if (result.affectedRows > 0) {
        return { success: true, message: '角色删除成功' };
      } else {
        return { success: false, message: '角色不存在' };
      }
    } catch (error) {
      await connection.rollback();
      console.error('删除角色失败:', error);
      return reply.code(500).send({ success: false, message: '删除角色失败' });
    } finally {
      connection.release();
    }
  });

  // Get role permissions
  fastify.get('/api/roles/:id/permissions', {
    preHandler: requirePermission('system:role:view')
  }, async (request, reply) => {
    const { id } = request.params;
    const connection = await fastify.mysql.getConnection();
    try {
      const [permissions] = await connection.query(`
        SELECT p.*
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
        ORDER BY p.module, p.id
      `, [id]);

      return { success: true, data: permissions };
    } finally {
      connection.release();
    }
  });

  // Add permission to role
  fastify.post('/api/roles/:id/permissions', {
    preHandler: requirePermission('system:role:manage')
  }, async (request, reply) => {
    const { id } = request.params;
    const { permission_id } = request.body;
    const connection = await fastify.mysql.getConnection();
    try {
      // Check if role already has this permission
      const [existing] = await connection.query(
        'SELECT * FROM role_permissions WHERE role_id = ? AND permission_id = ?',
        [id, permission_id]
      );

      if (existing.length > 0) {
        return { success: true, message: '角色已拥有此权限' };
      }

      await connection.query(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
        [id, permission_id]
      );

      return { success: true, message: '权限分配成功' };
    } catch (error) {
      console.error('添加权限失败:', error);
      return { success: false, message: '权限分配失败' };
    } finally {
      connection.release();
    }
  });

  // Delete permission from role
  fastify.delete('/api/roles/:id/permissions/:permissionId', {
    preHandler: requirePermission('system:role:manage')
  }, async (request, reply) => {
    const { id, permissionId } = request.params;
    const connection = await fastify.mysql.getConnection();
    try {
      const [result] = await connection.query(
        'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?',
        [id, permissionId]
      );

      if (result.affectedRows === 0) {
        return { success: false, message: '角色没有此权限' };
      }

      return { success: true, message: '权限移除成功' };
    } catch (error) {
      console.error('移除权限失败:', error);
      return { success: false, message: '权限移除失败' };
    } finally {
      connection.release();
    }
  });

  // Get audit logs
  fastify.get('/api/permissions/audit-logs', {
    preHandler: requirePermission('system:log:view')
  }, async (request, reply) => {
    const { page = 1, limit = 20, employee_id, operation_type } = request.query;
    const offset = (page - 1) * limit;

    const connection = await fastify.mysql.getConnection();
    try {
      let query = `
        SELECT l.*,
               e.real_name as employee_name,
               op.real_name as operator_name
        FROM vacation_audit_logs l
        LEFT JOIN employees e ON l.employee_id = e.id
        LEFT JOIN users op ON l.operator_id = op.id
        WHERE 1=1
      `;
      const params = [];

      if (employee_id) {
        query += ' AND l.employee_id = ?';
        params.push(employee_id);
      }

      if (operation_type) {
        query += ' AND l.operation_type = ?';
        params.push(operation_type);
      }

      // Count total
      const [countResult] = await connection.query(
        `SELECT COUNT(*) as total FROM (${query}) as t`,
        params
      );
      const total = countResult[0].total;

      // Get data
      query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [rows] = await connection.query(query, params);

      return {
        success: true,
        data: rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      };
    } finally {
      connection.release();
    }
  });

  // ==================== 角色部门权限管理 ====================
  // 获取角色的部门权限列表
  fastify.get('/api/roles/:id/departments', {
    preHandler: requirePermission('system:role:view')
  }, async (request, reply) => {
    const { id } = request.params;
    const connection = await fastify.mysql.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT d.*
         FROM departments d
         INNER JOIN role_departments rd ON d.id = rd.department_id
         WHERE rd.role_id = ?
         ORDER BY d.sort_order, d.id`,
        [id]
      );
      return { success: true, data: rows };
    } catch (error) {
      console.error('获取角色部门权限失败:', error);
      return reply.code(500).send({ success: false, error: 'Failed to fetch role departments' });
    } finally {
      connection.release();
    }
  });

  // 为角色添加部门权限
  fastify.post('/api/roles/:id/departments', {
    preHandler: requirePermission('system:role:manage')
  }, async (request, reply) => {
    const { id } = request.params;
    const { department_id } = request.body;
    const connection = await fastify.mysql.getConnection();
    try {
      await connection.query(
        'INSERT IGNORE INTO role_departments (role_id, department_id) VALUES (?, ?)',
        [id, department_id]
      );
      return { success: true, message: '部门权限添加成功' };
    } catch (error) {
      console.error('添加角色部门权限失败:', error);
      return reply.code(500).send({ success: false, error: 'Failed to add department permission' });
    } finally {
      connection.release();
    }
  });

  // 批量设置角色的部门权限
  fastify.put('/api/roles/:id/departments', {
    preHandler: requirePermission('system:role:manage')
  }, async (request, reply) => {
    const { id } = request.params;
    const { department_ids } = request.body;
    const connection = await fastify.mysql.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query('DELETE FROM role_departments WHERE role_id = ?', [id]);

      if (Array.isArray(department_ids) && department_ids.length > 0) {
        const values = department_ids.map(deptId => [id, deptId]);
        await connection.query(
          'INSERT INTO role_departments (role_id, department_id) VALUES ?',
          [values]
        );
      }

      await connection.commit();
      return { success: true, message: '部门权限设置成功', count: department_ids?.length || 0 };
    } catch (error) {
      await connection.rollback();
      console.error('批量设置角色部门权限失败:', error);
      return reply.code(500).send({ success: false, error: 'Failed to update department permissions' });
    } finally {
      connection.release();
    }
  });

  // 移除角色的部门权限
  fastify.delete('/api/roles/:roleId/departments/:departmentId', {
    preHandler: requirePermission('system:role:manage')
  }, async (request, reply) => {
    const { roleId, departmentId } = request.params;
    const connection = await fastify.mysql.getConnection();
    try {
      await connection.query(
        'DELETE FROM role_departments WHERE role_id = ? AND department_id = ?',
        [roleId, departmentId]
      );
      return { success: true, message: '部门权限移除成功' };
    } catch (error) {
      console.error('移除角色部门权限失败:', error);
      return reply.code(500).send({ success: false, error: 'Failed to remove department permission' });
    } finally {
      connection.release();
    }
  });

  // ==================== 员工部门权限管理 ====================
  // 获取员工的部门权限列表
  fastify.get('/api/users/:id/departments', {
    preHandler: requirePermission('user:employee:view')  // 修改权限代码
  }, async (request, reply) => {
    const { id } = request.params;
    const connection = await fastify.mysql.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT d.*
         FROM departments d
         INNER JOIN user_departments ud ON d.id = ud.department_id
         WHERE ud.user_id = ?
         ORDER BY d.sort_order, d.id`,
        [id]
      );
      return { success: true, data: rows };
    } catch (error) {
      console.error('获取员工部门权限失败:', error);
      return reply.code(500).send({ success: false, error: 'Failed to fetch user departments' });
    } finally {
      connection.release();
    }
  });

  // 为员工添加部门权限
  fastify.post('/api/users/:id/departments', {
    preHandler: requirePermission('user:employee:manage')  // 修改权限代码
  }, async (request, reply) => {
    const { id } = request.params;
    const { department_id } = request.body;
    const connection = await fastify.mysql.getConnection();
    try {
      await connection.query(
        'INSERT IGNORE INTO user_departments (user_id, department_id) VALUES (?, ?)',
        [id, department_id]
      );
      return { success: true, message: '部门权限添加成功' };
    } catch (error) {
      console.error('添加员工部门权限失败:', error);
      return reply.code(500).send({ success: false, error: 'Failed to add department permission' });
    } finally {
      connection.release();
    }
  });

  // 批量设置员工的部门权限
  fastify.put('/api/users/:id/departments', {
    preHandler: requirePermission('user:employee:manage')  // 修改权限代码
  }, async (request, reply) => {
    const { id } = request.params;
    const { department_ids } = request.body;
    const connection = await fastify.mysql.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query('DELETE FROM user_departments WHERE user_id = ?', [id]);

      if (Array.isArray(department_ids) && department_ids.length > 0) {
        const values = department_ids.map(deptId => [id, deptId]);
        await connection.query(
          'INSERT INTO user_departments (user_id, department_id) VALUES ?',
          [values]
        );
      }

      await connection.commit();
      return { success: true, message: '部门权限设置成功', count: department_ids?.length || 0 };
    } catch (error) {
      await connection.rollback();
      console.error('批量设置员工部门权限失败:', error);
      return reply.code(500).send({ success: false, error: 'Failed to update department permissions' });
    } finally {
      connection.release();
    }
  });

  // 移除员工的部门权限
  fastify.delete('/api/users/:userId/departments/:departmentId', {
    preHandler: requirePermission('user:employee:manage')  // 修改权限代码
  }, async (request, reply) => {
    const { userId, departmentId } = request.params;
    const connection = await fastify.mysql.getConnection();
    try {
      await connection.query(
        'DELETE FROM user_departments WHERE user_id = ? AND department_id = ?',
        [userId, departmentId]
      );
      return { success: true, message: '部门权限移除成功' };
    } catch (error) {
      console.error('移除员工部门权限失败:', error);
      return reply.code(500).send({ success: false, error: 'Failed to remove department permission' });
    } finally {
      connection.release();
    }
  });

  fastify.get('/api/permission-templates', {
    preHandler: requirePermission('system:role:view')
  }, async (request, reply) => {
    const connection = await fastify.mysql.getConnection();
    try {
      const [rows] = await connection.query('SELECT id, name, description, permission_ids, created_at, updated_at FROM permission_templates ORDER BY id DESC');
      return { success: true, data: rows.map(r => ({ ...r, permission_ids: JSON.parse(r.permission_ids) })) };
    } finally {
      connection.release();
    }
  });

  fastify.get('/api/permission-templates/:id', {
    preHandler: requirePermission('system:role:view')
  }, async (request, reply) => {
    const { id } = request.params;
    const connection = await fastify.mysql.getConnection();
    try {
      const [rows] = await connection.query('SELECT id, name, description, permission_ids, created_at, updated_at FROM permission_templates WHERE id = ?', [id]);
      if (rows.length === 0) return reply.code(404).send({ success: false, message: 'Not found' });
      const r = rows[0];
      return { success: true, data: { ...r, permission_ids: JSON.parse(r.permission_ids) } };
    } finally {
      connection.release();
    }
  });

  fastify.post('/api/permission-templates', {
    preHandler: requirePermission('system:role:manage')
  }, async (request, reply) => {
    const { name, description, permission_ids } = request.body;
    const connection = await fastify.mysql.getConnection();
    try {
      const [result] = await connection.query('INSERT INTO permission_templates (name, description, permission_ids) VALUES (?, ?, ?)', [name, description || null, JSON.stringify(permission_ids || [])]);
      return { success: true, id: result.insertId };
    } finally {
      connection.release();
    }
  });

  fastify.put('/api/permission-templates/:id', {
    preHandler: requirePermission('system:role:manage')
  }, async (request, reply) => {
    const { id } = request.params;
    const { name, description, permission_ids } = request.body;
    const connection = await fastify.mysql.getConnection();
    try {
      await connection.query('UPDATE permission_templates SET name = ?, description = ?, permission_ids = ? WHERE id = ?', [name, description || null, JSON.stringify(permission_ids || []), id]);
      return { success: true };
    } finally {
      connection.release();
    }
  });

  fastify.delete('/api/permission-templates/:id', {
    preHandler: requirePermission('system:role:manage')
  }, async (request, reply) => {
    const { id } = request.params;
    const connection = await fastify.mysql.getConnection();
    try {
      await connection.query('DELETE FROM permission_templates WHERE id = ?', [id]);
      return { success: true };
    } finally {
      connection.release();
    }
  });

  // Get users assigned to a role
  fastify.get('/api/roles/:id/users', {
    preHandler: requirePermission('system:role:view')
  }, async (request, reply) => {
    const { id } = request.params;
    const connection = await fastify.mysql.getConnection();
    try {
      const [users] = await connection.query(`
        SELECT u.id, u.username, u.real_name, u.email, u.phone, u.status, u.department_id, d.name as department_name
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        INNER JOIN user_roles ur ON u.id = ur.user_id
        WHERE ur.role_id = ?
        ORDER BY u.real_name
      `, [id]);

      return { success: true, data: users };
    } finally {
      connection.release();
    }
  });

  // Update users assigned to a role (batch update)
  fastify.put('/api/roles/:id/users', {
    preHandler: requirePermission('system:role:manage')
  }, async (request, reply) => {
    const { id } = request.params;  // role id
    const { userIds } = request.body;  // array of user ids
    const connection = await fastify.mysql.getConnection();
    try {
      await connection.beginTransaction();

      // Delete existing user-role assignments for this role
      await connection.query('DELETE FROM user_roles WHERE role_id = ?', [id]);

      // Insert new user-role assignments
      if (userIds && userIds.length > 0) {
        const values = userIds.map(uid => [uid, id]);
        await connection.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ?',
          [values]
        );
      }

      await connection.commit();
      return { success: true, message: '角色用户分配更新成功' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });

};

module.exports = permissionRoutes;
