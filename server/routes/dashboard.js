/**
 * 工作台首页统计 API
 */
const dayjs = require('dayjs');

module.exports = async function (fastify, opts) {
  const pool = fastify.mysql;

  fastify.get('/api/dashboard/stats', async (request, reply) => {
    const { user_id } = request.query;
    if (!user_id) return reply.code(400).send({ success: false, message: 'Missing user_id' });

    try {
      const { extractUserPermissions } = require('../middleware/checkPermission');
      const permissions = await extractUserPermissions(request, pool);
      if (!permissions) return reply.code(401).send({ success: false });

      const today = dayjs().format('YYYY-MM-DD');
      const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD');

      // --- 1. 基础信息 (通用) ---
      const [userRows] = await pool.query('SELECT real_name, username, department_id FROM users WHERE id = ?', [user_id]);
      const user = userRows[0];

      // --- 2. 待办事项总数 ---
      const [[{ pendingCount }]] = await pool.query(`
        SELECT (
          (SELECT COUNT(*) FROM reimbursements WHERE status IN ('pending', 'approving')) +
          (SELECT COUNT(*) FROM users WHERE status = 'pending')
        ) as pendingCount
      `);

      // --- 3. 角色特定数据 ---
      let adminStats = null;
      let personalStats = {};

      if (permissions.canViewAllDepartments) {
        // 管理员数据
        const [[{ totalEmployees }]] = await pool.query('SELECT COUNT(*) as totalEmployees FROM employees WHERE status != "deleted"');
        const [[{ todayClockIn }]] = await pool.query('SELECT COUNT(DISTINCT user_id) as todayClockIn FROM attendance_records WHERE attendance_date = ?', [today]);
        
        // 部门质检平均分 (示例)
        const [qaStats] = await pool.query(`
          SELECT d.name as dept_name, AVG(qs.score) as avg_score 
          FROM quality_sessions qs
          JOIN users u ON qs.agent_id = u.id
          JOIN departments d ON u.department_id = d.id
          WHERE qs.status = 'completed'
          GROUP BY d.id LIMIT 5
        `);

        adminStats = {
          totalEmployees,
          todayClockIn,
          qaStats
        };
      }

      // 个人数据 (员工/主管通用)
      // 最近一次打卡
      const [lastClock] = await pool.query(
        'SELECT clock_in_time as clock_in, clock_out_time as clock_out FROM attendance_records WHERE user_id = ? AND attendance_date = ?', 
        [user_id, today]
      );
      
      // 本月考勤异常数
      const [[{ absents }]] = await pool.query(
        'SELECT COUNT(*) as absents FROM attendance_records WHERE user_id = ? AND attendance_date >= ? AND (status = "absent" OR status = "late")',
        [user_id, startOfMonth]
      );

      personalStats = {
        todayClock: lastClock[0] || null,
        monthAbsents: absents
      };

      return {
        success: true,
        data: {
          user,
          pendingCount,
          adminStats,
          personalStats,
          serverTime: new Date()
        }
      };
    } catch (error) {
      console.error('Dashboard Stats Error:', error);
      return reply.code(500).send({ success: false });
    }
  });
};
