module.exports = async function (fastify, opts) {
  const pool = fastify.mysql;
  const redis = fastify.redis;
  const { recordLog } = require('../utils/logger');
  const { syncUserChatGroups } = require('../utils/personnelClosure');

  // 1. 获取客服人员列表
  fastify.get('/api/customers', async (request, reply) => {
    try {
      const [rows] = await pool.query(`
        SELECT u.id, u.username, u.real_name as name, u.email, u.phone, 
               d.name as department, u.status, e.rating
        FROM users u
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE d.name = '客服部' OR u.department_id IN (SELECT id FROM departments WHERE name = '客服部')
        ORDER BY u.created_at DESC
      `);
      return rows;
    } catch (error) {
      reply.code(500).send({ error: '获取客服列表失败' });
    }
  });

  // 2. 获取会话列表
  fastify.get('/api/sessions', async (request, reply) => {
    try {
      const sessions = [
        { id: 1, customer: '客户A', agent: '客服', startTime: '2024-11-09 09:00', duration: '15分钟', status: 'completed', satisfaction: 5 },
        { id: 2, customer: '客户B', agent: '客服', startTime: '2024-11-09 10:30', duration: '8分钟', status: 'completed', satisfaction: 4 },
        { id: 3, customer: '客户C', agent: '客服', startTime: '2024-11-09 11:15', duration: '正在通话', status: 'active', satisfaction: null }
      ];
      return sessions;
    } catch (error) {
      reply.code(500).send({ error: '获取会话列表失败' });
    }
  });

  // 3. 获取质检记录
  fastify.get('/api/quality-inspections', async (request, reply) => {
    try {
      const [rows] = await pool.query(`
        SELECT qs.id, qs.session_id as sessionId, u.real_name as agent,
               qs.inspector_name as inspector, qs.total_score as score,
               qs.status, DATE_FORMAT(qs.created_at, '%Y-%m-%d') as date
        FROM quality_sessions qs
        LEFT JOIN users u ON qs.agent_id = u.id
        ORDER BY qs.created_at DESC LIMIT 50
      `);
      return rows;
    } catch (error) {
      reply.code(500).send({ error: '获取质检列表失败' });
    }
  });

  // 4. 提交质检
  fastify.post('/api/quality-inspections', async (request, reply) => {
    const { sessionId, scores, comment } = request.body;
    try {
      const totalScore = Math.round(scores.attitude * 0.3 + scores.professional * 0.3 + scores.communication * 0.2 + scores.compliance * 0.2);
      await pool.query(
        'UPDATE quality_sessions SET status = ?, total_score = ?, inspector_name = ?, comments = ? WHERE id = ?',
        ['completed', totalScore, '前台人员', comment, sessionId]
      );
      return { success: true, score: totalScore };
    } catch (error) {
      reply.code(500).send({ error: '提交质检失败' });
    }
  });
};
