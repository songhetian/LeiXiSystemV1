is_rest_day // 测试数据库日期字段在API返回时的变化
const mysql = require('mysql2/promise');
const fs = require('fs');

async function testDateHandling() {
  console.log('=== 测试数据库日期字段处理 ===');

  // 读取数据库配置
  let dbConfig;
  try {
    const configContent = fs.readFileSync('./config/db-config.json', 'utf8');
    const decryptedConfig = JSON.parse(configContent);
    dbConfig = decryptedConfig.database;
  } catch (err) {
    console.error('无法读取数据库配置:', err.message);
    return;
  }

  try {
    // 创建数据库连接
    const connection = await mysql.createConnection(dbConfig);

    // 查询特定的调休申请记录
    const [rows] = await connection.execute(
      'SELECT id, original_schedule_date, new_schedule_date, created_at FROM compensatory_leave_requests WHERE id = 12'
    );

    console.log('数据库直接查询结果:');
    console.log(rows[0]);

    // 检查数据类型
    const record = rows[0];
    console.log('\n数据类型检查:');
    console.log('original_schedule_date 类型:', typeof record.original_schedule_date);
    console.log('original_schedule_date 值:', record.original_schedule_date);
    console.log('new_schedule_date 类型:', typeof record.new_schedule_date);
    console.log('new_schedule_date 值:', record.new_schedule_date);

    // 模拟API JSON序列化过程
    console.log('\n模拟API JSON序列化:');
    const serialized = JSON.stringify(record);
    console.log('序列化结果:', serialized);

    // 模拟前端反序列化过程
    console.log('\n模拟前端反序列化:');
    const deserialized = JSON.parse(serialized);
    console.log('反序列化结果:', deserialized);

    // 检查反序列化后的数据类型
    console.log('\n反序列化后数据类型:');
    console.log('original_schedule_date 类型:', typeof deserialized.original_schedule_date);
    console.log('original_schedule_date 值:', deserialized.original_schedule_date);
    console.log('new_schedule_date 类型:', typeof deserialized.new_schedule_date);
    console.log('new_schedule_date 值:', deserialized.new_schedule_date);

    // 创建Date对象并检查
    console.log('\n创建Date对象:');
    const originalDate = new Date(deserialized.original_schedule_date);
    const newDate = new Date(deserialized.new_schedule_date);

    console.log('originalDate:', originalDate);
    console.log('originalDate.toISOString():', originalDate.toISOString());
    console.log('originalDate.getFullYear():', originalDate.getFullYear());
    console.log('originalDate.getMonth():', originalDate.getMonth());
    console.log('originalDate.getDate():', originalDate.getDate());

    console.log('newDate:', newDate);
    console.log('newDate.toISOString():', newDate.toISOString());
    console.log('newDate.getFullYear():', newDate.getFullYear());
    console.log('newDate.getMonth():', newDate.getMonth());
    console.log('newDate.getDate():', newDate.getDate());

    await connection.end();
  } catch (error) {
    console.error('测试过程中出错:', error.message);
  }
}

testDateHandling();
