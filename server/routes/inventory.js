const jwt = require('jsonwebtoken')
const { recordLog } = require('../utils/logger')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

module.exports = async function (fastify, opts) {
  const pool = fastify.mysql
  const redis = fastify.redis // Assuming redis is decorated

  // Helper: Redis Key
  const getStockKey = (itemId) => `inventory:stock:${itemId}`

  // Helper: Get user
  const getUserFromToken = (request) => {
    const token = request.headers.authorization?.replace('Bearer ', '')
    if (!token) throw new Error('Unauthorized')
    return jwt.verify(token, JWT_SECRET)
  }

  // 1. Get Inventory Items (List with Stock)
  fastify.get('/api/inventory/items', async (request, reply) => {
    try {
      const { keyword, category } = request.query
      
      let query = 'SELECT * FROM inventory_items WHERE 1=1'
      const params = []
      
      if (keyword) {
        query += ' AND (name LIKE ? OR description LIKE ?)'
        params.push(`%${keyword}%`, `%${keyword}%`)
      }
      if (category) {
        query += ' AND category = ?'
        params.push(category)
      }
      
      query += ' ORDER BY created_at DESC'
      
      const [items] = await pool.query(query, params)

      // Redis Optimization: Sync/Check stock
      if (redis) {
        const pipeline = redis.pipeline()
        for (const item of items) {
            // Get current value from redis
            const stock = await redis.get(getStockKey(item.id))
            if (stock !== null) {
                item.current_stock = parseInt(stock) // Use Redis value as source of truth for display
            } else {
                // Warm up cache
                pipeline.set(getStockKey(item.id), item.current_stock)
            }
        }
        await pipeline.exec()
      }

      return { success: true, data: items }
    } catch (err) {
      console.error(err)
      return reply.code(500).send({ success: false, message: err.message })
    }
  })

  // 2. Add Procurement (Purchase & Stock In)
  fastify.post('/api/inventory/procure', async (request, reply) => {
    try {
      const user = getUserFromToken(request)
      const { item_name, category, quantity, price_per_unit, supplier, purchase_date, item_id } = request.body

      const conn = await pool.getConnection()
      await conn.beginTransaction()

      try {
        let finalItemId = item_id

        // If new item, create it first
        if (!finalItemId) {
            const [newItem] = await conn.query(
                'INSERT INTO inventory_items (name, category, current_stock) VALUES (?, ?, 0)',
                [item_name, category]
            )
            finalItemId = newItem.insertId
        }

        const totalPrice = quantity * price_per_unit

        // Insert Procurement Record
        await conn.query(
            `INSERT INTO procurement_records 
            (item_id, quantity, price_per_unit, total_price, supplier, purchase_date, purchaser_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [finalItemId, quantity, price_per_unit, totalPrice, supplier, purchase_date, user.id]
        )

        // Update Stock
        await conn.query(
            'UPDATE inventory_items SET current_stock = current_stock + ? WHERE id = ?',
            [quantity, finalItemId]
        )

        // Commit DB
        await conn.commit()

        // Update Redis
        if (redis) {
            await redis.incrby(getStockKey(finalItemId), quantity)
        }

        // Log
        await recordLog(pool, {
            user_id: user.id,
            username: user.username,
            real_name: user.real_name,
            module: 'finance',
            action: `采购入库: ${item_name || '现有物品'} +${quantity}`,
            method: 'POST',
            url: request.url,
            ip: request.ip,
            status: 1
        })

        return { success: true }
      } catch (e) {
        await conn.rollback()
        throw e
      } finally {
        conn.release()
      }
    } catch (err) {
      return reply.code(500).send({ success: false, message: err.message })
    }
  })

  // 3. Usage (Stock Out)
  fastify.post('/api/inventory/use', async (request, reply) => {
    try {
      const user = getUserFromToken(request)
      const { item_id, quantity, purpose, user_id } = request.body // user_id is who received it

      // Check stock first (Redis fast check)
      if (redis) {
          const stock = await redis.get(getStockKey(item_id))
          if (stock !== null && parseInt(stock) < quantity) {
              return reply.code(400).send({ success: false, message: '库存不足 (Redis Check)' })
          }
      }

      const conn = await pool.getConnection()
      await conn.beginTransaction()

      try {
        // Double check DB stock
        const [rows] = await conn.query('SELECT current_stock, name FROM inventory_items WHERE id = ? FOR UPDATE', [item_id])
        if (rows.length === 0) throw new Error('Item not found')
        if (rows[0].current_stock < quantity) throw new Error(`库存不足 (剩余: ${rows[0].current_stock})`)

        // Record Usage
        await conn.query(
            'INSERT INTO inventory_usage (item_id, quantity, user_id, purpose) VALUES (?, ?, ?, ?)',
            [item_id, quantity, user_id || user.id, purpose]
        )

        // Deduct Stock
        await conn.query(
            'UPDATE inventory_items SET current_stock = current_stock - ? WHERE id = ?',
            [quantity, item_id]
        )

        await conn.commit()

        // Update Redis
        if (redis) {
            await redis.decrby(getStockKey(item_id), quantity)
        }

        return { success: true }
      } catch (e) {
        await conn.rollback()
        throw e
      } finally {
        conn.release()
      }
    } catch (err) {
      return reply.code(500).send({ success: false, message: err.message })
    }
  })

  // 4. Audit/Stocktaking (盘点)
  fastify.post('/api/inventory/audit', async (request, reply) => {
    try {
      const user = getUserFromToken(request)
      const { item_id, actual_stock, notes } = request.body

      const conn = await pool.getConnection()
      await conn.beginTransaction()

      try {
        // Get expected stock
        const [rows] = await conn.query('SELECT current_stock, name FROM inventory_items WHERE id = ? FOR UPDATE', [item_id])
        const expectedStock = rows[0].current_stock
        const discrepancy = actual_stock - expectedStock
        let resultStatus = 'matched'
        if (discrepancy < 0) resultStatus = 'missing'
        if (discrepancy > 0) resultStatus = 'surplus'

        // Create Audit Record
        await conn.query(
            `INSERT INTO inventory_audits 
            (item_id, expected_stock, actual_stock, result_status, auditor_id, notes)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [item_id, expectedStock, actual_stock, resultStatus, user.id, notes]
        )

        // Auto-correct Stock? (Optional, usually we want to correct it to match reality)
        // Let's assume we Correct it.
        if (discrepancy !== 0) {
            await conn.query(
                'UPDATE inventory_items SET current_stock = ? WHERE id = ?',
                [actual_stock, item_id]
            )
            // Update Redis
            if (redis) {
                await redis.set(getStockKey(item_id), actual_stock)
            }
            
            // Critical Log
            await recordLog(pool, {
                user_id: user.id,
                username: user.username,
                real_name: user.real_name,
                module: 'finance',
                action: `库存盘点异常: ${rows[0].name} (差异: ${discrepancy})`,
                method: 'POST',
                url: request.url,
                ip: request.ip,
                status: 1 // Warning status? DB schema uses int. 1=Success.
            })
        }

        await conn.commit()
        return { success: true, discrepancy, status: resultStatus }
      } catch (e) {
        await conn.rollback()
        throw e
      } finally {
        conn.release()
      }
    } catch (err) {
      return reply.code(500).send({ success: false, message: err.message })
    }
  })

  // 5. Get History (Procurement, Usage, Audits)
  fastify.get('/api/inventory/history', async (request, reply) => {
      try {
          const { item_id, type } = request.query // type: procurement, usage, audit
          let data = []
          
          if (type === 'procurement') {
              const [rows] = await pool.query('SELECT * FROM procurement_records WHERE item_id = ? ORDER BY created_at DESC', [item_id])
              data = rows
          } else if (type === 'usage') {
              const [rows] = await pool.query('SELECT iu.*, u.real_name FROM inventory_usage iu LEFT JOIN users u ON iu.user_id = u.id WHERE item_id = ? ORDER BY created_at DESC', [item_id])
              data = rows
          } else if (type === 'audit') {
              const [rows] = await pool.query('SELECT ia.*, u.real_name FROM inventory_audits ia LEFT JOIN users u ON ia.auditor_id = u.id WHERE item_id = ? ORDER BY audit_date DESC', [item_id])
              data = rows
          }
          
          return { success: true, data }
      } catch (err) {
          return reply.code(500).send({ success: false, message: err.message })
      }
  })
}
