const { loadConfig } = require('./server/utils/config-crypto');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

async function testDirectRoute() {
  let connection;
  
  try {
    // 获取数据库配置
    const config = loadConfig('./config/db-config.json');
    connection = await mysql.createConnection(config.database);
    console.log('✅ 数据库连接成功');

    // 模拟request对象
    const token = jwt.sign({
      id: 11,
      username: 'admin',
      department_id: 8
    }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });

    const mockRequest = {
      headers: {
        authorization: `Bearer ${token}`
      },
      query: {
        page: 1,
        limit: 20
      }
    };

    // 1. 测试权限提取
    const { extractUserPermissions } = require('./server/middleware/checkPermission');
    const permissions = await extractUserPermissions(mockRequest, connection);
    console.log('👤 用户权限:', permissions);

    // 2. 使用与路由相同的 applyDepartmentFilter 函数
    const { applyDepartmentFilter } = require('./server/middleware/checkPermission');
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    // 应用部门权限过滤
    const filterResult = applyDepartmentFilter(
      permissions, 
      whereClause, 
      params, 
      'u.department_id', 
      'e.user_id'
    );
    whereClause = filterResult.query;
    params.push(...filterResult.params);

    // 3. 执行查询
    console.log('📝 WHERE子句:', whereClause);
    console.log('📝 参数:', params);

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

    console.log(`📊 查询结果: ${payslips.length} 条记录`);
    payslips.forEach((payslip, index) => {
      console.log(`${index + 1}. ${payslip.payslip_no} - ${payslip.employee_name} (${payslip.employee_no}) - ¥${payslip.net_salary} - ${payslip.status}`);
    });

    // 4. 测试总数查询
    const [totalResult] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM payslips p
      LEFT JOIN employees e ON p.employee_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      ${whereClause}
    `, params);

    console.log(`💾 总记录数: ${totalResult[0].count}`);

  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('错误堆栈:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 运行测试
testDirectRoute().then(() => {
  console.log('🎉 直接路由测试完成!');
  process.exit(0);
}).catch(error => {
  console.error('💥 直接路由测试失败:', error);
  process.exit(1);
});