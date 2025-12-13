const { formatDate, formatDateTime } = require('./src/utils/date');

console.log('=== 数据库日期字段处理测试 ===');

// 模拟从数据库获取并通过API传输的日期数据
// 这些本来是纯日期，但在JSON序列化后变成了Date对象
const dbDateFields = [
  new Date('2025-12-10T00:00:00'), // 模拟 original_schedule_date
  new Date('2025-12-11T00:00:00')  // 模拟 new_schedule_date
];

console.log('模拟数据库中的纯日期字段在前端的处理:');
dbDateFields.forEach((date, index) => {
  const fieldName = index === 0 ? 'original_schedule_date' : 'new_schedule_date';
  console.log(`\n${fieldName}:`, date);
  console.log('  formatDate (仅日期):', formatDate(date));
  console.log('  formatDateTime (含时间):', formatDateTime(date));
});

// 测试时间戳字段
console.log('\n=== 时间戳字段处理测试 ===');
const timestampFields = [
  new Date('2025-12-08T16:03:44') // 模拟 created_at
];

timestampFields.forEach((date, index) => {
  console.log(`\ntimestamp field ${index + 1}:`, date);
  console.log('  formatDate (仅日期):', formatDate(date));
  console.log('  formatDateTime (含时间):', formatDateTime(date));
});

// 测试纯字符串
console.log('\n=== 纯字符串处理测试 ===');
const stringDates = [
  '2025-12-10',
  '2025-12-11 16:03:44'
];

stringDates.forEach((date, index) => {
  console.log(`\nstring date ${index + 1}:`, date);
  console.log('  formatDate (仅日期):', formatDate(date));
  console.log('  formatDateTime (含时间):', formatDateTime(date));
});
