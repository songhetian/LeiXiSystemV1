const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const { requirePermission } = require('../middleware/auth')

async function userManagementRoutes(fastify, options) {
  const pool = fastify.mysql

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
}

module.exports = userManagementRoutes
