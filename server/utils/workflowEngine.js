/**
 * 审批流程引擎 - 核心模块
 *
 * 功能：
 * - 根据报销单信息动态生成审批流程实例
 * - 查找当前节点的审批人
 * - 处理审批动作（通过、驳回、退回、转交）
 * - 检查流程完成状态
 */

/**
 * 根据报销申请选择合适的审批流程
 * 支持基于角色的流程选择：不同角色使用不同的审批流程
 * @param {Object} pool - 数据库连接池
 * @param {Object} reimbursement - 报销申请信息
 * @returns {Object} 匹配的审批流程
 */
async function selectWorkflow(pool, reimbursement) {
  try {
    // 1. 获取提交人的角色列表
    const [userRoles] = await pool.query(
      `SELECT ur.role_id, r.name as role_name
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = ?`,
      [reimbursement.user_id]
    )
    const userRoleIds = userRoles.map(r => r.role_id)
    const userRoleNames = userRoles.map(r => r.role_name)

    console.log(`用户 ${reimbursement.user_id} 的角色:`, userRoleNames)

    // 2. 检查用户是否是部门主管
    const [userInfo] = await pool.query(
      'SELECT is_department_manager FROM users WHERE id = ?',
      [reimbursement.user_id]
    )
    const isDepartmentManager = userInfo[0]?.is_department_manager === 1

    // 3. 查找满足条件的非默认流程（按优先级排序）
    const [workflows] = await pool.query(
      `SELECT * FROM approval_workflows
       WHERE type = 'reimbursement' AND status = 'active' AND is_default = 0
       ORDER BY id ASC`
    )

    for (const workflow of workflows) {
      if (workflow.conditions) {
        const conditions = typeof workflow.conditions === 'string'
          ? JSON.parse(workflow.conditions)
          : workflow.conditions

        // 检查角色条件 - 新增功能：基于角色选择流程
        if (conditions.role_ids && conditions.role_ids.length > 0) {
          const hasMatchingRole = conditions.role_ids.some(roleId => userRoleIds.includes(roleId))
          if (hasMatchingRole) {
            console.log(`匹配角色流程: ${workflow.name}`)
            return workflow
          }
          // 如果设置了角色条件但不匹配，继续检查其他流程
          continue
        }

        // 检查是否为部门主管专用流程
        if (conditions.is_department_manager !== undefined) {
          if (conditions.is_department_manager === isDepartmentManager) {
            console.log(`匹配部门主管流程: ${workflow.name}`)
            return workflow
          }
          continue
        }

        // 检查金额条件
        if (conditions.amount_greater_than &&
            parseFloat(reimbursement.total_amount) > conditions.amount_greater_than) {
          console.log(`匹配金额流程: ${workflow.name}`)
          return workflow
        }

        // 检查部门条件
        if (conditions.department_ids &&
            conditions.department_ids.includes(reimbursement.department_id)) {
          console.log(`匹配部门流程: ${workflow.name}`)
          return workflow
        }

        // 检查报销类型条件
        if (conditions.types &&
            conditions.types.includes(reimbursement.type)) {
          console.log(`匹配类型流程: ${workflow.name}`)
          return workflow
        }
      }
    }

    // 4. 没有匹配的条件流程，使用默认流程
    const [defaultWorkflow] = await pool.query(
      `SELECT * FROM approval_workflows
       WHERE type = 'reimbursement' AND status = 'active' AND is_default = 1
       LIMIT 1`
    )

    if (defaultWorkflow.length > 0) {
      console.log(`使用默认流程: ${defaultWorkflow[0].name}`)
      return defaultWorkflow[0]
    }

    throw new Error('未找到可用的审批流程')
  } catch (error) {
    console.error('选择审批流程失败:', error)
    throw error
  }
}

/**
 * 获取流程的所有节点
 * @param {Object} pool - 数据库连接池
 * @param {number} workflowId - 流程ID
 * @returns {Array} 节点列表
 */
async function getWorkflowNodes(pool, workflowId) {
  const [nodes] = await pool.query(
    `SELECT * FROM approval_workflow_nodes
     WHERE workflow_id = ?
     ORDER BY node_order ASC`,
    [workflowId]
  )
  return nodes
}

/**
 * 根据节点配置查找具体的审批人
 * @param {Object} pool - 数据库连接池
 * @param {Object} node - 审批节点
 * @param {Object} reimbursement - 报销申请信息
 * @returns {Array} 审批人ID列表
 */
async function findNodeApprovers(pool, node, reimbursement) {
  const approverIds = []

  switch (node.approver_type) {
    case 'user':
      // 具体用户
      if (node.approver_id) {
        approverIds.push(node.approver_id)
      }
      break

    case 'role':
      // 某个角色下的所有用户
      if (node.role_id) {
        const [users] = await pool.query(
          `SELECT u.id FROM users u
           JOIN user_roles ur ON u.id = ur.user_id
           WHERE ur.role_id = ? AND u.status = 'active'`,
          [node.role_id]
        )
        approverIds.push(...users.map(u => u.id))
      }
      break

    case 'custom_group':
      // 自定义审批组 (原 boss/finance 等)
      if (node.custom_type_name) {
        const [customApprovers] = await pool.query(
          `SELECT a.user_id, a.delegate_user_id, a.delegate_start_date, a.delegate_end_date,
                  a.department_scope, a.amount_limit
           FROM approvers a
           WHERE a.approver_type = ? AND a.is_active = 1`,
          [node.custom_type_name]
        )
        
        for (const approver of customApprovers) {
          // 检查部门范围
          if (approver.department_scope) {
            const scope = typeof approver.department_scope === 'string'
              ? JSON.parse(approver.department_scope)
              : approver.department_scope
            if (scope && scope.length > 0 && !scope.includes(reimbursement.department_id)) {
              continue
            }
          }
          // 检查金额限制
          if (approver.amount_limit &&
              parseFloat(reimbursement.total_amount) > parseFloat(approver.amount_limit)) {
            continue
          }
          // 检查代理
          const today = new Date().toISOString().split('T')[0]
          if (approver.delegate_user_id &&
              approver.delegate_start_date <= today &&
              approver.delegate_end_date >= today) {
            approverIds.push(approver.delegate_user_id)
          } else {
            approverIds.push(approver.user_id)
          }
        }
      }
      break

    case 'department_manager':
      // 部门主管 - 查找报销单所属部门中标记为 is_department_manager 的人
      if (reimbursement.department_id) {
        const [managers] = await pool.query(
          `SELECT id FROM users
           WHERE department_id = ? AND is_department_manager = 1 AND status = 'active'`,
          [reimbursement.department_id]
        )
        approverIds.push(...managers.map(m => m.id))
      }
      break

    case 'boss':
      // 老板 - 从审批人配置表查找
      const [bosses] = await pool.query(
        `SELECT a.user_id, a.delegate_user_id, a.delegate_start_date, a.delegate_end_date
         FROM approvers a
         WHERE a.approver_type = 'boss' AND a.is_active = 1`
      )
      for (const boss of bosses) {
        // 检查是否在代理期间
        const today = new Date().toISOString().split('T')[0]
        if (boss.delegate_user_id &&
            boss.delegate_start_date <= today &&
            boss.delegate_end_date >= today) {
          approverIds.push(boss.delegate_user_id)
        } else {
          approverIds.push(boss.user_id)
        }
      }
      break

    case 'finance':
      // 财务 - 从审批人配置表查找
      const [financeUsers] = await pool.query(
        `SELECT a.user_id, a.delegate_user_id, a.delegate_start_date, a.delegate_end_date,
                a.department_scope, a.amount_limit
         FROM approvers a
         WHERE a.approver_type = 'finance' AND a.is_active = 1`
      )
      for (const finance of financeUsers) {
        // 检查部门范围
        if (finance.department_scope) {
          const scope = typeof finance.department_scope === 'string'
            ? JSON.parse(finance.department_scope)
            : finance.department_scope
          if (scope.length > 0 && !scope.includes(reimbursement.department_id)) {
            continue
          }
        }
        // 检查金额限制
        if (finance.amount_limit &&
            parseFloat(reimbursement.total_amount) > parseFloat(finance.amount_limit)) {
          continue
        }
        // 检查代理
        const today = new Date().toISOString().split('T')[0]
        if (finance.delegate_user_id &&
            finance.delegate_start_date <= today &&
            finance.delegate_end_date >= today) {
          approverIds.push(finance.delegate_user_id)
        } else {
          approverIds.push(finance.user_id)
        }
      }
      break

    case 'initiator':
      // 发起人确认
      approverIds.push(reimbursement.user_id)
      break

    default:
      console.warn(`未知的审批人类型: ${node.approver_type}`)
  }

  return [...new Set(approverIds)] // 去重
}

/**
 * 检查节点是否可以跳过
 * @param {Object} node - 审批节点
 * @param {Object} reimbursement - 报销申请
 * @returns {boolean}
 */
function shouldSkipNode(node, reimbursement) {
  if (!node.can_skip || !node.skip_conditions) {
    return false
  }

  const conditions = typeof node.skip_conditions === 'string'
    ? JSON.parse(node.skip_conditions)
    : node.skip_conditions

  // 金额小于某值时跳过
  if (conditions.amount_less_than &&
      parseFloat(reimbursement.total_amount) < conditions.amount_less_than) {
    return true
  }

  // 金额大于某值时跳过
  if (conditions.amount_greater_than &&
      parseFloat(reimbursement.total_amount) > conditions.amount_greater_than) {
    return true
  }

  return false
}

/**
 * 启动审批流程
 * @param {Object} pool - 数据库连接池
 * @param {number} reimbursementId - 报销单ID
 * @returns {Object} 第一个节点信息
 */
async function startWorkflow(pool, reimbursementId) {
  try {
    // 获取报销单信息
    const [reimbursements] = await pool.query(
      'SELECT * FROM reimbursements WHERE id = ?',
      [reimbursementId]
    )
    if (reimbursements.length === 0) {
      throw new Error('报销单不存在')
    }
    const reimbursement = reimbursements[0]

    // 选择审批流程
    const workflow = await selectWorkflow(pool, reimbursement)

    // 获取流程节点
    const nodes = await getWorkflowNodes(pool, workflow.id)
    if (nodes.length === 0) {
      throw new Error('审批流程未配置节点')
    }

    // 找到第一个不需要跳过的节点
    let firstNode = null
    for (const node of nodes) {
      if (!shouldSkipNode(node, reimbursement)) {
        firstNode = node
        break
      }
    }

    if (!firstNode) {
      // 所有节点都跳过，直接完成
      await pool.query(
        `UPDATE reimbursements
         SET status = 'approved', workflow_id = ?, completed_at = NOW()
         WHERE id = ?`,
        [workflow.id, reimbursementId]
      )
      return { completed: true }
    }

    // 更新报销单状态
    await pool.query(
      `UPDATE reimbursements
       SET status = 'approving', workflow_id = ?, current_node_id = ?, submitted_at = NOW()
       WHERE id = ?`,
      [workflow.id, firstNode.id, reimbursementId]
    )

    // 获取审批人
    const approvers = await findNodeApprovers(pool, firstNode, reimbursement)

    return {
      completed: false,
      workflow,
      currentNode: firstNode,
      approvers
    }
  } catch (error) {
    console.error('启动审批流程失败:', error)
    throw error
  }
}

/**
 * 处理审批动作
 * @param {Object} pool - 数据库连接池
 * @param {number} reimbursementId - 报销单ID
 * @param {number} approverId - 审批人ID
 * @param {string} action - 审批动作 (approve/reject/return/delegate)
 * @param {string} opinion - 审批意见
 * @param {number} delegateToId - 转交给的用户ID (仅当 action=delegate)
 * @returns {Object} 处理结果
 */
async function processApproval(pool, reimbursementId, approverId, action, opinion, delegateToId = null) {
  const connection = await pool.getConnection()
  await connection.beginTransaction()

  try {
    // 获取报销单和当前节点
    const [reimbursements] = await connection.query(
      'SELECT * FROM reimbursements WHERE id = ? FOR UPDATE',
      [reimbursementId]
    )
    if (reimbursements.length === 0) {
      throw new Error('报销单不存在')
    }
    const reimbursement = reimbursements[0]

    if (reimbursement.status !== 'approving') {
      throw new Error('报销单不在审批中状态')
    }

    const [nodes] = await connection.query(
      'SELECT * FROM approval_workflow_nodes WHERE id = ?',
      [reimbursement.current_node_id]
    )
    if (nodes.length === 0) {
      throw new Error('当前审批节点不存在')
    }
    const currentNode = nodes[0]

    // 记录审批
    await connection.query(
      `INSERT INTO approval_records
       (reimbursement_id, node_id, node_order, approver_id, action, opinion, delegate_to_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [reimbursementId, currentNode.id, currentNode.node_order, approverId, action, opinion, delegateToId]
    )

    let result = { action }

    if (action === 'approve') {
      // 查找下一个节点
      const [nextNodes] = await connection.query(
        `SELECT * FROM approval_workflow_nodes
         WHERE workflow_id = ? AND node_order > ?
         ORDER BY node_order ASC`,
        [reimbursement.workflow_id, currentNode.node_order]
      )

      // 找到第一个不需要跳过的节点
      let nextNode = null
      for (const node of nextNodes) {
        if (!shouldSkipNode(node, reimbursement)) {
          nextNode = node
          break
        }
      }

      if (nextNode) {
        // 进入下一个节点
        await connection.query(
          'UPDATE reimbursements SET current_node_id = ? WHERE id = ?',
          [nextNode.id, reimbursementId]
        )
        const approvers = await findNodeApprovers(pool, nextNode, reimbursement)
        result.nextNode = nextNode
        result.approvers = approvers
        result.completed = false
      } else {
        // 流程完成
        await connection.query(
          `UPDATE reimbursements
           SET status = 'approved', current_node_id = NULL, completed_at = NOW()
           WHERE id = ?`,
          [reimbursementId]
        )
        result.completed = true
      }
    } else if (action === 'reject') {
      // 驳回
      await connection.query(
        `UPDATE reimbursements
         SET status = 'rejected', current_node_id = NULL, completed_at = NOW()
         WHERE id = ?`,
        [reimbursementId]
      )
      result.completed = true
    } else if (action === 'return') {
      // 退回修改
      await connection.query(
        `UPDATE reimbursements
         SET status = 'draft', current_node_id = NULL, workflow_id = NULL
         WHERE id = ?`,
        [reimbursementId]
      )
      result.completed = false
      result.returned = true
    } else if (action === 'delegate') {
      // 转交 - 不改变节点，只记录
      result.completed = false
      result.delegatedTo = delegateToId
    }

    await connection.commit()
    connection.release()
    return result
  } catch (error) {
    await connection.rollback()
    connection.release()
    console.error('处理审批失败:', error)
    throw error
  }
}

/**
 * 获取报销单的审批进度
 * @param {Object} pool - 数据库连接池
 * @param {number} reimbursementId - 报销单ID
 * @returns {Object} 审批进度信息
 */
async function getApprovalProgress(pool, reimbursementId) {
  try {
    // 获取报销单
    const [reimbursements] = await pool.query(
      `SELECT r.*, w.name as workflow_name
       FROM reimbursements r
       LEFT JOIN approval_workflows w ON r.workflow_id = w.id
       WHERE r.id = ?`,
      [reimbursementId]
    )
    if (reimbursements.length === 0) {
      throw new Error('报销单不存在')
    }
    const reimbursement = reimbursements[0]

    // 获取所有节点
    let nodes = []
    if (reimbursement.workflow_id) {
      const [workflowNodes] = await pool.query(
        `SELECT * FROM approval_workflow_nodes
         WHERE workflow_id = ?
         ORDER BY node_order ASC`,
        [reimbursement.workflow_id]
      )
      nodes = workflowNodes
    }

    // 获取审批记录
    const [records] = await pool.query(
      `SELECT ar.*, u.real_name as approver_name
       FROM approval_records ar
       LEFT JOIN users u ON ar.approver_id = u.id
       WHERE ar.reimbursement_id = ?
       ORDER BY ar.approved_at ASC`,
      [reimbursementId]
    )

    return {
      reimbursement,
      nodes,
      records,
      currentNodeId: reimbursement.current_node_id
    }
  } catch (error) {
    console.error('获取审批进度失败:', error)
    throw error
  }
}

/**
 * 生成报销单号
 * @returns {string}
 */
function generateReimbursementNo() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `BX${year}${month}${day}${random}`
}

module.exports = {
  selectWorkflow,
  getWorkflowNodes,
  findNodeApprovers,
  shouldSkipNode,
  startWorkflow,
  processApproval,
  getApprovalProgress,
  generateReimbursementNo
}
