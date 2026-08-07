import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import mysql from 'mysql2/promise'
import type { ResultSetHeader } from 'mysql2'

export type DbClient = 'sqlite' | 'mysql'

export type TransactionType = 'income' | 'fixed' | 'variable' | 'savings'

export interface UserRow {
  id: string
  email: string
  name: string
  password_hash: string
  created_at: Date | string
}

export interface CategoryRow {
  id: string
  name: string
  type: TransactionType
  created_at: Date | string
}

export interface TransactionRow {
  id: string
  owner_id: string
  category_id: string | null
  description: string
  amount: string | number
  type: TransactionType
  month: string
  recurring: number | boolean
  created_at: Date | string
}

export interface ExecuteResult {
  affectedRows: number
}

type SqlParam = string | number | bigint | null

const DB_CLIENT = (process.env.DB_CLIENT || 'sqlite').toLowerCase() as DbClient
const isSqlite = DB_CLIENT !== 'mysql'

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(serverRoot, '..')

function resolveSqlitePath(): string {
  const raw = process.env.SQLITE_PATH || 'server/data/finanzas.sqlite'
  if (path.isAbsolute(raw)) return raw
  return path.resolve(repoRoot, raw)
}

const SEED_CATEGORIES: { name: string; type: TransactionType }[] = [
  { name: 'sueldo', type: 'income' },
  { name: 'arriendo', type: 'fixed' },
  { name: 'gastos comunes', type: 'fixed' },
  { name: 'internet', type: 'fixed' },
  { name: 'teléfono', type: 'fixed' },
  { name: 'streaming', type: 'variable' },
  { name: 'transporte', type: 'variable' },
  { name: 'ocio', type: 'variable' },
  { name: 'ahorro de emergencia', type: 'savings' },
  { name: 'inversiones', type: 'savings' },
]

let sqliteDb: DatabaseSync | null = null
let mysqlPool: mysql.Pool | null = null

function normalizeParams(params: unknown[] = []): SqlParam[] {
  return params.map((p): SqlParam => {
    if (p instanceof Date) return p.toISOString()
    if (typeof p === 'boolean') return p ? 1 : 0
    if (p === undefined) return null
    if (p === null) return null
    if (typeof p === 'string' || typeof p === 'number' || typeof p === 'bigint') return p
    return String(p)
  })
}

function getSqlite(): DatabaseSync {
  if (!sqliteDb) {
    throw new Error('[db] SQLite no inicializado')
  }
  return sqliteDb
}

function getMysql(): mysql.Pool {
  if (!mysqlPool) {
    throw new Error('[db] MySQL no inicializado')
  }
  return mysqlPool
}

export function getDbClient(): DbClient {
  return isSqlite ? 'sqlite' : 'mysql'
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (isSqlite) {
    return getSqlite().prepare(sql).all(...normalizeParams(params)) as T[]
  }
  const [rows] = await getMysql().execute(sql, normalizeParams(params))
  return rows as T[]
}

export async function execute(sql: string, params: unknown[] = []): Promise<ExecuteResult> {
  if (isSqlite) {
    const info = getSqlite().prepare(sql).run(...normalizeParams(params))
    return { affectedRows: Number(info.changes ?? 0) }
  }
  const [result] = await getMysql().execute(sql, normalizeParams(params))
  const header = result as ResultSetHeader
  return { affectedRows: header.affectedRows ?? 0 }
}

export async function waitForDb(maxAttempts = 30): Promise<void> {
  if (isSqlite) {
    const sqlitePath = resolveSqlitePath()
    fs.mkdirSync(path.dirname(sqlitePath), { recursive: true })
    sqliteDb = new DatabaseSync(sqlitePath)
    sqliteDb.exec('PRAGMA journal_mode = WAL')
    sqliteDb.exec('PRAGMA foreign_keys = ON')
    console.log(`[db] sqlite: ${sqlitePath}`)
    return
  }

  const {
    MYSQL_HOST = '127.0.0.1',
    MYSQL_PORT = '3306',
    MYSQL_USER = 'finanzas',
    MYSQL_PASSWORD = 'finanzas',
    MYSQL_DATABASE = 'finanzas',
  } = process.env

  mysqlPool = mysql.createPool({
    host: MYSQL_HOST,
    port: Number(MYSQL_PORT),
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
    timezone: 'Z',
  })

  let lastError: unknown
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const conn = await mysqlPool.getConnection()
      await conn.ping()
      conn.release()
      console.log('[db] mysql: connected')
      return
    } catch (err) {
      lastError = err
      console.log(`[db] intento ${i}/${maxAttempts} falló, reintentando…`)
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
  throw lastError
}

export async function migrateAndSeed(): Promise<void> {
  if (isSqlite) {
    const schemaPath = path.join(serverRoot, 'sql', 'schema.sqlite.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    getSqlite().exec(schema)
    console.log('[db] sqlite schema applied')
  }

  await seedCategoriesIfEmpty()
}

export async function seedCategoriesIfEmpty(): Promise<void> {
  const rows = await query<{ count: number | string }>('SELECT COUNT(*) AS count FROM categories')
  const count = Number(rows[0]?.count ?? 0)
  if (count > 0) return

  const now = new Date().toISOString()
  for (const cat of SEED_CATEGORIES) {
    const id = crypto.randomUUID()
    await execute(
      'INSERT INTO categories (id, name, type, created_at) VALUES (?, ?, ?, ?)',
      [id, cat.name, cat.type, now],
    )
  }
  console.log(`[db] seed: ${SEED_CATEGORIES.length} categorías`)
}
