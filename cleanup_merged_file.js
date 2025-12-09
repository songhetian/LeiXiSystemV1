const fs = require('fs');
const path = require('path');

// 读取合并后的文件
const targetFile = path.join(__dirname, 'database', 'migrations', 'leixin_customer_service_v1.sql');
let targetContent = fs.readFileSync(targetFile, 'utf8');

console.log('开始清理文件...');

// 将文件内容分割成行
const lines = targetContent.split('\n');

// 找到第一个SET FOREIGN_KEY_CHECKS = 1;的位置
let firstForeignKeyPos = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === 'SET FOREIGN_KEY_CHECKS = 1;' && firstForeignKeyPos === -1) {
    firstForeignKeyPos = i;
    break;
  }
}

// 如果找到了，截取到这个位置的内容
if (firstForeignKeyPos !== -1) {
  // 保留到第一个SET FOREIGN_KEY_CHECKS = 1;为止的内容
  let cleanLines = lines.slice(0, firstForeignKeyPos + 1);

  // 然后找到我们添加的插入数据部分
  let insertDataLines = [];
  let inInsertSection = false;

  for (let i = firstForeignKeyPos + 1; i < lines.length; i++) {
    const line = lines[i];

    // 检查是否是我们添加的插入数据部分的开始
    if (line.includes('-- 插入基础数据') && line.includes('-- ============================================================')) {
      inInsertSection = true;
    }

    // 如果在插入数据部分，添加到insertDataLines
    if (inInsertSection) {
      insertDataLines.push(line);

      // 检查是否到达部门主管标志字段部分的结束
      if (line.includes('-- 添加部门主管标志字段') && lines[i + 1] && lines[i + 1].includes('-- ============================================================')) {
        // 继续添加直到找到空行或者文件结束
        let j = i + 1;
        while (j < lines.length && !lines[j].includes('-- 插入基础数据')) {
          insertDataLines.push(lines[j]);
          j++;
        }
        break;
      }
    }
  }

  // 合并清洁后的内容
  cleanLines = cleanLines.concat([''], insertDataLines);

  // 写入清洁后的内容
  fs.writeFileSync(targetFile, cleanLines.join('\n'), 'utf8');

  console.log('文件清理完成');
} else {
  console.log('未找到SET FOREIGN_KEY_CHECKS = 1;，文件可能已被修改');
}
