const fs = require('fs');
const path = require('path');

// 读取两个文件
const deploymentFile = path.join(__dirname, 'database', 'migrations', '001_full_deployment.sql');
const targetFile = path.join(__dirname, 'database', 'migrations', 'leixin_customer_service_v1.sql');

let deploymentContent = fs.readFileSync(deploymentFile, 'utf8');
let targetContent = fs.readFileSync(targetFile, 'utf8');

console.log('开始合并文件...');

// 提取001_full_deployment.sql中的各个部分
const deploymentLines = deploymentContent.split('\n');

// 提取INSERT语句部分（包括基础数据）
let baseDataSection = [];
let permissionSection = [];
let notificationSection = [];
let departmentManagerSection = [];

let currentSection = null;

for (let i = 0; i < deploymentLines.length; i++) {
  const line = deploymentLines[i];

  // 检查各部分的开始
  if (line.includes('-- 2. 插入基础数据')) {
    currentSection = 'baseData';
    baseDataSection.push(line);
    continue;
  } else if (line.includes('-- 3. 初始化权限数据')) {
    currentSection = 'permission';
    permissionSection.push(line);
    continue;
  } else if (line.includes('-- 4. 初始化通知设置')) {
    currentSection = 'notification';
    notificationSection.push(line);
    continue;
  } else if (line.includes('-- 5. 添加部门主管标志字段')) {
    currentSection = 'departmentManager';
    departmentManagerSection.push(line);
    continue;
  } else if (line.includes('-- 6. 完成部署')) {
    currentSection = null;
    continue;
  }

  // 根据当前部分收集内容
  if (currentSection === 'baseData') {
    baseDataSection.push(line);
  } else if (currentSection === 'permission') {
    permissionSection.push(line);
  } else if (currentSection === 'notification') {
    notificationSection.push(line);
  } else if (currentSection === 'departmentManager') {
    departmentManagerSection.push(line);
  }
}

// 在目标文件中找到合适的位置插入这些语句
const targetLines = targetContent.split('\n');
let newTargetLines = [];

// 复制目标文件的所有内容直到SET FOREIGN_KEY_CHECKS = 1;
let foundForeignKeyCheck = false;
for (let i = 0; i < targetLines.length; i++) {
  newTargetLines.push(targetLines[i]);

  if (targetLines[i].trim() === 'SET FOREIGN_KEY_CHECKS = 1;' && !foundForeignKeyCheck) {
    foundForeignKeyCheck = true;

    // 在这里插入所有提取的部分
    newTargetLines.push('');

    // 插入基础数据部分
    newTargetLines.push('-- ============================================================');
    newTargetLines.push('-- 插入基础数据');
    newTargetLines.push('-- ============================================================');
    newTargetLines.push('');
    baseDataSection.forEach(line => {
      if (!line.includes('-- 2. 插入基础数据') && !line.includes('-- ============================================================')) {
        newTargetLines.push(line);
      }
    });

    newTargetLines.push('');

    // 插入权限初始化部分
    newTargetLines.push('-- ============================================================');
    newTargetLines.push('-- 初始化权限数据');
    newTargetLines.push('-- ============================================================');
    newTargetLines.push('');
    permissionSection.forEach(line => {
      if (!line.includes('-- 3. 初始化权限数据') && !line.includes('-- ============================================================')) {
        newTargetLines.push(line);
      }
    });

    newTargetLines.push('');

    // 插入通知设置部分
    newTargetLines.push('-- ============================================================');
    newTargetLines.push('-- 初始化通知设置');
    newTargetLines.push('-- ============================================================');
    newTargetLines.push('');
    notificationSection.forEach(line => {
      if (!line.includes('-- 4. 初始化通知设置') && !line.includes('-- ============================================================')) {
        newTargetLines.push(line);
      }
    });

    newTargetLines.push('');

    // 插入部门主管标志字段部分
    newTargetLines.push('-- ============================================================');
    newTargetLines.push('-- 添加部门主管标志字段');
    newTargetLines.push('-- ============================================================');
    newTargetLines.push('');
    departmentManagerSection.forEach(line => {
      if (!line.includes('-- 5. 添加部门主管标志字段') && !line.includes('-- ============================================================')) {
        newTargetLines.push(line);
      }
    });

    newTargetLines.push('');
  }
}

// 写入合并后的内容到目标文件
fs.writeFileSync(targetFile, newTargetLines.join('\n'), 'utf8');

console.log('文件合并完成');
