const pool = require('../config/database')

module.exports = function (fastify, opts, done) {
  // 获取个人排班数据
  fastify.get('/api/schedules/my-schedule', async (request, reply) => {
    const { employee_id, year, month } = request.query

    if (!employee_id || !year || !month) {
      return reply.code(400).send({
        success: false,
        message: '缺少必要参数：employee_id, year, month'
      })
    }

    try {
      // 构建日期范围
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      // 查询排班数据 (使用 shift_schedules 和 work_shifts 表)
      const query = `
        SELECT
          ss.id,
          DATE_FORMAT(ss.schedule_date, '%Y-%m-%d') as schedule_date,
          ss.is_rest_day,
          ws.id as shift_id,
          ws.name as shift_name,
          ws.start_time,
          ws.end_time,
          ws.color,
          ws.description as shift_description
        FROM shift_schedules ss
        LEFT JOIN work_shifts ws ON ss.shift_id = ws.id
        WHERE ss.employee_id = ?
          AND ss.schedule_date >= ?
          AND ss.schedule_date <= ?
        ORDER BY ss.schedule_date ASC
      `

      const [schedules] = await pool.query(query, [employee_id, startDate, endDate])

      // 格式化返回数据
      const formattedSchedules = schedules.map(s => ({
        ...s,
        is_rest_day: s.is_rest_day === 1, // 确保转换为布尔值
        // 如果是休息日，确保 shift_name 显示为休息
        shift_name: s.is_rest_day === 1 && !s.shift_name ? '休息' : s.shift_name
      }))

      return {
        success: true,
        data: formattedSchedules
      }
    } catch (error) {
      console.error('获取排班数据失败:', error)
      return reply.code(500).send({
        success: false,
        message: '获取排班数据失败: ' + error.message
      })
    }
  })

  done()
}
