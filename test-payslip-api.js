const { loadConfig } = require('./server/utils/config-crypto');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

async function testPayslipAPI() {
  let connection;
  
  try {
    // 获取数据库配置
    const config = loadConfig('./config/db-config.json');
    connection = await mysql.createConnection(config.database);
    console.log('✅ 数据库连接成功');

    // 1. 创建一个测试用户token
    const testUser = {
      id: 11, // 假设这是admin用户的ID
      username: 'admin',
      department_id: 1
    };

    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const testToken = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });
    console.log('🔑 测试Token:', testToken);

    // 2. 测试权限提取
    const { extractUserPermissions } = require('./server/middleware/checkPermission');
    
    // 模拟request对象
    const mockRequest = {
      headers: {
        authorization: `Bearer ${testToken}`
      }
    };

    const permissions = await extractUserPermissions(mockRequest, connection);
    console.log('👤 用户权限:', permissions);

    // 3. 手动测试SQL查询
    console.log('\n🔍 测试工资条查询...');
    
    let whereClause = 'WHERE 1=1';
    const params = [];

    // 应用部门权限过滤（直接使用和路由相同的逻辑）
    if (permissions.viewableDepartmentIds && permissions.viewableDepartmentIds.length > 0) {
      const placeholders = permissions.viewableDepartmentIds.map(() => '?').join(',');
      whereClause += ` AND (u.department_id IN (${placeholders}) OR e.user_id = ?)`;
      params.push(...permissions.viewableDepartmentIds, permissions.userId);
    } else if (permissions.userId) {
      whereClause += ` AND e.user_id = ?`;
      params.push(permissions.userId);
    } else {
      whereClause += ' AND 1=0';
    }

    console.log('📝 WHERE子句:', whereClause);
    console.log('📝 参数:', params);

    // 执行查询
    const [payslips] = await connection.execute(`
      SELECT
        p.*,
        u.real_name as employee_name,
        e.employee_no,
        d.name as department_name,
        pos.name as position_name,
        u.username as issued_by_name
      FROM payslips p
      LEFT JOIN employees e ON p.employee_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN positions pos ON e.position_id = pos.id
      ${whereClause}
      ORDER BY p.salary_month DESC, p.created_at DESC
      LIMIT 5
    `, params);

    console.log(`\n📊 查询结果: ${payslips.length} 条记录`);
    payslips.forEach((payslip, index) => {
      console.log(`${index + 1}. ${payslip.payslip_no} - ${payslip.employee_name} (${payslip.employee_no}) - ¥${payslip.net_salary} - ${payslip.status}`);
    });

    // 4. 检查数据库中是否有数据
    const [totalCount] = await connection.execute('SELECT COUNT(*) as count FROM payslips');
    console.log(`\n💾 数据库总记录数: ${totalCount[0].count}`);

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 运行测试
testPayslipAPI().then(() => {
  console.log('🎉 API测试完成!');
  process.exit(0);
}).catch(error => {
  console.error('💥 测试失败:', error);
  process.exit(1);
});