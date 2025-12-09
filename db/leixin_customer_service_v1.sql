/*
 Navicat Premium Dump SQL

 Source Server         : 本地
 Source Server Type    : MySQL
 Source Server Version : 80043 (8.0.43)
 Source Host           : localhost:3306
 Source Schema         : leixin_customer_service_v1

 Target Server Type    : MySQL
 Target Server Version : 80043 (8.0.43)
 File Encoding         : 65001

 Date: 09/12/2025 18:02:36
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for answer_records
-- ----------------------------
DROP TABLE IF EXISTS `answer_records`;
CREATE TABLE `answer_records`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '答题记录唯一标识ID',
  `result_id` int NOT NULL COMMENT '考核结果ID，关联assessment_results表，级联删除',
  `question_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '题目ID，支持临时ID(temp_前缀)和正式ID',
  `user_answer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '用户答案，根据题型格式不同',
  `is_correct` tinyint(1) NULL DEFAULT NULL COMMENT '是否正确：1-正确，0-错误，NULL-未评分',
  `score` decimal(5, 2) NULL DEFAULT NULL COMMENT '该题得分',
  `time_spent` int NULL DEFAULT NULL COMMENT '答题用时，单位秒',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_result_question`(`result_id` ASC, `question_id` ASC) USING BTREE,
  INDEX `idx_result_id`(`result_id` ASC) USING BTREE,
  INDEX `idx_is_correct`(`is_correct` ASC) USING BTREE,
  INDEX `idx_score`(`score` ASC) USING BTREE,
  INDEX `idx_time_spent`(`time_spent` ASC) USING BTREE,
  INDEX `idx_question_id`(`question_id` ASC) USING BTREE,
  CONSTRAINT `fk_answer_records_result_id` FOREIGN KEY (`result_id`) REFERENCES `assessment_results` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 145 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '答题记录表-存储用户的具体答题记录' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for article_comments
-- ----------------------------
DROP TABLE IF EXISTS `article_comments`;
CREATE TABLE `article_comments`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '评论ID',
  `article_id` bigint UNSIGNED NOT NULL COMMENT '文章ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `parent_id` bigint UNSIGNED NULL DEFAULT NULL COMMENT '父评论ID',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '评论内容',
  `like_count` int NOT NULL DEFAULT 0 COMMENT '点赞数',
  `is_pinned` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否置顶',
  `status` enum('active','deleted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active' COMMENT '评论状态',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_article_id`(`article_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_parent_id`(`parent_id` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  CONSTRAINT `article_comments_ibfk_1` FOREIGN KEY (`article_id`) REFERENCES `knowledge_articles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `article_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `article_comments_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `article_comments` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for article_likes
-- ----------------------------
DROP TABLE IF EXISTS `article_likes`;
CREATE TABLE `article_likes`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `article_id` int NOT NULL,
  `user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_like`(`article_id` ASC, `user_id` ASC) USING BTREE,
  INDEX `idx_article`(`article_id` ASC) USING BTREE,
  INDEX `idx_user`(`user_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for assessment_plans
-- ----------------------------
DROP TABLE IF EXISTS `assessment_plans`;
CREATE TABLE `assessment_plans`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '考核计划唯一标识ID',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '计划标题，如\"2024年第一季度考核\"',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '计划详细描述，说明考核目的和要求',
  `exam_id` int NOT NULL COMMENT '关联的试卷ID，关联exams表，级联删除',
  `target_users` json NULL COMMENT '目标用户列表，JSON格式存储用户ID数组',
  `target_departments` json NULL COMMENT '目标部门ID列表（JSON数组）',
  `start_time` datetime NOT NULL COMMENT '考核开始时间',
  `end_time` datetime NOT NULL COMMENT '考核结束时间',
  `max_attempts` int NOT NULL DEFAULT 1 COMMENT '最大尝试次数，防止无限重考',
  `status` enum('draft','published','ongoing','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft' COMMENT '计划状态：draft-草稿，published-已发布，ongoing-进行中，completed-已完成，cancelled-已取消',
  `created_by` int NULL DEFAULT NULL COMMENT '创建人用户ID，关联users表',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录最后更新时间',
  `is_deleted` tinyint(1) NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_title`(`title` ASC) USING BTREE,
  INDEX `idx_exam_id`(`exam_id` ASC) USING BTREE,
  INDEX `idx_start_time`(`start_time` ASC) USING BTREE,
  INDEX `idx_end_time`(`end_time` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_created_by`(`created_by` ASC) USING BTREE,
  INDEX `idx_time_range`(`start_time` ASC, `end_time` ASC) USING BTREE,
  CONSTRAINT `fk_assessment_plans_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_assessment_plans_exam_id` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 14 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '考核计划表-存储考核计划的安排和配置信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for assessment_results
-- ----------------------------
DROP TABLE IF EXISTS `assessment_results`;
CREATE TABLE `assessment_results`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '考核结果唯一标识ID',
  `plan_id` int NOT NULL COMMENT '考核计划ID，关联assessment_plans表，级联删除',
  `exam_id` int NOT NULL COMMENT '试卷ID，关联exams表，级联删除',
  `user_id` int NOT NULL COMMENT '考试用户ID，关联users表，级联删除',
  `attempt_number` int NOT NULL DEFAULT 1 COMMENT '尝试次数，第几次考试',
  `start_time` datetime NOT NULL COMMENT '考试开始时间',
  `submit_time` datetime NULL DEFAULT NULL COMMENT '提交时间，NULL表示未提交',
  `duration` int NULL DEFAULT NULL COMMENT '实际用时，单位秒',
  `score` decimal(5, 2) NULL DEFAULT NULL COMMENT '考试得分',
  `is_passed` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否通过：1-通过，0-未通过',
  `status` enum('in_progress','submitted','graded','expired') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in_progress' COMMENT '考试状态：in_progress-进行中，submitted-已提交，graded-已评分，expired-已过期',
  `answers` json NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录最后更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_plan_id`(`plan_id` ASC) USING BTREE,
  INDEX `idx_exam_id`(`exam_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_attempt_number`(`attempt_number` ASC) USING BTREE,
  INDEX `idx_start_time`(`start_time` ASC) USING BTREE,
  INDEX `idx_submit_time`(`submit_time` ASC) USING BTREE,
  INDEX `idx_duration`(`duration` ASC) USING BTREE,
  INDEX `idx_score`(`score` ASC) USING BTREE,
  INDEX `idx_is_passed`(`is_passed` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  CONSTRAINT `fk_assessment_results_exam_id` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_assessment_results_plan_id` FOREIGN KEY (`plan_id`) REFERENCES `assessment_plans` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_assessment_results_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 40 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '考核结果表-存储用户的考试结果和成绩信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for attendance_records
-- ----------------------------
DROP TABLE IF EXISTS `attendance_records`;
CREATE TABLE `attendance_records`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '考勤记录唯一标识ID',
  `user_id` int NOT NULL COMMENT '员工用户ID，关联users表，级联删除',
  `attendance_date` date NOT NULL COMMENT '考勤日期，YYYY-MM-DD格式',
  `check_in_time` datetime NULL DEFAULT NULL COMMENT '签到时间，精确到秒',
  `check_out_time` datetime NULL DEFAULT NULL COMMENT '签退时间，精确到秒',
  `work_hours` decimal(5, 2) NULL DEFAULT NULL COMMENT '实际工作时长，单位小时，自动计算',
  `overtime_hours` decimal(5, 2) NOT NULL DEFAULT 0.00 COMMENT '加班时长，单位小时',
  `status` enum('normal','late','early_leave','absent','overtime') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal' COMMENT '考勤状态：normal-正常，late-迟到，early_leave-早退，absent-缺勤，overtime-加班',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '考勤备注，异常情况说明',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录最后更新时间',
  `clock_out_time` datetime NULL DEFAULT NULL,
  `clock_out_location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `employee_id` int NOT NULL,
  `record_date` date NOT NULL,
  `clock_in_time` datetime NULL DEFAULT NULL,
  `clock_in_location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `is_overtime` tinyint(1) NULL DEFAULT 0,
  `remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_date`(`user_id` ASC, `attendance_date` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_attendance_date`(`attendance_date` ASC) USING BTREE,
  INDEX `idx_check_in_time`(`check_in_time` ASC) USING BTREE,
  INDEX `idx_check_out_time`(`check_out_time` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_user_date_status`(`user_id` ASC, `attendance_date` ASC, `status` ASC) USING BTREE,
  INDEX `idx_employee_date`(`employee_id` ASC, `record_date` ASC) USING BTREE,
  CONSTRAINT `fk_attendance_records_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 34 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '考勤记录表-员工考勤打卡记录表，记录每日的签到签退信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for attendance_rules
-- ----------------------------
DROP TABLE IF EXISTS `attendance_rules`;
CREATE TABLE `attendance_rules`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `rule_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '规则名称',
  `rule_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '规则类型',
  `rule_value` json NULL COMMENT '规则值',
  `is_active` tinyint(1) NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_rule_type`(`rule_type` ASC) USING BTREE,
  INDEX `idx_is_active`(`is_active` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '考勤规则表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for attendance_settings
-- ----------------------------
DROP TABLE IF EXISTS `attendance_settings`;
CREATE TABLE `attendance_settings`  (
  `id` int NOT NULL,
  `enable_location_check` tinyint(1) NOT NULL DEFAULT 0,
  `allowed_distance` int NOT NULL DEFAULT 500,
  `allowed_locations` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `enable_time_check` tinyint(1) NOT NULL DEFAULT 1,
  `early_clock_in_minutes` int NOT NULL DEFAULT 60,
  `late_clock_out_minutes` int NOT NULL DEFAULT 120,
  `late_minutes` int NOT NULL DEFAULT 30,
  `early_leave_minutes` int NOT NULL DEFAULT 30,
  `absent_hours` int NOT NULL DEFAULT 4,
  `max_annual_leave_days` int NOT NULL DEFAULT 10,
  `max_sick_leave_days` int NOT NULL DEFAULT 15,
  `require_proof_for_sick_leave` tinyint(1) NOT NULL DEFAULT 1,
  `require_approval_for_overtime` tinyint(1) NOT NULL DEFAULT 1,
  `min_overtime_hours` decimal(4, 1) NOT NULL DEFAULT 1.0,
  `max_overtime_hours_per_day` int NOT NULL DEFAULT 4,
  `allow_makeup` tinyint(1) NOT NULL DEFAULT 1,
  `makeup_deadline_days` int NOT NULL DEFAULT 3,
  `require_approval_for_makeup` tinyint(1) NOT NULL DEFAULT 1,
  `notify_on_late` tinyint(1) NOT NULL DEFAULT 1,
  `notify_on_early_leave` tinyint(1) NOT NULL DEFAULT 1,
  `notify_on_absent` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for broadcast_recipients
-- ----------------------------
DROP TABLE IF EXISTS `broadcast_recipients`;
CREATE TABLE `broadcast_recipients`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `broadcast_id` int NOT NULL COMMENT '广播ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `is_read` tinyint(1) NULL DEFAULT 0 COMMENT '是否已读',
  `read_at` timestamp NULL DEFAULT NULL COMMENT '阅读时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_broadcast_user`(`broadcast_id` ASC, `user_id` ASC) USING BTREE,
  INDEX `idx_broadcast`(`broadcast_id` ASC) USING BTREE,
  INDEX `idx_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_read`(`is_read` ASC) USING BTREE,
  CONSTRAINT `broadcast_recipients_ibfk_1` FOREIGN KEY (`broadcast_id`) REFERENCES `broadcasts` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `broadcast_recipients_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 140 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '广播接收记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for broadcasts
-- ----------------------------
DROP TABLE IF EXISTS `broadcasts`;
CREATE TABLE `broadcasts`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '广播标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '广播内容',
  `type` enum('info','warning','success','error','announcement') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'info' COMMENT '广播类型',
  `priority` enum('low','normal','high','urgent') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'normal' COMMENT '优先级',
  `target_type` enum('all','department','role','individual') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '目标类型',
  `target_departments` json NULL COMMENT '目标部门ID列表',
  `target_roles` json NULL COMMENT '目标角色列表',
  `target_users` json NULL COMMENT '目标用户ID列表',
  `creator_id` int NOT NULL COMMENT '创建者ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `expires_at` timestamp NULL DEFAULT NULL COMMENT '过期时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_creator`(`creator_id` ASC) USING BTREE,
  INDEX `idx_created`(`created_at` ASC) USING BTREE,
  CONSTRAINT `broadcasts_ibfk_1` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 38 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '系统广播表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for case_attachments
-- ----------------------------
DROP TABLE IF EXISTS `case_attachments`;
CREATE TABLE `case_attachments`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `case_id` int NOT NULL COMMENT '案例ID',
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文件名称',
  `file_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '文件类型 (e.g., image/jpeg, application/pdf)',
  `file_size` int NULL DEFAULT NULL COMMENT '文件大小 (bytes)',
  `file_url` varchar(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文件存储URL',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `case_id`(`case_id` ASC) USING BTREE,
  CONSTRAINT `case_attachments_ibfk_1` FOREIGN KEY (`case_id`) REFERENCES `quality_cases` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for case_categories
-- ----------------------------
DROP TABLE IF EXISTS `case_categories`;
CREATE TABLE `case_categories`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '分类名称',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '分类描述',
  `parent_id` int NULL DEFAULT NULL COMMENT '父分类ID（支持多级分类）',
  `sort_order` int NULL DEFAULT 0 COMMENT '排序权重',
  `is_active` tinyint(1) NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name` ASC) USING BTREE,
  INDEX `idx_parent`(`parent_id` ASC) USING BTREE,
  INDEX `idx_active`(`is_active` ASC) USING BTREE,
  CONSTRAINT `case_categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `case_categories` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '案例分类表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for case_comments
-- ----------------------------
DROP TABLE IF EXISTS `case_comments`;
CREATE TABLE `case_comments`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `case_id` int NOT NULL COMMENT '案例ID',
  `user_id` int NOT NULL COMMENT '评论用户ID',
  `comment_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '评论内容',
  `parent_comment_id` int NULL DEFAULT NULL COMMENT '父评论ID (用于回复)',
  `like_count` int NULL DEFAULT 0 COMMENT '点赞次数',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `case_id`(`case_id` ASC) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  INDEX `parent_comment_id`(`parent_comment_id` ASC) USING BTREE,
  CONSTRAINT `case_comments_ibfk_1` FOREIGN KEY (`case_id`) REFERENCES `quality_cases` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `case_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `case_comments_ibfk_3` FOREIGN KEY (`parent_comment_id`) REFERENCES `case_comments` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for case_learning_records
-- ----------------------------
DROP TABLE IF EXISTS `case_learning_records`;
CREATE TABLE `case_learning_records`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `case_id` int NOT NULL,
  `start_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `end_time` timestamp NULL DEFAULT NULL,
  `duration_seconds` int NULL DEFAULT 0,
  `progress_percentage` int NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_id`(`user_id` ASC, `case_id` ASC) USING BTREE,
  INDEX `case_id`(`case_id` ASC) USING BTREE,
  CONSTRAINT `case_learning_records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `case_learning_records_ibfk_2` FOREIGN KEY (`case_id`) REFERENCES `quality_cases` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for case_tags
-- ----------------------------
DROP TABLE IF EXISTS `case_tags`;
CREATE TABLE `case_tags`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '关联记录唯一标识ID',
  `case_id` int NOT NULL COMMENT '案例ID，关联cases表，级联删除',
  `tag_id` int NOT NULL COMMENT '标签ID，关联tags表，级联删除',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '关联创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_case_tag`(`case_id` ASC, `tag_id` ASC) USING BTREE,
  INDEX `idx_case_id`(`case_id` ASC) USING BTREE,
  INDEX `idx_tag_id`(`tag_id` ASC) USING BTREE,
  CONSTRAINT `fk_case_tags_case_id` FOREIGN KEY (`case_id`) REFERENCES `cases` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_case_tags_tag_id` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '案例标签关联表-案例与标签的多对多关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for cases
-- ----------------------------
DROP TABLE IF EXISTS `cases`;
CREATE TABLE `cases`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '案例唯一标识ID',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '案例标题，简洁明了的问题描述',
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '案例分类，如\"技术问题\"、\"服务投诉\"',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '案例详细描述，问题的具体情况',
  `problem` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '问题描述，客户遇到的具体问题',
  `solution` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '解决方案，详细的处理步骤和方法',
  `difficulty` enum('easy','medium','hard') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium' COMMENT '难度等级：easy-简单，medium-中等，hard-困难',
  `priority` enum('low','medium','high','urgent') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium' COMMENT '优先级：low-低，medium-中，high-高，urgent-紧急',
  `status` enum('draft','published','archived') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft' COMMENT '状态：draft-草稿，published-已发布，archived-已归档',
  `view_count` int NOT NULL DEFAULT 0 COMMENT '浏览次数，用于统计热门案例',
  `like_count` int NOT NULL DEFAULT 0 COMMENT '点赞次数，用于评估案例质量',
  `created_by` int NULL DEFAULT NULL COMMENT '创建人用户ID，关联users表',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录最后更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_title`(`title` ASC) USING BTREE,
  INDEX `idx_category`(`category` ASC) USING BTREE,
  INDEX `idx_difficulty`(`difficulty` ASC) USING BTREE,
  INDEX `idx_priority`(`priority` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_view_count`(`view_count` ASC) USING BTREE,
  INDEX `idx_like_count`(`like_count` ASC) USING BTREE,
  INDEX `idx_created_by`(`created_by` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  FULLTEXT INDEX `ft_content_search`(`title`, `description`, `problem`, `solution`),
  CONSTRAINT `fk_cases_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '案例表-存储知识案例库的案例信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for chat_room_members
-- ----------------------------
DROP TABLE IF EXISTS `chat_room_members`;
CREATE TABLE `chat_room_members`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '成员关系唯一标识ID',
  `room_id` int NOT NULL COMMENT '聊天室ID，关联chat_rooms表，级联删除',
  `user_id` int NOT NULL COMMENT '用户ID，关联users表，级联删除',
  `role` enum('owner','admin','member') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'member' COMMENT '成员角色：owner-群主，admin-管理员，member-普通成员',
  `joined_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `last_read_at` datetime NULL DEFAULT NULL COMMENT '最后阅读时间，用于计算未读消息',
  `is_muted` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否静音：1-静音，0-正常',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_room_user`(`room_id` ASC, `user_id` ASC) USING BTREE,
  INDEX `idx_room_id`(`room_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_role`(`role` ASC) USING BTREE,
  INDEX `idx_joined_at`(`joined_at` ASC) USING BTREE,
  INDEX `idx_last_read_at`(`last_read_at` ASC) USING BTREE,
  INDEX `idx_is_muted`(`is_muted` ASC) USING BTREE,
  CONSTRAINT `fk_chat_room_members_room_id` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_chat_room_members_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '聊天室成员表-聊天室成员关系表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for collected_messages
-- ----------------------------
DROP TABLE IF EXISTS `collected_messages`;
CREATE TABLE `collected_messages`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `message_id` int NOT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_message_id`(`message_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for compensatory_leave_requests
-- ----------------------------
DROP TABLE IF EXISTS `compensatory_leave_requests`;
CREATE TABLE `compensatory_leave_requests`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `employee_id` int NOT NULL COMMENT '员工ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `request_type` enum('schedule_change','compensatory_leave') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'compensatory_leave' COMMENT '申请类型',
  `original_schedule_date` date NULL DEFAULT NULL COMMENT '原排班日期',
  `original_shift_id` int NULL DEFAULT NULL COMMENT '原班次ID',
  `new_schedule_date` date NULL DEFAULT NULL COMMENT '新排班日期',
  `new_shift_id` int NULL DEFAULT NULL COMMENT '新班次ID',
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '申请理由',
  `status` enum('pending','approved','rejected','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'pending' COMMENT '状态',
  `approver_id` int NULL DEFAULT NULL COMMENT '审批人ID',
  `approval_note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '审批备注',
  `approved_at` timestamp NULL DEFAULT NULL COMMENT '审批时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_employee_id`(`employee_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_approver_id`(`approver_id` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '调休申请表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for conversation_members
-- ----------------------------
DROP TABLE IF EXISTS `conversation_members`;
CREATE TABLE `conversation_members`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint UNSIGNED NOT NULL,
  `user_id` int NOT NULL,
  `role` enum('member','admin','owner') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'member',
  `is_pinned` tinyint(1) NOT NULL DEFAULT 0,
  `is_muted` tinyint(1) NOT NULL DEFAULT 0,
  `unread_count` int UNSIGNED NOT NULL DEFAULT 0,
  `last_read_message_id` bigint UNSIGNED NULL DEFAULT NULL,
  `joined_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `left_at` datetime NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_conv_member`(`conversation_id` ASC, `user_id` ASC) USING BTREE,
  INDEX `idx_conv_member_conv`(`conversation_id` ASC) USING BTREE,
  INDEX `idx_conv_member_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_conv_members_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_conv_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for conversations
-- ----------------------------
DROP TABLE IF EXISTS `conversations`;
CREATE TABLE `conversations`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` enum('single','group','room') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `creator_id` int NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_conv_type`(`type` ASC) USING BTREE,
  INDEX `idx_conv_creator`(`creator_id` ASC) USING BTREE,
  CONSTRAINT `fk_conversations_creator` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for conversion_rules
-- ----------------------------
DROP TABLE IF EXISTS `conversion_rules`;
CREATE TABLE `conversion_rules`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '转换规则' COMMENT '规则名称',
  `ratio` decimal(10, 4) NULL DEFAULT 0.1250 COMMENT '转换比例',
  `conversion_rate` decimal(10, 2) NOT NULL COMMENT '转换比例（如：8小时=1天）',
  `enabled` tinyint(1) NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '规则描述',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '额度转换规则表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for conversion_usage_records
-- ----------------------------
DROP TABLE IF EXISTS `conversion_usage_records`;
CREATE TABLE `conversion_usage_records`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '使用记录ID',
  `conversion_id` int NOT NULL COMMENT '转换记录ID',
  `leave_record_id` int NOT NULL COMMENT '请假记录ID',
  `used_days` decimal(10, 2) NOT NULL COMMENT '使用天数',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_conversion`(`conversion_id` ASC) USING BTREE,
  INDEX `idx_leave_record`(`leave_record_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '假期转换使用记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for customers
-- ----------------------------
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '客户ID',
  `customer_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '客户ID（外部系统）',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '客户姓名',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '联系电话',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '电子邮箱',
  `platform_id` int NULL DEFAULT NULL COMMENT '所属平台ID',
  `shop_id` int NULL DEFAULT NULL COMMENT '所属店铺ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_customer_platform_shop`(`customer_id` ASC, `platform_id` ASC, `shop_id` ASC) USING BTREE,
  INDEX `idx_name`(`name` ASC) USING BTREE,
  INDEX `idx_phone`(`phone` ASC) USING BTREE,
  INDEX `idx_platform_shop`(`platform_id` ASC, `shop_id` ASC) USING BTREE,
  INDEX `fk_customers_shop`(`shop_id` ASC) USING BTREE,
  CONSTRAINT `fk_customers_platform` FOREIGN KEY (`platform_id`) REFERENCES `platforms` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_customers_shop` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '客户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for departments
-- ----------------------------
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '部门唯一标识ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '部门名称',
  `parent_id` int NULL DEFAULT NULL COMMENT '父部门ID，支持多级部门',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '部门描述',
  `manager_id` int NULL DEFAULT NULL COMMENT '部门经理用户ID',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active' COMMENT '部门状态',
  `sort_order` int NOT NULL DEFAULT 0 COMMENT '排序号',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_name`(`name` ASC) USING BTREE,
  INDEX `idx_parent_id`(`parent_id` ASC) USING BTREE,
  INDEX `idx_manager_id`(`manager_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_sort_order`(`sort_order` ASC) USING BTREE,
  CONSTRAINT `fk_departments_manager_id` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_departments_parent_id` FOREIGN KEY (`parent_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 58 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '部门表-存储组织架构信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for employee_changes
-- ----------------------------
DROP TABLE IF EXISTS `employee_changes`;
CREATE TABLE `employee_changes`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '变动记录ID',
  `employee_id` int NOT NULL COMMENT '员工ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `change_type` enum('hire','transfer','promotion','resign','terminate') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '变动类型',
  `change_date` date NOT NULL COMMENT '变动日期',
  `old_department_id` int NULL DEFAULT NULL COMMENT '原部门ID',
  `new_department_id` int NULL DEFAULT NULL COMMENT '新部门ID',
  `old_position` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '原职位',
  `new_position` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '新职位',
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '变动原因',
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '备注',
  `created_by` int NULL DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `employee_id`(`employee_id` ASC) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  INDEX `change_type`(`change_type` ASC) USING BTREE,
  INDEX `change_date`(`change_date` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 26 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '员工变动记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for employee_status_records
-- ----------------------------
DROP TABLE IF EXISTS `employee_status_records`;
CREATE TABLE `employee_status_records`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '记录唯一标识ID',
  `employee_id` int NOT NULL COMMENT '员工ID，关联users表',
  `old_status` enum('active','inactive','resigned') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '原状态',
  `new_status` enum('active','inactive','resigned') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '新状态',
  `old_department_id` int NULL DEFAULT NULL COMMENT '原部门ID',
  `new_department_id` int NULL DEFAULT NULL COMMENT '新部门ID',
  `change_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '变更原因',
  `change_date` date NOT NULL COMMENT '变更日期',
  `work_duration_days` int NULL DEFAULT 0 COMMENT '在职天数（截至变更日期）',
  `operated_by` int NULL DEFAULT NULL COMMENT '操作人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_employee_id`(`employee_id` ASC) USING BTREE,
  INDEX `idx_change_date`(`change_date` ASC) USING BTREE,
  INDEX `idx_new_status`(`new_status` ASC) USING BTREE,
  INDEX `idx_operated_by`(`operated_by` ASC) USING BTREE,
  INDEX `fk_employee_status_records_old_dept`(`old_department_id` ASC) USING BTREE,
  INDEX `fk_employee_status_records_new_dept`(`new_department_id` ASC) USING BTREE,
  CONSTRAINT `fk_employee_status_records_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_employee_status_records_new_dept` FOREIGN KEY (`new_department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_employee_status_records_old_dept` FOREIGN KEY (`old_department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_employee_status_records_operated_by` FOREIGN KEY (`operated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '员工状态变更记录表-记录员工状态和部门变更历史' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for employees
-- ----------------------------
DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '员工记录ID',
  `user_id` int NOT NULL COMMENT '关联用户ID',
  `employee_no` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '员工工号',
  `position` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '职位名称',
  `hire_date` date NOT NULL COMMENT '入职日期',
  `salary` decimal(10, 2) NULL DEFAULT NULL COMMENT '基本薪资',
  `status` enum('active','inactive','resigned') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active' COMMENT '员工状态',
  `emergency_contact` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '紧急联系人',
  `emergency_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '紧急联系电话',
  `address` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '家庭住址',
  `education` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '学历',
  `skills` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '技能特长',
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `rating` tinyint(1) NOT NULL DEFAULT 1 COMMENT '员工星级评定',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_id`(`user_id` ASC) USING BTREE,
  UNIQUE INDEX `uk_employee_no`(`employee_no` ASC) USING BTREE,
  INDEX `idx_position`(`position` ASC) USING BTREE,
  INDEX `idx_hire_date`(`hire_date` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  CONSTRAINT `fk_employees_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 92 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '员工信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for exam_categories
-- ----------------------------
DROP TABLE IF EXISTS `exam_categories`;
CREATE TABLE `exam_categories`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '分类名称',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '分类描述',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `deleted_by` int NULL DEFAULT NULL COMMENT '删除操作用户ID',
  `status` enum('active','inactive','deleted') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'active' COMMENT '状态',
  `order_num` int NOT NULL DEFAULT 1 COMMENT '排序号',
  `path` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '/' COMMENT '路径',
  `level` int NOT NULL DEFAULT 1 COMMENT '层级',
  `weight` decimal(8, 2) NOT NULL DEFAULT 0.00 COMMENT '权重',
  `created_by` int NULL DEFAULT NULL COMMENT '创建人ID',
  `parent_id` int NULL DEFAULT NULL COMMENT '父级分类ID',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_name`(`name` ASC) USING BTREE,
  INDEX `idx_deleted_at`(`deleted_at` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_parent_id`(`parent_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 14 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试卷分类表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for exam_category_audit_logs
-- ----------------------------
DROP TABLE IF EXISTS `exam_category_audit_logs`;
CREATE TABLE `exam_category_audit_logs`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NULL DEFAULT NULL,
  `operator_id` int NULL DEFAULT NULL,
  `operation` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `detail` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 17 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for exams
-- ----------------------------
DROP TABLE IF EXISTS `exams`;
CREATE TABLE `exams`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '试卷唯一标识ID',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '试卷标题，如\"客服基础知识测试\"',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '试卷详细描述，说明考试内容和要求',
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '试卷分类，如\"入职培训\"、\"技能考核\"',
  `category_id` int NULL DEFAULT NULL,
  `difficulty` enum('easy','medium','hard') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium' COMMENT '难度等级：easy-简单，medium-中等，hard-困难',
  `duration` int NOT NULL COMMENT '考试时长，单位分钟',
  `total_score` decimal(5, 2) NOT NULL COMMENT '试卷总分',
  `pass_score` decimal(5, 2) NOT NULL COMMENT '及格分数',
  `question_count` int NOT NULL DEFAULT 0 COMMENT '题目总数，自动计算',
  `status` enum('draft','published','archived') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft' COMMENT '试卷状态：draft-草稿，published-已发布，archived-已归档',
  `created_by` int NULL DEFAULT NULL COMMENT '创建人用户ID，关联users表',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录最后更新时间',
  `questions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_title`(`title` ASC) USING BTREE,
  INDEX `idx_category`(`category` ASC) USING BTREE,
  INDEX `idx_difficulty`(`difficulty` ASC) USING BTREE,
  INDEX `idx_duration`(`duration` ASC) USING BTREE,
  INDEX `idx_total_score`(`total_score` ASC) USING BTREE,
  INDEX `idx_pass_score`(`pass_score` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_created_by`(`created_by` ASC) USING BTREE,
  CONSTRAINT `fk_exams_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 26 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '试卷表-存储考试试卷的基本信息和配置' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for external_agents
-- ----------------------------
DROP TABLE IF EXISTS `external_agents`;
CREATE TABLE `external_agents`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '外部客服ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '客服姓名',
  `platform_id` int NOT NULL COMMENT '所属平台ID',
  `shop_id` int NOT NULL COMMENT '所属店铺ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_name_platform_shop`(`name` ASC, `platform_id` ASC, `shop_id` ASC) USING BTREE,
  INDEX `idx_platform_id`(`platform_id` ASC) USING BTREE,
  INDEX `idx_shop_id`(`shop_id` ASC) USING BTREE,
  CONSTRAINT `fk_external_agents_platform` FOREIGN KEY (`platform_id`) REFERENCES `platforms` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_external_agents_shop` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '外部客服表-存储从Excel导入的客服信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for group_members
-- ----------------------------
DROP TABLE IF EXISTS `group_members`;
CREATE TABLE `group_members`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `group_id` bigint UNSIGNED NOT NULL,
  `user_id` int NOT NULL,
  `role` enum('member','admin','owner') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'member',
  `nickname` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `joined_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_group_member`(`group_id` ASC, `user_id` ASC) USING BTREE,
  INDEX `idx_group_member_group`(`group_id` ASC) USING BTREE,
  INDEX `idx_group_member_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_group_members_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_group_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for groups
-- ----------------------------
DROP TABLE IF EXISTS `groups`;
CREATE TABLE `groups`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `announcement` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `owner_id` int NOT NULL,
  `max_members` int UNSIGNED NOT NULL DEFAULT 200,
  `is_public` tinyint(1) NOT NULL DEFAULT 0,
  `join_approval_required` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_group_owner`(`owner_id` ASC) USING BTREE,
  CONSTRAINT `fk_groups_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for holidays
-- ----------------------------
DROP TABLE IF EXISTS `holidays`;
CREATE TABLE `holidays`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '假期名称',
  `days` int NOT NULL COMMENT '天数',
  `month` int NOT NULL COMMENT '所属月份',
  `year` int NOT NULL COMMENT '年份',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `vacation_type_id` int NULL DEFAULT NULL COMMENT '关联的假期类型ID',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_year_month`(`year` ASC, `month` ASC) USING BTREE,
  INDEX `idx_vacation_type`(`vacation_type_id` ASC) USING BTREE,
  CONSTRAINT `holidays_chk_1` CHECK ((`days` >= 1) and (`days` <= 31)),
  CONSTRAINT `holidays_chk_2` CHECK ((`month` >= 1) and (`month` <= 12))
) ENGINE = InnoDB AUTO_INCREMENT = 20 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '节假日配置表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for knowledge_article_daily_stats
-- ----------------------------
DROP TABLE IF EXISTS `knowledge_article_daily_stats`;
CREATE TABLE `knowledge_article_daily_stats`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `article_id` bigint UNSIGNED NOT NULL,
  `stat_date` date NOT NULL,
  `views_count` int NULL DEFAULT 0,
  `full_reads_count` int NULL DEFAULT 0,
  `total_duration_seconds` bigint NULL DEFAULT 0,
  `total_active_seconds` bigint NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uniq_article_date`(`article_id` ASC, `stat_date` ASC) USING BTREE,
  INDEX `idx_article_id`(`article_id` ASC) USING BTREE,
  CONSTRAINT `fk_daily_stats_article` FOREIGN KEY (`article_id`) REFERENCES `knowledge_articles` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for knowledge_article_read_sessions
-- ----------------------------
DROP TABLE IF EXISTS `knowledge_article_read_sessions`;
CREATE TABLE `knowledge_article_read_sessions`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `session_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `department_id` int NULL DEFAULT NULL,
  `article_id` bigint UNSIGNED NOT NULL,
  `started_at` datetime NOT NULL,
  `ended_at` datetime NULL DEFAULT NULL,
  `duration_seconds` int NULL DEFAULT 0,
  `active_seconds` int NULL DEFAULT 0,
  `scroll_depth_percent` int NULL DEFAULT 0,
  `full_read` tinyint(1) NULL DEFAULT 0,
  `close_type` enum('user_close','auto_close','tab_hidden') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'user_close',
  `heartbeats_count` int NULL DEFAULT 0,
  `wheel_events` int NULL DEFAULT 0,
  `mousemove_events` int NULL DEFAULT 0,
  `keydown_events` int NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uniq_session_id`(`session_id` ASC) USING BTREE,
  INDEX `idx_article_id`(`article_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_started_at`(`started_at` ASC) USING BTREE,
  CONSTRAINT `fk_read_sessions_article` FOREIGN KEY (`article_id`) REFERENCES `knowledge_articles` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_read_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for knowledge_articles
-- ----------------------------
DROP TABLE IF EXISTS `knowledge_articles`;
CREATE TABLE `knowledge_articles`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `content` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `attachments` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `category_id` bigint UNSIGNED NULL DEFAULT NULL,
  `owner_id` bigint UNSIGNED NULL DEFAULT NULL,
  `original_article_id` bigint UNSIGNED NULL DEFAULT NULL,
  `type` enum('common','personal') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'common',
  `is_public` tinyint NOT NULL DEFAULT 1,
  `status` enum('draft','published','archived','deleted') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'published',
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `view_count` int UNSIGNED NOT NULL DEFAULT 0,
  `like_count` int UNSIGNED NOT NULL DEFAULT 0,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_by` bigint UNSIGNED NULL DEFAULT NULL,
  `updated_by` bigint UNSIGNED NULL DEFAULT NULL,
  `deleted_by` bigint UNSIGNED NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_art_category`(`category_id` ASC) USING BTREE,
  INDEX `idx_art_owner`(`owner_id` ASC) USING BTREE,
  INDEX `idx_art_type`(`type` ASC) USING BTREE,
  INDEX `idx_art_public`(`is_public` ASC) USING BTREE,
  INDEX `idx_art_status`(`status` ASC) USING BTREE,
  INDEX `idx_art_deleted`(`is_deleted` ASC) USING BTREE,
  INDEX `idx_art_original`(`original_article_id` ASC) USING BTREE,
  CONSTRAINT `fk_art_category` FOREIGN KEY (`category_id`) REFERENCES `knowledge_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 21 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for knowledge_attachments
-- ----------------------------
DROP TABLE IF EXISTS `knowledge_attachments`;
CREATE TABLE `knowledge_attachments`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `article_id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `size` bigint UNSIGNED NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_att_article`(`article_id` ASC) USING BTREE,
  CONSTRAINT `fk_att_article` FOREIGN KEY (`article_id`) REFERENCES `knowledge_articles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for knowledge_categories
-- ----------------------------
DROP TABLE IF EXISTS `knowledge_categories`;
CREATE TABLE `knowledge_categories`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `owner_id` bigint UNSIGNED NULL DEFAULT NULL,
  `type` enum('common','personal') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'common',
  `is_public` tinyint NOT NULL DEFAULT 1,
  `is_hidden` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('draft','published','archived') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'published',
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime NULL DEFAULT NULL,
  `deleted_by` bigint UNSIGNED NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_cat_owner`(`owner_id` ASC) USING BTREE,
  INDEX `idx_cat_type`(`type` ASC) USING BTREE,
  INDEX `idx_cat_public`(`is_public` ASC) USING BTREE,
  INDEX `idx_cat_status`(`status` ASC) USING BTREE,
  INDEX `idx_cat_deleted`(`is_deleted` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 17 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for knowledge_learning_plan_records
-- ----------------------------
DROP TABLE IF EXISTS `knowledge_learning_plan_records`;
CREATE TABLE `knowledge_learning_plan_records`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `plan_id` int NOT NULL,
  `start_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_time` datetime NULL DEFAULT NULL,
  `duration` int NOT NULL DEFAULT 0,
  `progress` int NOT NULL DEFAULT 0,
  `status` enum('in_progress','completed','abandoned') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in_progress',
  `completed_at` datetime NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_plan`(`user_id` ASC, `plan_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_plan_id`(`plan_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  CONSTRAINT `knowledge_learning_plan_records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `knowledge_learning_plan_records_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `learning_plans` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for knowledge_learning_plans
-- ----------------------------
DROP TABLE IF EXISTS `knowledge_learning_plans`;
CREATE TABLE `knowledge_learning_plans`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '学习计划唯一标识ID',
  `user_id` int NOT NULL COMMENT '用户ID，关联users表',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '计划标题',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '计划描述',
  `target_articles` json NULL COMMENT '目标文章列表，JSON格式存储文章ID数组',
  `start_date` date NOT NULL COMMENT '计划开始日期',
  `end_date` date NOT NULL COMMENT '计划结束日期',
  `status` enum('active','completed','cancelled','expired') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active' COMMENT '计划状态：active-进行中，completed-已完成，cancelled-已取消，expired-已过期',
  `progress` int NOT NULL DEFAULT 0 COMMENT '完成进度百分比，0-100',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_start_date`(`start_date` ASC) USING BTREE,
  INDEX `idx_end_date`(`end_date` ASC) USING BTREE,
  CONSTRAINT `fk_knowledge_learning_plans_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '学习计划表-用户的知识学习计划' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for knowledge_learning_statistics
-- ----------------------------
DROP TABLE IF EXISTS `knowledge_learning_statistics`;
CREATE TABLE `knowledge_learning_statistics`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '统计记录唯一标识ID',
  `user_id` int NOT NULL COMMENT '用户ID，关联users表',
  `stat_date` date NOT NULL COMMENT '统计日期',
  `articles_read` int NOT NULL DEFAULT 0 COMMENT '阅读文章数',
  `articles_completed` int NOT NULL DEFAULT 0 COMMENT '完成文章数',
  `total_duration` int NOT NULL DEFAULT 0 COMMENT '总学习时长，单位秒',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_date`(`user_id` ASC, `stat_date` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_stat_date`(`stat_date` ASC) USING BTREE,
  CONSTRAINT `fk_knowledge_learning_statistics_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '学习统计表-按天统计用户学习数据' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for learning_plans
-- ----------------------------
DROP TABLE IF EXISTS `learning_plans`;
CREATE TABLE `learning_plans`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '计划ID',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '计划标题',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '计划描述',
  `created_by` int NOT NULL COMMENT '创建者ID',
  `assigned_to` int NULL DEFAULT NULL COMMENT '分配给用户ID',
  `department_id` int NULL DEFAULT NULL COMMENT '分配给部门ID',
  `status` enum('draft','active','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft' COMMENT '计划状态',
  `start_date` datetime NULL DEFAULT NULL COMMENT '开始日期',
  `end_date` datetime NULL DEFAULT NULL COMMENT '结束日期',
  `completed_at` datetime NULL DEFAULT NULL COMMENT '完成时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_created_by`(`created_by` ASC) USING BTREE,
  INDEX `idx_assigned_to`(`assigned_to` ASC) USING BTREE,
  INDEX `idx_department_id`(`department_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  CONSTRAINT `learning_plans_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `learning_plans_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `learning_plans_ibfk_3` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '学习计划表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for learning_statistics
-- ----------------------------
DROP TABLE IF EXISTS `learning_statistics`;
CREATE TABLE `learning_statistics`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '统计ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `date` date NOT NULL COMMENT '统计日期',
  `articles_read` int NOT NULL DEFAULT 0 COMMENT '阅读文章数',
  `exams_taken` int NOT NULL DEFAULT 0 COMMENT '参加考试数',
  `exams_passed` int NOT NULL DEFAULT 0 COMMENT '通过考试数',
  `total_duration` int NOT NULL DEFAULT 0 COMMENT '总学习时长(秒)',
  `completed_tasks` int NOT NULL DEFAULT 0 COMMENT '完成任务数',
  `completed_plans` int NOT NULL DEFAULT 0 COMMENT '完成计划数',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_date`(`user_id` ASC, `date` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_date`(`date` ASC) USING BTREE,
  CONSTRAINT `learning_statistics_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '学习统计表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for learning_tasks
-- ----------------------------
DROP TABLE IF EXISTS `learning_tasks`;
CREATE TABLE `learning_tasks`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '任务标题',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '任务描述',
  `assigned_to` int NOT NULL COMMENT '分配给用户ID',
  `assigned_by` int NULL DEFAULT NULL COMMENT '分配者ID',
  `status` enum('pending','in_progress','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '任务状态',
  `priority` enum('low','medium','high') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium' COMMENT '优先级',
  `due_date` datetime NULL DEFAULT NULL COMMENT '截止日期',
  `completed_at` datetime NULL DEFAULT NULL COMMENT '完成时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `assigned_by`(`assigned_by` ASC) USING BTREE,
  INDEX `idx_assigned_to`(`assigned_to` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_due_date`(`due_date` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  CONSTRAINT `learning_tasks_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `learning_tasks_ibfk_2` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '学习任务表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for leave_records
-- ----------------------------
DROP TABLE IF EXISTS `leave_records`;
CREATE TABLE `leave_records`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '请假记录唯一标识ID',
  `user_id` int NOT NULL COMMENT '请假员工用户ID，关联users表，级联删除',
  `leave_type` enum('sick','annual','personal','maternity','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '请假类型：sick-病假，annual-年假，personal-事假，maternity-产假，other-其他',
  `start_date` date NOT NULL COMMENT '请假开始日期',
  `end_date` date NOT NULL COMMENT '请假结束日期',
  `days` decimal(5, 2) NOT NULL COMMENT '请假天数，支持半天请假，如0.5天',
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '请假原因，详细说明',
  `status` enum('pending','approved','rejected','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '审批状态：pending-待审批，approved-已批准，rejected-已拒绝，cancelled-已取消',
  `approver_id` int NULL DEFAULT NULL,
  `approved_at` datetime NULL DEFAULT NULL COMMENT '审批时间',
  `approval_note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录最后更新时间',
  `employee_id` int NOT NULL,
  `attachments` json NULL,
  `use_converted_leave` tinyint(1) NULL DEFAULT 0 COMMENT '是否优先使用转换假期',
  `used_conversion_days` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '使用的转换假期天数',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_leave_type`(`leave_type` ASC) USING BTREE,
  INDEX `idx_start_date`(`start_date` ASC) USING BTREE,
  INDEX `idx_end_date`(`end_date` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_approved_by`(`approver_id` ASC) USING BTREE,
  INDEX `idx_date_range`(`start_date` ASC, `end_date` ASC) USING BTREE,
  INDEX `idx_employee`(`employee_id` ASC) USING BTREE,
  CONSTRAINT `fk_leave_records_approved_by` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_leave_records_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 76 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '请假记录表-员工请假申请和审批记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for makeup_records
-- ----------------------------
DROP TABLE IF EXISTS `makeup_records`;
CREATE TABLE `makeup_records`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL COMMENT '员工ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `record_date` date NOT NULL COMMENT '补卡日期',
  `clock_type` enum('in','out') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '打卡类型',
  `clock_time` datetime NOT NULL COMMENT '打卡时间',
  `reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '补卡原因',
  `status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'pending' COMMENT '状态',
  `approver_id` int NULL DEFAULT NULL COMMENT '审批人ID',
  `approved_at` datetime NULL DEFAULT NULL COMMENT '审批时间',
  `approval_note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '审批备注',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_employee`(`employee_id` ASC) USING BTREE,
  INDEX `idx_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_record_date`(`record_date` ASC) USING BTREE,
  INDEX `idx_approver`(`approver_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '补卡申请表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for meal_order_items
-- ----------------------------
DROP TABLE IF EXISTS `meal_order_items`;
CREATE TABLE `meal_order_items`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '订餐明细唯一标识ID',
  `order_id` int NOT NULL COMMENT '订单ID，关联meal_orders表，级联删除',
  `menu_item_id` int NOT NULL COMMENT '菜品ID，关联menu_items表，级联删除',
  `quantity` int NOT NULL COMMENT '订购数量',
  `unit_price` decimal(8, 2) NOT NULL COMMENT '单价，记录下单时的价格',
  `subtotal` decimal(8, 2) NOT NULL COMMENT '小计金额，quantity * unit_price',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '单项备注，如\"少盐\"、\"不要辣\"',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_order_id`(`order_id` ASC) USING BTREE,
  INDEX `idx_menu_item_id`(`menu_item_id` ASC) USING BTREE,
  INDEX `idx_quantity`(`quantity` ASC) USING BTREE,
  INDEX `idx_subtotal`(`subtotal` ASC) USING BTREE,
  CONSTRAINT `fk_meal_order_items_menu_item_id` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_meal_order_items_order_id` FOREIGN KEY (`order_id`) REFERENCES `meal_orders` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '订餐明细表-订餐记录的详细项目表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for meal_orders
-- ----------------------------
DROP TABLE IF EXISTS `meal_orders`;
CREATE TABLE `meal_orders`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '订单唯一标识ID',
  `order_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单编号，全局唯一，格式如ORD20240115001',
  `user_id` int NOT NULL COMMENT '订餐用户ID，关联users表，级联删除',
  `order_date` date NOT NULL COMMENT '订餐日期，YYYY-MM-DD格式',
  `meal_type` enum('breakfast','lunch','dinner','snack') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '餐次类型：breakfast-早餐，lunch-午餐，dinner-晚餐，snack-加餐',
  `total_amount` decimal(8, 2) NOT NULL COMMENT '订单总金额，单位元',
  `status` enum('pending','confirmed','preparing','ready','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '订单状态：pending-待确认，confirmed-已确认，preparing-制作中，ready-已完成，completed-已取餐，cancelled-已取消',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '订单备注，特殊要求或说明',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录最后更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_order_no`(`order_no` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_order_date`(`order_date` ASC) USING BTREE,
  INDEX `idx_meal_type`(`meal_type` ASC) USING BTREE,
  INDEX `idx_total_amount`(`total_amount` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  CONSTRAINT `fk_meal_orders_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '订餐记录表-员工订餐记录主表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for memo_recipients
-- ----------------------------
DROP TABLE IF EXISTS `memo_recipients`;
CREATE TABLE `memo_recipients`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `memo_id` int NOT NULL COMMENT '备忘录ID',
  `user_id` int NOT NULL COMMENT '接收者用户ID',
  `is_read` tinyint(1) NULL DEFAULT 0 COMMENT '是否已读',
  `read_at` datetime NULL DEFAULT NULL COMMENT '阅读时间',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_memo_user`(`memo_id` ASC, `user_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_is_read`(`is_read` ASC) USING BTREE,
  CONSTRAINT `fk_memo_recipients_memo` FOREIGN KEY (`memo_id`) REFERENCES `memos` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 23 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '备忘录接收记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for memos
-- ----------------------------
DROP TABLE IF EXISTS `memos`;
CREATE TABLE `memos`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '创建者用户ID',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '备忘录标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '备忘录内容（Markdown格式）',
  `type` enum('personal','department') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'personal' COMMENT '类型：personal=个人备忘录, department=部门备忘录',
  `priority` enum('low','normal','high','urgent') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'normal' COMMENT '优先级',
  `is_read` tinyint(1) NULL DEFAULT 0 COMMENT '是否已读（仅个人备忘录使用）',
  `target_department_id` int NULL DEFAULT NULL COMMENT '目标部门ID（部门备忘录使用）',
  `target_user_id` int NULL DEFAULT NULL COMMENT '目标用户ID（部门备忘录指定用户时使用）',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime NULL DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_is_read`(`is_read` ASC) USING BTREE,
  INDEX `idx_target_department`(`target_department_id` ASC) USING BTREE,
  INDEX `idx_target_user`(`target_user_id` ASC) USING BTREE,
  INDEX `idx_deleted_at`(`deleted_at` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 28 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '备忘录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for menu_categories
-- ----------------------------
DROP TABLE IF EXISTS `menu_categories`;
CREATE TABLE `menu_categories`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '菜单分类唯一标识ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类名称，如\"主食\"、\"荤菜\"、\"素菜\"',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '分类详细描述，说明该分类的特点',
  `sort_order` int NOT NULL DEFAULT 0 COMMENT '排序号，用于菜单分类显示顺序',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否启用：1-启用，0-停用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录最后更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_name`(`name` ASC) USING BTREE,
  INDEX `idx_sort_order`(`sort_order` ASC) USING BTREE,
  INDEX `idx_is_active`(`is_active` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '菜单分类表-订餐系统的菜品分类管理表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for menu_items
-- ----------------------------
DROP TABLE IF EXISTS `menu_items`;
CREATE TABLE `menu_items`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '菜品唯一标识ID',
  `category_id` int NOT NULL COMMENT '所属分类ID，关联menu_categories表，级联删除',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '菜品名称，如\"宫保鸡丁\"、\"麻婆豆腐\"',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '菜品详细描述，包括口味、特色等',
  `price` decimal(8, 2) NOT NULL COMMENT '菜品价格，单位元',
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '菜品图片URL地址',
  `ingredients` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '主要配料信息，用于过敏提醒',
  `nutrition` json NULL COMMENT '营养信息，JSON格式存储卡路里、蛋白质等',
  `is_available` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否可订购：1-可订购，0-暂停供应',
  `is_recommended` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否推荐菜品：1-推荐，0-普通',
  `sort_order` int NOT NULL DEFAULT 0 COMMENT '排序号，用于菜品显示顺序',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录最后更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_category_id`(`category_id` ASC) USING BTREE,
  INDEX `idx_name`(`name` ASC) USING BTREE,
  INDEX `idx_price`(`price` ASC) USING BTREE,
  INDEX `idx_is_available`(`is_available` ASC) USING BTREE,
  INDEX `idx_is_recommended`(`is_recommended` ASC) USING BTREE,
  INDEX `idx_sort_order`(`sort_order` ASC) USING BTREE,
  CONSTRAINT `fk_menu_items_category_id` FOREIGN KEY (`category_id`) REFERENCES `menu_categories` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '菜品表-订餐系统的菜品信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for message_status
-- ----------------------------
DROP TABLE IF EXISTS `message_status`;
CREATE TABLE `message_status`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `message_id` bigint UNSIGNED NOT NULL,
  `user_id` int NOT NULL,
  `status` enum('sent','delivered','read') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'sent',
  `read_at` datetime NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_msg_user`(`message_id` ASC, `user_id` ASC) USING BTREE,
  INDEX `idx_msg_status_msg`(`message_id` ASC) USING BTREE,
  INDEX `idx_msg_status_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_user_status`(`user_id` ASC, `status` ASC) USING BTREE,
  INDEX `idx_message_id`(`message_id` ASC) USING BTREE,
  CONSTRAINT `fk_msg_status_msg` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_msg_status_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for messages
-- ----------------------------
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint UNSIGNED NOT NULL,
  `sender_id` int NOT NULL,
  `recipient_id` int NULL DEFAULT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `file_size` int NULL DEFAULT NULL,
  `reply_to_message_id` bigint UNSIGNED NULL DEFAULT NULL,
  `is_recalled` tinyint(1) NULL DEFAULT 0,
  `recalled_at` datetime NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_conversation_id`(`conversation_id` ASC) USING BTREE,
  INDEX `idx_sender_id`(`sender_id` ASC) USING BTREE,
  INDEX `idx_recipient_id`(`recipient_id` ASC) USING BTREE,
  INDEX `idx_reply_to_message_id`(`reply_to_message_id` ASC) USING BTREE,
  CONSTRAINT `fk_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_messages_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_messages_reply_to` FOREIGN KEY (`reply_to_message_id`) REFERENCES `messages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for migrations_history
-- ----------------------------
DROP TABLE IF EXISTS `migrations_history`;
CREATE TABLE `migrations_history`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `migration_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `migration_name`(`migration_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for my_knowledge_articles
-- ----------------------------
DROP TABLE IF EXISTS `my_knowledge_articles`;
CREATE TABLE `my_knowledge_articles`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `category_id` int NULL DEFAULT NULL COMMENT '分类ID',
  `source_article_id` int NULL DEFAULT NULL COMMENT '来源文章ID（如果是从公共知识库收藏的）',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文档标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '文档内容',
  `summary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '文档摘要',
  `attachments` json NULL COMMENT '附件列表',
  `tags` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '标签',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '个人笔记',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_category_id`(`category_id` ASC) USING BTREE,
  INDEX `idx_source_article_id`(`source_article_id` ASC) USING BTREE,
  INDEX `idx_title`(`title` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '我的知识库文档表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for my_knowledge_categories
-- ----------------------------
DROP TABLE IF EXISTS `my_knowledge_categories`;
CREATE TABLE `my_knowledge_categories`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '分类名称',
  `icon` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '?' COMMENT '分类图标',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '分类描述',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_name`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 67 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '我的知识库分类表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for my_knowledge_saved_articles
-- ----------------------------
DROP TABLE IF EXISTS `my_knowledge_saved_articles`;
CREATE TABLE `my_knowledge_saved_articles`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `article_id` bigint UNSIGNED NOT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_article`(`user_id` ASC, `article_id` ASC) USING BTREE,
  INDEX `idx_mk_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_mk_article`(`article_id` ASC) USING BTREE,
  CONSTRAINT `fk_mk_article` FOREIGN KEY (`article_id`) REFERENCES `knowledge_articles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for notification_recipients
-- ----------------------------
DROP TABLE IF EXISTS `notification_recipients`;
CREATE TABLE `notification_recipients`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `notification_id` int NOT NULL,
  `user_id` int NOT NULL,
  `is_read` tinyint(1) NULL DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `notification_id`(`notification_id` ASC, `user_id` ASC) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `notification_recipients_ibfk_1` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `notification_recipients_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for notification_settings
-- ----------------------------
DROP TABLE IF EXISTS `notification_settings`;
CREATE TABLE `notification_settings`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '事件类型',
  `target_roles` json NULL COMMENT '接收通知的角色列表',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_event_type`(`event_type` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 25 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '通知设置表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for notifications
-- ----------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '通知类型',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '通知标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '通知内容',
  `related_id` int NULL DEFAULT NULL COMMENT '关联记录ID',
  `is_read` tinyint(1) NULL DEFAULT 0 COMMENT '是否已读',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `related_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '关联对象类型',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_is_read`(`is_read` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_related`(`related_type` ASC, `related_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 72 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '消息通知表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for overtime_conversions
-- ----------------------------
DROP TABLE IF EXISTS `overtime_conversions`;
CREATE TABLE `overtime_conversions`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `user_id` int NOT NULL,
  `overtime_hours` decimal(5, 2) NOT NULL,
  `target_vacation_type_id` int NOT NULL,
  `converted_days` decimal(5, 2) NOT NULL,
  `conversion_rule_id` int NULL DEFAULT NULL,
  `conversion_ratio` decimal(5, 2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `target_vacation_type_id`(`target_vacation_type_id` ASC) USING BTREE,
  INDEX `conversion_rule_id`(`conversion_rule_id` ASC) USING BTREE,
  INDEX `idx_employee`(`employee_id` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  CONSTRAINT `overtime_conversions_ibfk_1` FOREIGN KEY (`target_vacation_type_id`) REFERENCES `vacation_types` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `overtime_conversions_ibfk_2` FOREIGN KEY (`conversion_rule_id`) REFERENCES `conversion_rules` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for overtime_records
-- ----------------------------
DROP TABLE IF EXISTS `overtime_records`;
CREATE TABLE `overtime_records`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL COMMENT '员工ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `overtime_date` date NOT NULL COMMENT '加班日期',
  `start_time` datetime NOT NULL COMMENT '开始时间',
  `end_time` datetime NOT NULL COMMENT '结束时间',
  `hours` decimal(4, 2) NOT NULL COMMENT '加班时长（小时）',
  `reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '加班原因',
  `status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'pending' COMMENT '状态',
  `approver_id` int NULL DEFAULT NULL COMMENT '审批人ID',
  `approved_at` datetime NULL DEFAULT NULL COMMENT '审批时间',
  `approval_note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '审批备注',
  `is_compensated` tinyint(1) NULL DEFAULT 0 COMMENT '是否已调休',
  `compensated_at` datetime NULL DEFAULT NULL COMMENT '调休时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_employee`(`employee_id` ASC) USING BTREE,
  INDEX `idx_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_overtime_date`(`overtime_date` ASC) USING BTREE,
  INDEX `idx_approver`(`approver_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 20 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '加班记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for permission_templates
-- ----------------------------
DROP TABLE IF EXISTS `permission_templates`;
CREATE TABLE `permission_templates`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `permission_ids` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for permissions
-- ----------------------------
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '权限唯一标识ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '权限名称',
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '权限代码',
  `resource` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '资源名称',
  `action` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作类型',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '权限描述',
  `module` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '所属模块',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_code`(`code` ASC) USING BTREE,
  INDEX `idx_resource`(`resource` ASC) USING BTREE,
  INDEX `idx_action`(`action` ASC) USING BTREE,
  INDEX `idx_module`(`module` ASC) USING BTREE,
  INDEX `idx_resource_action`(`resource` ASC, `action` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 37 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '权限表-定义系统权限' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for platforms
-- ----------------------------
DROP TABLE IF EXISTS `platforms`;
CREATE TABLE `platforms`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '平台ID',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '平台名称',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 34 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '平台表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for positions
-- ----------------------------
DROP TABLE IF EXISTS `positions`;
CREATE TABLE `positions`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '职位ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '职位名称',
  `department_id` int NOT NULL COMMENT '所属部门ID',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '职位描述',
  `requirements` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '任职要求',
  `responsibilities` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '工作职责',
  `salary_min` decimal(10, 2) NULL DEFAULT NULL COMMENT '最低薪资',
  `salary_max` decimal(10, 2) NULL DEFAULT NULL COMMENT '最高薪资',
  `level` enum('junior','middle','senior','expert') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'junior' COMMENT '职位级别',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'active' COMMENT '状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_by` int NULL DEFAULT NULL COMMENT '创建人ID',
  `updated_by` int NULL DEFAULT NULL COMMENT '更新人ID',
  `sort_order` int NOT NULL DEFAULT 0 COMMENT '排序号',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_position_dept`(`name` ASC, `department_id` ASC) USING BTREE,
  INDEX `idx_department_id`(`department_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_level`(`level` ASC) USING BTREE,
  INDEX `idx_name`(`name` ASC) USING BTREE,
  INDEX `idx_sort_order`(`sort_order` ASC) USING BTREE,
  INDEX `created_by`(`created_by` ASC) USING BTREE,
  INDEX `updated_by`(`updated_by` ASC) USING BTREE,
  CONSTRAINT `fk_positions_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_positions_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_positions_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 135 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '职位表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for quality_case_attachments
-- ----------------------------
DROP TABLE IF EXISTS `quality_case_attachments`;
CREATE TABLE `quality_case_attachments`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `case_id` int NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int NOT NULL,
  `file_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `thumbnail_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_by` int NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_case_id`(`case_id` ASC) USING BTREE,
  CONSTRAINT `fk_quality_case_attachments_case_id` FOREIGN KEY (`case_id`) REFERENCES `quality_cases` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '案例附件表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for quality_case_collections
-- ----------------------------
DROP TABLE IF EXISTS `quality_case_collections`;
CREATE TABLE `quality_case_collections`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `case_id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_case_user`(`case_id` ASC, `user_id` ASC) USING BTREE,
  INDEX `idx_case_id`(`case_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_quality_case_collections_case_id` FOREIGN KEY (`case_id`) REFERENCES `quality_cases` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '案例收藏表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for quality_case_comments
-- ----------------------------
DROP TABLE IF EXISTS `quality_case_comments`;
CREATE TABLE `quality_case_comments`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `case_id` int NOT NULL,
  `parent_id` int NULL DEFAULT NULL,
  `user_id` int NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `like_count` int NOT NULL DEFAULT 0,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_case_id`(`case_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_quality_case_comments_case_id` FOREIGN KEY (`case_id`) REFERENCES `quality_cases` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '案例评论表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for quality_case_favorites
-- ----------------------------
DROP TABLE IF EXISTS `quality_case_favorites`;
CREATE TABLE `quality_case_favorites`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `case_id` int NOT NULL COMMENT '案例ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_user_case`(`user_id` ASC, `case_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_case_id`(`case_id` ASC) USING BTREE,
  CONSTRAINT `quality_case_favorites_ibfk_1` FOREIGN KEY (`case_id`) REFERENCES `quality_cases` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `quality_case_favorites_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '案例收藏表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for quality_case_learning_records
-- ----------------------------
DROP TABLE IF EXISTS `quality_case_learning_records`;
CREATE TABLE `quality_case_learning_records`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `case_id` int NOT NULL,
  `user_id` int NOT NULL,
  `duration` int NOT NULL DEFAULT 0,
  `is_completed` tinyint(1) NOT NULL DEFAULT 0,
  `last_position` int NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_case_user`(`case_id` ASC, `user_id` ASC) USING BTREE,
  INDEX `idx_case_id`(`case_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_quality_case_learning_records_case_id` FOREIGN KEY (`case_id`) REFERENCES `quality_cases` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '案例学习记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for quality_case_likes
-- ----------------------------
DROP TABLE IF EXISTS `quality_case_likes`;
CREATE TABLE `quality_case_likes`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `case_id` int NOT NULL COMMENT '案例ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_user_case`(`user_id` ASC, `case_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_case_id`(`case_id` ASC) USING BTREE,
  CONSTRAINT `quality_case_likes_ibfk_1` FOREIGN KEY (`case_id`) REFERENCES `quality_cases` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `quality_case_likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '案例点赞表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for quality_case_tags
-- ----------------------------
DROP TABLE IF EXISTS `quality_case_tags`;
CREATE TABLE `quality_case_tags`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `case_id` int NOT NULL,
  `tag_id` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_case_tag`(`case_id` ASC, `tag_id` ASC) USING BTREE,
  INDEX `idx_case_id`(`case_id` ASC) USING BTREE,
  INDEX `idx_tag_id`(`tag_id` ASC) USING BTREE,
  CONSTRAINT `fk_quality_case_tags_case_id` FOREIGN KEY (`case_id`) REFERENCES `quality_cases` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '案例标签关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for quality_case_views
-- ----------------------------
DROP TABLE IF EXISTS `quality_case_views`;
CREATE TABLE `quality_case_views`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `case_id` int NOT NULL COMMENT '案例ID',
  `user_id` int NULL DEFAULT NULL COMMENT '用户ID（可为空，支持匿名浏览）',
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'IP地址',
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '用户代理',
  `viewed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '浏览时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_case_id`(`case_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_viewed_at`(`viewed_at` ASC) USING BTREE,
  CONSTRAINT `quality_case_views_ibfk_1` FOREIGN KEY (`case_id`) REFERENCES `quality_cases` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `quality_case_views_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '案例浏览记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for quality_cases
-- ----------------------------
DROP TABLE IF EXISTS `quality_cases`;
CREATE TABLE `quality_cases`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `problem` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `solution` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `case_type` enum('excellent','good','poor','warning') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'excellent',
  `difficulty` enum('easy','medium','hard') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `priority` enum('low','medium','high','urgent') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `status` enum('draft','published','archived') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `session_id` int NULL DEFAULT NULL,
  `view_count` int NOT NULL DEFAULT 0,
  `like_count` int NOT NULL DEFAULT 0,
  `collect_count` int NOT NULL DEFAULT 0,
  `comment_count` int NOT NULL DEFAULT 0,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `is_recommended` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` int NULL DEFAULT NULL,
  `updated_by` int NULL DEFAULT NULL,
  `published_at` datetime NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime NULL DEFAULT NULL COMMENT '删除时间（软删除）',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_category`(`category` ASC) USING BTREE,
  INDEX `idx_case_type`(`case_type` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_deleted_at`(`deleted_at` ASC) USING BTREE,
  FULLTEXT INDEX `ft_case_search`(`title`, `description`, `problem`, `solution`)
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '质检案例表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for quality_message_tags
-- ----------------------------
DROP TABLE IF EXISTS `quality_message_tags`;
CREATE TABLE `quality_message_tags`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '关联记录ID',
  `message_id` int NOT NULL COMMENT '消息ID',
  `tag_id` int NOT NULL COMMENT '标签ID',
  `created_by` int NULL DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_message_tag`(`message_id` ASC, `tag_id` ASC) USING BTREE,
  INDEX `idx_message_id`(`message_id` ASC) USING BTREE,
  INDEX `idx_tag_id`(`tag_id` ASC) USING BTREE,
  INDEX `idx_created_by`(`created_by` ASC) USING BTREE,
  CONSTRAINT `fk_quality_message_tags_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_quality_message_tags_message_id` FOREIGN KEY (`message_id`) REFERENCES `session_messages` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_quality_message_tags_tag_id` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 74 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '质检消息标签关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for quality_rules
-- ----------------------------
DROP TABLE IF EXISTS `quality_rules`;
CREATE TABLE `quality_rules`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '质检规则ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '规则名称',
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '规则分类',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '规则描述',
  `criteria` json NOT NULL COMMENT '评判标准',
  `score_weight` decimal(5, 2) NOT NULL COMMENT '分数权重',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_by` int NULL DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_name`(`name` ASC) USING BTREE,
  INDEX `idx_category`(`category` ASC) USING BTREE,
  INDEX `idx_score_weight`(`score_weight` ASC) USING BTREE,
  INDEX `idx_is_active`(`is_active` ASC) USING BTREE,
  INDEX `idx_created_by`(`created_by` ASC) USING BTREE,
  CONSTRAINT `fk_quality_rules_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '质检规则表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for quality_scores
-- ----------------------------
DROP TABLE IF EXISTS `quality_scores`;
CREATE TABLE `quality_scores`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '评分记录ID',
  `session_id` int NOT NULL COMMENT '会话ID',
  `rule_id` int NOT NULL COMMENT '规则ID',
  `score` decimal(5, 2) NOT NULL COMMENT '得分',
  `max_score` decimal(5, 2) NULL DEFAULT NULL COMMENT '满分',
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '评分说明',
  `created_by` int NULL DEFAULT NULL COMMENT '评分人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_session_rule`(`session_id` ASC, `rule_id` ASC) USING BTREE,
  INDEX `idx_session_id`(`session_id` ASC) USING BTREE,
  INDEX `idx_rule_id`(`rule_id` ASC) USING BTREE,
  INDEX `idx_score`(`score` ASC) USING BTREE,
  INDEX `idx_created_by`(`created_by` ASC) USING BTREE,
  CONSTRAINT `fk_quality_scores_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_quality_scores_rule_id` FOREIGN KEY (`rule_id`) REFERENCES `quality_rules` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_quality_scores_session_id` FOREIGN KEY (`session_id`) REFERENCES `quality_sessions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 344 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '质检评分表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for quality_session_tags
-- ----------------------------
DROP TABLE IF EXISTS `quality_session_tags`;
CREATE TABLE `quality_session_tags`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '关联记录ID',
  `session_id` int NOT NULL COMMENT '质检会话ID',
  `tag_id` int NOT NULL COMMENT '标签ID',
  `created_by` int NULL DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_session_tag`(`session_id` ASC, `tag_id` ASC) USING BTREE,
  INDEX `idx_session_id`(`session_id` ASC) USING BTREE,
  INDEX `idx_tag_id`(`tag_id` ASC) USING BTREE,
  INDEX `idx_created_by`(`created_by` ASC) USING BTREE,
  CONSTRAINT `fk_quality_session_tags_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_quality_session_tags_session_id` FOREIGN KEY (`session_id`) REFERENCES `quality_sessions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_quality_session_tags_tag_id` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 83 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '质检会话标签关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for quality_sessions
-- ----------------------------
DROP TABLE IF EXISTS `quality_sessions`;
CREATE TABLE `quality_sessions`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '质检会话ID',
  `session_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '会话编号',
  `agent_id` int NULL DEFAULT NULL COMMENT '客服人员ID（系统用户）',
  `external_agent_id` int NULL DEFAULT NULL COMMENT '外部客服ID（导入数据）',
  `agent_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '客服姓名（导入数据）',
  `customer_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '客户ID',
  `customer_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '客户姓名',
  `channel` enum('chat','phone','email','video') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'chat' COMMENT '沟通渠道',
  `start_time` datetime NOT NULL COMMENT '会话开始时间',
  `end_time` datetime NOT NULL COMMENT '会话结束时间',
  `duration` int NOT NULL COMMENT '会话时长（秒）',
  `message_count` int NOT NULL DEFAULT 0 COMMENT '消息总数',
  `status` enum('pending','in_review','completed','disputed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '质检状态',
  `inspector_id` int NULL DEFAULT NULL COMMENT '质检员ID',
  `score` decimal(5, 2) NULL DEFAULT NULL COMMENT '质检总分',
  `grade` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '质检等级',
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '质检评语',
  `reviewed_at` datetime NULL DEFAULT NULL COMMENT '质检完成时间',
  `platform_id` int NULL DEFAULT NULL COMMENT '平台ID',
  `shop_id` int NULL DEFAULT NULL COMMENT '店铺ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_session_no`(`session_no` ASC) USING BTREE,
  INDEX `idx_agent_id`(`agent_id` ASC) USING BTREE,
  INDEX `idx_external_agent_id`(`external_agent_id` ASC) USING BTREE,
  INDEX `idx_customer_id`(`customer_id` ASC) USING BTREE,
  INDEX `idx_channel`(`channel` ASC) USING BTREE,
  INDEX `idx_start_time`(`start_time` ASC) USING BTREE,
  INDEX `idx_end_time`(`end_time` ASC) USING BTREE,
  INDEX `idx_duration`(`duration` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_inspector_id`(`inspector_id` ASC) USING BTREE,
  INDEX `idx_score`(`score` ASC) USING BTREE,
  INDEX `idx_grade`(`grade` ASC) USING BTREE,
  INDEX `idx_reviewed_at`(`reviewed_at` ASC) USING BTREE,
  INDEX `idx_platform_id`(`platform_id` ASC) USING BTREE,
  INDEX `idx_shop_id`(`shop_id` ASC) USING BTREE,
  INDEX `idx_time_range`(`start_time` ASC, `end_time` ASC) USING BTREE,
  INDEX `idx_agent_time_status`(`agent_id` ASC, `start_time` ASC, `status` ASC) USING BTREE,
  CONSTRAINT `fk_quality_sessions_agent_id` FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_quality_sessions_external_agent_id` FOREIGN KEY (`external_agent_id`) REFERENCES `external_agents` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_quality_sessions_inspector_id` FOREIGN KEY (`inspector_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_quality_sessions_platform_id` FOREIGN KEY (`platform_id`) REFERENCES `platforms` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_quality_sessions_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 111 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '质检会话表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for quality_tag_categories
-- ----------------------------
DROP TABLE IF EXISTS `quality_tag_categories`;
CREATE TABLE `quality_tag_categories`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类名称',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '分类描述',
  `sort_order` int NOT NULL DEFAULT 0 COMMENT '排序',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_name`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 25 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '标签分类表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for quality_tags
-- ----------------------------
DROP TABLE IF EXISTS `quality_tags`;
CREATE TABLE `quality_tags`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '标签ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '标签名称',
  `category_id` int NULL DEFAULT NULL COMMENT '分类ID',
  `color` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '#1890ff' COMMENT '标签颜色',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '标签描述',
  `tag_type` enum('quality','business','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'quality' COMMENT '标签类型',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_name_category`(`name` ASC, `category_id` ASC) USING BTREE,
  INDEX `idx_category_id`(`category_id` ASC) USING BTREE,
  INDEX `idx_tag_type`(`tag_type` ASC) USING BTREE,
  CONSTRAINT `fk_quality_tags_category_id` FOREIGN KEY (`category_id`) REFERENCES `quality_tag_categories` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 61 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '质检标签表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for questions
-- ----------------------------
DROP TABLE IF EXISTS `questions`;
CREATE TABLE `questions`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '题目唯一标识ID',
  `exam_id` int NOT NULL COMMENT '所属试卷ID，关联exams表，级联删除',
  `type` enum('single_choice','multiple_choice','true_false','fill_blank','essay') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '题型：single_choice-单选，multiple_choice-多选，true_false-判断，fill_blank-填空，essay-问答',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '题目内容，支持富文本格式',
  `options` json NULL COMMENT '选项内容，JSON格式存储，适用于选择题',
  `correct_answer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '正确答案，根据题型格式不同',
  `score` decimal(5, 2) NOT NULL COMMENT '题目分值',
  `explanation` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '答案解析，帮助学习理解',
  `order_num` int NOT NULL DEFAULT 0 COMMENT '题目排序号，用于试卷中的显示顺序',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录最后更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_exam_id`(`exam_id` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_score`(`score` ASC) USING BTREE,
  INDEX `idx_order_num`(`order_num` ASC) USING BTREE,
  CONSTRAINT `fk_questions_exam_id` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 58 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '题目表-存储试卷中的具体题目信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for role_departments
-- ----------------------------
DROP TABLE IF EXISTS `role_departments`;
CREATE TABLE `role_departments`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '关联记录ID',
  `role_id` int NOT NULL COMMENT '角色ID',
  `department_id` int NOT NULL COMMENT '部门ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_role_department`(`role_id` ASC, `department_id` ASC) USING BTREE,
  INDEX `idx_role_id`(`role_id` ASC) USING BTREE,
  INDEX `idx_department_id`(`department_id` ASC) USING BTREE,
  CONSTRAINT `fk_role_departments_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_role_departments_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 55 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '角色部门关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for role_permissions
-- ----------------------------
DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '关联记录ID',
  `role_id` int NOT NULL COMMENT '角色ID',
  `permission_id` int NOT NULL COMMENT '权限ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_role_permission`(`role_id` ASC, `permission_id` ASC) USING BTREE,
  INDEX `idx_role_id`(`role_id` ASC) USING BTREE,
  INDEX `idx_permission_id`(`permission_id` ASC) USING BTREE,
  CONSTRAINT `fk_role_permissions_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_role_permissions_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 171 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '角色权限关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for roles
-- ----------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '角色唯一标识ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色名称',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '角色描述',
  `level` int NOT NULL DEFAULT 1 COMMENT '角色级别',
  `is_system` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否系统内置角色',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_name`(`name` ASC) USING BTREE,
  INDEX `idx_level`(`level` ASC) USING BTREE,
  INDEX `idx_is_system`(`is_system` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 61 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '角色表-定义系统角色' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for session_messages
-- ----------------------------
DROP TABLE IF EXISTS `session_messages`;
CREATE TABLE `session_messages`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `session_id` int NOT NULL COMMENT '所属会话ID',
  `sender_type` enum('agent','customer','system') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '发送者类型',
  `sender_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '发送者ID',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '消息内容',
  `content_type` enum('text','image','file','audio','video') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text' COMMENT '内容类型',
  `timestamp` datetime NOT NULL COMMENT '消息时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_session_id`(`session_id` ASC) USING BTREE,
  INDEX `idx_sender_type`(`sender_type` ASC) USING BTREE,
  INDEX `idx_sender_id`(`sender_id` ASC) USING BTREE,
  INDEX `idx_content_type`(`content_type` ASC) USING BTREE,
  INDEX `idx_timestamp`(`timestamp` ASC) USING BTREE,
  CONSTRAINT `fk_session_messages_session_id` FOREIGN KEY (`session_id`) REFERENCES `quality_sessions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 562 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '会话消息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for shift_schedules
-- ----------------------------
DROP TABLE IF EXISTS `shift_schedules`;
CREATE TABLE `shift_schedules`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL COMMENT '员工ID',
  `shift_id` int NULL DEFAULT NULL COMMENT '班次ID',
  `schedule_date` date NOT NULL,
  `is_rest_day` tinyint(1) NULL DEFAULT 0 COMMENT '是否休息日',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_employee_date`(`employee_id` ASC, `schedule_date` ASC) USING BTREE,
  INDEX `idx_employee`(`employee_id` ASC) USING BTREE,
  INDEX `idx_shift`(`shift_id` ASC) USING BTREE,
  INDEX `idx_schedule_date`(`schedule_date` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 335 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '排班表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for shift_schedules_backup
-- ----------------------------
DROP TABLE IF EXISTS `shift_schedules_backup`;
CREATE TABLE `shift_schedules_backup`  (
  `id` int NOT NULL DEFAULT 0,
  `employee_id` int NOT NULL COMMENT '员工ID',
  `shift_id` int NULL DEFAULT NULL COMMENT '班次ID',
  `schedule_date` date NOT NULL COMMENT '排班日期（纯日期，无时间部分）',
  `is_rest_day` tinyint(1) NULL DEFAULT 0 COMMENT '是否休息日',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for shift_schedules_backup_20251113
-- ----------------------------
DROP TABLE IF EXISTS `shift_schedules_backup_20251113`;
CREATE TABLE `shift_schedules_backup_20251113`  (
  `id` int NOT NULL DEFAULT 0,
  `employee_id` int NOT NULL COMMENT '员工ID',
  `shift_id` int NULL DEFAULT NULL COMMENT '班次ID',
  `schedule_date` date NOT NULL COMMENT '排班日期',
  `is_rest_day` tinyint(1) NULL DEFAULT 0 COMMENT '是否休息日',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for shift_schedules_backup_before_date_fix
-- ----------------------------
DROP TABLE IF EXISTS `shift_schedules_backup_before_date_fix`;
CREATE TABLE `shift_schedules_backup_before_date_fix`  (
  `id` int NOT NULL DEFAULT 0,
  `employee_id` int NOT NULL COMMENT '员工ID',
  `shift_id` int NULL DEFAULT NULL COMMENT '班次ID',
  `schedule_date` date NOT NULL COMMENT '排班日期',
  `is_rest_day` tinyint(1) NULL DEFAULT 0 COMMENT '是否休息日',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for shift_schedules_backup_comprehensive
-- ----------------------------
DROP TABLE IF EXISTS `shift_schedules_backup_comprehensive`;
CREATE TABLE `shift_schedules_backup_comprehensive`  (
  `id` int NOT NULL DEFAULT 0,
  `employee_id` int NOT NULL COMMENT '员工ID',
  `shift_id` int NULL DEFAULT NULL COMMENT '班次ID',
  `schedule_date` date NOT NULL COMMENT '排班日期（纯日期，无时间部分）',
  `is_rest_day` tinyint(1) NULL DEFAULT 0 COMMENT '是否休息日',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for shift_schedules_backup_simple
-- ----------------------------
DROP TABLE IF EXISTS `shift_schedules_backup_simple`;
CREATE TABLE `shift_schedules_backup_simple`  (
  `id` int NOT NULL DEFAULT 0,
  `employee_id` int NOT NULL COMMENT '员工ID',
  `shift_id` int NULL DEFAULT NULL COMMENT '班次ID',
  `schedule_date` date NOT NULL COMMENT '排班日期（纯日期，无时间部分）',
  `is_rest_day` tinyint(1) NULL DEFAULT 0 COMMENT '是否休息日',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for shops
-- ----------------------------
DROP TABLE IF EXISTS `shops`;
CREATE TABLE `shops`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '店铺ID',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '店铺名称',
  `platform_id` int NOT NULL COMMENT '所属平台ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `platform_id`(`platform_id` ASC) USING BTREE,
  CONSTRAINT `fk_shops_platform` FOREIGN KEY (`platform_id`) REFERENCES `platforms` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 78 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '店铺表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tag_categories
-- ----------------------------
DROP TABLE IF EXISTS `tag_categories`;
CREATE TABLE `tag_categories`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '标签分类ID',
  `parent_id` int NULL DEFAULT NULL COMMENT '父分类ID',
  `level` int NOT NULL DEFAULT 0 COMMENT '分类层级',
  `path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '分类路径',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类名称',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '分类描述',
  `color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '分类颜色',
  `sort_order` int NOT NULL DEFAULT 0 COMMENT '排序号',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_name`(`name` ASC) USING BTREE,
  INDEX `idx_parent_id`(`parent_id` ASC) USING BTREE,
  INDEX `idx_level`(`level` ASC) USING BTREE,
  INDEX `idx_path`(`path`(255) ASC) USING BTREE,
  INDEX `idx_sort_order`(`sort_order` ASC) USING BTREE,
  INDEX `idx_is_active`(`is_active` ASC) USING BTREE,
  CONSTRAINT `fk_tag_categories_parent_id` FOREIGN KEY (`parent_id`) REFERENCES `tag_categories` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 144 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '标签分类表-支持无限极分类' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tags
-- ----------------------------
DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '标签ID',
  `parent_id` int NULL DEFAULT NULL COMMENT '父标签ID',
  `level` int NOT NULL DEFAULT 0 COMMENT '标签层级',
  `path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '标签路径',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '标签名称',
  `tag_type` enum('quality','case','general') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general' COMMENT '标签类型',
  `category_id` int NULL DEFAULT NULL COMMENT '所属分类ID',
  `color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '标签颜色',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '标签描述',
  `usage_count` int NOT NULL DEFAULT 0 COMMENT '使用次数',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_parent_id`(`parent_id` ASC) USING BTREE,
  INDEX `idx_level`(`level` ASC) USING BTREE,
  INDEX `idx_path`(`path`(255) ASC) USING BTREE,
  INDEX `idx_name`(`name` ASC) USING BTREE,
  INDEX `idx_tag_type`(`tag_type` ASC) USING BTREE,
  INDEX `idx_category_id`(`category_id` ASC) USING BTREE,
  INDEX `idx_usage_count`(`usage_count` ASC) USING BTREE,
  INDEX `idx_is_active`(`is_active` ASC) USING BTREE,
  CONSTRAINT `fk_tags_category_id` FOREIGN KEY (`category_id`) REFERENCES `tag_categories` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_tags_parent_id` FOREIGN KEY (`parent_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 233 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '标签表-支持无限极分类' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for user_case_favorites
-- ----------------------------
DROP TABLE IF EXISTS `user_case_favorites`;
CREATE TABLE `user_case_favorites`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `case_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_id`(`user_id` ASC, `case_id` ASC) USING BTREE,
  INDEX `case_id`(`case_id` ASC) USING BTREE,
  CONSTRAINT `user_case_favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `user_case_favorites_ibfk_2` FOREIGN KEY (`case_id`) REFERENCES `quality_cases` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for user_departments
-- ----------------------------
DROP TABLE IF EXISTS `user_departments`;
CREATE TABLE `user_departments`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `department_id` int NOT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_user_department`(`user_id` ASC, `department_id` ASC) USING BTREE,
  INDEX `department_id`(`department_id` ASC) USING BTREE,
  CONSTRAINT `user_departments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `user_departments_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 25 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for user_notification_settings
-- ----------------------------
DROP TABLE IF EXISTS `user_notification_settings`;
CREATE TABLE `user_notification_settings`  (
  `user_id` int NOT NULL,
  `receive_system` tinyint(1) NULL DEFAULT 1,
  `receive_department` tinyint(1) NULL DEFAULT 1,
  `sound_on` tinyint(1) NULL DEFAULT 1,
  `dnd_start` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `dnd_end` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `toast_duration` int NULL DEFAULT 5000,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`) USING BTREE,
  CONSTRAINT `user_notification_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for user_roles
-- ----------------------------
DROP TABLE IF EXISTS `user_roles`;
CREATE TABLE `user_roles`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '关联记录ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `role_id` int NOT NULL COMMENT '角色ID',
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间',
  `assigned_by` int NULL DEFAULT NULL COMMENT '分配人ID',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_role`(`user_id` ASC, `role_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_role_id`(`role_id` ASC) USING BTREE,
  INDEX `idx_assigned_by`(`assigned_by` ASC) USING BTREE,
  CONSTRAINT `fk_user_roles_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_user_roles_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_user_roles_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 102 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户角色关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for user_settings
-- ----------------------------
DROP TABLE IF EXISTS `user_settings`;
CREATE TABLE `user_settings`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `message_notification` tinyint(1) NOT NULL DEFAULT 1,
  `sound_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `do_not_disturb_start` time NULL DEFAULT NULL,
  `do_not_disturb_end` time NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_user_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '用户唯一标识ID',
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户登录名',
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '密码哈希值',
  `real_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '真实姓名',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '邮箱地址',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '手机号码',
  `avatar` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '头像(Base64或URL)',
  `department_id` int NULL DEFAULT NULL COMMENT '所属部门ID',
  `status` enum('active','inactive','pending','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'pending',
  `approval_note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '审批备注',
  `last_login` datetime NULL DEFAULT NULL COMMENT '最后登录时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `session_token` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '会话token',
  `session_created_at` datetime NULL DEFAULT NULL COMMENT '会话创建时间',
  `is_department_manager` tinyint(1) NULL DEFAULT 0 COMMENT '是否为部门主管',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_username`(`username` ASC) USING BTREE,
  UNIQUE INDEX `uk_email`(`email` ASC) USING BTREE,
  UNIQUE INDEX `uk_phone`(`phone` ASC) USING BTREE,
  INDEX `idx_department_id`(`department_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_dept_status`(`department_id` ASC, `status` ASC) USING BTREE,
  INDEX `idx_session_token`(`session_token` ASC) USING BTREE,
  CONSTRAINT `fk_users_department_id` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 101 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户表-存储系统用户基本信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for vacation_audit_logs
-- ----------------------------
DROP TABLE IF EXISTS `vacation_audit_logs`;
CREATE TABLE `vacation_audit_logs`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `employee_id` int NOT NULL COMMENT '员工ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `operation_type` enum('leave_apply','leave_approve','leave_reject','overtime_apply','overtime_approve','compensatory_request','compensatory_approve','balance_adjust','overtime_convert') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '操作类型',
  `operation_detail` json NULL COMMENT '操作详情(JSON格式)',
  `balance_before` json NULL COMMENT '操作前余额快照',
  `balance_after` json NULL COMMENT '操作后余额快照',
  `operator_id` int NULL DEFAULT NULL COMMENT '操作人ID',
  `ip_address` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'IP地址',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_employee_id`(`employee_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_operation_type`(`operation_type` ASC) USING BTREE,
  INDEX `idx_operator_id`(`operator_id` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '假期操作审计日志' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for vacation_balance_changes
-- ----------------------------
DROP TABLE IF EXISTS `vacation_balance_changes`;
CREATE TABLE `vacation_balance_changes`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL COMMENT '员工ID',
  `year` int NOT NULL COMMENT '年份',
  `change_type` enum('addition','deduction','conversion','adjustment') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '变更类型',
  `leave_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '假期类型',
  `amount` decimal(5, 2) NOT NULL COMMENT '变更数量（正数为增加，负数为扣减）',
  `balance_before` decimal(5, 2) NULL DEFAULT NULL COMMENT '变更前余额',
  `balance_after` decimal(5, 2) NULL DEFAULT NULL COMMENT '变更后余额',
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '变更原因',
  `reference_id` int NULL DEFAULT NULL COMMENT '关联ID（审批单号/转换记录ID）',
  `reference_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '关联类型（leave_request/overtime_conversion/manual_adjustment）',
  `approval_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '审批单号',
  `created_by` int NULL DEFAULT NULL COMMENT '操作人ID',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_employee_year`(`employee_id` ASC, `year` ASC) USING BTREE,
  INDEX `idx_change_type`(`change_type` ASC) USING BTREE,
  INDEX `idx_reference`(`reference_type` ASC, `reference_id` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  CONSTRAINT `vacation_balance_changes_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '假期余额变更历史表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for vacation_balances
-- ----------------------------
DROP TABLE IF EXISTS `vacation_balances`;
CREATE TABLE `vacation_balances`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `employee_id` int NOT NULL COMMENT '员工ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `year` int NOT NULL COMMENT '年度',
  `annual_leave_total` decimal(5, 2) NULL DEFAULT 5.00 COMMENT '年假总额度(天)',
  `annual_leave_used` decimal(5, 2) NULL DEFAULT 0.00 COMMENT '年假已用(天)',
  `sick_leave_total` decimal(5, 2) NULL DEFAULT 10.00 COMMENT '病假总额度(天)',
  `sick_leave_used` decimal(5, 2) NULL DEFAULT 0.00 COMMENT '病假已用(天)',
  `compensatory_leave_total` decimal(5, 2) NULL DEFAULT 0.00 COMMENT '调休总额度(天)',
  `compensatory_leave_used` decimal(5, 2) NULL DEFAULT 0.00 COMMENT '调休已用(天)',
  `overtime_leave_total` decimal(5, 1) NULL DEFAULT 0.0,
  `overtime_leave_used` decimal(5, 1) NULL DEFAULT 0.0,
  `overtime_hours_total` decimal(6, 2) NULL DEFAULT 0.00 COMMENT '加班总时长(小时)',
  `overtime_hours_converted` decimal(6, 2) NULL DEFAULT 0.00 COMMENT '已转调休的加班时长(小时)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `total_days` decimal(5, 2) NULL DEFAULT 0.00 COMMENT '总假期天数',
  `last_updated` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `expiry_date` date NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_employee_year`(`employee_id` ASC, `year` ASC) USING BTREE,
  INDEX `idx_user_year`(`user_id` ASC, `year` ASC) USING BTREE,
  INDEX `idx_year`(`year` ASC) USING BTREE,
  INDEX `idx_expiry_date`(`expiry_date` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '假期余额表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for vacation_conversions
-- ----------------------------
DROP TABLE IF EXISTS `vacation_conversions`;
CREATE TABLE `vacation_conversions`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '转换记录ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `employee_id` int NOT NULL COMMENT '员工ID',
  `source_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'overtime' COMMENT '来源类型：overtime-加班',
  `source_hours` decimal(10, 2) NULL DEFAULT NULL COMMENT '来源小时数（如加班时长）',
  `converted_days` decimal(10, 2) NOT NULL COMMENT '转换获得的天数',
  `remaining_days` decimal(10, 2) NOT NULL COMMENT '剩余可用天数',
  `conversion_ratio` decimal(10, 4) NULL DEFAULT NULL COMMENT '转换比例',
  `conversion_rule_id` int NULL DEFAULT NULL COMMENT '使用的转换规则ID',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '备注',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_employee`(`employee_id` ASC) USING BTREE,
  INDEX `idx_user`(`user_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '假期转换记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for vacation_settings
-- ----------------------------
DROP TABLE IF EXISTS `vacation_settings`;
CREATE TABLE `vacation_settings`  (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `setting_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '配置键',
  `setting_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '配置值',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '配置说明',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `setting_key`(`setting_key` ASC) USING BTREE,
  INDEX `idx_setting_key`(`setting_key` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '假期系统配置' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for vacation_type_balances
-- ----------------------------
DROP TABLE IF EXISTS `vacation_type_balances`;
CREATE TABLE `vacation_type_balances`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `user_id` int NOT NULL,
  `year` int NOT NULL,
  `vacation_type_id` int NOT NULL,
  `total_days` decimal(5, 2) NULL DEFAULT 0.00,
  `used_days` decimal(5, 2) NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `conversion_date` date NULL DEFAULT NULL,
  `remaining_carryover_days` decimal(5, 2) NULL DEFAULT 0.00,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_employee_year_type`(`employee_id` ASC, `year` ASC, `vacation_type_id` ASC) USING BTREE,
  INDEX `idx_employee_year`(`employee_id` ASC, `year` ASC) USING BTREE,
  INDEX `idx_vacation_type`(`vacation_type_id` ASC) USING BTREE,
  CONSTRAINT `vacation_type_balances_ibfk_1` FOREIGN KEY (`vacation_type_id`) REFERENCES `vacation_types` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 344 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for vacation_types
-- ----------------------------
DROP TABLE IF EXISTS `vacation_types`;
CREATE TABLE `vacation_types`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '类型代码',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '类型名称',
  `base_days` decimal(5, 2) NULL DEFAULT 0.00 COMMENT '基准天数',
  `included_in_total` tinyint(1) NULL DEFAULT 1 COMMENT '是否计入总额度',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '描述',
  `enabled` tinyint(1) NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `code`(`code` ASC) USING BTREE,
  INDEX `idx_code`(`code` ASC) USING BTREE,
  INDEX `idx_enabled`(`enabled` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 53 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '假期类型表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for work_shifts
-- ----------------------------
DROP TABLE IF EXISTS `work_shifts`;
CREATE TABLE `work_shifts`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '班次名称',
  `start_time` time NOT NULL COMMENT '上班时间',
  `end_time` time NOT NULL COMMENT '下班时间',
  `work_hours` decimal(3, 1) NOT NULL COMMENT '工作时长',
  `rest_duration` int NULL DEFAULT 60 COMMENT '休息时长（分钟）',
  `late_threshold` int NULL DEFAULT 30 COMMENT '迟到阈值（分钟）',
  `early_threshold` int NULL DEFAULT 30 COMMENT '早退阈值（分钟）',
  `is_active` tinyint(1) NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `department_id` int NULL DEFAULT NULL COMMENT '部门ID（NULL表示全公司通用）',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '班次描述',
  `color` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '#3B82F6',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_is_active`(`is_active` ASC) USING BTREE,
  INDEX `idx_department`(`department_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 24 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '班次表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- View structure for employee_work_duration
-- ----------------------------
DROP VIEW IF EXISTS `employee_work_duration`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `employee_work_duration` AS select `u`.`id` AS `employee_id`,`u`.`username` AS `username`,`u`.`real_name` AS `real_name`,`e`.`hire_date` AS `hire_date`,(case when (`u`.`status` = 'active') then (to_days(curdate()) - to_days(`e`.`hire_date`)) else (select coalesce(max(`esr`.`work_duration_days`),(to_days(curdate()) - to_days(`e`.`hire_date`))) from `employee_status_records` `esr` where ((`esr`.`employee_id` = `u`.`id`) and (`esr`.`new_status` in ('inactive','resigned')))) end) AS `total_work_days`,`u`.`status` AS `current_status`,`u`.`department_id` AS `current_department_id`,`d`.`name` AS `current_department_name` from ((`users` `u` left join `employees` `e` on((`u`.`id` = `e`.`user_id`))) left join `departments` `d` on((`u`.`department_id` = `d`.`id`))) where (`e`.`user_id` is not null);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 插入基础数据
-- ============================================================


-- 插入默认部门
INSERT INTO `departments` (`name`, `description`, `status`, `sort_order`) VALUES
('管理部', '公司管理层部门，负责公司整体运营和战略规划', 'active', 1),
('客服部', '客户服务部门，负责处理客户咨询和售后服务', 'active', 2),
('技术部', '技术研发部门，负责系统开发和技术支持', 'active', 3),
('质检部', '质量检查部门，负责客服质量监控和评估', 'active', 4),
('运营部', '运营管理部门，负责业务运营和数据分析', 'active', 5)
ON DUPLICATE KEY UPDATE `name` = `name`;

-- 插入默认角色
INSERT INTO `roles` (`name`, `description`, `level`, `is_system`) VALUES
('超级管理员', '系统最高权限角色，拥有所有功能的访问和管理权限', 100, 1),
('部门经理', '部门管理角色，负责部门日常管理和人员调配', 80, 0),
('客服专员', '客户服务角色，负责处理客户咨询和问题解决', 50, 0),
('质检员', '质量检查角色，负责客服质量评估和监督', 60, 0),
('运营专员', '运营管理角色，负责业务运营和数据分析', 50, 0),
('普通员工', '普通员工权限', 3, 0)
ON DUPLICATE KEY UPDATE `name` = `name`;

-- 插入默认管理员用户(密码: admin123)
INSERT INTO `users` (`username`, `password_hash`, `real_name`, `email`, `status`, `is_department_manager`) VALUES
('admin', '$2b$10$kjCCNMqQEWZ13vV76MXKK.OktCVrxp0OFePS8fZmTx4MMVH4v16aW', '系统管理员', 'admin@example.com', 'active', 1)
ON DUPLICATE KEY UPDATE `username` = `username`;

-- 为管理员用户分配超级管理员角色
INSERT INTO `user_roles` (`user_id`, `role_id`)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'admin' AND r.name = '超级管理员'
ON DUPLICATE KEY UPDATE `user_id` = `user_id`;

-- 为普通员工角色分配默认可查看部门
INSERT INTO `role_departments` (`role_id`, `department_id`)
SELECT r.id, d.id
FROM roles r, departments d
WHERE r.name = '普通员工' AND d.name IN ('管理部', '客服部')
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;

-- ============================================================
-- 从001_full_deployment.sql补充的额外数据
-- ============================================================

-- 插入默认部门
INSERT INTO `departments` (`name`, `description`, `status`, `sort_order`) VALUES
('管理部', '公司管理层部门，负责公司整体运营和战略规划', 'active', 1),
('客服部', '客户服务部门，负责处理客户咨询和售后服务', 'active', 2),
('技术部', '技术研发部门，负责系统开发和技术支持', 'active', 3),
('质检部', '质量检查部门，负责客服质量监控和评估', 'active', 4),
('运营部', '运营管理部门，负责业务运营和数据分析', 'active', 5)
ON DUPLICATE KEY UPDATE `name` = `name`;

-- 插入默认角色
INSERT INTO `roles` (`name`, `description`, `level`, `is_system`) VALUES
('超级管理员', '系统最高权限角色，拥有所有功能的访问和管理权限', 100, 1),
('部门经理', '部门管理角色，负责部门日常管理和人员调配', 80, 0),
('客服专员', '客户服务角色，负责处理客户咨询和问题解决', 50, 0),
('质检员', '质量检查角色，负责客服质量评估和监督', 60, 0),
('运营专员', '运营管理角色，负责业务运营和数据分析', 50, 0),
('普通员工', '普通员工权限', 3, 0)
ON DUPLICATE KEY UPDATE `name` = `name`;

-- 插入默认管理员用户(密码: admin123)
INSERT INTO `users` (`username`, `password_hash`, `real_name`, `email`, `status`, `is_department_manager`) VALUES
('admin', '$2b$10$kjCCNMqQEWZ13vV76MXKK.OktCVrxp0OFePS8fZmTx4MMVH4v16aW', '系统管理员', 'admin@example.com', 'active', 1)
ON DUPLICATE KEY UPDATE `username` = `username`;

-- 为管理员用户分配超级管理员角色
INSERT INTO `user_roles` (`user_id`, `role_id`)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'admin' AND r.name = '超级管理员'
ON DUPLICATE KEY UPDATE `user_id` = `user_id`;

-- 为普通员工角色分配默认可查看部门
-- 角色部门关联数据已在上方插入，此处不再重复


-- ============================================================
-- 初始化权限数据
-- ============================================================


SET FOREIGN_KEY_CHECKS = 0;

-- 1. 清理现有权限数据 (防止重复执行导致的主键冲突或冗余)
TRUNCATE TABLE role_permissions;
TRUNCATE TABLE permissions;

-- 2. 插入所有系统权限
INSERT INTO permissions (name, code, resource, action, module, description) VALUES
-- 系统管理 (System)
('查看角色', 'system:role:view', 'role', 'view', 'system', '查看角色列表'),
('管理角色', 'system:role:manage', 'role', 'manage', 'system', '新增、编辑、删除角色及配置权限'),
('查看日志', 'system:log:view', 'log', 'view', 'system', '查看系统操作日志'),

-- 员工管理 (User)
('查看员工', 'user:employee:view', 'employee', 'view', 'user', '查看员工列表及详情'),
('管理员工', 'user:employee:manage', 'employee', 'manage', 'user', '新增、编辑、删除员工'),
('员工审核', 'user:audit:manage', 'audit', 'manage', 'user', '审核新注册员工'),
('重置密码', 'user:security:reset_password', 'security', 'reset_password', 'user', '重置员工密码'),
('部门备忘', 'user:memo:manage', 'memo', 'manage', 'user', '管理部门备忘录'),

-- 组织架构 (Organization)
('查看部门', 'org:department:view', 'department', 'view', 'organization', '查看部门架构'),
('管理部门', 'org:department:manage', 'department', 'manage', 'organization', '新增、编辑、删除部门'),
('查看职位', 'org:position:view', 'position', 'view', 'organization', '查看职位列表'),
('管理职位', 'org:position:manage', 'position', 'manage', 'organization', '新增、编辑、删除职位'),

-- 信息系统 (Messaging)
('查看广播', 'messaging:broadcast:view', 'broadcast', 'view', 'messaging', '查看系统广播'),
('发布广播', 'messaging:broadcast:manage', 'broadcast', 'manage', 'messaging', '发布、管理系统广播'),
('通知设置', 'messaging:config:manage', 'config', 'manage', 'messaging', '配置系统通知规则'),

-- 考勤管理 (Attendance)
('查看考勤', 'attendance:record:view', 'record', 'view', 'attendance', '查看考勤记录'),
('考勤统计', 'attendance:report:view', 'report', 'view', 'attendance', '查看考勤统计报表'),
('考勤设置', 'attendance:config:manage', 'config', 'manage', 'attendance', '修改考勤规则、班次、排班'),
('考勤审批', 'attendance:approval:manage', 'approval', 'manage', 'attendance', '审批请假、加班、补卡申请'),
('排班管理', 'attendance:schedule:manage', 'schedule', 'manage', 'attendance', '管理员工排班'),

-- 假期管理 (Vacation)
('查看假期', 'vacation:record:view', 'record', 'view', 'vacation', '查看假期余额及记录'),
('假期配置', 'vacation:config:manage', 'config', 'manage', 'vacation', '配置假期规则及额度'),
('假期审批', 'vacation:approval:manage', 'approval', 'manage', 'vacation', '审批调休申请'),

-- 质检管理 (Quality)
('查看质检', 'quality:session:view', 'session', 'view', 'quality', '查看质检会话及记录'),
('质检评分', 'quality:score:manage', 'score', 'manage', 'quality', '进行质检评分'),
('质检配置', 'quality:config:manage', 'config', 'manage', 'quality', '配置质检规则、标签、平台店铺'),
('案例管理', 'quality:case:manage', 'case', 'manage', 'quality', '管理质检案例'),

-- 知识库 (Knowledge)
('查看知识库', 'knowledge:article:view', 'article', 'view', 'knowledge', '查看公共知识库'),
('管理知识库', 'knowledge:article:manage', 'article', 'manage', 'knowledge', '发布、编辑、删除知识库文章'),

-- 考核系统 (Assessment)
('查看考核', 'assessment:plan:view', 'plan', 'view', 'assessment', '查看考核计划及试卷'),
('管理考核', 'assessment:plan:manage', 'plan', 'manage', 'assessment', '创建试卷、发布考核计划'),
('查看成绩', 'assessment:result:view', 'result', 'view', 'assessment', '查看所有员工考试成绩');

-- 3. 确保基础角色存在
INSERT IGNORE INTO roles (name, description, level, is_system) VALUES
('普通员工', '系统默认基础角色，拥有基本查看权限', 1, 1);

-- 4. 为【超级管理员】分配所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = '超级管理员';

-- 5. 为【普通员工】分配基础权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'user:employee:view',
    'org:department:view',
    'org:position:view',
    'messaging:broadcast:view',
    'attendance:record:view',
    'vacation:record:view',
    'knowledge:article:view',
    'assessment:plan:view'
)
WHERE r.name = '普通员工';

SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
-- 初始化通知设置
-- ============================================================


-- 插入默认设置
INSERT INTO `notification_settings` (`event_type`, `target_roles`) VALUES
('leave_apply', '["部门经理"]'),
('leave_approval', '["申请人"]'),
('leave_rejection', '["申请人"]'),
('exam_publish', '["全体员工"]'),
('exam_result', '["考生"]'),
('leave_cancel', '["部门经理"]'),
('overtime_apply', '["部门经理"]'),
('overtime_approval', '["申请人"]'),
('overtime_rejection', '["申请人"]'),
('makeup_apply', '["部门经理"]'),
('makeup_approval', '["申请人"]'),
('makeup_rejection', '["申请人"]')
ON DUPLICATE KEY UPDATE `event_type` = `event_type`;


-- ============================================================
-- 添加部门主管标志字段
-- ============================================================


-- 检查并添加is_department_manager字段到users表
SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'is_department_manager'
);

SET @ddl = IF(
  @col_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `is_department_manager` BOOLEAN DEFAULT FALSE COMMENT ''是否为部门主管''',
  'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;



-- ============================================================
-- 插入基础数据
-- ============================================================

-- 部门数据已在上方插入，此处不再重复
-- 角色数据已在上方插入，此处不再重复
-- 用户数据已在上方插入，此处不再重复
-- 用户角色关联数据已在上方插入，此处不再重复
INSERT INTO `role_departments` (`role_id`, `department_id`)
SELECT r.id, d.id
FROM roles r, departments d
WHERE r.name = '普通员工' AND d.name IN ('管理部', '客服部')
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;

-- ============================================================
-- 从001_full_deployment.sql补充的额外数据
-- ============================================================

-- 插入默认部门
INSERT INTO `departments` (`name`, `description`, `status`, `sort_order`) VALUES
('管理部', '公司管理层部门，负责公司整体运营和战略规划', 'active', 1),
('客服部', '客户服务部门，负责处理客户咨询和售后服务', 'active', 2),
('技术部', '技术研发部门，负责系统开发和技术支持', 'active', 3),
('质检部', '质量检查部门，负责客服质量监控和评估', 'active', 4),
('运营部', '运营管理部门，负责业务运营和数据分析', 'active', 5)
ON DUPLICATE KEY UPDATE `name` = `name`;

-- 插入默认角色
INSERT INTO `roles` (`name`, `description`, `level`, `is_system`) VALUES
('超级管理员', '系统最高权限角色，拥有所有功能的访问和管理权限', 100, 1),
('部门经理', '部门管理角色，负责部门日常管理和人员调配', 80, 0),
('客服专员', '客户服务角色，负责处理客户咨询和问题解决', 50, 0),
('质检员', '质量检查角色，负责客服质量评估和监督', 60, 0),
('运营专员', '运营管理角色，负责业务运营和数据分析', 50, 0),
('普通员工', '普通员工权限', 3, 0)
ON DUPLICATE KEY UPDATE `name` = `name`;

-- 插入默认管理员用户(密码: admin123)
INSERT INTO `users` (`username`, `password_hash`, `real_name`, `email`, `status`, `is_department_manager`) VALUES
('admin', '$2b$10$kjCCNMqQEWZ13vV76MXKK.OktCVrxp0OFePS8fZmTx4MMVH4v16aW', '系统管理员', 'admin@example.com', 'active', 1)
ON DUPLICATE KEY UPDATE `username` = `username`;

-- 为管理员用户分配超级管理员角色
INSERT INTO `user_roles` (`user_id`, `role_id`)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'admin' AND r.name = '超级管理员'
ON DUPLICATE KEY UPDATE `user_id` = `user_id`;

-- 为普通员工角色分配默认可查看部门
-- 角色部门关联数据已在上方插入，此处不再重复
