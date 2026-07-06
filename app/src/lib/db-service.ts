import { db, seedCategoriesIfEmpty } from './db'
import type { CategoryRow, TransactionRow, UserRow } from './db'
import type { Category, Transaction, AppUser } from '@/types/finance'

export async function getCategories(): Promise<Category[]> {
  return seedCategoriesIfEmpty()
}

export async function getTransactions(ownerId?: string): Promise<Transaction[]> {
  const [transactions, categories] = await Promise.all([
    ownerId
      ? db.transactions.where('owner_id').equals(ownerId).reverse().sortBy('created_at')
      : db.transactions.orderBy('created_at').reverse().toArray(),
    seedCategoriesIfEmpty(),
  ])
  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  return transactions.map((t) => ({
    ...t,
    categories: t.category_id ? (categoryMap.get(t.category_id) ?? null) : null,
  }))
}

export async function addTransaction(data: {
  description: string
  amount: number
  type: string
  month: string
  category_id: string | null
  recurring: boolean
  owner_id: string | null
}): Promise<void> {
  const now = new Date().toISOString()
  await db.transactions.add({
    id: crypto.randomUUID(),
    owner_id: data.owner_id,
    category_id: data.category_id,
    description: data.description,
    amount: data.amount,
    type: data.type as TransactionRow['type'],
    month: data.month,
    recurring: data.recurring,
    created_at: now,
  })
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions.delete(id)
}

export async function cloneRecurringTransactions(
  fromMonth: string,
  toMonth: string,
  ownerId?: string,
): Promise<void> {
  const query = ownerId
    ? db.transactions
        .where({ month: fromMonth, recurring: true, owner_id: ownerId })
        .toArray()
    : db.transactions
        .where({ month: fromMonth, recurring: true })
        .toArray()

  const previousRecurring = await query
  if (previousRecurring.length === 0) return

  const now = new Date().toISOString()
  const inserts = previousRecurring.map((t) => ({
    id: crypto.randomUUID(),
    owner_id: ownerId ?? null,
    category_id: t.category_id,
    description: t.description,
    amount: t.amount,
    type: t.type,
    month: toMonth,
    recurring: true,
    created_at: now,
  }))

  await db.transactions.bulkAdd(inserts)
}

export async function createUser(
  name: string,
  email: string,
  passwordHash: string,
): Promise<AppUser> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await db.users.add({ id, email, name, passwordHash, created_at: now })
  return { id, email, name, passwordHash, created_at: now }
}

export async function findUserByEmail(email: string): Promise<AppUser | null> {
  const user = await db.users.where('email').equals(email).first()
  if (!user) return null
  return { id: user.id, email: user.email, name: user.name, passwordHash: user.passwordHash, created_at: user.created_at }
}

export async function getUserById(id: string): Promise<AppUser | null> {
  const user = await db.users.get(id)
  if (!user) return null
  return { id: user.id, email: user.email, name: user.name, passwordHash: user.passwordHash, created_at: user.created_at }
}
