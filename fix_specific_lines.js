const fs = require('fs');
const path = require('path');

// 读取文件
const filePath = path.join(__dirname, 'database', 'migrations', '001_full_deployment.sql');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

console.log('开始修复文件...');

// 修复answer_records表中的问题行
// 修复第28行
if (lines[27].includes('user_answer') && lines[27].includes('是否正确')) {
  lines[27] = "  `user_answer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '用户答案，根据题型格式不同',";
}

// 修复第29行（原本应该是is_correct字段）
lines[28] = "  `is_correct` tinyint(1) DEFAULT NULL COMMENT '是否正确：1-正确，0-错误，NULL-未评分',";

// 修复第40行（表结尾）
if (lines[39].includes('答题记录表') && lines[39].includes('评论ID')) {
  lines[39] = ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='答题记录表 存储用户的具体答题记录';";
  // 插入新的文章评论表开始部分
  lines.splice(40, 0, "");
  lines.splice(41, 0, "-- 文章评论表");
  lines.splice(42, 0, "DROP TABLE IF EXISTS `article_comments`;");
  lines.splice(43, 0, "/*!40101 SET @saved_cs_client     = @@character_set_client */;");
  lines.splice(44, 0, "/*!50503 SET character_set_client = utf8mb4 */;");
  lines.splice(45, 0, "CREATE TABLE `article_comments` (");
  lines.splice(46, 0, "  `id` int NOT NULL AUTO_INCREMENT COMMENT '评论ID',");
  lines.splice(47, 0, "  `article_id` int NOT NULL COMMENT '文章ID',");
  lines.splice(48, 0, "  `user_id` int NOT NULL COMMENT '用户ID',");
  lines.splice(49, 0, "  `parent_id` int DEFAULT NULL COMMENT '父评论ID',");
}

// 修复文章评论表中的外键约束问题
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("`article_comments_ibfk_1`") && lines[i].includes("bigint unsigned")) {
    // 修复外键约束中的字段类型
    lines[i] = lines[i].replace(/bigint unsigned/g, "int");
  }
}

// 写入修复后的内容
fs.writeFileSync(filePath, lines.join('\n'), 'utf8');

console.log('文件修复完成');
