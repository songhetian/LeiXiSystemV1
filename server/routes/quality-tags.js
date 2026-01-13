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

  // --- 考试分类 API ---
  fastify.get('/api/exam-categories', async () => {
    const [rows] = await pool.query('SELECT ec.*, COUNT(e.id) as exam_count FROM exam_categories ec LEFT JOIN exams e ON ec.id = e.category_id GROUP BY ec.id ORDER BY ec.created_at DESC');
    return rows;
  });

  fastify.post('/api/exam-categories', {
    config: { audit: { module: 'assessment', action: '创建考试分类: :name' } }
  }, async (request) => {
    const { name, description, icon } = request.body;
    const [res] = await pool.query('INSERT INTO exam_categories (name, description, icon) VALUES (?, ?, ?)', [name, description, icon || '📁']);
    return { success: true, id: res.insertId };
  });
};