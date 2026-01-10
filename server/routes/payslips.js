const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');

module.exports = async function (fastify, opts) {
  const pool = fastify.mysql;

  // ==================== 员工端 API ====================

  // 验证二级密码
  fastify.post('/api/payslips/verify-password', async (request, reply) => {
    try {
      const { password } = request.body;
      const userId = request.user.id;

      if (!password) {
        return reply.code(400).send({ success: false, message: '请输入密码' });
      }

      const [passwords] = await pool.query(
        'SELECT * FROM payslip_passwords WHERE user_id = ?',
        [userId]
      );

      if (passwords.length === 0) {
        return reply.code(404).send({
          success: false,
          message: '未设置二级密码，请联系管理员'
        });
      }

      const passwordRecord = passwords[0];
      const isValid = await bcrypt.compare(password, passwordRecord.password_hash);

      if (!isValid) {
        return reply.code(401).send({ success: false, message: '密码错误' });
      }

      const token = Buffer.from(`${userId}:${Date.now()}`).toString('base64');

      return {
        success: true,
        token,
        is_default: passwordRecord.is_default,
        message: '验证成功'
      };
    } catch (error) {
      console.error('验证二级密码失败:', error);
      return reply.code(500).send({ success: false, message: '验证失败' });
    }
  });

  // 修改二级密码
  fastify.post('/api/payslips/change-password', async (request, reply) => {
    try {
      const { oldPassword, newPassword } = request.body;
      const userId = request.user.id;

      if (!oldPassword || !newPassword) {
        return reply.code(400).send({ success: false, message: '请填写完整信息' });
      }

      if (newPassword.length < 6) {
        return reply.code(400).send({ success: false, message: '密码长度至少6位' });
      }

      const [passwords] = await pool.query(
        'SELECT * FROM payslip_passwords WHERE user_id = ?',
        [userId]
      );

      if (passwords.length === 0) {
        return reply.code(404).send({ success: false, message: '未设置二级密码' });
      }

      const passwordRecord = passwords[0];
      const isValid = await bcrypt.compare(oldPassword, passwordRecord.password_hash);

      if (!isValid) {
        return reply.code(401).send({ success: false, message: '原密码错误' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await pool.query(
        'UPDATE payslip_passwords SET password_hash = ?, is_default = 0, last_changed_at = NOW() WHERE user_id = ?',
        [passwordHash, userId]
      );

      return {
        success: true,
        message: '密码修改成功'
      };
    } catch (error) {
      console.error('修改二级密码失败:', error);
      return reply.code(500).send({ success: false, message: '修改密码失败' });
    }
  });

  // 获取我的工资条列表
  fastify.get('/api/payslips/my-payslips', async (request, reply) => {
    try {
      const userId = request.user.id;
      const { page = 1, limit = 10, year, month } = request.query;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE p.user_id = ?';
      const params = [userId];

      if (year && month) {
        whereClause += ' AND YEAR(p.salary_month) = ? AND MONTH(p.salary_month) = ?';
        params.push(year, month);
      } else if (year) {
        whereClause += ' AND YEAR(p.salary_month) = ?';
        params.push(year);
      }

      const [total] = await pool.query(
        `SELECT COUNT(*) as count FROM payslips p ${whereClause}`,
        params
      );

      const [payslips] = await pool.query(
        `SELECT
          p.id,
          p.payslip_no,
          p.salary_month,
          p.payment_date,
          p.net_salary,
          p.status,
          p.issued_at,
          p.viewed_at,
          p.confirmed_at
        FROM payslips p
        ${whereClause}
        ORDER BY p.salary_month DESC, p.created_at DESC
        LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      return {
        success: true,
        data: payslips,
        total: total[0].count,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(total[0].count / limit)
        }
      };
    } catch (error) {
      console.error('获取工资条列表失败:', error);
      return reply.code(500).send({ success: false, message: '获取工资条列表失败' });
    }
  });

  // 获取工资条详情
  fastify.get('/api/payslips/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user.id;

      const [payslips] = await pool.query(
        `SELECT
          p.*,
          u.real_name as employee_name,
          e.employee_no,
          d.name as department_name,
          e.position as position_name
        FROM payslips p
        LEFT JOIN employees e ON p.employee_id = e.id
        LEFT JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE p.id = ? AND p.user_id = ?`,
        [id, userId]
      );

      if (payslips.length === 0) {
        return reply.code(404).send({ success: false, message: '工资条不存在' });
      }

      const payslip = payslips[0];

      if (payslip.status === 'sent' && !payslip.viewed_at) {
        await pool.query(
          'UPDATE payslips SET status = ?, viewed_at = NOW() WHERE id = ?',
          ['viewed', id]
        );
        payslip.status = 'viewed';
        payslip.viewed_at = new Date();
      }

      return {
        success: true,
        data: payslip
      };
    } catch (error) {
      console.error('获取工资条详情失败:', error);
      return reply.code(500).send({ success: false, message: '获取工资条详情失败' });
    }
  });

  // 确认工资条
  fastify.post('/api/payslips/:id/confirm', async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = request.user.id;

      const [payslips] = await pool.query(
        'SELECT * FROM payslips WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      if (payslips.length === 0) {
        return reply.code(404).send({ success: false, message: '工资条不存在' });
      }

      await pool.query(
        'UPDATE payslips SET status = ?, confirmed_at = NOW() WHERE id = ?',
        ['confirmed', id]
      );

      return {
        success: true,
        message: '工资条已确认'
      };
    } catch (error) {
      console.error('确认工资条失败:', error);
      return reply.code(500).send({ success: false, message: '确认工资条失败' });
    }
  });

  // ==================== 管理端 API ====================

  // 获取所有工资条（管理员）
  fastify.get('/api/admin/payslips', async (request, reply) => {
    try {
      const { page = 1, limit = 20, month, department, status, keyword } = request.query;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const params = [];

      if (month) {
        whereClause += ' AND DATE_FORMAT(p.salary_month, "%Y-%m") = ?';
        params.push(month);
      }

      if (department) {
        whereClause += ' AND e.department_id = ?';
        params.push(department);
      }

      if (status) {
        whereClause += ' AND p.status = ?';
        params.push(status);
      }

      if (keyword) {
        whereClause += ' AND (u.real_name LIKE ? OR e.employee_no LIKE ? OR p.payslip_no LIKE ?)';
        const searchTerm = `%${keyword}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      const [total] = await pool.query(
        `SELECT COUNT(*) as count
        FROM payslips p
        LEFT JOIN employees e ON p.employee_id = e.id
        ${whereClause}`,
        params
      );

      const [payslips] = await pool.query(
        `SELECT
          p.*,
          u.real_name as employee_name,
          e.employee_no,
          d.name as department_name,
          e.position as position_name,
          u.username as issued_by_name
        FROM payslips p
        LEFT JOIN employees e ON p.employee_id = e.id
        LEFT JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        ${whereClause}
        ORDER BY p.salary_month DESC, p.created_at DESC
        LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      return {
        success: true,
        data: payslips,
        total: total[0].count,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(total[0].count / limit)
        }
      };
    } catch (error) {
      console.error('获取工资条列表失败:', error);
      return reply.code(500).send({ success: false, message: '获取工资条列表失败' });
    }
  });

  // 创建工资条
  fastify.post('/api/admin/payslips', async (request, reply) => {
    try {
      const salaryData = request.body;
      const userId = request.user.id;

      const [employees] = await pool.query(
        'SELECT * FROM employees WHERE id = ?',
        [salaryData.employee_id]
      );

      if (employees.length === 0) {
        return reply.code(404).send({ success: false, message: '员工不存在' });
      }

      const employee = employees[0];
      const salaryMonth = new Date(salaryData.salary_month);
      const monthStr = `${salaryMonth.getFullYear()}${String(salaryMonth.getMonth() + 1).padStart(2, '0')}`;

      const [existing] = await pool.query(
        'SELECT id FROM payslips WHERE employee_id = ? AND salary_month = ?',
        [salaryData.employee_id, salaryData.salary_month]
      );

      if (existing.length > 0) {
        return reply.code(400).send({ success: false, message: '该员工当月工资条已存在' });
      }

      const [lastPayslip] = await pool.query(
        `SELECT payslip_no FROM payslips
        WHERE payslip_no LIKE ?
        ORDER BY payslip_no DESC LIMIT 1`,
        [`PS-${monthStr}-%`]
      );

      let nextNum = 1;
      if (lastPayslip.length > 0) {
        const lastNum = parseInt(lastPayslip[0].payslip_no.split('-')[2]);
        nextNum = lastNum + 1;
      }

      const payslipNo = `PS-${monthStr}-${String(nextNum).padStart(4, '0')}`;

      const netSalary = (
        parseFloat(salaryData.basic_salary || 0) +
        parseFloat(salaryData.position_salary || 0) +
        parseFloat(salaryData.performance_bonus || 0) +
        parseFloat(salaryData.overtime_pay || 0) +
        parseFloat(salaryData.allowances || 0) -
        parseFloat(salaryData.deductions || 0) -
        parseFloat(salaryData.social_security || 0) -
        parseFloat(salaryData.housing_fund || 0) -
        parseFloat(salaryData.tax || 0) -
        parseFloat(salaryData.other_deductions || 0)
      ).toFixed(2);

      const [result] = await pool.query(
        `INSERT INTO payslips (
          payslip_no, employee_id, user_id, salary_month, payment_date,
          attendance_days, late_count, early_leave_count, leave_days, overtime_hours, absent_days,
          basic_salary, position_salary, performance_bonus, overtime_pay, allowances,
          deductions, social_security, housing_fund, tax, other_deductions,
          net_salary, status, remark, custom_fields
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          payslipNo, salaryData.employee_id, employee.user_id, salaryData.salary_month, salaryData.payment_date,
          salaryData.attendance_days || 0, salaryData.late_count || 0, salaryData.early_leave_count || 0,
          salaryData.leave_days || 0, salaryData.overtime_hours || 0, salaryData.absent_days || 0,
          salaryData.basic_salary || 0, salaryData.position_salary || 0, salaryData.performance_bonus || 0,
          salaryData.overtime_pay || 0, salaryData.allowances || 0, salaryData.deductions || 0,
          salaryData.social_security || 0, salaryData.housing_fund || 0, salaryData.tax || 0,
          salaryData.other_deductions || 0, netSalary, 'draft', salaryData.remark || null,
          salaryData.custom_fields ? JSON.stringify(salaryData.custom_fields) : null
        ]
      );

      const [newPayslip] = await pool.query(
        'SELECT * FROM payslips WHERE id = ?',
        [result.insertId]
      );

      return {
        success: true,
        data: newPayslip[0],
        message: '工资条创建成功'
      };
    } catch (error) {
      console.error('创建工资条失败:', error);
      return reply.code(500).send({ success: false, message: '创建工资条失败' });
    }
  });

  // 更新工资条
  fastify.put('/api/admin/payslips/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const salaryData = request.body;

      const [existing] = await pool.query('SELECT * FROM payslips WHERE id = ?', [id]);

      if (existing.length === 0) {
        return reply.code(404).send({ success: false, message: '工资条不存在' });
      }

      const netSalary = (
        parseFloat(salaryData.basic_salary || 0) +
        parseFloat(salaryData.position_salary || 0) +
        parseFloat(salaryData.performance_bonus || 0) +
        parseFloat(salaryData.overtime_pay || 0) +
        parseFloat(salaryData.allowances || 0) -
        parseFloat(salaryData.deductions || 0) -
        parseFloat(salaryData.social_security || 0) -
        parseFloat(salaryData.housing_fund || 0) -
        parseFloat(salaryData.tax || 0) -
        parseFloat(salaryData.other_deductions || 0)
      ).toFixed(2);

      await pool.query(
        `UPDATE payslips SET
          attendance_days = ?, late_count = ?, early_leave_count = ?,
          leave_days = ?, overtime_hours = ?, absent_days = ?,
          basic_salary = ?, position_salary = ?, performance_bonus = ?,
          overtime_pay = ?, allowances = ?, deductions = ?,
          social_security = ?, housing_fund = ?, tax = ?,
          other_deductions = ?, net_salary = ?, remark = ?,
          custom_fields = ?, payment_date = ?
        WHERE id = ?`,
        [
          salaryData.attendance_days || 0, salaryData.late_count || 0, salaryData.early_leave_count || 0,
          salaryData.leave_days || 0, salaryData.overtime_hours || 0, salaryData.absent_days || 0,
          salaryData.basic_salary || 0, salaryData.position_salary || 0, salaryData.performance_bonus || 0,
          salaryData.overtime_pay || 0, salaryData.allowances || 0, salaryData.deductions || 0,
          salaryData.social_security || 0, salaryData.housing_fund || 0, salaryData.tax || 0,
          salaryData.other_deductions || 0, netSalary, salaryData.remark || null,
          salaryData.custom_fields ? JSON.stringify(salaryData.custom_fields) : null,
          salaryData.payment_date || null, id
        ]
      );

      const [updated] = await pool.query('SELECT * FROM payslips WHERE id = ?', [id]);

      return {
        success: true,
        data: updated[0],
        message: '工资条更新成功'
      };
    } catch (error) {
      console.error('更新工资条失败:', error);
      return reply.code(500).send({ success: false, message: '更新工资条失败' });
    }
  });

  // 删除工资条
  fastify.delete('/api/admin/payslips/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      const [existing] = await pool.query('SELECT * FROM payslips WHERE id = ?', [id]);

      if (existing.length === 0) {
        return reply.code(404).send({ success: false, message: '工资条不存在' });
      }

      if (existing[0].status === 'confirmed') {
        return reply.code(400).send({ success: false, message: '已确认的工资条不能删除' });
      }

      await pool.query('DELETE FROM payslips WHERE id = ?', [id]);

      return {
        success: true,
        message: '工资条删除成功'
      };
    } catch (error) {
      console.error('删除工资条失败:', error);
      return reply.code(500).send({ success: false, message: '删除工资条失败' });
    }
  });

  // 批量发放工资条
  fastify.post('/api/admin/payslips/batch-send', async (request, reply) => {
    try {
      const { payslip_ids, notify_options = {} } = request.body;
      const userId = request.user.id;

      if (!payslip_ids || payslip_ids.length === 0) {
        return reply.code(400).send({ success: false, message: '请选择要发放的工资条' });
      }

      const placeholders = payslip_ids.map(() => '?').join(',');

      await pool.query(
        `UPDATE payslips
        SET status = 'sent', issued_by = ?, issued_at = NOW()
        WHERE id IN (${placeholders}) AND status = 'draft'`,
        [userId, ...payslip_ids]
      );

      const [updated] = await pool.query(
        `SELECT COUNT(*) as count FROM payslips WHERE id IN (${placeholders}) AND status = 'sent'`,
        payslip_ids
      );

      return {
        success: true,
        sent_count: updated[0].count,
        message: `成功发放 ${updated[0].count} 条工资条`
      };
    } catch (error) {
      console.error('批量发放工资条失败:', error);
      return reply.code(500).send({ success: false, message: '批量发放失败' });
    }
  });

  // 下载导入模板
  fastify.get('/api/admin/payslips/import-template', async (request, reply) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('工资条导入模板');

      worksheet.columns = [
        { header: '员工工号*', key: 'employee_no', width: 15 },
        { header: '姓名*', key: 'name', width: 15 },
        { header: '工资月份*（YYYY-MM-DD）', key: 'salary_month', width: 20 },
        { header: '发放日期（YYYY-MM-DD）', key: 'payment_date', width: 20 },
        { header: '出勤天数', key: 'attendance_days', width: 12 },
        { header: '迟到次数', key: 'late_count', width: 12 },
        { header: '早退次数', key: 'early_leave_count', width: 12 },
        { header: '请假天数', key: 'leave_days', width: 12 },
        { header: '加班时长', key: 'overtime_hours', width: 12 },
        { header: '缺勤天数', key: 'absent_days', width: 12 },
        { header: '基本工资', key: 'basic_salary', width: 12 },
        { header: '岗位工资', key: 'position_salary', width: 12 },
        { header: '绩效奖金', key: 'performance_bonus', width: 12 },
        { header: '加班费', key: 'overtime_pay', width: 12 },
        { header: '各类补贴', key: 'allowances', width: 12 },
        { header: '各类扣款', key: 'deductions', width: 12 },
        { header: '社保扣款', key: 'social_security', width: 12 },
        { header: '公积金扣款', key: 'housing_fund', width: 12 },
        { header: '个人所得税', key: 'tax', width: 12 },
        { header: '其他扣款', key: 'other_deductions', width: 12 },
        { header: '备注', key: 'remark', width: 30 }
      ];

      worksheet.addRow({
        employee_no: 'E001',
        name: '张三',
        salary_month: '2024-01-01',
        payment_date: '2024-01-10',
        attendance_days: 22,
        late_count: 0,
        early_leave_count: 0,
        leave_days: 0,
        overtime_hours: 10,
        absent_days: 0,
        basic_salary: 5000,
        position_salary: 2000,
        performance_bonus: 1000,
        overtime_pay: 500,
        allowances: 500,
        deductions: 0,
        social_security: 800,
        housing_fund: 600,
        tax: 200,
        other_deductions: 0,
        remark: '示例数据'
      });

      const buffer = await workbook.xlsx.writeBuffer();

      reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      reply.header('Content-Disposition', 'attachment; filename="payslip_import_template.xlsx"');
      return reply.send(buffer);
    } catch (error) {
      console.error('生成导入模板失败:', error);
      return reply.code(500).send({ success: false, message: '生成导入模板失败' });
    }
  });

  // 批量导入工资条
  fastify.post('/api/admin/payslips/import', async (request, reply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({ success: false, message: '请上传文件' });
      }

      const buffer = await data.toBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.getWorksheet(1);

      const results = {
        total: 0,
        success: 0,
        failed: 0,
        errors: []
      };

      const rows = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          rows.push({
            rowNumber,
            employee_no: row.getCell(1).value,
            name: row.getCell(2).value,
            salary_month: row.getCell(3).value,
            payment_date: row.getCell(4).value,
            attendance_days: row.getCell(5).value || 0,
            late_count: row.getCell(6).value || 0,
            early_leave_count: row.getCell(7).value || 0,
            leave_days: row.getCell(8).value || 0,
            overtime_hours: row.getCell(9).value || 0,
            absent_days: row.getCell(10).value || 0,
            basic_salary: row.getCell(11).value || 0,
            position_salary: row.getCell(12).value || 0,
            performance_bonus: row.getCell(13).value || 0,
            overtime_pay: row.getCell(14).value || 0,
            allowances: row.getCell(15).value || 0,
            deductions: row.getCell(16).value || 0,
            social_security: row.getCell(17).value || 0,
            housing_fund: row.getCell(18).value || 0,
            tax: row.getCell(19).value || 0,
            other_deductions: row.getCell(20).value || 0,
            remark: row.getCell(21).value || null
          });
        }
      });

      results.total = rows.length;

      for (const rowData of rows) {
        try {
          const [employees] = await pool.query(
            'SELECT e.*, e.user_id FROM employees e WHERE e.employee_no = ?',
            [rowData.employee_no]
          );

          if (employees.length === 0) {
            results.failed++;
            results.errors.push({
              row: rowData.rowNumber,
              message: `员工工号 ${rowData.employee_no} 不存在`
            });
            continue;
          }

          const employee = employees[0];

          const netSalary = (
            parseFloat(rowData.basic_salary) +
            parseFloat(rowData.position_salary) +
            parseFloat(rowData.performance_bonus) +
            parseFloat(rowData.overtime_pay) +
            parseFloat(rowData.allowances) -
            parseFloat(rowData.deductions) -
            parseFloat(rowData.social_security) -
            parseFloat(rowData.housing_fund) -
            parseFloat(rowData.tax) -
            parseFloat(rowData.other_deductions)
          ).toFixed(2);

          const salaryMonth = new Date(rowData.salary_month);
          const monthStr = `${salaryMonth.getFullYear()}${String(salaryMonth.getMonth() + 1).padStart(2, '0')}`;

          const [lastPayslip] = await pool.query(
            `SELECT payslip_no FROM payslips
            WHERE payslip_no LIKE ?
            ORDER BY payslip_no DESC LIMIT 1`,
            [`PS-${monthStr}-%`]
          );

          let nextNum = 1;
          if (lastPayslip.length > 0) {
            const lastNum = parseInt(lastPayslip[0].payslip_no.split('-')[2]);
            nextNum = lastNum + 1;
          }

          const payslipNo = `PS-${monthStr}-${String(nextNum).padStart(4, '0')}`;

          await pool.query(
            `INSERT INTO payslips (
              payslip_no, employee_id, user_id, salary_month, payment_date,
              attendance_days, late_count, early_leave_count, leave_days, overtime_hours, absent_days,
              basic_salary, position_salary, performance_bonus, overtime_pay, allowances,
              deductions, social_security, housing_fund, tax, other_deductions,
              net_salary, status, remark
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              payslipNo, employee.id, employee.user_id, rowData.salary_month, rowData.payment_date,
              rowData.attendance_days, rowData.late_count, rowData.early_leave_count,
              rowData.leave_days, rowData.overtime_hours, rowData.absent_days,
              rowData.basic_salary, rowData.position_salary, rowData.performance_bonus,
              rowData.overtime_pay, rowData.allowances, rowData.deductions,
              rowData.social_security, rowData.housing_fund, rowData.tax,
              rowData.other_deductions, netSalary, 'draft', rowData.remark
            ]
          );

          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push({
            row: rowData.rowNumber,
            message: err.message
          });
        }
      }

      await pool.query(
        `INSERT INTO payslip_import_history (
          file_name, salary_month, total_count, success_count, failed_count,
          error_details, status, imported_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.filename,
          rows[0]?.salary_month || new Date(),
          results.total,
          results.success,
          results.failed,
          JSON.stringify(results.errors),
          results.failed === 0 ? 'completed' : 'failed',
          request.user.id
        ]
      );

      return {
        success: true,
        data: results,
        message: `导入完成，成功 ${results.success} 条，失败 ${results.failed} 条`
      };
    } catch (error) {
      console.error('导入工资条失败:', error);
      return reply.code(500).send({ success: false, message: '导入工资条失败' });
    }
  });

  // 获取导入历史
  fastify.get('/api/admin/payslips/import-history', async (request, reply) => {
    try {
      const { page = 1, limit = 20 } = request.query;
      const offset = (page - 1) * limit;

      const [total] = await pool.query(
        'SELECT COUNT(*) as count FROM payslip_import_history'
      );

      const [history] = await pool.query(
        `SELECT
          h.*,
          u.username as imported_by_name
        FROM payslip_import_history h
        LEFT JOIN users u ON h.imported_by = u.id
        ORDER BY h.created_at DESC
        LIMIT ? OFFSET ?`,
        [parseInt(limit), offset]
      );

      return {
        success: true,
        data: history,
        total: total[0].count,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(total[0].count / limit)
        }
      };
    } catch (error) {
      console.error('获取导入历史失败:', error);
      return reply.code(500).send({ success: false, message: '获取导入历史失败' });
    }
  });

  // 重置二级密码（管理员）
  fastify.post('/api/admin/payslips/reset-password', async (request, reply) => {
    try {
      const { user_ids, reset_to_default = true } = request.body;

      if (!user_ids || user_ids.length === 0) {
        return reply.code(400).send({ success: false, message: '请选择要重置的用户' });
      }

      const defaultPassword = '123456';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      let resetCount = 0;

      for (const userId of user_ids) {
        const [existing] = await pool.query(
          'SELECT id FROM payslip_passwords WHERE user_id = ?',
          [userId]
        );

        if (existing.length > 0) {
          await pool.query(
            'UPDATE payslip_passwords SET password_hash = ?, is_default = 1, last_changed_at = NOW() WHERE user_id = ?',
            [passwordHash, userId]
          );
        } else {
          await pool.query(
            'INSERT INTO payslip_passwords (user_id, password_hash, is_default, last_changed_at) VALUES (?, ?, 1, NOW())',
            [userId, passwordHash]
          );
        }
        resetCount++;
      }

      return {
        success: true,
        reset_count: resetCount,
        default_password: defaultPassword,
        message: `成功重置 ${resetCount} 个用户的密码`
      };
    } catch (error) {
      console.error('重置密码失败:', error);
      return reply.code(500).send({ success: false, message: '重置密码失败' });
    }
  });

  // 获取统计数据
  fastify.get('/api/admin/payslips/statistics', async (request, reply) => {
    try {
      const { year, month, department_id } = request.query;

      let whereClause = 'WHERE 1=1';
      const params = [];

      if (year && month) {
        whereClause += ' AND YEAR(p.salary_month) = ? AND MONTH(p.salary_month) = ?';
        params.push(year, month);
      }

      if (department_id) {
        whereClause += ' AND e.department_id = ?';
        params.push(department_id);
      }

      const [stats] = await pool.query(
        `SELECT
          COUNT(*) as total_count,
          SUM(CASE WHEN p.status = 'draft' THEN 1 ELSE 0 END) as draft_count,
          SUM(CASE WHEN p.status = 'sent' THEN 1 ELSE 0 END) as sent_count,
          SUM(CASE WHEN p.status = 'viewed' THEN 1 ELSE 0 END) as viewed_count,
          SUM(CASE WHEN p.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_count,
          SUM(p.net_salary) as total_salary,
          AVG(p.net_salary) as avg_salary
        FROM payslips p
        LEFT JOIN employees e ON p.employee_id = e.id
        ${whereClause}`,
        params
      );

      return {
        success: true,
        data: stats[0]
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return reply.code(500).send({ success: false, message: '获取统计数据失败' });
    }
  });
};
