const { formatDate } = require('./src/utils/date');

// 模拟实际从数据库获取并在前端显示的日期数据
console.log('=== 最终调试测试 ===');

// 情况1: 数据库中的日期字段，在JSON序列化后变成Date对象
console.log('\n1. 数据库日期字段模拟:');
const dbDate1 = new Date('2025-12-10T00:00:00.000Z');
const dbDate2 = new Date('2025-12-11T00:00:00.000Z');

console.log('dbDate1 (new Date("2025-12-10T00:00:00.000Z")):');
console.log('  toISOString():', dbDate1.toISOString());
console.log('  formatDate():', formatDate(dbDate1));

console.log('dbDate2 (new Date("2025-12-11T00:00:00.000Z")):');
console.log('  toISOString():', dbDate2.toISOString());
console.log('  formatDate():', formatDate(dbDate2));

// 情况2: 检查是否有时区影响
console.log('\n2. 时区影响检查:');
const now = new Date();
console.log('当前时间:');
console.log('  toISOString():', now.toISOString());
console.log('  toLocaleString():', now.toLocaleString());
console.log('  formatDate():', formatDate(now));
console.log('  formatDate(now, true):', formatDate(now, true));

// 情况3: 纯字符串测试
console.log('\n3. 纯字符串测试:');
console.log('formatDate("2025-12-10"):', formatDate("2025-12-10"));
console.log('formatDate("2025-12-11"):', formatDate("2025-12-11"));

// 情况4: 检查边界情况
console.log('\n4. 边界情况测试:');
console.log('formatDate(null):', formatDate(null));
console.log('formatDate(undefined):', formatDate(undefined));
console.log('formatDate(""):', formatDate(""));
