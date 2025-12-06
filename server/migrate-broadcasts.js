// 数据库迁移脚本 - 创建广播表
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

async function runMigration() {
  let connection

  try {
    // 从环境变量读取数据库配置
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'leixi_system',
      multipleStatements: true
    })

    console.log('✅ 数据库连接成功')

    // 读取SQL文件
    const sqlFile = path.join(__dirname, '../database/migrations/005_create_broadcasts.sql')
    const sql = fs.readFileSync(sqlFile, 'utf8')

    console.log('📄 执行SQL迁移文件...')

    // 执行SQL
    await connection.query(sql)

    console.log('✅ 广播表创建成功！')
    console.log('   - broadcasts (广播表)')
    console.log('   - broadcast_recipients (广播接收记录表)')

  } catch (error) {
    console.error('❌ 迁移失败:', error.message)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log('🔌 数据库连接已关闭')
    }
  }
}

runMigration()
