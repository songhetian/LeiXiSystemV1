/**
 * 管理员专属看板 API
 */
const dayjs = require('dayjs');

module.exports = async function (fastify, opts) {
  const pool = fastify.mysql;

  fastify.get('/api/admin/dashboard/stats', async (request, reply) => {
    const redis = fastify.redis;
    const cacheKey = 'stats:admin_dashboard';

    try {
      const { extractUserPermissions } = require('../middleware/checkPermission');
      const permissions = await extractUserPermissions(request, pool);
      
      if (!permissions || !permissions.canViewAllDepartments) {
        return reply.code(403).send({ success: false, message: '权限不足' });
      }

      // 1. 尝试从 Redis 获取
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return { success: true, data: JSON.parse(cached) };
        }
      }

      const today = dayjs().format('YYYY-MM-DD');
      const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD');

      // --- 1. 人力大盘 ---
      const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) as totalUsers FROM users WHERE status != "deleted"');
      const [[{ pendingUsers }]] = await pool.query('SELECT COUNT(*) as pendingUsers FROM users WHERE status = "pending"');
      
      // 部门分布优化：统计所有启用的部门，即使没有用户也显示为0
      const [deptDistribution] = await pool.query(`
        SELECT d.name, COUNT(u.id) as value 
        FROM departments d 
        LEFT JOIN users u ON d.id = u.department_id AND u.status != 'deleted'
        WHERE d.status = 'active'
        GROUP BY d.id
      `);

      // --- 2. 考勤大盘 ---
      const [[{ todayClocks }]] = await pool.query('SELECT COUNT(DISTINCT user_id) as todayClocks FROM attendance_records WHERE attendance_date = ?', [today]);

      // --- 3. 财务支出 (报销) ---
      // 这里的汇总统计
      const [[{ monthReimbursement }]] = await pool.query(
        'SELECT SUM(total_amount) as total FROM reimbursements WHERE created_at >= ? AND status = "approved"', 
        [startOfMonth + ' 00:00:00']
      );

      // 分类统计优化：如果没有任何通过的，返回空数组
      const [reimbursementByTypeRaw] = await pool.query(`
        SELECT type as name, SUM(total_amount) as value 
        FROM reimbursements 
        WHERE created_at >= ? AND status = "approved"
        GROUP BY type
      `, [startOfMonth + ' 00:00:00']);

      // 报销类型翻译映射 (为了图表显示中文)
      const typeLabels = {
        travel: '差旅费',
        office: '办公费',
        entertainment: '招待费',
        training: '培训费',
        other: '其他'
      };

      const reimbursementByType = reimbursementByTypeRaw.map(item => ({
        name: typeLabels[item.name] || item.name,
        value: parseFloat(item.value || 0)
      }));

      // --- 4. 安全审计 ---
      const [[{ todayLogs }]] = await pool.query('SELECT COUNT(*) as total FROM operation_logs WHERE created_at >= ?', [today + ' 00:00:00']);

      const finalData = {
        overview: {
          totalUsers,
          pendingUsers,
          todayClocks,
          monthReimbursement: parseFloat(monthReimbursement?.total || 0),
          todayLogs
        },
        charts: {
          deptDistribution: deptDistribution.map(d => ({ name: d.name, value: parseInt(d.value) })),
          reimbursementByType: reimbursementByType.length > 0 ? reimbursementByType : []
        }
      };

      // 2. 写入 Redis (有效期 10 分钟)
      if (redis) {
        await redis.set(cacheKey, JSON.stringify(finalData), 'EX', 600);
      }

      return {
        success: true,
        data: finalData
      };
    } catch (error) {
      console.error('Admin Dashboard Error:', error);
      return reply.code(500).send({ success: false });
    }
  });
};