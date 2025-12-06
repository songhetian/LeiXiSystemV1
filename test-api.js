const axios = require('axios');

async function testApi() {
  try {
    console.log('Testing API connection...');
    
    // 测试根路径
    const response = await axios.get('http://192.168.2.31:3001/api');
    console.log('API Root Response:', response.data);
    
    // 测试健康检查
    const healthResponse = await axios.get('http://192.168.2.31:3001/api/health');
    console.log('Health Check Response:', healthResponse.data);
    
  } catch (error) {
    console.error('API Test Failed:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

testApi();