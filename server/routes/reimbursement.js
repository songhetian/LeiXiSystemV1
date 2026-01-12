/**
 * 报销申请 API 路由
 */

const {
  startWorkflow,
  processApproval,
  getApprovalProgress,
  generateReimbursementNo,
  findNodeApprovers
} = require('../utils/workflowEngine')
const { sendNotificationToUser } = require('../websocket')
const { recordLog } = require('../utils/logger')

module.exports = async function (fastify, opts) {
  const pool = fastify.mysql

  // ============================================================
  // 创建报销申请
  // ============================================================
  fastify.post('/api/reimbursement/apply', async (request, reply) => {
    const {
      user_id,
      employee_id,
      department_id,
      title,
      type,
      remark,
      items = [],
      attachments = []
    } = request.body

    try {
      const connection = await pool.getConnection()
      
      let finalEmployeeId = employee_id;
      if (!finalEmployeeId && user_id) {
        const [empRows] = await connection.query(
          'SELECT id FROM employees WHERE user_id = ?',
          [user_id]
        );
        if (empRows.length > 0) {
          finalEmployeeId = empRows[0].id;
        }
      }

      if (!finalEmployeeId) {
        connection.release();
        return reply.code(400).send({ success: false, message: '未找到关联的员工档案，无法创建报销' });
      }

      await connection.beginTransaction()

      try {
        const reimbursementNo = generateReimbursementNo()
        const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)

        const [result] = await connection.query(
          `INSERT INTO reimbursements
           (reimbursement_no, user_id, employee_id, department_id, title, type, total_amount, remark, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
          [reimbursementNo, user_id, finalEmployeeId, department_id, title, type, totalAmount, remark]
        )
        const reimbursementId = result.insertId

        if (items.length > 0) {
          const itemValues = items.map(item => [
            reimbursementId,
            item.item_type,
            item.amount,
            item.expense_date || null,
            item.description || null
          ])
          await connection.query(
            `INSERT INTO reimbursement_items
             (reimbursement_id, item_type, amount, expense_date, description)
             VALUES ?`,
            [itemValues]
          )
        }

        if (attachments.length > 0) {
          const attachmentValues = attachments.map(att => [
            reimbursementId,
            att.file_name,
            att.file_type,
            att.file_size,
            att.file_url
          ])
          await connection.query(
            `INSERT INTO reimbursement_attachments
             (reimbursement_id, file_name, file_type, file_size, file_url)
             VALUES ?`,
            [attachmentValues]
          )
        }

        await connection.commit()
        connection.release()

        // 记录日志
        await recordLog(pool, {
          user_id,
          module: 'reimbursement',
          action: `创建报销申请: ${title}`,
          method: 'POST',
          url: request.url,
          ip: request.ip,
          params: { id: reimbursementId, total_amount: totalAmount }
        });

        return {
          success: true,
          message: '报销申请创建成功',
          data: { id: reimbursementId, reimbursement_no: reimbursementNo }
        }
      } catch (error) {
        await connection.rollback()
        connection.release()
        throw error
      }
    } catch (error) {
      console.error('创建报销申请失败:', error)
      return reply.code(500).send({ success: false, message: '创建失败: ' + error.message })
    }
  })

  // ============================================================
  // 获取报销列表 (申请人视角)
  // ============================================================
  fastify.get('/api/reimbursement/list', async (request, reply) => {
    const { user_id, status, page = 1, limit = 20 } = request.query
    try {
      const offset = (page - 1) * limit
      let query = `
        SELECT r.*, u.real_name as applicant_name, d.name as department_name
        FROM reimbursements r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN departments d ON r.department_id = d.id
        WHERE r.user_id = ?
      `
      const params = [user_id]
      if (status && status !== 'all') {
        query += ' AND r.status = ?'; params.push(status);
      }
      query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?'
      params.push(parseInt(limit), offset)
      
      const [records] = await pool.query(query, params)
      const [countResult] = await pool.query('SELECT COUNT(*) as total FROM reimbursements WHERE user_id = ?', [user_id])
      const total = countResult[0]?.total || 0;
      
      return { success: true, data: records, pagination: { total } }
    } catch (error) {
      console.error(error)
      return reply.code(500).send({ success: false, message: '获取列表失败' })
    }
  })

  // ============================================================
  // 获取待审批列表（审批人视角）
  // ============================================================
  fastify.get('/api/reimbursement/pending', async (request, reply) => {
    const { 
      user_id, page = 1, limit = 20, department_id, 
      start_date, end_date, keyword, status = 'approving' 
    } = request.query

    try {
      const { extractUserPermissions } = require('../middleware/checkPermission')
      const permissions = await extractUserPermissions(request, pool)
      if (!permissions) return reply.code(401).send({ success: false, message: '未授权' })

      const roleIds = (permissions.roles || []).map(r => r.id)
      const [approverConfig] = await pool.query(
        'SELECT approver_type, custom_type_name FROM approvers WHERE user_id = ? AND is_active = 1',
        [user_id]
      )
      const customTypeNames = approverConfig.filter(a => a.approver_type === 'custom_group').map(a => a.custom_type_name)

      // 定义：单据当前是否属于“我”审批的逻辑
      const myApprovalCondition = `
        (
          (n.approver_type = 'user' AND n.approver_id = ${user_id}) OR
          (n.approver_type = 'role' AND n.role_id IN (${roleIds.length > 0 ? roleIds.join(',') : '0'})) OR
          (n.approver_type = 'custom_group' AND n.custom_type_name IN (${customTypeNames.length > 0 ? customTypeNames.map(n => `'${n}'`).join(',') : "''"})) OR
          (n.approver_type = 'initiator' AND r.user_id = ${user_id}) OR
          (n.approver_type = 'department_manager' AND r.department_id = (SELECT department_id FROM users WHERE id = ${user_id} AND is_department_manager = 1))
        )
      `

      let query = `
        SELECT DISTINCT r.*, u.real_name as applicant_name, d.name as department_name, 
               n.node_name as current_node_name,
               (r.status = 'approving' AND ${myApprovalCondition}) as is_approvable
        FROM reimbursements r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN departments d ON r.department_id = d.id
        LEFT JOIN approval_workflow_nodes n ON r.current_node_id = n.id
        WHERE 1=1
      `
      const params = []

      // 1. 状态筛选
      if (status === 'approving') {
        query += ` AND r.status = 'approving' AND ${myApprovalCondition}`
      } else if (status !== 'all') {
        query += ` AND r.status = ?`; params.push(status);
      }

      // 2. 数据可见性隔离
      if (!permissions.canViewAllDepartments) {
        if (permissions.viewableDepartmentIds && permissions.viewableDepartmentIds.length > 0) {
          query += ` AND r.department_id IN (?)`; params.push(permissions.viewableDepartmentIds);
        } else {
          query += ` AND (r.department_id = ? OR r.user_id = ?)`; params.push(permissions.departmentId, user_id);
        }
      }

      // 3. 搜索条件
      if (department_id) { query += ` AND r.department_id = ?`; params.push(department_id); }
      if (start_date) { query += ` AND r.created_at >= ?`; params.push(start_date + ' 00:00:00'); }
      if (end_date) { query += ` AND r.created_at <= ?`; params.push(end_date + ' 23:59:59'); }
      if (keyword) {
        query += ` AND (u.real_name LIKE ? OR r.title LIKE ? OR r.reimbursement_no LIKE ?)`
        const k = `%${keyword}%`; params.push(k, k, k);
      }

      const offset = (page - 1) * limit
      query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`
      params.push(parseInt(limit), offset)

      const [records] = await pool.query(query, params)
      return { success: true, data: records }
    } catch (error) {
      console.error('获取审批列表失败:', error);
      return reply.code(500).send({ success: false, message: '获取列表失败' })
    }
  })

  // ============================================================
  // 获取报销详情
  // ============================================================
  fastify.get('/api/reimbursement/:id', async (request, reply) => {
    const { id } = request.params
    try {
      const [reimbursements] = await pool.query(
        `SELECT r.*, u.real_name as applicant_name, d.name as department_name, w.name as workflow_name
         FROM reimbursements r
         LEFT JOIN users u ON r.user_id = u.id
         LEFT JOIN departments d ON r.department_id = d.id
         LEFT JOIN approval_workflows w ON r.workflow_id = w.id
         WHERE r.id = ?`, [id]
      )
      if (reimbursements.length === 0) return reply.code(404).send({ success: false, message: '不存在' })
      const [items] = await pool.query('SELECT * FROM reimbursement_items WHERE reimbursement_id = ?', [id])
      const [attachments] = await pool.query('SELECT * FROM reimbursement_attachments WHERE reimbursement_id = ?', [id])
      const progress = await getApprovalProgress(pool, id)
      return { success: true, data: { ...reimbursements[0], items, attachments, approval: progress } }
    } catch (error) { return reply.code(500).send({ success: false }) }
  })

  // ============================================================
  // 更新报销申请
  // ============================================================
  fastify.put('/api/reimbursement/:id', async (request, reply) => {
    const { id } = request.params
    const { title, type, remark, items = [], attachments = [] } = request.body
    try {
      const connection = await pool.getConnection()
      await connection.beginTransaction()
      try {
        const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
        await connection.query('UPDATE reimbursements SET title=?, type=?, remark=?, total_amount=? WHERE id=?', [title, type, remark, totalAmount, id])
        await connection.query('DELETE FROM reimbursement_items WHERE reimbursement_id = ?', [id])
        if (items.length > 0) {
          await connection.query('INSERT INTO reimbursement_items (reimbursement_id, item_type, amount, expense_date, description) VALUES ?', 
            [items.map(i => [id, i.item_type, i.amount, i.expense_date || null, i.description || null])])
        }
        await connection.query('DELETE FROM reimbursement_attachments WHERE reimbursement_id = ?', [id])
        if (attachments.length > 0) {
          await connection.query('INSERT INTO reimbursement_attachments (reimbursement_id, file_name, file_type, file_size, file_url) VALUES ?',
            [attachments.map(a => [id, a.file_name, a.file_type, a.file_size, a.file_url])])
        }
        await connection.commit(); connection.release();
        return { success: true }
      } catch (e) { await connection.rollback(); connection.release(); throw e; }
    } catch (error) { return reply.code(500).send({ success: false }) }
  })

  // ============================================================
  // 提交/撤销/删除/审批接口
  // ============================================================
  fastify.post('/api/reimbursement/:id/submit', async (request, reply) => {
    try {
      const result = await startWorkflow(pool, request.params.id)
      
      // 记录日志
      await recordLog(pool, {
        module: 'reimbursement',
        action: `提交报销单审批: ID ${request.params.id}`,
        method: 'POST',
        url: request.url,
        ip: request.ip
      });

      // 🔔 实时推送通知给审批人
      try {
        if (result.approvers && result.approvers.length > 0) {
          const [reimbursement] = await pool.query('SELECT title FROM reimbursements WHERE id = ?', [request.params.id]);
          const title = reimbursement[0]?.title || '报销申请';
          
          for (const approverId of result.approvers) {
            // 写入数据库
            await pool.query(
              `INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                approverId,
                'reimbursement_approval',
                '待审批报销申请',
                `您有一个新的报销申请待处理: ${title}`,
                request.params.id,
                'reimbursement'
              ]
            );

            // WebSocket 推送
            if (fastify.io) {
              sendNotificationToUser(fastify.io, approverId, {
                type: 'reimbursement_approval',
                title: '待审批报销申请',
                content: `您有一个新的报销申请待处理: ${title}`,
                related_id: request.params.id,
                related_type: 'reimbursement',
                created_at: new Date()
              });
            }
          }
        }
      } catch (notificationError) {
        console.error('❌ 发送报销审批通知失败:', notificationError);
      }

      return { success: true, data: result }
    } catch (e) { return reply.code(500).send({ success: false, message: e.message }) }
  })

  fastify.post('/api/reimbursement/:id/cancel', async (request, reply) => {
    await pool.query("UPDATE reimbursements SET status = 'cancelled' WHERE id = ?", [request.params.id])
    
    // 记录日志
    await recordLog(pool, {
      module: 'reimbursement',
      action: `撤销报销申请: ID ${request.params.id}`,
      method: 'POST',
      url: request.url,
      ip: request.ip
    });

    return { success: true }
  })

  fastify.delete('/api/reimbursement/:id', async (request, reply) => {
    await pool.query("DELETE FROM reimbursements WHERE id = ?", [request.params.id])
    
    // 记录日志
    await recordLog(pool, {
      module: 'reimbursement',
      action: `删除报销草稿: ID ${request.params.id}`,
      method: 'DELETE',
      url: request.url,
      ip: request.ip
    });

    return { success: true }
  })

  fastify.post('/api/reimbursement/:id/approval', async (request, reply) => {
    const { approver_id, action, opinion } = request.body
    const result = await processApproval(pool, request.params.id, approver_id, action, opinion)
    
    // 记录日志
    const actionMap = { approve: '通过', reject: '驳回', return: '退回' };
    await recordLog(pool, {
      user_id: approver_id,
      module: 'reimbursement',
      action: `审批报销单: ${actionMap[action] || action} (ID: ${request.params.id})`,
      method: 'POST',
      url: request.url,
      ip: request.ip,
      params: { opinion }
    });

    // 🔔 实时推送通知
    try {
      const [reimbursement] = await pool.query('SELECT user_id, title FROM reimbursements WHERE id = ?', [request.params.id]);
      const applicantId = reimbursement[0]?.user_id;
      const title = reimbursement[0]?.title || '报销申请';

      if (applicantId) {
        let notifyTitle = '';
        let notifyContent = '';
        let notifyType = '';

        if (action === 'approve') {
          if (result.completed) {
            notifyTitle = '报销申请已通过';
            notifyContent = `您的报销申请 "${title}" 已通过最终审批`;
            notifyType = 'reimbursement_pass';
          } else {
            // 通知下一个节点的审批人
            if (result.approvers && result.approvers.length > 0) {
              for (const nextApproverId of result.approvers) {
                await pool.query(
                  `INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
                   VALUES (?, ?, ?, ?, ?, ?)`,
                  [nextApproverId, 'reimbursement_approval', '待审批报销申请', `您有一个新的报销申请待处理: ${title}`, request.params.id, 'reimbursement']
                );
                if (fastify.io) {
                  sendNotificationToUser(fastify.io, nextApproverId, {
                    type: 'reimbursement_approval',
                    title: '待审批报销申请',
                    content: `您有一个新的报销申请待处理: ${title}`,
                    related_id: request.params.id,
                    related_type: 'reimbursement',
                    created_at: new Date()
                  });
                }
              }
            }
            // 同时也通知申请人进度更新
            notifyTitle = '报销进度更新';
            notifyContent = `您的报销申请 "${title}" 已通过当前节点审批，进入下一环节`;
            notifyType = 'reimbursement_progress';
          }
        } else if (action === 'reject') {
          notifyTitle = '报销申请被驳回';
          notifyContent = `您的报销申请 "${title}" 已被驳回。意见: ${opinion || '无'}`;
          notifyType = 'reimbursement_reject';
        } else if (action === 'return') {
          notifyTitle = '报销申请被退回';
          notifyContent = `您的报销申请 "${title}" 已被退回修改。意见: ${opinion || '无'}`;
          notifyType = 'reimbursement_return';
        }

        if (notifyTitle) {
          // 写入数据库
          await pool.query(
            `INSERT INTO notifications (user_id, type, title, content, related_id, related_type)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [applicantId, notifyType, notifyTitle, notifyContent, request.params.id, 'reimbursement']
          );

          // WebSocket 推送
          if (fastify.io) {
            sendNotificationToUser(fastify.io, applicantId, {
              type: notifyType,
              title: notifyTitle,
              content: notifyContent,
              related_id: request.params.id,
              related_type: 'reimbursement',
              created_at: new Date()
            });
          }
        }
      }
    } catch (notificationError) {
      console.error('❌ 发送报销审批结果通知失败:', notificationError);
    }

    return { success: true, data: result }
  })
}
