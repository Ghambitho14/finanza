import { Router } from 'express'
import { query, type CategoryRow } from '../db.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'

const router = Router()

function mapCategory(row: CategoryRow) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    created_at: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at),
  }
}

router.get('/', requireAuth, async (_req: AuthedRequest, res) => {
  const rows = await query<CategoryRow>(
    'SELECT id, name, type, created_at FROM categories ORDER BY type, name',
  )
  res.json({ categories: rows.map(mapCategory) })
})

export default router
