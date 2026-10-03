import './env.js'
import express from 'express'
import cors from 'cors'
import { getDbClient, migrateAndSeed, query, waitForDb } from './db.js'
import { errorHandler } from './middleware/errors.js'
import authRoutes from './routes/auth.js'
import categoriesRoutes from './routes/categories.js'
import transactionsRoutes from './routes/transactions.js'

const PORT = Number(process.env.PORT || 4000)
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'

async function main() {
  await waitForDb()
  await migrateAndSeed()

  const app = express()
  app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',') }))
  app.use(express.json())

  app.get('/api/health', async (_req, res) => {
    try {
      await query('SELECT 1 AS ok')
      res.json({ ok: true, db: getDbClient() })
    } catch {
      res.status(503).json({ ok: false })
    }
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/categories', categoriesRoutes)
  app.use('/api/transactions', transactionsRoutes)

  app.use((_req, res) => {
    res.status(404).json({ error: 'No encontrado' })
  })

  app.use(errorHandler)

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[api] listening on :${PORT} (db=${getDbClient()})`)
  })
}

main().catch((err) => {
  console.error('[api] failed to start', err)
  process.exit(1)
})
