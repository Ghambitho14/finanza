import { todayISO } from '@/lib/format'
import type { Category, MonthSummary, Transaction, TransactionType } from '@/types/finance'

/** Compras variables hasta este monto cuentan como "gastos hormiga". */
export const SMALL_EXPENSE_LIMIT = 5000

export const monthOf = (date: string): string => date.slice(0, 7)

export const currentMonth = (): string => monthOf(todayISO())

export const isMonthKey = (value: string | null): value is string =>
  !!value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)

export const shiftMonth = (month: string, delta: number): string => {
  const [year, m] = month.split('-').map(Number)
  const d = new Date(year, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const prevMonth = (month: string): string => shiftMonth(month, -1)
export const nextMonth = (month: string): string => shiftMonth(month, 1)

export const daysInMonth = (month: string): number => {
  const [year, m] = month.split('-').map(Number)
  return new Date(year, m, 0).getDate()
}

/** `count` meses terminando en `lastMonth`, del más antiguo al más reciente. */
export const monthRange = (lastMonth: string, count: number): string[] =>
  Array.from({ length: count }, (_, i) => shiftMonth(lastMonth, i - count + 1))

/** Fecha sugerida para un movimiento nuevo: hoy si es el mes actual, o el día 1. */
export const defaultDateForMonth = (month: string): string => {
  const today = todayISO()
  return monthOf(today) === month ? today : `${month}-01`
}

export const inMonth = (transactions: Transaction[], month: string): Transaction[] =>
  transactions.filter((t) => monthOf(t.date) === month)

export const summarize = (transactions: Transaction[]): MonthSummary => {
  const totals: Record<TransactionType, number> = { income: 0, fixed: 0, variable: 0, savings: 0 }
  for (const t of transactions) totals[t.type] += t.amount

  const expenses = totals.fixed + totals.variable
  return {
    ...totals,
    expenses,
    available: totals.income - expenses - totals.savings,
    savingsRate: totals.income > 0 ? totals.savings / totals.income : null,
  }
}

export const summaryForMonth = (transactions: Transaction[], month: string): MonthSummary =>
  summarize(inMonth(transactions, month))

/** Variación relativa; null si no hay base para comparar. */
export const percentChange = (current: number, previous: number): number | null =>
  previous > 0 ? (current - previous) / previous : null

/** Orden estable para listas: por fecha y luego por creación, más reciente primero. */
export const byDateDesc = (a: Transaction, b: Transaction): number =>
  b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)

export const byDateAsc = (a: Transaction, b: Transaction): number =>
  a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at)

/** Agrupa por día (ya ordenados) conservando el orden. */
export const groupByDate = (transactions: Transaction[]): { date: string; items: Transaction[]; total: number }[] => {
  const groups: { date: string; items: Transaction[]; total: number }[] = []
  for (const t of transactions) {
    const last = groups[groups.length - 1]
    if (last?.date === t.date) {
      last.items.push(t)
      last.total += t.amount
    } else {
      groups.push({ date: t.date, items: [t], total: t.amount })
    }
  }
  return groups
}

export interface CategorySpending {
  category: Category | null
  type: TransactionType
  spent: number
  budget: number | null
}

/**
 * Gasto variable del mes por categoría, incluidas las categorías con
 * presupuesto aunque aún no tengan gasto. Los fijos van en su propia lista.
 */
export const spendingByCategory = (
  monthTransactions: Transaction[],
  categories: Category[],
): CategorySpending[] => {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const rows = new Map<string, CategorySpending>()

  for (const c of categories) {
    if (c.budget && c.type === 'variable') {
      rows.set(c.id, { category: c, type: c.type, spent: 0, budget: c.budget })
    }
  }

  for (const t of monthTransactions) {
    if (t.type !== 'variable') continue
    const category = t.category_id ? byId.get(t.category_id) ?? null : null
    const key = category?.id ?? `none-${t.type}`
    const row = rows.get(key) ?? { category, type: t.type, spent: 0, budget: category?.budget ?? null }
    row.spent += t.amount
    rows.set(key, row)
  }

  return Array.from(rows.values()).sort((a, b) => b.spent - a.spent)
}

/** Una cuenta fija es una categoría de gasto fijo con monto mensual. */
export const isFixedBill = (category: Category | undefined | null): category is Category & { budget: number } =>
  !!category && category.type === 'fixed' && category.budget !== null

export interface FixedBill {
  category: Category & { budget: number }
  payments: Transaction[]
  /** Lo pagado en el mes (puede diferir del monto mensual, p. ej. la luz). */
  paid: number
  isPaid: boolean
}

/**
 * Cuentas fijas del mes: pagada si tiene algún gasto fijo de su categoría.
 * Devuelve también los gastos fijos que no corresponden a ninguna cuenta.
 */
export const fixedBillsForMonth = (
  monthTransactions: Transaction[],
  categories: Category[],
): { bills: FixedBill[]; others: Transaction[]; pending: number } => {
  const bills = new Map<string, FixedBill>()
  for (const c of categories) {
    if (isFixedBill(c)) bills.set(c.id, { category: c, payments: [], paid: 0, isPaid: false })
  }

  const others: Transaction[] = []
  for (const t of monthTransactions) {
    if (t.type !== 'fixed') continue
    const bill = t.category_id ? bills.get(t.category_id) : undefined
    if (bill) {
      bill.payments.push(t)
      bill.paid += t.amount
      bill.isPaid = true
    } else {
      others.push(t)
    }
  }

  const list = Array.from(bills.values())
  const pending = list.filter((b) => !b.isPaid).reduce((s, b) => s + b.category.budget, 0)
  return { bills: list, others, pending }
}

export const smallExpenses = (monthTransactions: Transaction[]): { count: number; total: number } => {
  const small = monthTransactions.filter((t) => t.type === 'variable' && t.amount <= SMALL_EXPENSE_LIMIT)
  return { count: small.length, total: small.reduce((s, t) => s + t.amount, 0) }
}

/** Identifica un recurrente entre meses, para no duplicarlo al copiarlo. */
const recurringKey = (t: Transaction): string =>
  `${t.type}|${t.category_id ?? ''}|${t.description.trim().toLowerCase()}`

/** Identifica un movimiento importado, para no duplicarlo al importar dos veces. */
export const importKey = (t: Pick<Transaction, 'date' | 'type' | 'amount' | 'description'>): string =>
  `${t.date}|${t.type}|${t.amount}|${t.description.trim().toLowerCase()}`

/**
 * Mismo día del mes en el mes destino. Si era el último día del mes, sigue
 * siendo el último (31 ago → 30 sep → 31 oct) en vez de quedarse en 30.
 */
export const sameDayIn = (month: string, date: string): string => {
  const day = Number(date.slice(8, 10))
  const lastDay = daysInMonth(month)
  const target = day >= daysInMonth(monthOf(date)) ? lastDay : Math.min(day, lastDay)
  return `${month}-${String(target).padStart(2, '0')}`
}

/**
 * Recurrentes del mes anterior que todavía no están en `month`. Los pagos de
 * cuentas fijas no se copian: cada mes se marcan como pagados a mano.
 */
export const missingRecurring = (
  transactions: Transaction[],
  month: string,
  categoryById: Map<string, Category>,
): Transaction[] => {
  const seen = new Set(inMonth(transactions, month).map(recurringKey))
  return inMonth(transactions, prevMonth(month)).filter((t) => {
    if (!t.recurring || (t.type === 'fixed' && t.category_id && isFixedBill(categoryById.get(t.category_id)))) {
      return false
    }
    const key = recurringKey(t)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
