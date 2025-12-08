// 补卡管理 API
const { getNotificationTargets } = require('../utils/notificationHelper');
const { findApprover } = require('../utils/approvalHelper');
const { sendNotificationToUser } = require('../websocket');

module.exports = async function (fastify, opts) {
  const pool = fastify.mysql

  // 创建补卡申请
  fastify.post('/api/makeup/apply', async (request, reply) => {
    const { employee_id, user_id, record_date, clock_type, clock_time, reason } = request.body

    try {
      // 检查是否已有补卡申请
      const [existing] = await pool.query(
        `SELECT id FROM makeup_records
        WHERE employee_id = ? AND record_date = ? AND clock_type = ? AND status = 'pending'`,
        [employee_id, record_date, clock_type]
      )

      if (existing.length > 0) {
        return reply.code(400).send({ success: false, message: '该日期已有待审批的补卡申请' })
      }

      const [result] = await pool.query(
        `INSERT INTO makeup_records
        (employee_id, user_id, record_date, clock_type, clock_time, reason, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [employee_id, user_id, record_date, clock_type, clock_time, reason]
      )

      // 发送通知给审批人
      try {
        // 获取申请人的部门ID
        const [applicantInfo] = await pool.query('SELECT department_id, real_name FROM users WHERE id = ?', [user_id])
        const departmentId = applicantInfo[0]?.department_id
        const applicantName = applicantInfo[0]?.real_name

        // 1. 尝试查找部门主管作为审批人
        const approver = await findApprover(pool, user_id, departmentId)

        let targetUserIds = []

        if (approver) {
          targetUserIds.push(approver.id)
        } else {
          // 2. 回退策略
          targetUserIds = await getNotificationTargets(pool, 'makeup_apply', {
            departmentId,
            applicantId: user_id
          })
        }

        // 去重
        targetUserIds = [...new Set(targetUserIds)]

        if (targetUserIds.length > 0) {
          const title = '新补卡申请'
          const content = `${applicantName} 申请补卡 (${record_date} ${clock_type === 'in' ? '上班' : '下班'})`

          // 批量插入通知
          const values = targetUserIds.map(uid => [
            uid, 'makeup_apply', title, content, result.insertId, 'makeup'
          ])

          await pool.query(
            `INSERT INTO notifications (user_id, type, title, content, related_id, related_type) VALUES ?`,
            [values]
          )

          // 发送WebSocket通知
          if (fastify.io) {
            targetUserIds.forEach(uid => {
              sendNotificationToUser(fastify.io, uid, {
                type: 'makeup_apply',
                title,
                content,
                related_id: result.insertId,
                related_type: 'makeup',
                created_at: new Date()
              })
            })
          }
        }
      } catch (notifyError) {
        console.error('发送补卡申请通知失败:', notifyError)
      }

      return {
        success: true,
        message: '补卡申请提交成功',
        data: { id: result.insertId }
      }
    } catch (error) {
      console.error('创建补卡申请失败:', error)
      return reply.code(500).send({ success: false, message: '申请失败' })
    }
  })

  // 获取补卡记录列表
  fastify.get('/api/makeup/records', async (request, reply) => {
    const { employee_id, status, page = 1, limit = 20 } = request.query

    try {
      const offset = (page - 1) * limit
      let query = `
        SELECT mr.*, u.real_name as approver_name
        FROM makeup_records mr
        LEFT JOIN users u ON mr.approver_id = u.id
        WHERE mr.employee_id = ?
      `
      const params = [employee_id]

      if (status && status !== 'all') {
        query += ' AND mr.status = ?'
        params.push(status)
      }

      query += ' ORDER BY mr.created_at DESC LIMIT ? OFFSET ?'
      params.push(parseInt(limit), offset)

      const [records] = await pool.query(query, params)

      // 获取总数
      let countQuery = 'SELECT COUNT(*) as total FROM makeup_records WHERE employee_id = ?'
      const countParams = [employee_id]

      if (status && status !== 'all') {
        countQuery += ' AND status = ?'
        countParams.push(status)
      }

      const [countResult] = await pool.query(countQuery, countParams)

      return {
        success: true,
        data: records,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total
        }
      }
    } catch (error) {
      console.error('获取补卡记录失败:', error)
      return reply.code(500).send({ success: false, message: '获取失败' })
    }
  })

  // 审批补卡（通过）
  fastify.post('/api/makeup/records/:id/approve', async (request, reply) => {
    const { id } = request.params
    const { approver_id, approval_note } = request.body

    try {
      // 获取补卡记录
      const [makeupRecords] = await pool.query(
        'SELECT * FROM makeup_records WHERE id = ?',
        [id]
      )

      if (makeupRecords.length === 0) {
        return reply.code(404).send({ success: false, message: '补卡记录不存在' })
      }

      const makeup = makeupRecords[0]

      // 更新补卡申请状态
      await pool.query(
        `UPDATE makeup_records
        SET status = 'approved', approver_id = ?, approved_at = NOW(), approval_note = ?
        WHERE id = ?`,
        [approver_id, approval_note || null, id]
      )

      // 更新或创建考勤记录
      const [attendanceRecords] = await pool.query(
        'SELECT * FROM attendance_records WHERE employee_id = ? AND record_date = ?',
        [makeup.employee_id, makeup.record_date]
      )

      if (attendanceRecords.length > 0) {
        // 更新现有记录
        if (makeup.clock_type === 'in') {
          await pool.query(
            'UPDATE attendance_records SET clock_in_time = ? WHERE id = ?',
            [makeup.clock_time, attendanceRecords[0].id]
          )
        } else {
          await pool.query(
            'UPDATE attendance_records SET clock_out_time = ? WHERE id = ?',
            [makeup.clock_time, attendanceRecords[0].id]
          )
        }
      } else {
        // 创建新记录
        if (makeup.clock_type === 'in') {
          await pool.query(
            `INSERT INTO attendance_records
            (employee_id, user_id, record_date, clock_in_time, status)
            VALUES (?, ?, ?, ?, 'normal')`,
            [makeup.employee_id, makeup.user_id, makeup.record_date, makeup.clock_time]
          )
        } else {
          await pool.query(
            `INSERT INTO attendance_records
            (employee_id, user_id, record_date, clock_out_time, status)
            VALUES (?, ?, ?, ?, 'normal')`,
            [makeup.employee_id, makeup.user_id, makeup.record_date, makeup.clock_time]
          )
        }
      }

      // 发送通知给申请人
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          makeup.user_id,
          'makeup_approval',
          '补卡申请已通过',
          `您的补卡申请（${makeup.record_date} ${makeup.clock_type === 'in' ? '上班' : '下班'}）已通过审批`,
          id,
          'makeup'
        ]
      )

      // 🔔 实时推送通知（WebSocket）
      if (fastify.io) {
        const { sendNotificationToUser } = require('../websocket')
        sendNotificationToUser(fastify.io, makeup.user_id, {
          type: 'makeup_approval',
          title: '补卡申请已通过',
          content: `您的补卡申请（${makeup.record_date} ${makeup.clock_type === 'in' ? '上班' : '下班'}）已通过审批`,
          related_id: id,
          related_type: 'makeup',
          created_at: new Date()
        })
      }

      // 🔄 自动更新排班（如果适用）
      try {
        console.log('🔄 开始自动更新排班...')
        console.log('📋 补卡记录:', makeup)

        // 查找"休息"班次（通过名称模糊匹配）
        const [restShifts] = await pool.query(
          "SELECT id, name FROM work_shifts WHERE name LIKE '%休%' AND is_active = 1 LIMIT 1"
        )
        console.log('🛏️ 休息班次查询结果:', restShifts)

        if (restShifts.length > 0) {
          const restShiftId = restShifts[0].id
          console.log(`✅ 找到休息班次 ID: ${restShiftId}, 名称: ${restShifts[0].name}`)

          // 检查是否已有排班记录
          const [existing] = await pool.query(
            'SELECT id FROM shift_schedules WHERE employee_id = ? AND schedule_date = ?',
            [makeup.employee_id, makeup.record_date]
          )

          if (existing.length > 0) {
            // 更新现有排班
            await pool.query(
              'UPDATE shift_schedules SET shift_id = ?, is_rest_day = 1 WHERE id = ?',
              [restShiftId, existing[0].id]
            )
            console.log(`    ✏️ 更新排班记录 ID: ${existing[0].id}`)
          } else {
            // 创建新排班记录
            await pool.query(
              'INSERT INTO shift_schedules (employee_id, shift_id, schedule_date, is_rest_day) VALUES (?, ?, ?, 1)',
              [makeup.employee_id, restShiftId, makeup.record_date]
            )
            console.log(`    ➕ 创建新排班记录`)
          }

          console.log(`✅ 已自动更新员工 ${makeup.employee_id} 的排班为休息`)
        } else {
          console.warn('⚠️ 未找到"休息"班次，无法自动更新排班')
        }
      } catch (scheduleError) {
        console.error('❌ 自动更新排班失败:', scheduleError)
        // 不影响审批结果，只记录错误
      }

      return {
        success: true,
        message: '补卡审批通过，考勤记录已更新'
      }
    } catch (error) {
      console.error('审批补卡失败:', error)
      return reply.code(500).send({ success: false, message: '审批失败' })
    }
  })

  // 拒绝补卡
  fastify.post('/api/makeup/records/:id/reject', async (request, reply) => {
    const { id } = request.params
    const { approver_id, approval_note } = request.body

    try {
      // 获取补卡记录信息
      const [makeupRecords] = await pool.query(
        'SELECT user_id, record_date, clock_type FROM makeup_records WHERE id = ?',
        [id]
      )

      if (makeupRecords.length === 0) {
        return reply.code(404).send({ success: false, message: '补卡记录不存在' })
      }

      await pool.query(
        `UPDATE makeup_records
        SET status = 'rejected', approver_id = ?, approved_at = NOW(), approval_note = ?
        WHERE id = ?`,
        [approver_id, approval_note || null, id]
      )

      // 发送通知给申请人
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          makeupRecords[0].user_id,
          'makeup_rejection',
          '补卡申请被拒绝',
          approval_note || '您的补卡申请未通过审批',
          id,
          'makeup'
        ]
      )

      // 🔔 实时推送拒绝通知（WebSocket）
      if (fastify.io) {
        const { sendNotificationToUser } = require('../websocket')
        sendNotificationToUser(fastify.io, makeupRecords[0].user_id, {
          type: 'makeup_rejection',
          title: '补卡申请被拒绝',
          content: approval_note || '您的补卡申请未通过审批',
          related_id: id,
          related_type: 'makeup',
          created_at: new Date()
        })
      }

      return {
        success: true,
        message: '已拒绝补卡申请'
      }
    } catch (error) {
      console.error('拒绝补卡失败:', error)
      return reply.code(500).send({ success: false, message: '操作失败' })
    }
  })

  // 删除今日补卡记录（测试用）
  fastify.delete('/api/attendance/makeup/today', async (request, reply) => {
    const { employee_id, date } = request.query

    try {
      await pool.query(
        'DELETE FROM makeup_records WHERE employee_id = ? AND record_date = ?',
        [employee_id, date]
      )

      return { success: true, message: '今日补卡记录已删除' }
    } catch (error) {
      console.error('删除补卡记录失败:', error)
      return reply.code(500).send({ success: false, message: '删除失败' })
    }
  })
}
