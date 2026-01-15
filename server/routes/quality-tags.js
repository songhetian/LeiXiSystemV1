module.exports = async function (fastify, opts) {
  const pool = fastify.mysql;

  // --- 质检标签 API ---
  fastify.get('/api/quality-tags', async () => {
    const [rows] = await pool.query('SELECT * FROM quality_tags ORDER BY category, sort_order');
    return rows;
  });

  fastify.post('/api/quality-tags', {
    config: { audit: { module: 'quality', action: '创建质检标签: :name' } }
  }, async (request) => {
    const { name, category, color, score_impact } = request.body;
    const [res] = await pool.query('INSERT INTO quality_tags (name, category, color, score_impact) VALUES (?,?,?,?)', [name, category, color, score_impact]);
    return { success: true, id: res.insertId };
  });
};