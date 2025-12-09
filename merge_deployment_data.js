const fs = require('fs');
const path = require('path');

// 读取两个文件
const deploymentFile = path.join(__dirname, 'database', 'migrations', '001_full_deployment.sql');
const targetFile = path.join(__dirname, 'database', 'migrations', 'leixin_customer_service_v1.sql');

let deploymentContent = fs.readFileSync(deploymentFile, 'utf8');
let targetContent = fs.readFileSync(targetFile, 'utf8');

console.log('开始合并文件...');

// 提取001_full_deployment.sql中的INSERT语句和权限初始化部分
const deploymentLines = deploymentContent.split('\n');
let insertStatements = [];
let permissionInitStatements = [];
let notificationSettingsStatements = [];
let departmentManagerFlagStatements = [];
let inInsertSection = false;
let inPermissionSection = false;
let inNotificationSection = false;
let inDepartmentManagerSection = false;

for (let i = 0; i < deploymentLines.length; i++) {
  const line = deploymentLines[i].trim();

  // 检查是否进入INSERT语句部分
  if (line.includes('-- 2. 插入基础数据')) {
    inInsertSection = true;
    continue;
  }

  // 检查是否进入权限初始化部分
  if (line.includes('-- 3. 初始化权限数据')) {
    inInsertSection = false;
    inPermissionSection = true;
    continue;
  }

  // 检查是否进入通知设置部分
  if (line.includes('-- 4. 初始化通知设置')) {
    inPermissionSection = false;
    inNotificationSection = true;
    continue;
  }

  // 检查是否进入部门主管标志字段部分
  if (line.includes('-- 5. 添加部门主管标志字段')) {
    inNotificationSection = false;
    inDepartmentManagerSection = true;
    continue;
  }

  // 检查是否结束所有需要提取的部分
  if (line.includes('-- 6. 完成部署')) {
    inInsertSection = false;
    inPermissionSection = false;
    inNotificationSection = false;
    inDepartmentManagerSection = false;
    continue;
  }

  // 收集INSERT语句
  if (inInsertSection && (line.startsWith('INSERT INTO') || line.startsWith('ON DUPLICATE KEY') || line.startsWith('SELECT') || line.startsWith('FROM') || line.startsWith('WHERE') || line.startsWith('SET @') || line.startsWith('PREPARE') || line.startsWith('EXECUTE') || line.startsWith('DEALLOCATE'))) {
    insertStatements.push(deploymentLines[i]);
  }

  // 收集权限初始化语句
  if (inPermissionSection && (line.startsWith('TRUNCATE TABLE') || line.startsWith('INSERT INTO') || line.startsWith('SET FOREIGN_KEY_CHECKS') || line.startsWith('--') || line.includes('权限') || line.includes('permission') || line.includes('role'))) {
    permissionInitStatements.push(deploymentLines[i]);
  }

  // 收集通知设置语句
  if (inNotificationSection && (line.startsWith('INSERT INTO') || line.startsWith('ON DUPLICATE KEY'))) {
    notificationSettingsStatements.push(deploymentLines[i]);
  }

  // 收集部门主管标志字段语句
  if (inDepartmentManagerSection && (line.startsWith('SET @col_exists') || line.startsWith('SET @ddl') || line.startsWith('PREPARE') || line.startsWith('EXECUTE') || line.startsWith('DEALLOCATE'))) {
    departmentManagerFlagStatements.push(deploymentLines[i]);
  }
}

// 在目标文件中找到合适的位置插入这些语句
const targetLines = targetContent.split('\n');
let newTargetLines = [];
let insertSectionAdded = false;
let permissionSectionAdded = false;
let notificationSectionAdded = false;
let departmentManagerSectionAdded = false;

for (let i = 0; i < targetLines.length; i++) {
  newTargetLines.push(targetLines[i]);

  // 在文件末尾添加INSERT语句
  if (!insertSectionAdded && targetLines[i].includes('SET FOREIGN_KEY_CHECKS = 1;') && i > targetLines.length - 10) {
    newTargetLines.push('');
    newTargetLines.push('-- ============================================================');
    newTargetLines.push('-- 插入基础数据');
    newTargetLines.push('-- ============================================================');
    newTargetLines.push('');
    newTargetLines = newTargetLines.concat(insertStatements);
    insertSectionAdded = true;
  }

  // 在INSERT语句后添加权限初始化语句
  if (insertSectionAdded && !permissionSectionAdded && targetLines[i].trim() === '' && newTargetLines[newTargetLines.length - 2].includes('INSERT INTO') && newTargetLines[newTargetLines.length - 3].includes('INSERT INTO')) {
    newTargetLines.push('');
    newTargetLines.push('-- ============================================================');
    newTargetLines.push('-- 初始化权限数据');
    newTargetLines.push('-- ============================================================');
    newTargetLines.push('');
    newTargetLines = newTargetLines.concat(permissionInitStatements);
    permissionSectionAdded = true;
  }

  // 在权限初始化后添加通知设置语句
  if (permissionSectionAdded && !notificationSectionAdded && targetLines[i].trim() === '' && newTargetLines[newTargetLines.length - 2].includes('INSERT INTO') && newTargetLines[newTargetLines.length - 3].includes('INSERT INTO')) {
    newTargetLines.push('');
    newTargetLines.push('-- ============================================================');
    newTargetLines.push('-- 初始化通知设置');
    newTargetLines.push('-- ============================================================');
    newTargetLines.push('');
    newTargetLines = newTargetLines.concat(notificationSettingsStatements);
    notificationSectionAdded = true;
  }

  // 在通知设置后添加部门主管标志字段语句
  if (notificationSectionAdded && !departmentManagerSectionAdded && targetLines[i].trim() === '' && newTargetLines[newTargetLines.length - 2].includes('INSERT INTO')) {
    newTargetLines.push('');
    newTargetLines.push('-- ============================================================');
    newTargetLines.push('-- 添加部门主管标志字段');
    newTargetLines.push('-- ============================================================');
    newTargetLines.push('');
    newTargetLines = newTargetLines.concat(departmentManagerFlagStatements);
    departmentManagerSectionAdded = true;
  }
}

// 写入合并后的内容到目标文件
fs.writeFileSync(targetFile, newTargetLines.join('\n'), 'utf8');

console.log('文件合并完成');
