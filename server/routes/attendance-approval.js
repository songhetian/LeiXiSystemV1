const jwt = require('jsonwebtoken')
const { toBeijingDate } = require('../utils/time')
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

module.exports = async function (fastify, opts) {
  const pool = fastify.mysql

  // 辅助函数：从 token 获取用户 ID
  const getUserIdFromToken = (request) => {
    const token = request.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      throw new Error('未登录')
    }
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded.id
  }

  // 获取请假记录列表（支持分页和筛选）
  fastify.get('/api/attendance/leave/records', async (request, reply) => {
    const { page = 1, limit = 10, status, start_date, end_date, employee_id } = request.query

    let currentUserId
    try {
      currentUserId = getUserIdFromToken(request)
    } catch (error) {
      return reply.code(401).send({ success: false, message: '未登录' })
    }

    try {
      // 获取当前用户信息（角色和部门）
      const [currentUser] = await pool.query(
        `SELECT u.id, u.department_id, u.is_department_manager,
         GROUP_CONCAT(r.name) as role_names
         FROM users u
         LEFT JOIN user_roles ur ON u.id = ur.user_id
         LEFT JOIN roles r ON ur.role_id = r.id
         WHERE u.id = ?
         GROUP BY u.id`,
        [currentUserId]
      )

      if (currentUser.length === 0) {
        return reply.code(404).send({ success: false, message: '用户不存在' })
      }

      const user = currentUser[0]
      const roleNames = user.role_names ? user.role_names.split(',') : []
      const isSuperAdmin = roleNames.includes('超级管理员')
      const isDeptManager = user.is_department_manager === 1 || user.is_department_manager === true

      const offset = (page - 1) * limit
      let query = `
        SELECT
          lr.id,
          lr.employee_id,
          lr.user_id,
          lr.leave_type,
          DATE_FORMAT(lr.start_date, '%Y-%m-%d') as start_date,
          DATE_FORMAT(lr.end_date, '%Y-%m-%d') as end_date,
          lr.days,
          lr.reason,
          lr.attachments,
          lr.status,
          lr.approver_id,
          lr.approved_at,
          lr.approval_note,
          lr.created_at,
          u.username as employee_name,
          u.department_id,
          a.username as approver_name
        FROM leave_records lr
        LEFT JOIN users u ON lr.user_id = u.id
        LEFT JOIN users a ON lr.approver_id = a.id
        WHERE 1=1
      `
      const params = []

      // 权限过滤
      if (!isSuperAdmin) {
        if (isDeptManager) {
          // 部门主管只能看自己部门的（或者自己审批的）
          query += ' AND (u.department_id = ? OR lr.approver_id = ?)'
          params.push(user.department_id, currentUserId)
        } else {
          // 普通用户只能看自己的
          query += ' AND lr.user_id = ?'
          params.push(currentUserId)
        }
      }

      if (employee_id) {
        query += ' AND lr.employee_id = ?'
        params.push(employee_id)
      }

      if (status && status !== 'all' && status !== '') {
        query += ' AND lr.status = ?'
        params.push(status)
      }

      if (start_date) {
        query += ' AND lr.start_date >= ?'
        params.push(start_date)
      }

      if (end_date) {
        query += ' AND lr.end_date <= ?'
        params.push(end_date)
      }

      // 获取总数
      const countQuery = query.replace(
        /SELECT[\s\S]*?FROM/i,
        'SELECT COUNT(*) as total FROM'
      )
      const [countResult] = await pool.query(countQuery, params)
      const total = countResult[0]?.total || 0

      // 分页查询
      query += ' ORDER BY lr.created_at DESC LIMIT ? OFFSET ?'
      params.push(parseInt(limit), offset)

      const [rows] = await pool.query(query, params)

      return {
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('获取请假记录失败:', error)
      return reply.code(500).send({ success: false, message: '获取失败' })
    }
  })

  // 获取加班记录列表（支持分页和筛选）
  fastify.get('/api/attendance/overtime/records', async (request, reply) => {
    const { page = 1, limit = 10, status, start_date, end_date, employee_id } = request.query

    let currentUserId
    try {
      currentUserId = getUserIdFromToken(request)
    } catch (error) {
      return reply.code(401).send({ success: false, message: '未登录' })
    }

    try {
      // 获取当前用户信息（角色和部门）
      const [currentUser] = await pool.query(
        `SELECT u.id, u.department_id, u.is_department_manager,
         GROUP_CONCAT(r.name) as role_names
         FROM users u
         LEFT JOIN user_roles ur ON u.id = ur.user_id
         LEFT JOIN roles r ON ur.role_id = r.id
         WHERE u.id = ?
         GROUP BY u.id`,
        [currentUserId]
      )

      if (currentUser.length === 0) {
        return reply.code(404).send({ success: false, message: '用户不存在' })
      }

      const user = currentUser[0]
      const roleNames = user.role_names ? user.role_names.split(',') : []
      const isSuperAdmin = roleNames.includes('超级管理员')
      const isDeptManager = user.is_department_manager === 1 || user.is_department_manager === true

      const offset = (page - 1) * limit
      let query = `
        SELECT
          or_table.id,
          or_table.employee_id,
          or_table.user_id,
          DATE_FORMAT(or_table.overtime_date, '%Y-%m-%d') as overtime_date,
          DATE_FORMAT(or_table.start_time, '%Y-%m-%d %H:%i:%s') as start_time,
          DATE_FORMAT(or_table.end_time, '%Y-%m-%d %H:%i:%s') as end_time,
          or_table.hours,
          or_table.reason,
          or_table.status,
          or_table.approver_id,
          or_table.approved_at,
          or_table.created_at,
          u.username as employee_name,
          u.department_id,
          a.username as approver_name
        FROM overtime_records or_table
        LEFT JOIN users u ON or_table.user_id = u.id
        LEFT JOIN users a ON or_table.approver_id = a.id
        WHERE 1=1
      `
      const params = []

      // 权限过滤
      if (!isSuperAdmin) {
        if (isDeptManager) {
          // 部门主管只能看自己部门的（或者自己审批的）
          query += ' AND (u.department_id = ? OR or_table.approver_id = ?)'
          params.push(user.department_id, currentUserId)
        } else {
          // 普通用户只能看自己的
          query += ' AND or_table.user_id = ?'
          params.push(currentUserId)
        }
      }

      if (employee_id) {
        query += ' AND or_table.employee_id = ?'
        params.push(employee_id)
      }

      if (status && status !== 'all' && status !== '') {
        query += ' AND or_table.status = ?'
        params.push(status)
      }

      if (start_date) {
        query += ' AND or_table.overtime_date >= ?'
        params.push(start_date)
      }

      if (end_date) {
        query += ' AND or_table.overtime_date <= ?'
        params.push(end_date)
      }

      // 获取总数
      const countQuery = query.replace(
        /SELECT[\s\S]*?FROM/,
        'SELECT COUNT(*) as total FROM'
      )
      const [countResult] = await pool.query(countQuery, params)
      const total = countResult[0].total

      // 分页查询
      query += ' ORDER BY or_table.created_at DESC LIMIT ? OFFSET ?'
      params.push(parseInt(limit), offset)

      const [rows] = await pool.query(query, params)

      return {
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('获取加班记录失败:', error)
      return reply.code(500).send({ success: false, message: '获取失败' })
    }
  })

  // 获取补卡记录列表（支持分页和筛选）
  fastify.get('/api/attendance/makeup/records', async (request, reply) => {
    const { page = 1, limit = 10, status, start_date, end_date, employee_id } = request.query

    let currentUserId
    try {
      currentUserId = getUserIdFromToken(request)
    } catch (error) {
      return reply.code(401).send({ success: false, message: '未登录' })
    }

    try {
      // 获取当前用户信息（角色和部门）
      const [currentUser] = await pool.query(
        `SELECT u.id, u.department_id, u.is_department_manager,
         GROUP_CONCAT(r.name) as role_names
         FROM users u
         LEFT JOIN user_roles ur ON u.id = ur.user_id
         LEFT JOIN roles r ON ur.role_id = r.id
         WHERE u.id = ?
         GROUP BY u.id`,
        [currentUserId]
      )

      if (currentUser.length === 0) {
        return reply.code(404).send({ success: false, message: '用户不存在' })
      }

      const user = currentUser[0]
      const roleNames = user.role_names ? user.role_names.split(',') : []
      const isSuperAdmin = roleNames.includes('超级管理员')
      const isDeptManager = user.is_department_manager === 1 || user.is_department_manager === true

      const offset = (page - 1) * limit
      let query = `
        SELECT
          mr.id,
          mr.employee_id,
          mr.user_id,
          DATE_FORMAT(mr.record_date, '%Y-%m-%d') as record_date,
          DATE_FORMAT(mr.clock_time, '%Y-%m-%d %H:%i:%s') as clock_time,
          mr.clock_type,
          mr.reason,
          mr.status,
          mr.approver_id,
          mr.approved_at,
          mr.approval_note,
          mr.created_at,
          u.username as employee_name,
          u.department_id,
          a.username as approver_name
        FROM makeup_records mr
        LEFT JOIN users u ON mr.user_id = u.id
        LEFT JOIN users a ON mr.approver_id = a.id
        WHERE 1=1
      `
      const params = []

      // 权限过滤
      if (!isSuperAdmin) {
        if (isDeptManager) {
          // 部门主管只能看自己部门的（或者自己审批的）
          query += ' AND (u.department_id = ? OR mr.approver_id = ?)'
          params.push(user.department_id, currentUserId)
        } else {
          // 普通用户只能看自己的
          query += ' AND mr.user_id = ?'
          params.push(currentUserId)
        }
      }

      if (employee_id) {
        query += ' AND mr.employee_id = ?'
        params.push(employee_id)
      }

      if (status && status !== 'all' && status !== '') {
        query += ' AND mr.status = ?'
        params.push(status)
      }

      if (start_date) {
        query += ' AND mr.record_date >= ?'
        params.push(start_date)
      }

      if (end_date) {
        query += ' AND mr.record_date <= ?'
        params.push(end_date)
      }

      // 获取总数
      const countQuery = query.replace(
        /SELECT[\s\S]*?FROM/,
        'SELECT COUNT(*) as total FROM'
      )
      const [countResult] = await pool.query(countQuery, params)
      const total = countResult[0]?.total || 0

      // 分页查询
      query += ' ORDER BY mr.created_at DESC LIMIT ? OFFSET ?'
      params.push(parseInt(limit), offset)

      const [rows] = await pool.query(query, params)

      return {
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('获取补卡记录失败:', error)
      return reply.code(500).send({ success: false, message: '获取失败' })
    }
  })

  // 审批请假申请
  fastify.post('/api/attendance/leave/:id/approve', async (request, reply) => {
    const { id } = request.params
    const { approved, approval_note } = request.body

    let approver_id
    try {
      approver_id = getUserIdFromToken(request)
    } catch (error) {
      return reply.code(401).send({ success: false, message: '未登录' })
    }

    try {
      const status = approved ? 'approved' : 'rejected'

      await pool.query(
        `UPDATE leave_records
        SET status = ?, approver_id = ?, approved_at = NOW(), approval_note = ?
        WHERE id = ?`,
        [status, approver_id, approval_note || null, id]
      )

      // 如果审批通过，创建通知并自动更新排班
      if (approved) {
        // 获取请假记录详情（包含user_id）
        const [leaveRecords] = await pool.query(
          'SELECT employee_id, user_id, start_date, end_date FROM leave_records WHERE id = ?',
          [id]
        )

        if (leaveRecords.length > 0) {
          const leave = leaveRecords[0]

          // 1. 先创建通知
          try {
            console.log('=== 开始创建请假审批通知 ===')
            console.log('申请人user_id:', leave.user_id)
            console.log('请假记录ID:', id)

            if (leave.user_id) {
              const startDateStr = toBeijingDate(leave.start_date)
              const endDateStr = toBeijingDate(leave.end_date)

              await pool.query(
                `INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  leave.user_id,
                  'leave_approval',
                  '请假申请已通过',
                  `您的请假申请（${startDateStr} 至 ${endDateStr}）已通过审批`,
                  id,
                  'leave'
                ]
              )
              console.log('✅ 通知创建成功')

              // 🔔 实时推送通知（WebSocket）
              if (fastify.io) {
                const { sendNotificationToUser } = require('../websocket')
                sendNotificationToUser(fastify.io, leave.user_id, {
                  type: 'leave_approval',
                  title: '请假申请已通过',
                  content: `您的请假申请（${startDateStr} 至 ${endDateStr}）已通过审批`,
                  related_id: id,
                  related_type: 'leave',
                  created_at: new Date()
                })
              }
            } else {
              console.warn('⚠️ user_id 为空，跳过通知创建')
            }
          } catch (notificationError) {
            console.error('❌ 创建通知失败:', notificationError)
            // 不影响审批流程
          }

          // 2. 再更新排班
          try {
            console.log('🔄 开始自动更新排班...')
            console.log('📋 请假记录:', leaveRecords)

            if (leaveRecords.length > 0) {
              const leave = leaveRecords[0]
              console.log(`👤 员工ID: ${leave.employee_id}, 开始日期: ${leave.start_date}, 结束日期: ${leave.end_date}`)

              // 查找"休息"班次（通过名称模糊匹配）
              const [restShifts] = await pool.query(
                "SELECT id, name FROM work_shifts WHERE name LIKE '%休%' AND is_active = 1 LIMIT 1"
              )
              console.log('🛏️ 休息班次查询结果:', restShifts)

              if (restShifts.length > 0) {
                const restShiftId = restShifts[0].id
                console.log(`✅ 找到休息班次 ID: ${restShiftId}, 名称: ${restShifts[0].name}`)

                // 计算日期范围
                const startDate = new Date(leave.start_date)
                const endDate = new Date(leave.end_date)
                console.log(`📅 日期范围: ${startDate.toISOString()} 到 ${endDate.toISOString()}`)

                let updateCount = 0
                let createCount = 0

                // 循环更新每一天的排班
                for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                  const dateStr = d.toISOString().split('T')[0]
                  console.log(`  处理日期: ${dateStr}`)

                  // 检查是否已有排班记录
                  const [existing] = await pool.query(
                    'SELECT id FROM shift_schedules WHERE employee_id = ? AND schedule_date = ?',
                    [leave.employee_id, dateStr]
                  )

                  if (existing.length > 0) {
                    // 更新现有排班
                    await pool.query(
                      'UPDATE shift_schedules SET shift_id = ?, is_rest_day = 1 WHERE id = ?',
                      [restShiftId, existing[0].id]
                    )
                    updateCount++
                    console.log(`    ✏️ 更新排班记录 ID: ${existing[0].id}`)
                  } else {
                    // 创建新排班记录
                    await pool.query(
                      'INSERT INTO shift_schedules (employee_id, shift_id, schedule_date, is_rest_day) VALUES (?, ?, ?, 1)',
                      [leave.employee_id, restShiftId, dateStr]
                    )
                    createCount++
                    console.log(`    ➕ 创建新排班记录`)
                  }
                }

                console.log(`✅ 已自动更新员工 ${leave.employee_id} 的排班为休息 (更新: ${updateCount}, 创建: ${createCount})`)
              } else {
                console.warn('⚠️ 未找到"休息"班次（is_rest_day=1），无法自动更新排班')
              }
            }
          } catch (scheduleError) {
            console.error('❌ 自动更新排班失败:', scheduleError)
            // 不影响审批结果，只记录错误
          }
        }
      } else {
        // 审批拒绝，创建拒绝通知
        try {
          const [leaveRecords] = await pool.query(
            'SELECT user_id, start_date, end_date FROM leave_records WHERE id = ?',
            [id]
          )

          if (leaveRecords.length > 0 && leaveRecords[0].user_id) {
            const leave = leaveRecords[0]
            const startDateStr = toBeijingDate(leave.start_date)
            const endDateStr = toBeijingDate(leave.end_date)
            const content = approval_note
              ? `您的请假申请（${startDateStr} 至 ${endDateStr}）被拒绝：${approval_note}`
              : `您的请假申请（${startDateStr} 至 ${endDateStr}）未通过审批`

            await pool.query(
              `INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                leave.user_id,
                'leave_rejection',
                '请假申请被拒绝',
                content,
                id,
                'leave'
              ]
            )
            console.log('✅ 拒绝通知创建成功')

            // 🔔 实时推送拒绝通知（WebSocket）
            if (fastify.io) {
              const { sendNotificationToUser } = require('../websocket')
              sendNotificationToUser(fastify.io, leave.user_id, {
                type: 'leave_rejection',
                title: '请假申请被拒绝',
                content: content,
                related_id: id,
                related_type: 'leave',
                created_at: new Date()
              })
            }
          }
        } catch (notificationError) {
          console.error('❌ 创建拒绝通知失败:', notificationError)
        }
      }

      return {
        success: true,
        message: approved ? '审批通过' : '审批驳回'
      }
    } catch (error) {
      console.error('审批失败:', error)
      return reply.code(500).send({ success: false, message: '审批失败' })
    }
  })

  // 审批加班申请
  fastify.post('/api/attendance/overtime/:id/approve', async (request, reply) => {
    const { id } = request.params
    const { approved, approval_note } = request.body

    let currentUserId
    try {
      currentUserId = getUserIdFromToken(request)
    } catch (error) {
      return reply.code(401).send({ success: false, message: '未登录' })
    }

    try {
      // 权限检查
      const { getUserPermissions } = require('../utils/permission')
      const permissions = await getUserPermissions(pool, currentUserId)
      const hasManagePermission = permissions.includes('attendance:approval:manage')

      // 同时也检查是否为部门主管 (兼容旧逻辑)
      const [user] = await pool.query('SELECT is_department_manager FROM users WHERE id = ?', [currentUserId])
      const isDeptManager = user[0]?.is_department_manager === 1 || user[0]?.is_department_manager === true

      if (!hasManagePermission && !isDeptManager) {
        return reply.code(403).send({ success: false, message: '无权审批' })
      }

      const approver_id = currentUserId
      const status = approved ? 'approved' : 'rejected'

      await pool.query(
        `UPDATE overtime_records
        SET status = ?, approver_id = ?, approved_at = NOW()
        WHERE id = ?`,
        [status, approver_id, id]
      )

  // 创建通知
  try {
    const [overtimeRecords] = await pool.query(
      'SELECT user_id, overtime_date, start_time, end_time FROM overtime_records WHERE id = ?',
      [id]
    )

    if (overtimeRecords.length > 0 && overtimeRecords[0].user_id) {
      const overtime = overtimeRecords[0]
      const dateStr = toBeijingDate(overtime.overtime_date)
      const formatHM = (dt) => {
        const d = new Date(dt)
        if (isNaN(d.getTime())) return ''
        const pad = (n) => String(n).padStart(2, '0')
        return `${pad(d.getHours())}:${pad(d.getMinutes())}`
      }
      const startHM = formatHM(overtime.start_time)
      const endHM = formatHM(overtime.end_time)

          if (approved) {
            await pool.query(
              `INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                overtime.user_id,
                'overtime_approval',
                '加班申请已通过',
                `您的加班申请（${dateStr} ${startHM}-${endHM}）已通过审批`,
                id,
                'overtime'
              ]
            )
            console.log('✅ 加班审批通过通知创建成功')

            // 🔔 实时推送通知（WebSocket）
            if (fastify.io) {
              const { sendNotificationToUser } = require('../websocket')
              sendNotificationToUser(fastify.io, overtime.user_id, {
                type: 'overtime_approval',
                title: '加班申请已通过',
                content: `您的加班申请（${dateStr} ${startHM}-${endHM}）已通过审批`,
                related_id: id,
                related_type: 'overtime',
                created_at: new Date()
              })
            }
          } else {
            const content = approval_note
              ? `您的加班申请（${dateStr} ${startHM}-${endHM}）被拒绝：${approval_note}`
              : `您的加班申请（${dateStr} ${startHM}-${endHM}）未通过审批`

            await pool.query(
              `INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                overtime.user_id,
                'overtime_rejection',
                '加班申请被拒绝',
                content,
                id,
                'overtime'
              ]
            )
            console.log('✅ 加班审批拒绝通知创建成功')

            // 🔔 实时推送通知（WebSocket）
            if (fastify.io) {
              const { sendNotificationToUser } = require('../websocket')
              sendNotificationToUser(fastify.io, overtime.user_id, {
                type: 'overtime_rejection',
                title: '加班申请被拒绝',
                content: content,
                related_id: id,
                related_type: 'overtime',
                created_at: new Date()
              })
            }
          }
        }
      } catch (notificationError) {
        console.error('❌ 创建加班审批通知失败:', notificationError)
      }

      return {
        success: true,
        message: approved ? '审批通过' : '审批驳回'
      }
    } catch (error) {
      console.error('审批失败:', error)
      return reply.code(500).send({ success: false, message: '审批失败' })
    }
  })

  // 审批补卡申请
  fastify.post('/api/attendance/makeup/:id/approve', async (request, reply) => {
    const { id } = request.params
    const { approved, approval_note } = request.body

    let currentUserId
    try {
      currentUserId = getUserIdFromToken(request)
    } catch (error) {
      return reply.code(401).send({ success: false, message: '未登录' })
    }

    // 权限检查
    try {
      const { getUserPermissions } = require('../utils/permission')
      const permissions = await getUserPermissions(pool, currentUserId)
      const hasManagePermission = permissions.includes('attendance:approval:manage')

      // 同时也检查是否为部门主管 (兼容旧逻辑)
      const [user] = await pool.query('SELECT is_department_manager FROM users WHERE id = ?', [currentUserId])
      const isDeptManager = user[0]?.is_department_manager === 1 || user[0]?.is_department_manager === true

      if (!hasManagePermission && !isDeptManager) {
        return reply.code(403).send({ success: false, message: '无权审批' })
      }
    } catch (error) {
      console.error('权限检查失败:', error)
      return reply.code(500).send({ success: false, message: '系统错误' })
    }

    const approver_id = currentUserId
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      const status = approved ? 'approved' : 'rejected'

      // 获取补卡记录详情
      const [makeupRecords] = await connection.query(
        'SELECT * FROM makeup_records WHERE id = ?',
        [id]
      )

      if (makeupRecords.length === 0) {
        await connection.rollback()
        return reply.code(404).send({ success: false, message: '补卡记录不存在' })
      }

      const makeup = makeupRecords[0]

      // 更新补卡申请状态
      await connection.query(
        `UPDATE makeup_records
        SET status = ?, approver_id = ?, approved_at = NOW(), approval_note = ?
        WHERE id = ?`,
        [status, approver_id, approval_note || null, id]
      )

      // 如果审批通过，更新考勤打卡记录
      if (approved) {
        // 获取该员工当天的排班信息
        const [schedules] = await connection.query(
          `SELECT ss.*, ws.start_time, ws.end_time, ws.late_threshold, ws.early_threshold
           FROM shift_schedules ss
           LEFT JOIN work_shifts ws ON ss.shift_id = ws.id
           WHERE ss.employee_id = ? AND ss.schedule_date = ?`,
          [makeup.employee_id, makeup.record_date]
        )

        const schedule = schedules.length > 0 ? schedules[0] : null

        // 查找对应日期的考勤记录
        const [attendanceRecords] = await connection.query(
          'SELECT * FROM attendance_records WHERE employee_id = ? AND record_date = ?',
          [makeup.employee_id, makeup.record_date]
        )

        if (attendanceRecords.length > 0) {
          // 更新现有考勤记录
          const record = attendanceRecords[0]
          let newClockInTime = record.clock_in_time
          let newClockOutTime = record.clock_out_time

          if (makeup.clock_type === 'in') {
            // 更新上班打卡时间
            newClockInTime = makeup.clock_time
            await connection.query(
              `UPDATE attendance_records SET clock_in_time = ? WHERE id = ?`,
              [makeup.clock_time, record.id]
            )
          } else {
            // 更新下班打卡时间
            newClockOutTime = makeup.clock_time
            await connection.query(
              `UPDATE attendance_records SET clock_out_time = ? WHERE id = ?`,
              [makeup.clock_time, record.id]
            )
          }

          // 重新计算工作时长和状态
          if (newClockInTime && newClockOutTime) {
            const clockInTime = new Date(newClockInTime)
            const clockOutTime = new Date(newClockOutTime)
            const workHours = ((clockOutTime - clockInTime) / (1000 * 60 * 60)).toFixed(2)

            // 计算考勤状态
            let attendanceStatus = 'normal'

            if (schedule && schedule.start_time && schedule.end_time) {
              const recordDate = makeup.record_date
              const shiftStartTime = new Date(`${recordDate} ${schedule.start_time}`)
              const shiftEndTime = new Date(`${recordDate} ${schedule.end_time}`)

              // 使用班次的迟到阈值，如果为NULL则使用全局设置
              let lateThreshold;
              if (schedule.late_threshold !== null) {
                // 使用班次设置的迟到阈值（分钟转毫秒）
                lateThreshold = schedule.late_threshold * 60 * 1000
              } else {
                // 回退到全局设置的迟到阈值（分钟转毫秒）
                lateThreshold = 30 * 60 * 1000
              }

              // 使用班次的早退阈值，如果为NULL则使用全局设置
              let earlyThreshold;
              if (schedule.early_threshold !== null) {
                // 使用班次设置的早退阈值（分钟转毫秒）
                earlyThreshold = schedule.early_threshold * 60 * 1000
              } else {
                // 回退到全局设置的早退阈值（分钟转毫秒）
                earlyThreshold = 30 * 60 * 1000
              }

              // 判断迟到
              if (clockInTime - shiftStartTime > lateThreshold) {
                attendanceStatus = 'late'
              }

              // 判断早退（优先级高于迟到）
              if (shiftEndTime - clockOutTime > earlyThreshold) {
                attendanceStatus = 'early'
              }
            }

            await connection.query(
              'UPDATE attendance_records SET work_hours = ?, status = ? WHERE id = ?',
              [workHours, attendanceStatus, record.id]
            )
          } else if (newClockInTime && schedule && schedule.start_time) {
            // 只有上班时间，判断是否迟到
            const clockInTime = new Date(newClockInTime)
            const recordDate = makeup.record_date
            const shiftStartTime = new Date(`${recordDate} ${schedule.start_time}`)

            // 使用班次的迟到阈值，如果为NULL则使用全局设置
            let lateThreshold;
            if (schedule.late_threshold !== null) {
              // 使用班次设置的迟到阈值（分钟转毫秒）
              lateThreshold = schedule.late_threshold * 60 * 1000
            } else {
              // 回退到全局设置的迟到阈值（分钟转毫秒）
              lateThreshold = 30 * 60 * 1000
            }

            let attendanceStatus = 'normal'
            if (clockInTime - shiftStartTime > lateThreshold) {
              attendanceStatus = 'late'
            }

            await connection.query(
              'UPDATE attendance_records SET status = ? WHERE id = ?',
              [attendanceStatus, record.id]
            )
          }
        } else {
          // 创建新的考勤记录
          let attendanceStatus = 'normal'

          // 如果有排班信息，判断状态
          if (schedule && schedule.start_time && makeup.clock_type === 'in') {
            const clockInTime = new Date(makeup.clock_time)
            const recordDate = makeup.record_date
            const shiftStartTime = new Date(`${recordDate} ${schedule.start_time}`)

            // 使用班次的迟到阈值，如果为NULL则使用全局设置
            let lateThreshold;
            if (schedule.late_threshold !== null) {
              // 使用班次设置的迟到阈值（分钟转毫秒）
              lateThreshold = schedule.late_threshold * 60 * 1000
            } else {
              // 回退到全局设置的迟到阈值（分钟转毫秒）
              lateThreshold = 30 * 60 * 1000
            }

            if (clockInTime - shiftStartTime > lateThreshold) {
              attendanceStatus = 'late'
            }
          }

          if (makeup.clock_type === 'in') {
            await connection.query(
              `INSERT INTO attendance_records
              (employee_id, user_id, record_date, clock_in_time, status)
              VALUES (?, ?, ?, ?, ?)`,
              [makeup.employee_id, makeup.user_id, makeup.record_date, makeup.clock_time, attendanceStatus]
            )
          } else {
            await connection.query(
              `INSERT INTO attendance_records
              (employee_id, user_id, record_date, clock_out_time, status)
              VALUES (?, ?, ?, ?, ?)`,
              [makeup.employee_id, makeup.user_id, makeup.record_date, makeup.clock_time, attendanceStatus]
            )
          }
        }
      }

      // 创建通知
      try {
        if (makeup.user_id) {
          const dateStr = toBeijingDate(makeup.record_date)
          const clockTypeText = makeup.clock_type === 'in' ? '上班' : '下班'

          if (approved) {
            await connection.query(
              `INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                makeup.user_id,
                'makeup_approval',
                '补卡申请已通过',
                `您的补卡申请（${dateStr} ${clockTypeText}打卡）已通过审批`,
                id,
                'makeup'
              ]
            )
            console.log('✅ 补卡审批通过通知创建成功')
          } else {
            const content = approval_note
              ? `您的补卡申请（${dateStr} ${clockTypeText}打卡）被拒绝：${approval_note}`
              : `您的补卡申请（${dateStr} ${clockTypeText}打卡）未通过审批`

            await connection.query(
              `INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                makeup.user_id,
                'makeup_rejection',
                '补卡申请被拒绝',
                content,
                id,
                'makeup'
              ]
            )
            console.log('✅ 补卡审批拒绝通知创建成功')
          }
        }
      } catch (notificationError) {
        console.error('❌ 创建补卡审批通知失败:', notificationError)
      }

      await connection.commit()

      return {
        success: true,
        message: approved ? '审批通过，考勤记录已更新' : '审批驳回'
      }
    } catch (error) {
      await connection.rollback()
      console.error('审批失败:', error)
      return reply.code(500).send({ success: false, message: '审批失败' })
    } finally {
      connection.release()
    }
  })
}
