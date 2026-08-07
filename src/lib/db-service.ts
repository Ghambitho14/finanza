import { apiFetch, clearToken, setToken } from './api'
import type { Category, Transaction, AppUser } from '@/types/finance'

export async function getCategories(): Promise<Category[]> {
  const data = await apiFetch<{ categories: Category[] }>('/categories')
  return data.categories
}

export async function getTransactions(_ownerId?: string): Promise<Transaction[]> {
  const data = await apiFetch<{ transactions: Transaction[] }>('/transactions')
  return data.transactions
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
  await apiFetch('/transactions', {
    method: 'POST',
    body: JSON.stringify({
      description: data.description,
      amount: data.amount,
      type: data.type,
      month: data.month,
      category_id: data.category_id,
      recurring: data.recurring,
    }),
  })
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiFetch(`/transactions/${id}`, { method: 'DELETE' })
}

export async function cloneRecurringTransactions(
  fromMonth: string,
  toMonth: string,
  _ownerId?: string,
): Promise<void> {
  await apiFetch('/transactions/clone-recurring', {
    method: 'POST',
    body: JSON.stringify({ fromMonth, toMonth }),
  })
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<{ token: string; user: AppUser }> {
  const data = await apiFetch<{ token: string; user: AppUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setToken(data.token)
  return data
}

export async function registerRequest(
  name: string,
  email: string,
  password: string,
): Promise<{ token: string; user: AppUser }> {
  const data = await apiFetch<{ token: string; user: AppUser }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
  setToken(data.token)
  return data
}

export async function meRequest(): Promise<AppUser> {
  const data = await apiFetch<{ user: AppUser }>('/auth/me')
  return data.user
}

export function logoutRequest(): void {
  clearToken()
}
