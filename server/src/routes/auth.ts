import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { execute, query, type UserRow } from '../db.js'
import { requireAuth, signToken, type AuthedRequest } from '../middleware/auth.js'

const router = Router()

const registerSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(255),
  password: z.string().min(4).max(128),
})

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128),
})

function publicUser(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    created_at: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at),
  }
}

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos' })
    return
  }

  const { name, email, password } = parsed.data
  const normalizedEmail = email.toLowerCase()

  const existing = await query<{ id: string }>(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [normalizedEmail],
  )
  if (existing.length > 0) {
    res.status(409).json({ error: 'El email ya está registrado' })
    return
  }

  const id = crypto.randomUUID()
  const passwordHash = await bcrypt.hash(password, 10)
  const now = new Date().toISOString()

  await execute(
    'INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, normalizedEmail, name, passwordHash, now],
  )

  const user = { id, email: normalizedEmail, name, created_at: now }
  const token = signToken({ userId: id, email: normalizedEmail })
  res.status(201).json({ token, user })
})

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos' })
    return
  }

  const { email, password } = parsed.data
  const normalizedEmail = email.toLowerCase()

  const rows = await query<UserRow>(
    'SELECT id, email, name, password_hash, created_at FROM users WHERE email = ? LIMIT 1',
    [normalizedEmail],
  )
  const found = rows[0]
  if (!found) {
    res.status(401).json({ error: 'Usuario no encontrado' })
    return
  }

  const ok = await bcrypt.compare(password, found.password_hash)
  if (!ok) {
    res.status(401).json({ error: 'Contraseña incorrecta' })
    return
  }

  const token = signToken({ userId: found.id, email: found.email })
  res.json({ token, user: publicUser(found) })
})

router.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const rows = await query<UserRow>(
    'SELECT id, email, name, password_hash, created_at FROM users WHERE id = ? LIMIT 1',
    [req.auth!.userId],
  )
  const found = rows[0]
  if (!found) {
    res.status(401).json({ error: 'Usuario no encontrado' })
    return
  }
  res.json({ user: publicUser(found) })
})

export default router
