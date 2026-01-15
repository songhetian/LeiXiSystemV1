// 考勤管理 API 路由

module.exports = async function (fastify, opts) {
  const pool = fastify.mysql

  // ==================== 考勤规则 API ====================

  // 获取考勤规则
  fastify.get('/api/attendance/rules', async (request, reply) => {
    try {
      // 查询考勤规则
      const [rules] = await pool.query(
        `SELECT rule_type, rule_value FROM attendance_rules WHERE is_active = 1`
      )

      // 如果没有规则，创建默认规则
      if (rules.length === 0) {

        const defaultRules = [
          {
            rule_name: '上班打卡提前时间',
            rule_type: 'clock_in_advance',
            rule_value: JSON.stringify({ minutes: 60 })
          },
          {
            rule_name: '下班打卡延后时间',
            rule_type: 'clock_out_delay',
            rule_value: JSON.stringify({ minutes: 60 })
          },
          {
            rule_name: '迟到阈值',
            rule_type: 'late_threshold',
            rule_value: JSON.stringify({ minutes: 0 })
          },
          {
            rule_name: '早退阈值',
            rule_type: 'early_threshold',
            rule_value: JSON.stringify({ minutes: 0 })
          }
        ]

        // 插入默认规则
        for (const rule of defaultRules) {
          await pool.query(
            `INSERT INTO attendance_rules (rule_name, rule_type, rule_value, is_active) VALUES (?, ?, ?, 1)`,
            [rule.rule_name, rule.rule_type, rule.rule_value]
          )
        }

        // 重新查询
        const [newRules] = await pool.query(
          `SELECT rule_type, rule_value FROM attendance_rules WHERE is_active = 1`
        )
        rules.push(...newRules)
      }

      // 转换为对象格式
      const rulesObj = {}
      rules.forEach(rule => {
        try {
          const value = JSON.parse(rule.rule_value)
          rulesObj[rule.rule_type] = value.minutes || value.threshold || 0
        } catch (e) {
          console.error('解析规则失败:', rule.rule_type, e)
        }
      })


      return {
        success: true,
        data: rulesObj
      }
    } catch (error) {
      console.error('获取考勤规则失败:', error)
      return reply.code(500).send({
        success: false,
        message: '获取考勤规则失败',
        // 返回默认规则
        data: {
          clock_in_advance: 60,
          clock_out_delay: 60,
          late_threshold: 0,
          early_threshold: 0
        }
      })
    }
  })

  // 更新考勤规则
  fastify.put('/api/attendance/rules', async (request, reply) => {
    const { clock_in_advance, clock_out_delay, late_threshold, early_threshold } = request.body

    try {
      // 更新或插入规则
      const rules = [
        { type: 'clock_in_advance', name: '上班打卡提前时间', value: clock_in_advance },
        { type: 'clock_out_delay', name: '下班打卡延后时间', value: clock_out_delay },
        { type: 'late_threshold', name: '迟到阈值', value: late_threshold },
        { type: 'early_threshold', name: '早退阈值', value: early_threshold }
      ]

      for (const rule of rules) {
        if (rule.value !== undefined) {
          // 先查询是否存在
          const [existing] = await pool.query(
            `SELECT id FROM attendance_rules WHERE rule_type = ? AND is_active = 1 LIMIT 1`,
            [rule.type]
          )

          const ruleValue = JSON.stringify({ minutes: rule.value })

          if (existing.length > 0) {
            // 更新
            await pool.query(
              `UPDATE attendance_rules SET rule_value = ?, updated_at = NOW() WHERE id = ?`,
              [ruleValue, existing[0].id]
            )
          } else {
            // 插入
            await pool.query(
              `INSERT INTO attendance_rules (rule_name, rule_type, rule_value, is_active) VALUES (?, ?, ?, 1)`,
              [rule.name, rule.type, ruleValue]
            )
          }
        }
      }

      return {
        success: true,
        message: '考勤规则更新成功'
      }
    } catch (error) {
      console.error('更新考勤规则失败:', error)
      return reply.code(500).send({ success: false, message: '更新考勤规则失败' })
    }
  })
}
