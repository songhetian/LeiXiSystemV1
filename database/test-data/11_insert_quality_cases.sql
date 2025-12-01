-- 插入质检案例测试数据

-- 清理旧数据
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE quality_case_likes;
TRUNCATE TABLE quality_case_favorites;
TRUNCATE TABLE quality_cases;
SET FOREIGN_KEY_CHECKS = 1; 

-- 获取相关ID
SET @session1_id = (SELECT id FROM `quality_sessions` WHERE `session_no` = 'QS20251130001' LIMIT 1);
SET @user_manager1_id = (SELECT id FROM `users` WHERE `username` = 'manager1' LIMIT 1);
SET @user_service1_id = (SELECT id FROM `users` WHERE `username` = 'service1' LIMIT 1);
SET @user_service2_id = (SELECT id FROM `users` WHERE `username` = 'service2' LIMIT 1);
SET @user_service3_id = (SELECT id FROM `users` WHERE `username` = 'service3' LIMIT 1);

-- 插入案例数据
INSERT INTO quality_cases (session_id, title, description, category, difficulty, problem, solution, view_count, like_count, collect_count, status, created_by, created_at, case_type, priority)
VALUES
(@session1_id, '如何优雅地处理客户投诉', '这是一个关于处理客户情绪激动的投诉案例，展示了共情和解决方案的重要性。', '投诉处理', 'medium', '客户因物流延误非常生气，要求立刻退款并赔偿。', CONCAT('1. 首先安抚客户情绪，表示理解；', CHAR(10), '2. 查询物流状态，发现是天气原因导致；', CHAR(10), '3. 向客户解释原因，并主动申请了一张优惠券作为补偿；', CHAR(10), '4. 承诺持续跟进物流状态。'), 125, 12, 5, 'published', @user_manager1_id, DATE_SUB(NOW(), INTERVAL 5 DAY), 'excellent', 'medium'),

(@session1_id, '产品功能咨询的标准话术', '针对新上线产品的复杂功能咨询，如何用通俗易懂的语言向客户解释。', '业务咨询', 'easy', '客户询问新推出的"智能排班"功能具体如何使用，以及与旧版的区别。', '使用了类比的方法，将智能排班比作"自动导航"，只需要输入目的地（排班规则），系统自动规划路线（生成班次）。同时列举了3个核心优势点。', 89, 8, 3, 'published', @user_manager1_id, DATE_SUB(NOW(), INTERVAL 3 DAY), 'excellent', 'medium'),

(@session1_id, '处理退换货纠纷的教科书式案例', '在不符合退换货条件的情况下，如何婉拒客户并提供替代方案。', '售后服务', 'hard', '客户购买商品已超过7天无理由退换期，且已拆封使用，但坚持要求退货。', CONCAT('1. 温和坚定地表明公司规定；', CHAR(10), '2. 详细解释为什么不能退货（影响二次销售）；', CHAR(10), '3. 提出替代方案：提供维修服务或以旧换新折扣；', CHAR(10), '4. 最终客户接受了维修方案。'), 210, 35, 15, 'published', @user_service1_id, DATE_SUB(NOW(), INTERVAL 10 DAY), 'excellent', 'high'),

(@session1_id, 'VIP客户的个性化服务接待', '识别VIP客户身份，并提供超出预期的个性化服务体验。', 'VIP服务', 'medium', '系统提示进线客户为高等级VIP，且在其生日月。', CONCAT('1. 开场白直接送上生日祝福；', CHAR(10), '2. 全程优先处理其需求；', CHAR(10), '3. 结束时赠送VIP专属生日礼包；', CHAR(10), '4. 客户表示非常惊喜，给出了满分好评。'), 156, 22, 8, 'published', @user_manager1_id, DATE_SUB(NOW(), INTERVAL 1 DAY), 'excellent', 'medium'),

(@session1_id, '突发系统故障时的安抚话术', '在系统崩溃导致无法下单时，如何批量安抚焦虑的客户。', '危机处理', 'hard', '双十一大促期间，系统突然卡顿，大量客户无法付款，进线咨询量激增。', CONCAT('1. 统一口径，承认问题并致歉；', CHAR(10), '2. 告知技术部门正在紧急修复，预计恢复时间；', CHAR(10), '3. 建议客户稍后尝试，并承诺优惠依然有效；', CHAR(10), '4. 引导客户先加购物车。'), 340, 56, 20, 'published', @user_service1_id, DATE_SUB(NOW(), INTERVAL 20 DAY), 'excellent', 'urgent');

-- 获取案例ID
SET @case1_id = (SELECT id FROM `quality_cases` WHERE `title` = '如何优雅地处理客户投诉' LIMIT 1);
SET @case2_id = (SELECT id FROM `quality_cases` WHERE `title` = '产品功能咨询的标准话术' LIMIT 1);
SET @case3_id = (SELECT id FROM `quality_cases` WHERE `title` = '处理退换货纠纷的教科书式案例' LIMIT 1);

-- 插入案例收藏数据
INSERT INTO quality_case_favorites (case_id, user_id, created_at)
VALUES
(@case1_id, @user_manager1_id, NOW()),
(@case3_id, @user_manager1_id, NOW()),
(@case2_id, @user_service1_id, NOW());

-- 插入案例点赞数据
INSERT INTO quality_case_likes (case_id, user_id, created_at)
VALUES
(@case1_id, @user_manager1_id, NOW()),
(@case1_id, @user_service1_id, NOW()),
(@case2_id, @user_manager1_id, NOW()),
(@case3_id, @user_manager1_id, NOW()),
(@case3_id, @user_service1_id, NOW()),
(@case3_id, @user_service2_id, NOW());
