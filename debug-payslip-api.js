const { loadConfig } = require('./server/utils/config-crypto');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

async function debugFrontendAPI() {
  let connection;
  
  try {
    // 获取数据库配置
    const config = loadConfig('./config/db-config.json');
    connection = await mysql.createConnection(config.database);
    console.log('✅ 数据库连接成功');

    // 1. 创建一个真实的用户token（模拟前端登录）
    const [users] = await connection.execute(`
      SELECT u.id, u.username, u.real_name, u.department_id 
      FROM users u 
      WHERE u.status = 'active' AND u.username = 'admin'
      LIMIT 1
    `);

    if (users.length === 0) {
      console.log('❌ 没有找到admin用户');
      return;
    }

    const user = users[0];
    console.log('👤 找到用户:', user);

    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign({
      id: user.id,
      username: user.username,
      department_id: user.department_id
    }, JWT_SECRET, { expiresIn: '1h' });

    console.log('🔑 生成Token:', token);

    // 2. 模拟前端API调用
    const url = 'http://localhost:3001/api/admin/payslips';
    const params = {
      page: 1,
      limit: 20
    };
    
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = `${url}?${queryString}`;
    
    console.log('🌐 API URL:', fullUrl);
    console.log('📋 请求参数:', params);

    const response = await fetch(fullUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 响应状态:', response.status);
    console.log('📊 响应头:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('📊 响应数据:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log(`✅ API调用成功 - 返回 ${data.data?.length || 0} 条记录`);
      console.log('📊 总记录数:', data.total);
      
      // 显示前几条记录
      if (data.data && data.data.length > 0) {
        console.log('\n📋 前几条记录:');
        data.data.slice(0, 5).forEach((record, index) => {
          console.log(`${index + 1}. ${record.payslip_no} - ${record.employee_name} - ¥${record.net_salary} - ${record.status}`);
        });
      }
    } else {
      console.log('❌ API调用失败:', data.message);
    }

    // 3. 检查数据库中的实际数据
    console.log('\n🔍 检查数据库实际数据...');
    
    const [totalCount] = await connection.execute('SELECT COUNT(*) as count FROM payslips');
    console.log('💾 数据库总记录数:', totalCount[0].count);

    const [withJoins] = await connection.execute(`
      SELECT 
        p.payslip_no,
        u.real_name,
        e.employee_no,
        d.name as department_name,
        u.department_id as user_department_id
      FROM payslips p
      LEFT JOIN employees e ON p.employee_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      LIMIT 3
    `);
    
    console.log('📋 数据库中的前3条记录:');
    withJoins.forEach((record, index) => {
      console.log(`${index + 1}. ${record.payslip_no} - ${record.real_name} (${record.employee_no}) - 部门ID: ${record.user_department_id} - 部门: ${record.department_name}`);
    });

  } catch (error) {
    console.error('❌ 调试失败:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 运行调试
debugFrontendAPI().then(() => {
  console.log('\n🎉 API调试完成!');
  process.exit(0);
}).catch(error => {
  console.error('💥 调试失败:', error);
  process.exit(1);
});