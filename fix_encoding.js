const fs = require('fs');
const path = require('path');

// 读取文件
const filePath = path.join(__dirname, 'database', 'migrations', '001_full_deployment.sql');
let content = fs.readFileSync(filePath, 'utf8');

// 修复answer_records表中的注释乱码问题
content = content.replace(
  /`user_answer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '用户答案，根据题型格式[^']*'/g,
  "`user_answer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '用户答案，根据题型格式不同'"
);

content = content.replace(
  /`is_correct` tinyint\(1\) DEFAULT NULL COMMENT '是否正确[^']*'/g,
  "`is_correct` tinyint(1) DEFAULT NULL COMMENT '是否正确：1-正确，0-错误，NULL-未评分'"
);

content = content.replace(
  /COMMENT='答题记录[^']*'/g,
  "COMMENT='答题记录表 存储用户的具体答题记录'"
);

// 修复文章评论表中的字段类型不匹配问题
content = content.replace(
  /`id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '评论ID',\s*`article_id` bigint unsigned NOT NULL COMMENT '文章ID',\s*`parent_id` bigint unsigned DEFAULT NULL COMMENT '父评论ID'/g,
  "`id` int NOT NULL AUTO_INCREMENT COMMENT '评论ID',\n  `article_id` int NOT NULL COMMENT '文章ID',\n  `parent_id` int DEFAULT NULL COMMENT '父评论ID'"
);

// 写入修复后的内容
fs.writeFileSync(filePath, content, 'utf8');

console.log('文件修复完成');
