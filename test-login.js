const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login API...');
    
    // 测试根路径
    const rootResponse = await axios.get('http://localhost:3001/api');
    console.log('Root API Response:', rootResponse.data);
    
    // 测试登录 - 使用正确的密码
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: '123456'  // 使用正确的密码
    });
    
    console.log('Login Response:', loginResponse.data);
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

testLogin();