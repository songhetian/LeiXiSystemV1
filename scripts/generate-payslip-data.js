const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// 读取数据库配置
function getDbConfig() {
  try {
    const configPath = path.join(__dirname, '../config/db-config.json');
    
    // 使用项目的配置解密工具
    const { loadConfig } = require('../server/utils/config-crypto');
    const config = loadConfig(configPath);
    
    return config.database;
  } catch (error) {
    console.error('读取数据库配置失败:', error);
    process.exit(1);
  }
}

// 生成随机数据
function generateRandomData() {
  const departments = ['技术部', '人事部', '财务部', '市场部', '客服部', '运营部', '产品部', '设计部'];
  const positions = ['工程师', '经理', '主管', '专员', '助理', '总监', '顾问', '分析师'];
  
  return {
    attendance_days: (Math.random() * 5 + 18).toFixed(1), // 18-23天
    late_count: Math.floor(Math.random() * 5), // 0-4次
    early_leave_count: Math.floor(Math.random() * 3), // 0-2次
    leave_days: (Math.random() * 3).toFixed(1), // 0-3天
    overtime_hours: (Math.random() * 20 + 10).toFixed(1), // 10-30小时
    absent_days: (Math.random() * 2).toFixed(1), // 0-2天
    basic_salary: Math.floor(Math.random() * 8000 + 5000), // 5000-13000
    position_salary: Math.floor(Math.random() * 4000 + 2000), // 2000-6000
    performance_bonus: Math.floor(Math.random() * 3000 + 1000), // 1000-4000
    overtime_pay: Math.floor(Math.random() * 2000 + 500), // 500-2500
    allowances: Math.floor(Math.random() * 1500 + 500), // 500-2000
    deductions: Math.floor(Math.random() * 500), // 0-500
    social_security: Math.floor(Math.random() * 1000 + 800), // 800-1800
    housing_fund: Math.floor(Math.random() * 800 + 600), // 600-1400
    tax: Math.floor(Math.random() * 2000 + 500), // 500-2500
    other_deductions: Math.floor(Math.random() * 300), // 0-300
    status: ['draft', 'sent', 'viewed', 'confirmed'][Math.floor(Math.random() * 4)],
    remark: `${departments[Math.floor(Math.random() * departments.length)]}工资条`
  };
}

// 生成工资条编号
function generatePayslipNo(yearMonth, sequence) {
  return `PS-${yearMonth}-${String(sequence).padStart(3, '0')}`;
}

// 生成测试数据的主函数
async function generateTestPayslips() {
  let connection;
  
  try {
    // 获取数据库配置
    const dbConfig = getDbConfig();
    
    // 创建数据库连接
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 1. 查询真实的员工数据
    const [employees] = await connection.execute(`
      SELECT 
        u.id as user_id,
        u.real_name,
        u.department_id,
        e.id as employee_id,
        e.employee_no
      FROM users u
      INNER JOIN employees e ON u.id = e.user_id
      WHERE u.status = 'active' AND e.status = 'active'
      ORDER BY u.id
      LIMIT 30
    `);

    console.log(`📊 找到 ${employees.length} 个真实员工`);

    if (employees.length === 0) {
      console.log('❌ 没有找到真实的员工数据，请先创建员工记录');
      return;
    }

    // 2. 清理现有的测试数据（可选）
    console.log('🧹 清理现有的测试数据...');
    const deletedResult = await connection.execute('DELETE FROM payslips WHERE payslip_no LIKE "PS-%"');
    console.log(`🗑️ 清理了 ${deletedResult.affectedRows} 条旧记录`);

    // 3. 生成近3个月的工资条数据
    const months = ['2024-10', '2024-11', '2024-12'];
    let totalInserted = 0;

    for (const month of months) {
      console.log(`📅 生成 ${month} 月份的工资条数据...`);
      
      for (let i = 0; i < employees.length; i++) {
        const employee = employees[i];
        const randomData = generateRandomData();
        
        // 计算实发工资
        const grossSalary = 
          parseFloat(randomData.basic_salary) +
          parseFloat(randomData.position_salary) +
          parseFloat(randomData.performance_bonus) +
          parseFloat(randomData.overtime_pay) +
          parseFloat(randomData.allowances);
        
        const totalDeductions = 
          parseFloat(randomData.deductions) +
          parseFloat(randomData.social_security) +
          parseFloat(randomData.housing_fund) +
          parseFloat(randomData.tax) +
          parseFloat(randomData.other_deductions);
        
        const netSalary = grossSalary - totalDeductions;

        // 生成工资条编号
        const sequence = i + 1;
        const payslipNo = generatePayslipNo(month, sequence);

        // 随机生成日期
        const salaryMonth = `${month}-01`;
        const paymentDate = month === '2024-12' ? null : `${month}-28`;
        
        // 随机选择一个管理员作为发放人
        const issuedBy = employees[Math.floor(Math.random() * Math.min(5, employees.length))].user_id;

        // 检查是否已存在该员工该月的工资条
        const [existing] = await connection.execute(
          'SELECT id FROM payslips WHERE employee_id = ? AND salary_month = ?',
          [employee.employee_id, salaryMonth]
        );

        if (existing.length > 0) {
          console.log(`⚠️ 员工 ${employee.real_name} (${employee.employee_no}) 在 ${month} 的工资条已存在，跳过`);
          continue;
        }

        // 插入工资条数据
        await connection.execute(`
          INSERT INTO payslips (
            payslip_no, employee_id, user_id, salary_month, payment_date,
            attendance_days, late_count, early_leave_count, leave_days, overtime_hours, absent_days,
            basic_salary, position_salary, performance_bonus, overtime_pay, allowances, deductions,
            social_security, housing_fund, tax, other_deductions, net_salary,
            status, remark, issued_by, issued_at,
            viewed_at, confirmed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          payslipNo,
          employee.employee_id,
          employee.user_id,
          salaryMonth,
          paymentDate,
          randomData.attendance_days,
          randomData.late_count,
          randomData.early_leave_count,
          randomData.leave_days,
          randomData.overtime_hours,
          randomData.absent_days,
          randomData.basic_salary,
          randomData.position_salary,
          randomData.performance_bonus,
          randomData.overtime_pay,
          randomData.allowances,
          randomData.deductions,
          randomData.social_security,
          randomData.housing_fund,
          randomData.tax,
          randomData.other_deductions,
          netSalary,
          randomData.status,
          randomData.remark,
          randomData.status !== 'draft' ? issuedBy : null,
          randomData.status !== 'draft' ? new Date() : null,
          randomData.status === 'viewed' || randomData.status === 'confirmed' ? new Date() : null,
          randomData.status === 'confirmed' ? new Date() : null
        ]);

        totalInserted++;
        console.log(`✅ 生成工资条: ${payslipNo} - ${employee.real_name} (${employee.employee_no})`);
      }
    }

    console.log(`✅ 成功生成 ${totalInserted} 条工资条测试数据`);
    
    // 4. 显示统计信息
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_count,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
        COUNT(CASE WHEN status = 'viewed' THEN 1 END) as viewed_count,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
        SUM(net_salary) as total_net_salary
      FROM payslips
    `);

    console.log('\n📈 数据统计:');
    console.log(`总记录数: ${stats[0].total_count}`);
    console.log(`草稿状态: ${stats[0].draft_count}`);
    console.log(`已发放: ${stats[0].sent_count}`);
    console.log(`已查看: ${stats[0].viewed_count}`);
    console.log(`已确认: ${stats[0].confirmed_count}`);
    console.log(`实发工资总计: ¥${parseFloat(stats[0].total_net_salary).toFixed(2)}`);

  } catch (error) {
    console.error('❌ 生成测试数据失败:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 运行脚本
if (require.main === module) {
  generateTestPayslips().then(() => {
    console.log('🎉 测试数据生成完成!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { generateTestPayslips };