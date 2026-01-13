/**
 * 消息异步队列工具
 * 处理逻辑：Redis 生成自增 ID -> 消息入队 -> 批量写入 MySQL
 */
class MessageQueue {
  constructor(pool, redis) {
    this.pool = pool;
    this.redis = redis;
    this.queueKey = 'chat:queue:pending_messages';
    this.idKey = 'chat:message_id_seq';
    this.isProcessing = false;
  }

  /**
   * 初始化 ID 序列 (防止重启后 ID 冲突)
   */
  async initSequence() {
    const [rows] = await this.pool.query('SELECT MAX(id) as maxId FROM chat_messages');
    const maxId = rows[0].maxId || 0;
    await this.redis.setnx(this.idKey, maxId);
    console.log(`🚀 [MessageQueue] ID 序列初始化完成，起始 ID: ${maxId}`);
  }

  /**
   * 消息入队
   */
  async enqueue(message) {
    // 1. 获取全局唯一 ID
    const nextId = await this.redis.incr(this.idKey);
    const msgWithId = { ...message, id: nextId, created_at: new Date() };

    // 2. 推入待持久化队列
    await this.redis.rpush(this.queueKey, JSON.stringify(msgWithId));
    
    return msgWithId;
  }

  /**
   * 批量持久化到 MySQL
   */
  async flush() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const batchSize = 100;
      const messages = await this.redis.lrange(this.queueKey, 0, batchSize - 1);
      
      if (messages.length === 0) {
        this.isProcessing = false;
        return;
      }

      console.log(`📦 [MessageQueue] 正在持久化 ${messages.length} 条消息...`);

      const values = messages.map(m => {
        const item = JSON.parse(m);
        return [
          item.id, 
          item.sender_id, 
          item.group_id, 
          item.content, 
          item.msg_type || 'text', 
          item.file_url || null, 
          new Date(item.created_at)
        ];
      });

      // 使用批量插入语法
      const sql = `
        INSERT INTO chat_messages (id, sender_id, group_id, content, msg_type, file_url, created_at)
        VALUES ?
        ON DUPLICATE KEY UPDATE id=id
      `;

      await this.pool.query(sql, [values]);

      // 移除已成功写入的消息
      await this.redis.ltrim(this.queueKey, messages.length, -1);
      
    } catch (err) {
      console.error('❌ [MessageQueue] 持久化失败:', err);
    } finally {
      this.isProcessing = false;
    }
  }
}

module.exports = MessageQueue;
