const fs = require('fs');
const path = require('path');

// 读取文件
const filePath = path.join(__dirname, 'database', 'migrations', '001_full_deployment.sql');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

console.log('开始修复文件...');

// 修复answer_records表，添加缺失的score字段
// 在time_spent字段之前添加score字段
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('`time_spent` int DEFAULT NULL COMMENT')) {
    lines.splice(i, 0, "  `score` decimal(5,2) DEFAULT NULL COMMENT '该题得分',");
    break;
  }
}

// 修复文章评论表中的重复字段问题
let inArticleCommentsTable = false;
let articleCommentsStartIndex = -1;
let duplicatesToRemove = [];

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('CREATE TABLE `article_comments`')) {
    inArticleCommentsTable = true;
    articleCommentsStartIndex = i;
  } else if (inArticleCommentsTable && lines[i].includes(') ENGINE=InnoDB')) {
    inArticleCommentsTable = false;
  }

  // 如果在文章评论表中，检查重复字段
  if (inArticleCommentsTable && articleCommentsStartIndex > 0) {
    // 检查重复的字段定义
    if (lines[i].includes('`article_id` bigint unsigned NOT NULL COMMENT') ||
        lines[i].includes('`user_id` int NOT NULL COMMENT') ||
        lines[i].includes('`parent_id` bigint unsigned DEFAULT NULL COMMENT')) {
      // 检查是否是重复定义（在正确定义之后出现的）
      if (i > articleCommentsStartIndex + 10) { // 假设正确字段在前10行内
        duplicatesToRemove.push(i);
      }
    }
  }
}

// 从后往前删除重复行，避免索引变化
duplicatesToRemove.sort((a, b) => b - a);
for (let index of duplicatesToRemove) {
  lines.splice(index, 1);
}

// 修复文章评论表中的字段类型
for (let i = 0; i < lines.length; i++) {
  // 修复id字段类型
  if (lines[i].includes('`id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT')) {
    lines[i] = lines[i].replace('`id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT', '`id` int NOT NULL AUTO_INCREMENT COMMENT');
  }
  // 修复article_id字段类型
  if (lines[i].includes('`article_id` bigint unsigned NOT NULL COMMENT')) {
    lines[i] = lines[i].replace('`article_id` bigint unsigned NOT NULL COMMENT', '`article_id` int NOT NULL COMMENT');
  }
  // 修复parent_id字段类型
  if (lines[i].includes('`parent_id` bigint unsigned DEFAULT NULL COMMENT')) {
    lines[i] = lines[i].replace('`parent_id` bigint unsigned DEFAULT NULL COMMENT', '`parent_id` int DEFAULT NULL COMMENT');
  }
}

// 写入修复后的内容
fs.writeFileSync(filePath, lines.join('\n'), 'utf8');

console.log('文件修复完成');
