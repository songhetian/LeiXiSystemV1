const { extractUserPermissions, applyDepartmentFilter } = require('../middleware/checkPermission');

module.exports = async function (fastify, opts) {
  const pool = fastify.mysql;

  // 1. 获取员工变动记录列表
  fastify.get('/api/employee-changes', async (request, reply) => {
    const { type } = request.query;

    try {
      // 获取用户权限
      const permissions = await extractUserPermissions(request, pool);

      let query = `
        SELECT
          ec.*,
          u.username,
          u.real_name as real_name,
          e.employee_no,
          d1.name as old_department_name,
          d2.name as new_department_name
        FROM employee_changes ec
        LEFT JOIN users u ON ec.user_id = u.id
        LEFT JOIN employees e ON ec.employee_id = e.id
        LEFT JOIN departments d1 ON ec.old_department_id = d1.id
        LEFT JOIN departments d2 ON ec.new_department_id = d2.id
        WHERE 1=1
      `;

      let params = [];

      // 应用部门权限过滤（检查新旧部门）
      // 注意：这里手动处理权限逻辑，因为 applyDepartmentFilter 主要是针对单字段过滤
      if (!permissions || !permissions.canViewAllDepartments) {
        if (permissions && permissions.viewableDepartmentIds && permissions.viewableDepartmentIds.length > 0) {
          const placeholders = permissions.viewableDepartmentIds.map(() => '?').join(',');
          query += ` AND (ec.old_department_id IN (${placeholders}) OR ec.new_department_id IN (${placeholders}))`;
          params.push(...permissions.viewableDepartmentIds, ...permissions.viewableDepartmentIds);
        } else {
          // 如果没有任何部门权限，且不是超级管理员，则不返回任何数据
          query += ` AND 1=0`;
        }
      }

      if (type && type !== 'all') {
        query += ' AND ec.change_type = ?';
        params.push(type);
      }

      query += ' ORDER BY ec.change_date DESC, ec.created_at DESC';

      const [rows] = await pool.query(query, params);

      // 统一返回格式
      return { success: true, data: rows };
    } catch (error) {
      console.error('获取员工变动记录失败:', error);
      return { success: false, message: '获取员工变动记录失败', error: error.message };
    }
  });

  // 2. 获取指定员工的变动历史
  fastify.get('/api/employee-changes/:employeeId', async (request, reply) => {
    const { employeeId } = request.params;
    try {
      const [rows] = await pool.query(`
        SELECT
          ec.*,
          d1.name as old_department_name,
          d2.name as new_department_name
        FROM employee_changes ec
        LEFT JOIN departments d1 ON ec.old_department_id = d1.id
        LEFT JOIN departments d2 ON ec.new_department_id = d2.id
        WHERE ec.employee_id = ?
        ORDER BY ec.change_date DESC, ec.created_at DESC
      `, [employeeId]);
      
      return { success: true, data: rows };
    } catch (error) {
      console.error(error);
      return { success: false, message: '获取员工变动历史失败', error: error.message };
    }
  });

  // 3. 创建员工变动记录
  fastify.post('/api/employee-changes/create', async (request, reply) => {
    const {
      employee_id,
      user_id,
      change_type,
      change_date,
      old_department_id,
      new_department_id,
      old_position,
      new_position,
      reason
    } = request.body;
  
    try {
      // 验证必填字段
      if (!employee_id || !user_id || !change_type || !change_date) {
        return reply.code(400).send({
          success: false,
          message: '缺少必填字段'
        });
      }
  
      // 处理日期格式
      const formattedChangeDate = change_date.split('T')[0];
  
      const [result] = await pool.query(
        `INSERT INTO employee_changes
        (employee_id, user_id, change_type, change_date, old_department_id, new_department_id, old_position, new_position, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          employee_id,
          user_id,
          change_type,
          formattedChangeDate,
          old_department_id || null,
          new_department_id || null,
          old_position || null,
          new_position || null,
          reason || null
        ]
      );
      return { success: true, id: result.insertId };
    } catch (error) {
      console.error('创建员工变动记录失败:', error);
      return { 
        success: false, 
        message: '创建员工变动记录失败',
        error: error.message
      };
    }
  });
};
