// 打卡管理 API

module.exports = async function (fastify, opts) {
  const pool = fastify.mysql

  // 上班打卡
  fastify.post('/api/attendance/clock-in', async (request, reply) => {
    const { employee_id, user_id } = request.body

    try {
      const today = new Date().toISOString().split('T')[0]

      // 检查今天是否已经打过上班卡
      const [existing] = await pool.query(
        'SELECT id FROM attendance_records WHERE employee_id = ? AND record_date = ? AND clock_in_time IS NOT NULL',
        [employee_id, today]
      )

      if (existing.length > 0) {
        return reply.code(400).send({ success: false, message: '今天已经打过上班卡了' })
      }

      const clockInTime = new Date()

      // 获取员工的排班信息（schedules表使用user_id，不是employee_id）
      const [schedules] = await pool.query(
        `SELECT s.*, ws.start_time, ws.end_time
         FROM schedules s
         LEFT JOIN work_shifts ws ON s.shift_id = ws.id
         WHERE s.user_id = ? AND s.schedule_date = ?`,
        [user_id, today]
      )

      // 获取考勤设置（统一使用考勤设置表的阈值）
      const [settings] = await pool.query(
        'SELECT * FROM attendance_settings WHERE id = 1'
      )

      let status = 'normal'

      if (schedules.length > 0 && schedules[0].start_time && settings.length > 0) {
        const schedule = schedules[0]
        const setting = settings[0]

        const shiftStartTime = new Date(`${today} ${schedule.start_time}`)
        // 使用考勤设置的迟到阈值（分钟转毫秒）
        const lateThreshold = (setting.late_minutes || 30) * 60 * 1000

        if (clockInTime - shiftStartTime > lateThreshold) {
          status = 'late'
        }
      }

      const [result] = await pool.query(
        `INSERT INTO attendance_records
        (employee_id, user_id, attendance_date, record_date, clock_in_time, check_in_time, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [employee_id, user_id, today, today, clockInTime, clockInTime, status]
      )

      // 如果迟到，创建考勤异常通知
      if (status === 'late') {
        const lateMinutes = schedules.length > 0 && schedules[0].start_time
          ? Math.floor((clockInTime - new Date(`${today} ${schedules[0].start_time}`)) / 60000)
          : 0

        await pool.query(
          `INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            user_id,
            'attendance_abnormal',
            '考勤异常提醒',
            `您在 ${today} 上班打卡迟到了 ${lateMinutes} 分钟`,
            result.insertId,
            'attendance'
          ]
        )
      }

      return {
        success: true,
        message: status === 'late' ? '打卡成功，但您迟到了' : '打卡成功',
        data: { id: result.insertId, clock_in_time: clockInTime, status }
      }
    } catch (error) {
      console.error('上班打卡失败:', error)
      return reply.code(500).send({
        success: false,
        message: '打卡失败：' + error.message,
        error: error.sqlMessage || error.message
      })
    }
  })

  // 下班打卡
  fastify.post('/api/attendance/clock-out', async (request, reply) => {
    const { employee_id, user_id } = request.body

    try {
      const today = new Date().toISOString().split('T')[0]

      // 查找今天的打卡记录
      const [records] = await pool.query(
        'SELECT * FROM attendance_records WHERE employee_id = ? AND record_date = ?',
        [employee_id, today]
      )

      if (records.length === 0 || !records[0].clock_in_time) {
        return reply.code(400).send({ success: false, message: '请先打上班卡' })
      }

      if (records[0].clock_out_time) {
        return reply.code(400).send({ success: false, message: '今天已经打过下班卡了' })
      }

      const clockOutTime = new Date()
      const clockInTime = new Date(records[0].clock_in_time)

      // 计算工作时长（小时）
      const workHours = ((clockOutTime - clockInTime) / (1000 * 60 * 60)).toFixed(2)

      // 获取员工的排班信息（schedules表使用user_id，不是employee_id）
      const [schedules] = await pool.query(
        `SELECT s.*, ws.start_time, ws.end_time
         FROM schedules s
         LEFT JOIN work_shifts ws ON s.shift_id = ws.id
         WHERE s.user_id = ? AND s.schedule_date = ?`,
        [user_id, today]
      )

      // 获取考勤设置（统一使用考勤设置表的阈值）
      const [settings] = await pool.query(
        'SELECT * FROM attendance_settings WHERE id = 1'
      )

      let status = records[0].status

      if (schedules.length > 0 && schedules[0].end_time && settings.length > 0) {
        const schedule = schedules[0]
        const setting = settings[0]

        const shiftEndTime = new Date(`${today} ${schedule.end_time}`)
        // 使用考勤设置的早退阈值（分钟转毫秒）
        const earlyThreshold = (setting.early_leave_minutes || 30) * 60 * 1000

        if (shiftEndTime - clockOutTime > earlyThreshold) {
          status = 'early'
        }
      }

      await pool.query(
        `UPDATE attendance_records
        SET clock_out_time = ?, work_hours = ?, status = ?
        WHERE id = ?`,
        [clockOutTime, workHours, status, records[0].id]
      )

      // 如果早退，创建考勤异常通知
      if (status === 'early') {
        const earlyMinutes = schedules.length > 0 && schedules[0].end_time
          ? Math.floor((new Date(`${today} ${schedules[0].end_time}`) - clockOutTime) / 60000)
          : 0

        await pool.query(
          `INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            user_id,
            'attendance_abnormal',
            '考勤异常提醒',
            `您在 ${today} 下班打卡早退了 ${earlyMinutes} 分钟`,
            records[0].id,
            'attendance'
          ]
        )
      }

      return {
        success: true,
        message: status === 'early' ? '打卡成功，但您早退了' : '打卡成功',
        data: { clock_out_time: clockOutTime, work_hours: workHours, status }
      }
    } catch (error) {
      console.error('下班打卡失败:', error)
      return reply.code(500).send({
        success: false,
        message: '打卡失败：' + error.message,
        error: error.sqlMessage || error.message
      })
    }
  })

  // 获取今日打卡状态
  fastify.get('/api/attendance/today', async (request, reply) => {
    const { employee_id } = request.query

    try {
      const today = new Date().toISOString().split('T')[0]

      const [records] = await pool.query(
        'SELECT * FROM attendance_records WHERE employee_id = ? AND record_date = ?',
        [employee_id, today]
      )

      return {
        success: true,
        data: records.length > 0 ? records[0] : null
      }
    } catch (error) {
      console.error('获取今日打卡状态失败:', error)
      return reply.code(500).send({ success: false, message: '获取失败' })
    }
  })

  // 获取打卡记录列表
  fastify.get('/api/attendance/records', async (request, reply) => {
    const { employee_id, start_date, end_date, page = 1, limit = 20 } = request.query

    try {
      // 1. 获取考勤记录
      let attendanceQuery = `
        SELECT
          id, user_id, employee_id,
          DATE_FORMAT(record_date, '%Y-%m-%d') as record_date,
          clock_in_time, clock_out_time,
          work_hours, status, remark,
          clock_in_location, clock_out_location
        FROM attendance_records
        WHERE employee_id = ?
      `
      const attendanceParams = [employee_id]

      if (start_date) {
        attendanceQuery += ' AND record_date >= ?'
        attendanceParams.push(start_date)
      }

      if (end_date) {
        attendanceQuery += ' AND record_date <= ?'
        attendanceParams.push(end_date)
      }

      attendanceQuery += ' ORDER BY record_date DESC'
      const [attendanceRecords] = await pool.query(attendanceQuery, attendanceParams)

      // 2. 获取请假记录
      let leaveQuery = `
        SELECT
          id, employee_id, user_id,
          DATE_FORMAT(start_date, '%Y-%m-%d') as start_date,
          DATE_FORMAT(end_date, '%Y-%m-%d') as end_date,
          days, leave_type, reason, status, created_at
        FROM leave_records
        WHERE employee_id = ? AND status = 'approved'
      `
      const leaveParams = [employee_id]

      if (start_date) {
        leaveQuery += ' AND end_date >= ?'
        leaveParams.push(start_date)
      }

      if (end_date) {
        leaveQuery += ' AND start_date <= ?'
        leaveParams.push(end_date)
      }

      const [leaveRecords] = await pool.query(leaveQuery, leaveParams)

      // 3. 获取加班记录
      let overtimeQuery = `
        SELECT
          id, employee_id, user_id,
          DATE_FORMAT(overtime_date, '%Y-%m-%d') as overtime_date,
          start_time, end_time, hours, reason, status, created_at
        FROM overtime_records
        WHERE employee_id = ? AND status = 'approved'
      `
      const overtimeParams = [employee_id]

      if (start_date) {
        overtimeQuery += ' AND overtime_date >= ?'
        overtimeParams.push(start_date)
      }

      if (end_date) {
        overtimeQuery += ' AND overtime_date <= ?'
        overtimeParams.push(end_date)
      }

      const [overtimeRecords] = await pool.query(overtimeQuery, overtimeParams)

      // 4. 格式化并合并数据
      const formattedAttendance = attendanceRecords.map(r => ({
        ...r,
        type: 'attendance',
        // 修复状态枚举: 数据库中可能是 'early_leave'，前端之前用的是 'early'
        status: r.status === 'early_leave' ? 'early' : r.status
      }))

      const leaveTypeMap = {
        sick: '病假',
        annual: '年假',
        personal: '事假',
        maternity: '产假',
        other: '其他'
      }

      const formattedLeaves = leaveRecords.map(r => ({
        id: `leave_${r.id}`,
        original_id: r.id,
        employee_id: r.employee_id,
        user_id: r.user_id,
        record_date: r.start_date, // 使用开始日期作为记录日期
        start_date: r.start_date,
        end_date: r.end_date,
        days: r.days, // 添加天数
        type: 'leave',
        status: 'leave',
        leave_type: leaveTypeMap[r.leave_type] || r.leave_type, // 映射为中文
        remark: `请假: ${leaveTypeMap[r.leave_type] || r.leave_type} (${r.days}天) - ${r.reason}`,
        work_hours: 0
      }))

      const formattedOvertime = overtimeRecords.map(r => ({
        id: `overtime_${r.id}`,
        original_id: r.id,
        employee_id: r.employee_id,
        user_id: r.user_id,
        record_date: r.overtime_date, // 使用加班日期
        clock_in_time: r.start_time,
        clock_out_time: r.end_time,
        type: 'overtime',
        status: 'overtime',
        remark: `加班: ${r.hours}小时 - ${r.reason}`,
        work_hours: parseFloat(r.hours)
      }))

      // 合并所有记录
      let allRecords = [...formattedAttendance, ...formattedLeaves, ...formattedOvertime]

      // 按日期降序排序
      allRecords.sort((a, b) => new Date(b.record_date) - new Date(a.record_date))

      // 5. 过滤状态 (如果在前端过滤也可以，但在后端过滤更高效且支持分页)
      const { status } = request.query
      let filteredRecords = allRecords

      if (status && status !== 'all') {
        filteredRecords = allRecords.filter(r => {
          if (status === 'normal') return r.status === 'normal'
          if (status === 'late') return r.status === 'late'
          if (status === 'early') return r.status === 'early' || r.status === 'early_leave'
          if (status === 'absent') return r.status === 'absent'
          if (status === 'leave') return r.type === 'leave' // 请假记录都算作 leave 状态
          if (status === 'overtime') return r.type === 'overtime' // 加班记录都算作 overtime 状态
          return r.status === status
        })
      }

      // 6. 计算统计数据 (基于所有符合条件的记录)
      const stats = {
        total_days: allRecords.length,
        late_count: formattedAttendance.filter(r => r.status === 'late').length,
        early_count: formattedAttendance.filter(r => r.status === 'early' || r.status === 'early_leave').length,
        normal_count: formattedAttendance.filter(r => r.status === 'normal').length,
        absent_count: formattedAttendance.filter(r => r.status === 'absent').length,
        leave_count: formattedLeaves.length,
        overtime_count: formattedOvertime.length,
        total_work_hours: formattedAttendance.reduce((sum, r) => sum + (parseFloat(r.work_hours) || 0), 0) +
                          formattedOvertime.reduce((sum, r) => sum + (parseFloat(r.work_hours) || 0), 0)
      }

      stats.avg_work_hours = stats.total_days > 0
        ? (stats.total_work_hours / stats.total_days).toFixed(1)
        : '0.0'

      // 出勤率计算：正常出勤天数 / 总记录天数 (排除加班记录，因为加班通常在工作日或周末额外发生)
      // 或者更简单的：正常打卡次数 / (正常+迟到+早退+缺勤)
      const attendanceBase = stats.normal_count + stats.late_count + stats.early_count + stats.absent_count
      stats.attendance_rate = attendanceBase > 0
        ? ((stats.normal_count / attendanceBase) * 100).toFixed(1)
        : '0.0'

      // 7. 内存分页 (基于过滤后的记录)
      const total = filteredRecords.length
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + parseInt(limit)
      const paginatedRecords = filteredRecords.slice(startIndex, endIndex)

      return {
        success: true,
        data: paginatedRecords,
        stats: stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total
        }
      }
    } catch (error) {
      console.error('获取打卡记录失败:', error)
      return reply.code(500).send({ success: false, message: '获取失败: ' + error.message })
    }
  })

  // 删除今日打卡记录（测试用）
  fastify.delete('/api/attendance/today', async (request, reply) => {
    const { employee_id, date } = request.query

    try {
      await pool.query(
        'DELETE FROM attendance_records WHERE employee_id = ? AND record_date = ?',
        [employee_id, date]
      )

      return { success: true, message: '今日打卡记录已删除' }
    } catch (error) {
      console.error('删除打卡记录失败:', error)
      return reply.code(500).send({ success: false, message: '删除失败' })
    }
  })
}
