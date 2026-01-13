// 部门管理 API
const { extractUserPermissions } = require('../middleware/checkPermission')

module.exports = async function (fastify, opts) {
  const pool = fastify.mysql

  // 获取部门列表
  fastify.get('/api/departments/list', async (request, reply) => {
    try {
      // 获取用户权限
      const permissions = await extractUserPermissions(request, pool)

      let query = 'SELECT * FROM departments WHERE 1=1'
      const params = []

      // 权限控制
      if (permissions) {
        // 根据用户权限过滤部门
        // 优先使用 viewableDepartmentIds（配置的部门权限）
        if (permissions.viewableDepartmentIds && permissions.viewableDepartmentIds.length > 0) {
          query += ` AND id IN (${permissions.viewableDepartmentIds.map(() => '?').join(',')})`
          params.push(...permissions.viewableDepartmentIds)
        } else if (permissions.departmentId) {
          // 如果没有配置部门权限，则只能看到自己所在的部门
          query += ' AND id = ?'
          params.push(permissions.departmentId)
        } else {
          // 没有任何部门权限
          return { success: true, data: [] }
        }
      } else {
        // 未登录用户可以查看所有启用的部门
        query += ' AND status = "active"'
      }

      query += ' ORDER BY sort_order, id'

      const [rows] = await pool.query(query, params)
      return { success: true, data: rows }
    } catch (error) {
      console.error('获取部门列表失败:', error)
      return reply.code(500).send({ success: false, message: '获取失败' })
    }
  })

  // 获取所有部门列表（用于管理场景，绕过权限检查）
  fastify.get('/api/departments/all', async (request, reply) => {
    const redis = fastify.redis;
    const cacheKey = 'metadata:departments:all';

    try {
      // 1. 尝试从 Redis 获取
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return { success: true, data: JSON.parse(cached) };
        }
      }

      // 2. Redis 没有，查 MySQL
      let query = 'SELECT * FROM departments WHERE status = "active" ORDER BY sort_order, id'
      const [rows] = await pool.query(query)

      // 3. 写入 Redis (有效期 24 小时，因为变更会自动清理)
      if (redis) {
        await redis.set(cacheKey, JSON.stringify(rows), 'EX', 86400);
      }

      return { success: true, data: rows }
    } catch (error) {
      console.error('获取所有部门列表失败:', error)
      return reply.code(500).send({ success: false, message: '获取失败' })
    }
  })

  // 获取单个部门详情
  fastify.get('/api/departments/detail/:id', async (request, reply) => {
    const { id } = request.params
    const redis = fastify.redis;
    const cacheKey = `metadata:department:detail:${id}`;

    try {
      // 尝试从缓存获取
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) return { success: true, data: JSON.parse(cached) };
      }

      const [rows] = await pool.query('SELECT * FROM departments WHERE id = ?', [id])
      if (rows.length === 0) {
        return reply.code(404).send({ success: false, message: '部门不存在' })
      }

      if (redis) {
        await redis.set(cacheKey, JSON.stringify(rows[0]), 'EX', 3600);
      }

      return { success: true, data: rows[0] }
    } catch (error) {
      console.error('获取部门详情失败:', error)
      return reply.code(500).send({ success: false, message: '获取失败' })
    }
  })

  // 创建部门
  fastify.post('/api/departments/create', async (request, reply) => {
    const { name, parent_id, description, manager_id, status, sort_order } = request.body
    const redis = fastify.redis;

    try {
      // 验证必填字段
      if (!name) {
        return reply.code(400).send({ success: false, message: '请填写部门名称' })
      }

      // 检查部门名称是否已存在
      const [existing] = await pool.query('SELECT id FROM departments WHERE name = ?', [name])
      if (existing.length > 0) {
        return reply.code(400).send({ success: false, message: '部门名称已存在' })
      }

      const [result] = await pool.query(
        `INSERT INTO departments
        (name, parent_id, description, manager_id, status, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          name,
          parent_id || null,
          description || null,
          manager_id || null,
          status || 'active',
          sort_order || 0
        ]
      )

      // 清理部门列表缓存
      if (redis) {
        await redis.del('metadata:departments:all');
      }

      // --- Auto-Create Chat Group for Department ---
      try {
        const deptId = result.insertId;
        // Find a valid owner (Manager or First User)
        let ownerId = manager_id;
        if (!ownerId) {
            const [firstUser] = await pool.query('SELECT id FROM users ORDER BY id ASC LIMIT 1');
            if (firstUser.length > 0) ownerId = firstUser[0].id;
        }
        
        if (ownerId) {
            await pool.query(
                'INSERT INTO chat_groups (name, owner_id, type, department_id) VALUES (?, ?, ?, ?)',
                [name, ownerId, 'group', deptId]
            );

            // Record Operation Log
            await recordLog(pool, {
                user_id: 0, // System action
                username: 'system',
                real_name: '系统自动',
                module: 'messaging',
                action: `自动为新部门 [${name}] 创建聊天群组`,
                method: 'SYSTEM',
                url: '/api/departments/create',
                ip: '127.0.0.1',
                status: 1
            });
        }
      } catch (groupErr) {
          console.error('Failed to auto-create group for department:', groupErr);
          // Don't fail the request, just log it.
      }

      return {
        success: true,
        message: '部门创建成功',
        data: { id: result.insertId }
      }
    } catch (error) {
      console.error('创建部门失败:', error)
      return reply.code(500).send({ success: false, message: '创建失败' })
    }
  })

  // 更新部门
  fastify.put('/api/departments/update/:id', async (request, reply) => {
    const { id } = request.params
    const { name, parent_id, description, manager_id, status, sort_order } = request.body
    const redis = fastify.redis;

    try {
      // 检查部门是否存在
      const [existing] = await pool.query('SELECT id FROM departments WHERE id = ?', [id])
      if (existing.length === 0) {
        return reply.code(404).send({ success: false, message: '部门不存在' })
      }

      // 检查名称是否与其他部门重复
      const [nameCheck] = await pool.query('SELECT id FROM departments WHERE name = ? AND id != ?', [name, id])
      if (nameCheck.length > 0) {
        return reply.code(400).send({ success: false, message: '部门名称已存在' })
      }

      await pool.query(
        `UPDATE departments SET
        name = ?, parent_id = ?, description = ?, manager_id = ?, status = ?, sort_order = ?
        WHERE id = ?`,
        [
          name,
          parent_id || null,
          description || null,
          manager_id || null,
          status || 'active',
          sort_order || 0,
          id
        ]
      )

      // --- Sync Name to Chat Group ---
      try {
          await pool.query('UPDATE chat_groups SET name = ? WHERE department_id = ?', [name, id]);
      } catch (syncErr) {
          console.error('Failed to sync group name:', syncErr);
      }

      // 清理缓存
      if (redis) {
        await redis.del('metadata:departments:all');
        await redis.del(`metadata:department:detail:${id}`);
      }

      return { success: true, message: '部门更新成功' }
    } catch (error) {
      console.error('更新部门失败:', error)
      return reply.code(500).send({ success: false, message: '更新失败' })
    }
  })

  // 删除部门
  fastify.delete('/api/departments/delete/:id', async (request, reply) => {
    const { id } = request.params
    const redis = fastify.redis;

    try {
      // 检查部门是否存在
      const [existing] = await pool.query('SELECT id FROM departments WHERE id = ?', [id])
      if (existing.length === 0) {
        return reply.code(404).send({ success: false, message: '部门不存在' })
      }

      // 检查是否有员工属于该部门
      const [employeeCheck] = await pool.query('SELECT id FROM users WHERE department_id = ?', [id])
      if (employeeCheck.length > 0) {
        return reply.code(400).send({ success: false, message: '该部门下有员工，无法删除' })
      }

      // 检查是否有职位属于该部门
      const [positionCheck] = await pool.query('SELECT id FROM positions WHERE department_id = ?', [id])
      if (positionCheck.length > 0) {
        return reply.code(400).send({ success: false, message: '该部门下有职位，无法删除' })
      }

      await pool.query('DELETE FROM departments WHERE id = ?', [id])

      // --- Sync Delete Chat Group ---
      try {
          await pool.query('DELETE FROM chat_groups WHERE department_id = ?', [id]);
      } catch (syncErr) {
          console.error('Failed to delete department chat group:', syncErr);
      }

      // 清理缓存
      if (redis) {
        await redis.del('metadata:departments:all');
        await redis.del(`metadata:department:detail:${id}`);
      }

      return { success: true, message: '部门删除成功' }
    } catch (error) {
      console.error('删除部门失败:', error)
      return reply.code(500).send({ success: false, message: '删除失败' })
    }
  })

  // 获取部门员工列表
  fastify.get('/api/departments/employees/:departmentId', async (request, reply) => {
    const { departmentId } = request.params

    try {

      // 查询该部门的所有员工（通过employees表关联users表）
      const [employees] = await pool.query(
        `SELECT
          e.id,
          e.employee_no,
          e.user_id,
          u.real_name,
          u.username,
          u.email,
          u.phone,
          u.department_id,
          pos.name as position,
          e.hire_date,
          e.status,
          e.rating
        FROM employees e
        INNER JOIN users u ON e.user_id = u.id
        LEFT JOIN positions pos ON e.position_id = pos.id
        WHERE u.department_id = ? AND u.status = 'active' AND e.status = 'active'
        ORDER BY e.employee_no`,
        [departmentId]
      )

      return {
        success: true,
        data: employees
      }
    } catch (error) {
      console.error('获取部门员工失败:', error)
      return reply.code(500).send({
        success: false,
        message: '获取部门员工失败: ' + error.message
      })
    }
  })
}
