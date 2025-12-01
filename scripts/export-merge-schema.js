const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const migrationsDir = path.join(__dirname, '../database/migrations');
const originalFile = path.join(migrationsDir, '001_init_database.sql');
const outputFile = path.join(migrationsDir, '001_init_database_new.sql');

// 头部内容
const header = `-- ==========================================
-- 客服管理系统 - 数据库初始化脚本
-- 生成时间: ${new Date().toISOString().split('T')[0]}
-- 说明: 完整的数据库表结构定义（包含所有模块）
-- ==========================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS leixin_customer_service DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE leixin_customer_service;

-- 设置SQL模式
SET SESSION sql_mode = 'NO_ENGINE_SUBSTITUTION';

-- 禁用外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================
-- 删除所有表（如果存在）
-- ==========================================
`;

// 初始数据部分（从原文件提取）
const seedDataStartMarker = '-- ==========================================';
const seedDataSecondMarker = '-- 插入系统必需的初始数据';

function getSeedData() {
  try {
    const originalContent = fs.readFileSync(originalFile, 'utf8');
    const seedIndex = originalContent.indexOf(seedDataSecondMarker);

    if (seedIndex !== -1) {
      const sectionStart = originalContent.lastIndexOf(seedDataStartMarker, seedIndex);
      return originalContent.substring(sectionStart);
    }
    return '';
  } catch (error) {
    console.error('Error reading original file:', error);
    return '';
  }
}

function exportAndMerge() {
  // 使用 mysqldump 导出，注意添加 --default-character-set=utf8mb4
  const cmd = 'mysqldump -h 192.168.2.3 -u tian -proot --default-character-set=utf8mb4 --no-data --skip-add-drop-table --skip-lock-tables leixin_customer_service';

  console.log('Executing mysqldump...');

  // 增加 maxBuffer 以处理大量输出
  exec(cmd, { maxBuffer: 1024 * 1024 * 10, encoding: 'utf8' }, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }

    console.log('Export successful. Processing content...');

    let schemaContent = stdout;

    // 清理内容
    schemaContent = schemaContent.replace(/AUTO_INCREMENT=\d+\s/g, '');
    schemaContent = schemaContent.replace(/^-- MySQL dump.*$/gm, '');
    schemaContent = schemaContent.replace(/^-- Host:.*$/gm, '');
    schemaContent = schemaContent.replace(/^-- Server version.*$/gm, '');

    // 获取种子数据
    const seedContent = getSeedData();

    if (!seedContent) {
      console.error('Failed to extract seed data!');
      return;
    }

    // 组合最终内容
    const finalContent = header +
      '\n-- ==========================================\n-- 完整表结构\n-- ==========================================\n\n' +
      schemaContent +
      '\n\n' +
      seedContent;

    // 写入文件，强制 UTF-8
    fs.writeFileSync(outputFile, finalContent, { encoding: 'utf8' });
    console.log('Successfully created new migration file:', outputFile);
  });
}

exportAndMerge();
