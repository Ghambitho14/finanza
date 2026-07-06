import type { Transaction, TransactionType, MonthSummary } from '@/types/finance'

export const formatCLP = (n: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n)
}

export const formatMonthLabel = (month: string): string => {
  const [year, monthNum] = month.split('-')
  const date = new Date(Number(year), Number(monthNum) - 1, 1)
  return new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(date)
}

export const monthOptions = (count = 12): string[] => {
  const options: string[] = []
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  for (let i = 0; i < count; i++) {
    const d = new Date(currentYear, currentMonth - i, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    options.push(`${y}-${m}`)
  }

  return options
}

export const toMonthInput = (month: string): string => {
  return month // already YYYY-MM
}

export const firstDayOfMonth = (month: string): string => {
  return `${month}-01`
}

export const summaryForMonth = (
  transactions: Transaction[],
  month: string,
): MonthSummary => {
  const filtered = transactions.filter((t) => t.month === firstDayOfMonth(month))

  const sum = (type: TransactionType): number =>
    filtered.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0)

  const income = sum('income')
  const fixed = sum('fixed')
  const variable = sum('variable')
  const savings = sum('savings')

  return {
    income,
    fixed,
    variable,
    savings,
    balance: income - fixed - variable - savings,
  }
}

export const summarizeByCategory = (
  transactions: Transaction[],
  month: string,
): { name: string; amount: number; type: TransactionType }[] => {
  const filtered = transactions.filter((t) => t.month === firstDayOfMonth(month))
  const map = new Map<string, { name: string; amount: number; type: TransactionType }>()

  for (const t of filtered) {
    const key = t.category_id ?? t.description
    const existing = map.get(key)
    const categoryName = t.categories?.name ?? t.description

    if (existing) {
      existing.amount += t.amount
    } else {
      map.set(key, { name: categoryName, amount: t.amount, type: t.type })
    }
  }

  return Array.from(map.values()).sort((a, b) => b.amount - a.amount)
}

export const typeSign = (type: TransactionType): string => {
  switch (type) {
    case 'income':
      return '+'
    case 'savings':
      return '»'
    case 'fixed':
    case 'variable':
      return '−'
    default:
      return ''
  }
}

export const typeColorClass = (
  type: TransactionType,
): { text: string; bg: string; border: string; bar: string } => {
  switch (type) {
    case 'income':
      return {
        text: 'text-green',
        bg: 'bg-green-bg',
        border: 'border-l-green',
        bar: 'bg-green',
      }
    case 'fixed':
      return {
        text: 'text-red',
        bg: 'bg-red-bg',
        border: 'border-l-red',
        bar: 'bg-red',
      }
    case 'variable':
      return {
        text: 'text-red',
        bg: 'bg-red-bg',
        border: 'border-l-red',
        bar: 'bg-red',
      }
    case 'savings':
      return {
        text: 'text-amber',
        bg: 'bg-amber-bg',
        border: 'border-l-amber',
        bar: 'bg-amber',
      }
  }
}

export const nextMonth = (month: string): string => {
  const [year, m] = month.split('-').map(Number)
  const next = new Date(year, m, 1)
  const y = next.getFullYear()
  const mm = String(next.getMonth() + 1).padStart(2, '0')
  return `${y}-${mm}`
}
