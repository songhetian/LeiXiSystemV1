const getNotificationTargets = async (pool, eventType, context = {}) => {
  try {
    // 1. 获取通知配置
    const [settings] = await pool.query(
      'SELECT target_roles FROM notification_settings WHERE event_type = ?',
      [eventType]
    )

    let targetRoles = []
    if (settings.length > 0 && settings[0].target_roles) {
      targetRoles = typeof settings[0].target_roles === 'string'
        ? JSON.parse(settings[0].target_roles)
        : settings[0].target_roles
    } else {
      // 默认回退策略
      if (eventType === 'leave_apply') targetRoles = ['部门管理员']
      else if (eventType === 'leave_approval' || eventType === 'leave_rejection') targetRoles = ['申请人']
      else if (eventType === 'leave_cancel') targetRoles = ['部门管理员']
      else if (eventType === 'overtime_apply') targetRoles = ['部门管理员']
      else if (eventType === 'overtime_approval' || eventType === 'overtime_rejection') targetRoles = ['申请人']
      else if (eventType === 'makeup_apply') targetRoles = ['部门管理员']
      else if (eventType === 'makeup_approval' || eventType === 'makeup_rejection') targetRoles = ['申请人']
      else if (eventType === 'exam_publish') targetRoles = ['全体员工']
      else if (eventType === 'exam_result') targetRoles = ['考生']
    }

    if (targetRoles.length === 0) return []

    let targetUserIds = new Set()

    // 2. 处理特殊角色 "申请人" 和 "考生"
    if (targetRoles.includes('申请人') && context.applicantId) {
      targetUserIds.add(context.applicantId)
      targetRoles = targetRoles.filter(r => r !== '申请人')
    }

    if (targetRoles.includes('考生') && context.examineeId) {
      targetUserIds.add(context.examineeId)
      targetRoles = targetRoles.filter(r => r !== '考生')
    }

    if (targetRoles.length === 0) return Array.from(targetUserIds)

    // 3. 查询拥有指定角色的用户
    // 注意：不再根据部门上下文过滤，完全按照配置的角色发送
    const placeholders = targetRoles.map(() => '?').join(',')

    let query = `
      SELECT DISTINCT u.id
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name IN (${placeholders}) AND u.status = 'active'
    `

    const [users] = await pool.query(query, targetRoles)

    for (const user of users) {
      targetUserIds.add(user.id)
    }

    return Array.from(targetUserIds)
  } catch (error) {
    console.error('获取通知目标用户失败:', error)
    return []
  }
}

/**
 * 创建并发送通知 (包含 DB 写入、Redis 缓存失效、WebSocket 推送)
 */
async function createNotification(pool, redis, io, { userId, type, title, content, relatedId, relatedType }) {
  try {
    // 1. 写入数据库
    const [result] = await pool.query(
      `INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, type, title, content, relatedId || null, relatedType || null]
    );

    // 2. 失效 Redis 缓存
    if (redis) {
      await redis.del(`user:unread_count:${userId}`);
    }

    // 3. WebSocket 推送
    if (io) {
      const { sendNotificationToUser } = require('../websocket');
      sendNotificationToUser(io, userId, {
        id: result.insertId,
        type,
        title,
        content,
        related_id: relatedId,
        related_type: relatedType,
        created_at: new Date()
      });
    }

    return result.insertId;
  } catch (error) {
    console.error('创建通知失败:', error);
    throw error;
  }
}

module.exports = { getNotificationTargets, createNotification }
