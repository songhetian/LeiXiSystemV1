const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const { requirePermission } = require('../middleware/auth')

async function userManagementRoutes(fastify, options) {
  const pool = fastify.mysql || options.mysql

  // 获取当前用户权限
  fastify.get('/api/users/permissions', async (request, reply) => {
    const token = request.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return reply.code(401).send({ success: false, message: '未登录' })
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      const userId = decoded.id

      const { getUserPermissions } = require('../utils/permission')
      const permissions = await getUserPermissions(pool, userId)

      return { success: true, permissions }
    } catch (error) {
      console.error('获取权限失败:', error)
      return reply.code(500).send({ success: false, message: '获取权限失败' })
    }
  })

  // 更新用户是否为部门主管
  fastify.put('/api/users/:userId/department-manager', {
    preHandler: requirePermission('user:employee:manage')
  }, async (request, reply) => {
    const { userId } = request.params
    const { isDepartmentManager } = request.body

    try {
      // 执行更新
      await pool.query(
        'UPDATE users SET is_department_manager = ? WHERE id = ?',
        [isDepartmentManager ? 1 : 0, userId]
      )

      return { success: true, message: '更新成功' }
    } catch (error) {
      console.error('更新部门主管标识失败:', error)
      return reply.code(500).send({ success: false, message: '更新失败' })
    }
  })

  // 获取用户的审批人
  fastify.get('/api/users/:userId/approver', async (request, reply) => {
    const { userId } = request.params
    try {
      const [user] = await pool.query('SELECT department_id FROM users WHERE id = ?', [userId])
      if (user.length === 0) {
        return reply.code(404).send({ success: false, message: '用户不存在' })
      }

      // 这里需要引入 findApprover，或者如果不需要复杂逻辑，可以直接查询部门主管
      // 暂时简单实现：查找该部门的主管
      const [managers] = await pool.query(
        `SELECT u.id, u.real_name, e.position
         FROM users u
         LEFT JOIN employees e ON u.id = e.user_id
         WHERE u.department_id = ? AND u.is_department_manager = 1`,
        [user[0].department_id]
      )

      // 如果有多个主管，返回第一个，或者根据具体业务逻辑处理
      // 如果没有主管，可能需要向上级部门查找（这里暂不实现递归查找）
      const approver = managers.length > 0 ? managers[0] : null

      return {
        success: true,
        data: approver
      }
    } catch (error) {
      console.error('获取审批人失败:', error)
      return reply.code(500).send({ success: false, message: '获取审批人失败' })
    }
  })

  // 更新用户个人资料（新增路由）
  fastify.put('/api/users/:userId/profile', {
    preHandler: requirePermission('user:profile:update')
  }, async (request, reply) => {
    const token = request.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return reply.code(401).send({ success: false, message: '未登录' })
    }

    // 验证token
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return reply.code(401).send({ success: false, message: '令牌无效' })
    }

    const { userId } = request.params
    // 检查用户是否在更新自己的资料
    if (decoded.id != userId) {
      // 如果不是更新自己的资料，需要检查是否为超级管理员
      const pool = fastify.mysql
      // 检查是否为超级管理员
      const [userRoles] = await pool.query(
        `SELECT r.name
         FROM roles r
         JOIN user_roles ur ON r.id = ur.role_id
         WHERE ur.user_id = ?`,
        [decoded.id]
      )

      const isAdmin = userRoles.some(r => r.name === '超级管理员');

      // 只有超级管理员才能更新他人的资料
      if (!isAdmin) {
        return reply.code(403).send({ success: false, message: '权限不足' })
      }
    }

    const {
      real_name,
      email,
      phone,
      emergency_contact,
      emergency_phone,
      address,
      education
    } = request.body

    try {
      // 执行更新
      await pool.query(
        `UPDATE users SET
          real_name = ?,
          email = ?,
          phone = ?,
          emergency_contact = ?,
          emergency_phone = ?,
          address = ?,
          education = ?
        WHERE id = ?`,
        [
          real_name || null,
          email || null,
          phone || null,
          emergency_contact || null,
          emergency_phone || null,
          address || null,
          education || null,
          userId
        ]
      )

      return { success: true, message: '个人资料更新成功' }
    } catch (error) {
      console.error('更新个人资料失败:', error)
      return reply.code(500).send({ success: false, message: '更新失败' })
    }
  })
}

module.exports = userManagementRoutes
