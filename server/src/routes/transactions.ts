import { Router } from 'express'
import { z } from 'zod'
import { execute, query, type CategoryRow, type TransactionRow } from '../db.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errors.js'

const router = Router()

const transactionTypes = z.enum(['income', 'fixed', 'variable', 'savings'])

/** Accept YYYY-MM or YYYY-MM-01 and canonicalize to YYYY-MM. */
const monthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}(-\d{2})?$/)
  .transform((value) => value.slice(0, 7))

/** Límite de la columna DECIMAL(12, 2) en MySQL. */
const MAX_AMOUNT = 9_999_999_999

const transactionSchema = z.object({
  description: z.string().trim().min(1).max(500),
  amount: z.number().finite().positive().max(MAX_AMOUNT),
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

async function categoryExists(categoryId: string | null): Promise<boolean> {
  if (!categoryId) return true
  const rows = await query<{ id: string }>('SELECT id FROM categories WHERE id = ? LIMIT 1', [categoryId])
  return rows.length > 0
}

/** Clave para detectar si un recurrente ya existe en el mes destino. */
function recurringKey(t: Pick<TransactionRow, 'type' | 'category_id' | 'description'>): string {
  return `${t.type}|${t.category_id ?? ''}|${t.description.trim().toLowerCase()}`
}

router.get('/', requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
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
}))

router.post('/', requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
  const parsed = transactionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos' })
    return
  }

  const data = parsed.data
  if (!(await categoryExists(data.category_id))) {
    res.status(400).json({ error: 'Categoría no encontrada' })
    return
  }

  const id = crypto.randomUUID()
  const now = new Date()

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
}))

router.put('/:id', requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
  const parsed = transactionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos' })
    return
  }

  const id = req.params.id
  const ownerId = req.auth!.userId
  const existing = await query<{ id: string }>(
    'SELECT id FROM transactions WHERE id = ? AND owner_id = ? LIMIT 1',
    [id, ownerId],
  )
  if (existing.length === 0) {
    res.status(404).json({ error: 'Transacción no encontrada' })
    return
  }

  const data = parsed.data
  if (!(await categoryExists(data.category_id))) {
    res.status(400).json({ error: 'Categoría no encontrada' })
    return
  }

  await execute(
    `UPDATE transactions
     SET category_id = ?, description = ?, amount = ?, type = ?, month = ?, recurring = ?
     WHERE id = ? AND owner_id = ?`,
    [
      data.category_id,
      data.description,
      data.amount,
      data.type,
      data.month,
      data.recurring ? 1 : 0,
      id,
      ownerId,
    ],
  )

  res.json({ id })
}))

router.delete('/:id', requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
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
}))

router.post('/clone-recurring', requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
  const parsed = cloneSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos' })
    return
  }

  const { fromMonth, toMonth } = parsed.data
  if (fromMonth === toMonth) {
    res.status(400).json({ error: 'El mes de origen y destino deben ser distintos' })
    return
  }

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
    res.json({ cloned: 0, skipped: 0 })
    return
  }

  // Evita duplicar si ya se clonó (o se agregó a mano) en el mes destino
  const existing = await query<Pick<TransactionRow, 'type' | 'category_id' | 'description'>>(
    `SELECT type, category_id, description
     FROM transactions
     WHERE owner_id = ? AND (month = ? OR month = ?)`,
    [ownerId, toMonth, `${toMonth}-01`],
  )
  const seen = new Set(existing.map(recurringKey))

  const now = new Date()
  let cloned = 0
  for (const t of rows) {
    const key = recurringKey(t)
    if (seen.has(key)) continue
    seen.add(key)

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
    cloned++
  }

  res.json({ cloned, skipped: rows.length - cloned })
}))

export default router
