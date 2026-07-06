import Dexie, { type EntityTable } from 'dexie'
import type { TransactionType } from '@/types/finance'

export interface CategoryRow {
  id: string
  name: string
  type: TransactionType
  created_at: string
}

export interface TransactionRow {
  id: string
  owner_id: string | null
  category_id: string | null
  description: string
  amount: number
  type: TransactionType
  month: string
  recurring: boolean
  created_at: string
}

export interface UserRow {
  id: string
  email: string
  name: string
  passwordHash: string
  created_at: string
}

const SEED_CATEGORIES: Omit<CategoryRow, 'id'>[] = [
  { name: 'sueldo', type: 'income', created_at: new Date().toISOString() },
  { name: 'arriendo', type: 'fixed', created_at: new Date().toISOString() },
  { name: 'gastos comunes', type: 'fixed', created_at: new Date().toISOString() },
  { name: 'internet', type: 'fixed', created_at: new Date().toISOString() },
  { name: 'teléfono', type: 'fixed', created_at: new Date().toISOString() },
  { name: 'streaming', type: 'variable', created_at: new Date().toISOString() },
  { name: 'transporte', type: 'variable', created_at: new Date().toISOString() },
  { name: 'ocio', type: 'variable', created_at: new Date().toISOString() },
  { name: 'ahorro de emergencia', type: 'savings', created_at: new Date().toISOString() },
  { name: 'inversiones', type: 'savings', created_at: new Date().toISOString() },
]

class FinanzasDB extends Dexie {
  categories!: EntityTable<CategoryRow, 'id'>
  transactions!: EntityTable<TransactionRow, 'id'>
  users!: EntityTable<UserRow, 'id'>

  constructor() {
    super('finanzas')
    this.version(1).stores({
      categories: 'id, name, type',
      transactions: 'id, month, category_id, type, created_at',
    })
    this.version(2).stores({
      categories: 'id, name, type',
      transactions: 'id, month, category_id, type, created_at, owner_id',
      users: 'id, &email, name',
    })
  }
}

export const db = new FinanzasDB()

export async function seedCategoriesIfEmpty(): Promise<CategoryRow[]> {
  const count = await db.categories.count()
  if (count > 0) {
    return db.categories.toArray()
  }

  const now = new Date().toISOString()
  const categories: CategoryRow[] = SEED_CATEGORIES.map((c) => ({
    ...c,
    id: crypto.randomUUID(),
    created_at: now,
  }))

  await db.categories.bulkAdd(categories)
  return categories
}
