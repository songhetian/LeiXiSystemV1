// 通知管理 API
module.exports = async function (fastify, opts) {
  const pool = fastify.mysql

  // 获取通知列表（支持筛选和分页）
  fastify.get('/api/notifications', async (request, reply) => {
    const {
      userId,
      page = 1,
      pageSize = 10,
      search,
      type,
      isRead,
      startDate,
      endDate
    } = request.query

    try {
      if (!userId) {
        return reply.code(400).send({ success: false, message: '缺少用户ID参数' })
      }

      const offset = (parseInt(page) - 1) * parseInt(pageSize)
      let query = `
        SELECT
          id,
          user_id,
          type,
          title,
          content,
          related_id,
          related_type,
          is_read,
          created_at
        FROM notifications
        WHERE user_id = ?
      `
      const params = [userId]

      // 搜索筛选
      if (search) {
        query += ' AND (title LIKE ? OR content LIKE ?)'
        params.push(`%${search}%`, `%${search}%`)
      }

      // 类型筛选（支持多个类型，逗号分隔）
      if (type) {
        const types = type.split(',').map(t => t.trim())
        const placeholders = types.map(() => '?').join(',')
        query += ` AND type IN (${placeholders})`
        params.push(...types)
      }

      // 已读状态筛选
      if (isRead !== undefined && isRead !== '') {
        query += ' AND is_read = ?'
        params.push(isRead === 'true' || isRead === '1' ? 1 : 0)
      }

      // 日期范围筛选
      if (startDate) {
        query += ' AND DATE(created_at) >= ?'
        params.push(startDate)
      }
      if (endDate) {
        query += ' AND DATE(created_at) <= ?'
        params.push(endDate)
      }

      // 获取总数
      const countQuery = query.replace(
        'SELECT\n          id,\n          user_id,\n          type,\n          title,\n          content,\n          related_id,\n          related_type,\n          is_read,\n          created_at',
        'SELECT COUNT(*) as total'
      )
      const [countResult] = await pool.query(countQuery, params)
      const total = countResult[0].total

      // 分页查询
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
      params.push(parseInt(pageSize), offset)

      const [notifications] = await pool.query(query, params)

      return {
        success: true,
        data: notifications,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize))
        }
      }
    } catch (error) {
      console.error('获取通知列表失败:', error)
      return reply.code(500).send({ success: false, message: '获取通知失败' })
    }
  })

  // 获取未读通知数量
  fastify.get('/api/notifications/unread-count', async (request, reply) => {
    const { userId } = request.query
    const redis = fastify.redis

    try {
      if (!userId) {
        return reply.code(400).send({ success: false, message: '缺少用户ID参数' })
      }

      const cacheKey = `user:unread_count:${userId}`;
      
      // 1. 尝试从 Redis 获取
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached !== null) {
          return { success: true, count: parseInt(cached) };
        }
      }

      // 2. Redis 没有，查 MySQL
      const [result] = await pool.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
        [userId]
      )

      const count = result[0].count;

      // 3. 写入 Redis
      if (redis) {
        await redis.set(cacheKey, count, 'EX', 3600);
      }

      return {
        success: true,
        count: count
      }
    } catch (error) {
      console.error('获取未读数量失败:', error)
      return reply.code(500).send({ success: false, message: '获取未读数量失败' })
    }
  })

  // 标记单条通知为已读
  fastify.put('/api/notifications/:id/read', async (request, reply) => {
    const { id } = request.params
    const redis = fastify.redis

    try {
      // 获取 userId 用于清理缓存
      const [rows] = await pool.query('SELECT user_id FROM notifications WHERE id = ?', [id]);
      if (rows.length === 0) {
        return reply.code(404).send({ success: false, message: '通知不存在' })
      }
      const userId = rows[0].user_id;

      const [result] = await pool.query(
        'UPDATE notifications SET is_read = 1 WHERE id = ?',
        [id]
      )

      if (result.affectedRows === 0) {
        return reply.code(404).send({ success: false, message: '通知不存在' })
      }

      // 清理 Redis 缓存
      if (redis) {
        await redis.del(`user:unread_count:${userId}`);
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

  // 标记所有通知为已读
  fastify.put('/api/notifications/read-all', async (request, reply) => {
    const { userId } = request.body
    const redis = fastify.redis

    try {
      if (!userId) {
        return reply.code(400).send({ success: false, message: '缺少用户ID参数' })
      }

      await pool.query(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
        [userId]
      )

      // 更新 Redis 缓存为 0
      if (redis) {
        await redis.set(`user:unread_count:${userId}`, 0, 'EX', 3600);
      }

      return {
        success: true,
        message: '已全部标记为已读'
      }
    } catch (error) {
      console.error('标记全部已读失败:', error)
      return reply.code(500).send({ success: false, message: '操作失败' })
    }
  })

  // 删除通知
  fastify.delete('/api/notifications/:id', async (request, reply) => {
    const { id } = request.params
    const redis = fastify.redis

    try {
      // 获取 userId 用于清理缓存
      const [rows] = await pool.query('SELECT user_id FROM notifications WHERE id = ?', [id]);
      if (rows.length === 0) {
        return reply.code(404).send({ success: false, message: '通知不存在' })
      }
      const userId = rows[0].user_id;

      const [result] = await pool.query(
        'DELETE FROM notifications WHERE id = ?',
        [id]
      )

      if (result.affectedRows === 0) {
        return reply.code(404).send({ success: false, message: '通知不存在' })
      }

      // 清理 Redis 缓存
      if (redis) {
        await redis.del(`user:unread_count:${userId}`);
      }

      return {
        success: true,
        message: '删除成功'
      }
    } catch (error) {
      console.error('删除通知失败:', error)
      return reply.code(500).send({ success: false, message: '删除失败' })
    }
  })

  // 清理旧通知（性能优化）
  // 自动删除30天前的已读通知
  fastify.post('/api/notifications/cleanup', async (request, reply) => {
    const { days = 30 } = request.body
    const redis = fastify.redis

    try {
      const [result] = await pool.query(
        `DELETE FROM notifications
         WHERE is_read = 1
         AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [days]
      )

      // 注意：这里清理的是已读通知，通常不影响未读数
      // 但为了保险起见，如果有大量变动，可以让受影响用户的缓存失效
      // 简化处理：这里可以不清理，或者清理所有用户的未读计数缓存（如果需要极其精确）

      return {
        success: true,
        message: `已清理 ${result.affectedRows} 条旧通知`,
        deletedCount: result.affectedRows
      }
    } catch (error) {
      console.error('清理旧通知失败:', error)
      return reply.code(500).send({ success: false, message: '清理失败' })
    }
  })

  // 获取通知统计信息
  fastify.get('/api/notifications/stats', async (request, reply) => {
    const { userId } = request.query

    try {
      if (!userId) {
        return reply.code(400).send({ success: false, message: '缺少用户ID参数' })
      }

      // 获取各类型通知数量
      const [typeStats] = await pool.query(
        `SELECT type, COUNT(*) as count, SUM(is_read = 0) as unread_count
         FROM notifications
         WHERE user_id = ?
         GROUP BY type`,
        [userId]
      )

      // 获取总数
      const [totalStats] = await pool.query(
        `SELECT
           COUNT(*) as total,
           SUM(is_read = 0) as unread,
           SUM(is_read = 1) as read
         FROM notifications
         WHERE user_id = ?`,
        [userId]
      )

      return {
        success: true,
        data: {
          total: totalStats[0].total,
          unread: totalStats[0].unread,
          read: totalStats[0].read,
          byType: typeStats
        }
      }
    } catch (error) {
      console.error('获取通知统计失败:', error)
      return reply.code(500).send({ success: false, message: '获取统计失败' })
    }
  })
}
