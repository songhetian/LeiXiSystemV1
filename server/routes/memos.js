// 备忘录管理 API
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

module.exports = async function (fastify, opts) {
  const pool = fastify.mysql

  // ==================== 个人备忘录 API ====================

  // 创建个人备忘录
  fastify.post('/api/memos/personal', async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        return reply.code(401).send({ success: false, message: '未提供认证令牌' })
      }

      let decoded
      try {
        decoded = jwt.verify(token, JWT_SECRET)
      } catch (error) {
        return reply.code(401).send({ success: false, message: '无效的认证令牌' })
      }

      const { title, content, priority = 'normal' } = request.body

      if (!title || !content) {
        return reply.code(400).send({ success: false, message: '标题和内容不能为空' })
      }

      const [result] = await pool.query(
        `INSERT INTO memos (user_id, title, content, type, priority)
         VALUES (?, ?, ?, 'personal', ?)`,
        [decoded.id, title, content, priority]
      )

      return {
        success: true,
        message: '备忘录创建成功',
        data: { id: result.insertId }
      }
    } catch (error) {
      console.error('创建个人备忘录失败:', error)
      return reply.code(500).send({ success: false, message: '创建失败' })
    }
  })

  // 获取我的备忘录列表（个人创建的 + 接收到的部门备忘录）
  fastify.get('/api/memos/my-memos', async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        return reply.code(401).send({ success: false, message: '未提供认证令牌' })
      }

      let decoded
      try {
        decoded = jwt.verify(token, JWT_SECRET)
      } catch (error) {
        return reply.code(401).send({ success: false, message: '无效的认证令牌' })
      }

      const { page = 1, pageSize = 20, isRead, priority, search } = request.query
      const offset = (page - 1) * pageSize

      let whereClauses = []
      let params = []

      // 构建查询：个人备忘录 OR 接收到的部门备忘录
      let query = `
        SELECT
          m.id,
          m.user_id,
          m.title,
          m.content,
          m.type,
          m.priority,
          CASE
            WHEN m.type = 'personal' THEN m.is_read
            ELSE COALESCE(mr.is_read, 0)
          END as is_read,
          CASE
            WHEN m.type = 'personal' THEN NULL
            ELSE mr.read_at
          END as read_at,
          m.created_at,
          m.updated_at,
          u.real_name as creator_name,
          d.name as creator_department
        FROM memos m
        LEFT JOIN memo_recipients mr ON m.id = mr.memo_id AND mr.user_id = ?
        LEFT JOIN users u ON m.user_id = u.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE m.deleted_at IS NULL
        AND (
          (m.type = 'personal' AND m.user_id = ?)
          OR (m.type = 'department' AND mr.user_id = ?)
        )
      `
      params.push(decoded.id, decoded.id, decoded.id)

      // 筛选条件
      if (isRead !== undefined) {
        query += ` AND (
          (m.type = 'personal' AND m.is_read = ?)
          OR (m.type = 'department' AND mr.is_read = ?)
        )`
        params.push(parseInt(isRead), parseInt(isRead))
      }

      if (priority) {
        query += ` AND m.priority = ?`
        params.push(priority)
      }

      if (search) {
        query += ` AND (m.title LIKE ? OR m.content LIKE ?)`
        params.push(`%${search}%`, `%${search}%`)
      }

      // 获取总数
      const countQuery = query.replace(/SELECT[\s\S]*FROM/, 'SELECT COUNT(*) as total FROM')
      const [countResult] = await pool.query(countQuery, params)
      const total = countResult[0].total

      // 分页查询
      query += ` ORDER BY m.created_at DESC LIMIT ? OFFSET ?`
      params.push(parseInt(pageSize), offset)

      const [memos] = await pool.query(query, params)

      return {
        success: true,
        data: memos,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    } catch (error) {
      console.error('获取备忘录列表失败:', error)
      return reply.code(500).send({ success: false, message: '获取失败' })
    }
  })

  // 获取未读备忘录数量
  fastify.get('/api/memos/unread-count', async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        return reply.code(401).send({ success: false, message: '未提供认证令牌' })
      }

      let decoded
      try {
        decoded = jwt.verify(token, JWT_SECRET)
      } catch (error) {
        return reply.code(401).send({ success: false, message: '无效的认证令牌' })
      }

      const [result] = await pool.query(
        `SELECT COUNT(*) as count FROM (
          SELECT m.id FROM memos m
          WHERE m.deleted_at IS NULL
          AND m.type = 'personal'
          AND m.user_id = ?
          AND m.is_read = 0
          UNION ALL
          SELECT m.id FROM memos m
          INNER JOIN memo_recipients mr ON m.id = mr.memo_id
          WHERE m.deleted_at IS NULL
          AND m.type = 'department'
          AND mr.user_id = ?
          AND mr.is_read = 0
        ) as unread_memos`,
        [decoded.id, decoded.id]
      )

      return {
        success: true,
        count: result[0].count
      }
    } catch (error) {
      console.error('获取未读数量失败:', error)
      return reply.code(500).send({ success: false, message: '获取失败' })
    }
  })

  // 获取未读备忘录列表（用于弹窗）
  fastify.get('/api/memos/unread-list', async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        return reply.code(401).send({ success: false, message: '未提供认证令牌' })
      }

      let decoded
      try {
        decoded = jwt.verify(token, JWT_SECRET)
      } catch (error) {
        return reply.code(401).send({ success: false, message: '无效的认证令牌' })
      }

      const [memos] = await pool.query(
        `SELECT
          m.id,
          m.title,
          m.content,
          m.type,
          m.priority,
          m.created_at,
          u.real_name as creator_name
        FROM memos m
        LEFT JOIN memo_recipients mr ON m.id = mr.memo_id AND mr.user_id = ?
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.deleted_at IS NULL
        AND (
          (m.type = 'personal' AND m.user_id = ? AND m.is_read = 0)
          OR (m.type = 'department' AND mr.user_id = ? AND mr.is_read = 0)
        )
        ORDER BY m.priority DESC, m.created_at DESC`,
        [decoded.id, decoded.id, decoded.id]
      )

      return {
        success: true,
        data: memos
      }
    } catch (error) {
      console.error('获取未读备忘录列表失败:', error)
      return reply.code(500).send({ success: false, message: '获取失败' })
    }
  })

  // 标记备忘录为已读
  fastify.put('/api/memos/:id/read', async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        return reply.code(401).send({ success: false, message: '未提供认证令牌' })
      }

      let decoded
      try {
        decoded = jwt.verify(token, JWT_SECRET)
      } catch (error) {
        return reply.code(401).send({ success: false, message: '无效的认证令牌' })
      }

      const { id } = request.params

      // 获取备忘录信息
      const [memos] = await pool.query(
        'SELECT type, user_id FROM memos WHERE id = ? AND deleted_at IS NULL',
        [id]
      )

      if (memos.length === 0) {
        return reply.code(404).send({ success: false, message: '备忘录不存在' })
      }

      const memo = memos[0]

      if (memo.type === 'personal') {
        // 个人备忘录：更新memos表
        if (memo.user_id !== decoded.id) {
          return reply.code(403).send({ success: false, message: '无权操作此备忘录' })
        }

        await pool.query(
          'UPDATE memos SET is_read = 1 WHERE id = ?',
          [id]
        )
      } else {
        // 部门备忘录：更新memo_recipients表
        await pool.query(
          'UPDATE memo_recipients SET is_read = 1, read_at = NOW() WHERE memo_id = ? AND user_id = ?',
          [id, decoded.id]
        )
      }

      return {
        success: true,
        message: '已标记为已读'
      }
    } catch (error) {
      console.error('标记已读失败:', error)
      return reply.code(500).send({ success: false, message: '操作失败' })
    }
  })

  // 更新个人备忘录
  fastify.put('/api/memos/personal/:id', async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        return reply.code(401).send({ success: false, message: '未提供认证令牌' })
      }

      let decoded
      try {
        decoded = jwt.verify(token, JWT_SECRET)
      } catch (error) {
        return reply.code(401).send({ success: false, message: '无效的认证令牌' })
      }

      const { id } = request.params
      const { title, content, priority } = request.body

      // 验证权限
      const [memos] = await pool.query(
        'SELECT type, user_id FROM memos WHERE id = ? AND deleted_at IS NULL',
        [id]
      )

      if (memos.length === 0) {
        return reply.code(404).send({ success: false, message: '备忘录不存在' })
      }

      const memo = memos[0]

      if (memo.type !== 'personal') {
        return reply.code(403).send({ success: false, message: '部门备忘录不允许修改' })
      }

      if (memo.user_id !== decoded.id) {
        return reply.code(403).send({ success: false, message: '无权修改此备忘录' })
      }

      // 更新
      const updateFields = []
      const updateValues = []

      if (title !== undefined) {
        updateFields.push('title = ?')
        updateValues.push(title)
      }
      if (content !== undefined) {
        updateFields.push('content = ?')
        updateValues.push(content)
      }
      if (priority !== undefined) {
        updateFields.push('priority = ?')
        updateValues.push(priority)
      }

      if (updateFields.length === 0) {
        return reply.code(400).send({ success: false, message: '没有提供需要更新的字段' })
      }

      updateValues.push(id)
      await pool.query(
        `UPDATE memos SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      )

      return {
        success: true,
        message: '更新成功'
      }
    } catch (error) {
      console.error('更新备忘录失败:', error)
      return reply.code(500).send({ success: false, message: '更新失败' })
    }
  })

  // 删除个人备忘录（软删除）
  fastify.delete('/api/memos/personal/:id', async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        return reply.code(401).send({ success: false, message: '未提供认证令牌' })
      }

      let decoded
      try {
        decoded = jwt.verify(token, JWT_SECRET)
      } catch (error) {
        return reply.code(401).send({ success: false, message: '无效的认证令牌' })
      }

      const { id } = request.params

      // 验证权限
      const [memos] = await pool.query(
        'SELECT type, user_id FROM memos WHERE id = ? AND deleted_at IS NULL',
        [id]
      )

      if (memos.length === 0) {
        return reply.code(404).send({ success: false, message: '备忘录不存在' })
      }

      const memo = memos[0]

      if (memo.type !== 'personal') {
        return reply.code(403).send({ success: false, message: '部门备忘录不允许删除' })
      }

      if (memo.user_id !== decoded.id) {
        return reply.code(403).send({ success: false, message: '无权删除此备忘录' })
      }

      // 软删除
      await pool.query(
        'UPDATE memos SET deleted_at = NOW() WHERE id = ?',
        [id]
      )

      return {
        success: true,
        message: '删除成功'
      }
    } catch (error) {
      console.error('删除备忘录失败:', error)
      return reply.code(500).send({ success: false, message: '删除失败' })
    }
  })

  // ==================== 部门备忘录 API ====================

  // 创建部门备忘录
  fastify.post('/api/memos/department', async (request, reply) => {
    const connection = await pool.getConnection()
    try {
      const token = request.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        connection.release()
        return reply.code(401).send({ success: false, message: '未提供认证令牌' })
      }

      let decoded
      try {
        decoded = jwt.verify(token, JWT_SECRET)
      } catch (error) {
        connection.release()
        return reply.code(401).send({ success: false, message: '无效的认证令牌' })
      }

      const { title, content, priority = 'normal', sendMode, targetDepartmentId, targetUserId } = request.body

      if (!title || !content) {
        connection.release()
        return reply.code(400).send({ success: false, message: '标题和内容不能为空' })
      }

      if (!sendMode || !['department', 'individual'].includes(sendMode)) {
        connection.release()
        return reply.code(400).send({ success: false, message: '发送模式无效' })
      }

      if (sendMode === 'department' && !targetDepartmentId) {
        connection.release()
        return reply.code(400).send({ success: false, message: '请选择目标部门' })
      }

      if (sendMode === 'individual' && !targetUserId) {
        connection.release()
        return reply.code(400).send({ success: false, message: '请选择目标员工' })
      }

      await connection.beginTransaction()

      // 创建备忘录记录
      const [memoResult] = await connection.query(
        `INSERT INTO memos (user_id, title, content, type, priority, target_department_id, target_user_id)
         VALUES (?, ?, ?, 'department', ?, ?, ?)`,
        [decoded.id, title, content, priority, targetDepartmentId || null, targetUserId || null]
      )

      const memoId = memoResult.insertId

      // 获取目标用户列表
      let targetUsers = []
      if (sendMode === 'department') {
        const [users] = await connection.query(
          `SELECT id FROM users WHERE department_id = ? AND status = 'active'`,
          [targetDepartmentId]
        )
        targetUsers = users
      } else {
        const [users] = await connection.query(
          `SELECT id FROM users WHERE id = ? AND status = 'active'`,
          [targetUserId]
        )
        targetUsers = users
      }

      if (targetUsers.length === 0) {
        await connection.rollback()
        connection.release()
        return reply.code(400).send({ success: false, message: '目标部门/员工无有效用户' })
      }

      // 批量创建接收记录
      const recipientValues = targetUsers.map(user => [memoId, user.id])
      await connection.query(
        `INSERT INTO memo_recipients (memo_id, user_id) VALUES ?`,
        [recipientValues]
      )

      await connection.commit()
      connection.release()

      // 实时推送功能 - 获取WebSocket实例并发送通知
      try {
        const { sendMemoToUser } = require('../websocket')
        const io = fastify.io

        // 构造备忘录对象用于推送
        const memoForPush = {
          id: memoId,
          title: title,
          content: content,
          type: 'department',
          priority: priority,
          created_at: new Date().toISOString()
        }

        // 向所有目标用户推送备忘录
        let successCount = 0
        let failCount = 0

        targetUsers.forEach(user => {
          try {
            sendMemoToUser(io, user.id, memoForPush)
            successCount++
          } catch (userPushError) {
            console.error(`向用户 ${user.id} 推送备忘录失败:`, userPushError)
            failCount++
          }
        })

        console.log(`📝 [WebSocket] 备忘录推送完成 - 成功: ${successCount}, 失败: ${failCount}, 总计: ${targetUsers.length}`)
      } catch (pushError) {
        console.error('实时推送备忘录失败:', pushError)
        // 不影响主流程，继续执行
      }

      return {
        success: true,
        message: '备忘录发送成功',
        data: {
          id: memoId,
          recipientCount: targetUsers.length
        }
      }
    } catch (error) {
      await connection.rollback()
      connection.release()
      console.error('创建部门备忘录失败:', error)
      return reply.code(500).send({ success: false, message: '创建失败' })
    }
  })

  // 获取我创建的部门备忘录列表
  fastify.get('/api/memos/department/created', async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        return reply.code(401).send({ success: false, message: '未提供认证令牌' })
      }

      let decoded
      try {
        decoded = jwt.verify(token, JWT_SECRET)
      } catch (error) {
        return reply.code(401).send({ success: false, message: '无效的认证令牌' })
      }

      const { page = 1, pageSize = 20, departmentId } = request.query
      const offset = (page - 1) * pageSize

      let query = `
        SELECT
          m.id,
          m.title,
          m.content,
          m.priority,
          m.target_department_id,
          m.target_user_id,
          m.created_at,
          d.name as department_name,
          u.real_name as target_user_name,
          (SELECT COUNT(*) FROM memo_recipients WHERE memo_id = m.id) as total_recipients,
          (SELECT COUNT(*) FROM memo_recipients WHERE memo_id = m.id AND is_read = 1) as read_count
        FROM memos m
        LEFT JOIN departments d ON m.target_department_id = d.id
        LEFT JOIN users u ON m.target_user_id = u.id
        WHERE m.type = 'department'
        AND m.user_id = ?
        AND m.deleted_at IS NULL
      `
      const params = [decoded.id]

      if (departmentId) {
        query += ` AND m.target_department_id = ?`
        params.push(departmentId)
      }

      // 获取总数
      const countQuery = query.replace(/SELECT[\s\S]*FROM/, 'SELECT COUNT(*) as total FROM')
      const [countResult] = await pool.query(countQuery, params)
      const total = countResult[0].total

      // 分页查询
      query += ` ORDER BY m.created_at DESC LIMIT ? OFFSET ?`
      params.push(parseInt(pageSize), offset)

      const [memos] = await pool.query(query, params)

      return {
        success: true,
        data: memos,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    } catch (error) {
      console.error('获取部门备忘录列表失败:', error)
      return reply.code(500).send({ success: false, message: '获取失败' })
    }
  })

  // 获取部门备忘录详情及接收者列表
  fastify.get('/api/memos/department/:id/recipients', async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        return reply.code(401).send({ success: false, message: '未提供认证令牌' })
      }

      let decoded
      try {
        decoded = jwt.verify(token, JWT_SECRET)
      } catch (error) {
        return reply.code(401).send({ success: false, message: '无效的认证令牌' })
      }

      const { id } = request.params

      // 获取备忘录详情
      const [memos] = await pool.query(
        `SELECT
          m.*,
          d.name as department_name,
          creator.real_name as creator_name
        FROM memos m
        LEFT JOIN departments d ON m.target_department_id = d.id
        LEFT JOIN users creator ON m.user_id = creator.id
        WHERE m.id = ? AND m.type = 'department' AND m.deleted_at IS NULL`,
        [id]
      )

      if (memos.length === 0) {
        return reply.code(404).send({ success: false, message: '备忘录不存在' })
      }

      const memo = memos[0]

      // 验证权限：只有创建者可以查看接收者列表
      if (memo.user_id !== decoded.id) {
        return reply.code(403).send({ success: false, message: '无权查看此备忘录的接收者列表' })
      }

      // 获取接收者列表
      const [recipients] = await pool.query(
        `SELECT
          mr.user_id,
          mr.is_read,
          mr.read_at,
          u.real_name,
          u.username,
          d.name as department_name
        FROM memo_recipients mr
        INNER JOIN users u ON mr.user_id = u.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE mr.memo_id = ?
        ORDER BY mr.is_read ASC, u.real_name ASC`,
        [id]
      )

      return {
        success: true,
        data: {
          memo,
          recipients
        }
      }
    } catch (error) {
      console.error('获取备忘录接收者列表失败:', error)
      return reply.code(500).send({ success: false, message: '获取失败' })
    }
  })
}
