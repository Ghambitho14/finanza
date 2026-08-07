import { Router } from 'express'
import { z } from 'zod'
import { execute, query, type CategoryRow, type TransactionRow } from '../db.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'

const router = Router()

const transactionTypes = z.enum(['income', 'fixed', 'variable', 'savings'])

/** Accept YYYY-MM or YYYY-MM-01 and canonicalize to YYYY-MM. */
const monthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}(-\d{2})?$/)
  .transform((value) => value.slice(0, 7))

const createSchema = z.object({
  description: z.string().trim().min(1).max(500),
  amount: z.number().finite(),
  type: transactionTypes,
  month: monthSchema,
  category_id: z.string().uuid().nullable(),
  recurring: z.boolean(),
})

const cloneSchema = z.object({
  fromMonth: monthSchema,
  toMonth: monthSchema,
})

interface TransactionJoined extends TransactionRow {
  category_name: string | null
  category_type: CategoryRow['type'] | null
  category_created_at: Date | string | null
}

function mapTransaction(row: TransactionJoined) {
  const amount = typeof row.amount === 'string' ? Number(row.amount) : row.amount
  return {
    id: row.id,
    owner_id: row.owner_id,
    category_id: row.category_id,
    description: row.description,
    amount,
    type: row.type,
    month: row.month.slice(0, 7),
    recurring: Boolean(row.recurring),
    created_at: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at),
    categories: row.category_id && row.category_name
      ? {
          id: row.category_id,
          name: row.category_name,
          type: row.category_type!,
          created_at: row.category_created_at instanceof Date
            ? row.category_created_at.toISOString()
            : String(row.category_created_at),
        }
      : null,
  }
}

router.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const rows = await query<TransactionJoined>(
    `SELECT t.id, t.owner_id, t.category_id, t.description, t.amount, t.type,
            t.month, t.recurring, t.created_at,
            c.name AS category_name, c.type AS category_type, c.created_at AS category_created_at
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.owner_id = ?
     ORDER BY t.created_at DESC`,
    [req.auth!.userId],
  )
  res.json({ transactions: rows.map(mapTransaction) })
})

router.post('/', requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos' })
    return
  }

  const data = parsed.data
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  await execute(
    `INSERT INTO transactions
      (id, owner_id, category_id, description, amount, type, month, recurring, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      req.auth!.userId,
      data.category_id,
      data.description,
      data.amount,
      data.type,
      data.month,
      data.recurring ? 1 : 0,
      now,
    ],
  )

  res.status(201).json({ id })
})

router.delete('/:id', requireAuth, async (req: AuthedRequest, res) => {
  const id = req.params.id
  const result = await execute(
    'DELETE FROM transactions WHERE id = ? AND owner_id = ?',
    [id, req.auth!.userId],
  )
  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'Transacción no encontrada' })
    return
  }
  res.status(204).send()
})

router.post('/clone-recurring', requireAuth, async (req: AuthedRequest, res) => {
  const parsed = cloneSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos' })
    return
  }

  const { fromMonth, toMonth } = parsed.data
  const ownerId = req.auth!.userId

  // Match both canonical YYYY-MM and legacy YYYY-MM-01 rows
  const rows = await query<TransactionRow>(
    `SELECT id, owner_id, category_id, description, amount, type, month, recurring, created_at
     FROM transactions
     WHERE owner_id = ? AND recurring = 1
       AND (month = ? OR month = ?)`,
    [ownerId, fromMonth, `${fromMonth}-01`],
  )

  if (rows.length === 0) {
    res.json({ cloned: 0 })
    return
  }

  const now = new Date().toISOString()
  for (const t of rows) {
    await execute(
      `INSERT INTO transactions
        (id, owner_id, category_id, description, amount, type, month, recurring, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        crypto.randomUUID(),
        ownerId,
        t.category_id,
        t.description,
        t.amount,
        t.type,
        toMonth,
        now,
      ],
    )
  }

  res.json({ cloned: rows.length })
})

export default router
