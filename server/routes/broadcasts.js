const jwt = require('jsonwebtoken')
const { sendBroadcast } = require('../websocket')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

module.exports = async function (fastify, opts) {
  const pool = fastify.mysql

  // 辅助函数：从token获取用户信息
  const getUserFromToken = (request) => {
    const token = request.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      throw new Error('未登录')
    }
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded
  }

  // 辅助函数：检查用户权限
  const checkBroadcastPermission = async (userId) => {
    const [users] = await pool.query(
      'SELECT role, department_id FROM users WHERE id = ?',
      [userId]
    )

    if (users.length === 0) {
      throw new Error('用户不存在')
    }

    const user = users[0]
    // 超级管理员或部门管理员可以发送广播
    return user.role === '超级管理员' || user.role === '部门管理员'
  }

  // 辅助函数：获取目标用户列表
  const getTargetUsers = async (targetType, targetDepartments, targetRoles, targetUsers, creatorDepartmentId) => {
    let userIds = []

    if (targetType === 'all') {
      // 全体员工
      const [users] = await pool.query('SELECT id FROM users WHERE status = "active"')
      userIds = users.map(u => u.id)
    } else if (targetType === 'department') {
      // 指定部门
      const departments = JSON.parse(targetDepartments || '[]')
      if (departments.length > 0) {
        const placeholders = departments.map(() => '?').join(',')
        const [users] = await pool.query(
          `SELECT id FROM users WHERE department_id IN (${placeholders}) AND status = "active"`,
          departments
        )
        userIds = users.map(u => u.id)
      }
    } else if (targetType === 'role') {
      // 指定角色
      const roles = JSON.parse(targetRoles || '[]')
      if (roles.length > 0) {
        const placeholders = roles.map(() => '?').join(',')
        const [users] = await pool.query(
          `SELECT id FROM users WHERE role IN (${placeholders}) AND status = "active"`,
          roles
        )
        userIds = users.map(u => u.id)
      }
    } else if (targetType === 'individual') {
      // 指定个人
      userIds = JSON.parse(targetUsers || '[]')
    }

    return userIds
  }

  // 创建广播
  fastify.post('/api/broadcasts', async (request, reply) => {
    try {
      const user = getUserFromToken(request)

      // 检查权限
      const hasPermission = await checkBroadcastPermission(user.id)
      if (!hasPermission) {
        return reply.code(403).send({
          success: false,
          message: '没有权限发送广播'
        })
      }

      const {
        title,
        content,
        type = 'info',
        priority = 'normal',
        targetType,
        targetDepartments,
        targetRoles,
        targetUsers,
        expiresAt
      } = request.body

      // 验证必填字段
      if (!title || !content || !targetType) {
        return reply.code(400).send({
          success: false,
          message: '标题、内容和目标类型不能为空'
        })
      }

      // 获取用户部门（用于部门管理员权限限制）
      const [userInfo] = await pool.query(
        'SELECT department_id, role FROM users WHERE id = ?',
        [user.id]
      )
      const creatorDepartmentId = userInfo[0]?.department_id

      // 如果是部门管理员，只能向本部门发送
      if (userInfo[0]?.role === '部门管理员' && targetType === 'department') {
        const departments = JSON.parse(targetDepartments || '[]')
        if (!departments.includes(creatorDepartmentId)) {
          return reply.code(403).send({
            success: false,
            message: '部门管理员只能向本部门发送广播'
          })
        }
      }

      // 创建广播记录
      const [result] = await pool.query(
        `INSERT INTO broadcasts (title, content, type, priority, target_type, target_departments, target_roles, target_users, creator_id, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          content,
          type,
          priority,
          targetType,
          targetDepartments ? JSON.stringify(JSON.parse(targetDepartments)) : null,
          targetRoles ? JSON.stringify(JSON.parse(targetRoles)) : null,
          targetUsers ? JSON.stringify(JSON.parse(targetUsers)) : null,
          user.id,
          expiresAt || null
        ]
      )

      const broadcastId = result.insertId

      // 获取目标用户列表
      const targetUserIds = await getTargetUsers(
        targetType,
        targetDepartments,
        targetRoles,
        targetUsers,
        creatorDepartmentId
      )

      // 创建接收记录
      if (targetUserIds.length > 0) {
        const values = targetUserIds.map(userId => [broadcastId, userId])
        await pool.query(
          'INSERT INTO broadcast_recipients (broadcast_id, user_id) VALUES ?',
          [values]
        )

        // 🔔 实时推送广播（WebSocket）
        if (fastify.io) {
          sendBroadcast(fastify.io, targetUserIds, {
            id: broadcastId,
            type,
            title,
            content,
            priority,
            created_at: new Date()
          })
          console.log(`📣 广播已推送给 ${targetUserIds.length} 个用户`)
        }
      }

      return {
        success: true,
        message: '广播发送成功',
        data: {
          id: broadcastId,
          recipientCount: targetUserIds.length
        }
      }
    } catch (error) {
      console.error('创建广播失败:', error)
      return reply.code(500).send({
        success: false,
        message: error.message || '创建广播失败'
      })
    }
  })

  // 获取我的广播列表（我收到的）
  fastify.get('/api/broadcasts/my-broadcasts', async (request, reply) => {
    try {
      const user = getUserFromToken(request)
      const { page = 1, limit = 20, isRead } = request.query

      const offset = (page - 1) * limit

      let query = `
        SELECT
          b.id,
          b.title,
          b.content,
          b.type,
          b.priority,
          b.created_at,
          b.expires_at,
          br.is_read,
          br.read_at,
          u.real_name as creator_name
        FROM broadcast_recipients br
        INNER JOIN broadcasts b ON br.broadcast_id = b.id
        LEFT JOIN users u ON b.creator_id = u.id
        WHERE br.user_id = ?
      `
      const params = [user.id]

      // 过滤已读/未读
      if (isRead !== undefined) {
        query += ' AND br.is_read = ?'
        params.push(isRead === 'true' ? 1 : 0)
      }

      // 过滤过期的广播
      query += ' AND (b.expires_at IS NULL OR b.expires_at > NOW())'

      query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?'
      params.push(parseInt(limit), parseInt(offset))

      const [broadcasts] = await pool.query(query, params)

      // 获取总数
      let countQuery = `
        SELECT COUNT(*) as total
        FROM broadcast_recipients br
        INNER JOIN broadcasts b ON br.broadcast_id = b.id
        WHERE br.user_id = ?
      `
      const countParams = [user.id]

      if (isRead !== undefined) {
        countQuery += ' AND br.is_read = ?'
        countParams.push(isRead === 'true' ? 1 : 0)
      }

      countQuery += ' AND (b.expires_at IS NULL OR b.expires_at > NOW())'

      const [countResult] = await pool.query(countQuery, countParams)
      const total = countResult[0].total

      return {
        success: true,
        data: broadcasts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('获取广播列表失败:', error)
      return reply.code(500).send({
        success: false,
        message: error.message || '获取广播列表失败'
      })
    }
  })

  // 标记广播为已读
  fastify.put('/api/broadcasts/:id/read', async (request, reply) => {
    try {
      const user = getUserFromToken(request)
      const { id } = request.params

      await pool.query(
        `UPDATE broadcast_recipients
         SET is_read = TRUE, read_at = NOW()
         WHERE broadcast_id = ? AND user_id = ?`,
        [id, user.id]
      )

      return {
        success: true,
        message: '已标记为已读'
      }
    } catch (error) {
      console.error('标记已读失败:', error)
      return reply.code(500).send({
        success: false,
        message: error.message || '标记已读失败'
      })
    }
  })

  // 获取未读广播数
  fastify.get('/api/broadcasts/unread-count', async (request, reply) => {
    try {
      const user = getUserFromToken(request)

      const [result] = await pool.query(
        `SELECT COUNT(*) as count
         FROM broadcast_recipients br
         INNER JOIN broadcasts b ON br.broadcast_id = b.id
         WHERE br.user_id = ? AND br.is_read = FALSE
         AND (b.expires_at IS NULL OR b.expires_at > NOW())`,
        [user.id]
      )

      return {
        success: true,
        count: result[0].count
      }
    } catch (error) {
      console.error('获取未读数失败:', error)
      return reply.code(500).send({
        success: false,
        message: error.message || '获取未读数失败'
      })
    }
  })

  // 获取我创建的广播列表（管理员）
  fastify.get('/api/broadcasts/created', async (request, reply) => {
    try {
      const user = getUserFromToken(request)
      const { page = 1, limit = 20 } = request.query

      const offset = (page - 1) * limit

      const [broadcasts] = await pool.query(
        `SELECT
          b.*,
          (SELECT COUNT(*) FROM broadcast_recipients WHERE broadcast_id = b.id) as recipient_count,
          (SELECT COUNT(*) FROM broadcast_recipients WHERE broadcast_id = b.id AND is_read = TRUE) as read_count
         FROM broadcasts b
         WHERE b.creator_id = ?
         ORDER BY b.created_at DESC
         LIMIT ? OFFSET ?`,
        [user.id, parseInt(limit), parseInt(offset)]
      )

      const [countResult] = await pool.query(
        'SELECT COUNT(*) as total FROM broadcasts WHERE creator_id = ?',
        [user.id]
      )

      return {
        success: true,
        data: broadcasts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      }
    } catch (error) {
      console.error('获取创建的广播失败:', error)
      return reply.code(500).send({
        success: false,
        message: error.message || '获取创建的广播失败'
      })
    }
  })
}
