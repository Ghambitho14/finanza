import { currentMonth, monthRange, summaryForMonth } from './calculations'
import { formatMonthShort } from './format'
import type { MonthSummary, Transaction, TransactionType } from './types'

export const HISTORY_RANGES = [6, 12, 24] as const
export type HistoryRange = (typeof HISTORY_RANGES)[number]

/** Lo que se apila en cada barra (de abajo hacia arriba). */
export const STACK: TransactionType[] = ['fixed', 'variable', 'savings']
export const SERIES: TransactionType[] = ['income', 'fixed', 'variable', 'savings']

export type HistoryRow = MonthSummary & { month: string; label: string }

const hasData = (r: MonthSummary) => r.income > 0 || r.expenses > 0 || r.savings > 0

/** Los últimos `range` meses, desde el primero que tiene registros. */
export function buildHistoryRows(transactions: Transaction[], range: HistoryRange): HistoryRow[] {
  const all = monthRange(currentMonth(), range).map((month) => ({
    month,
    label: formatMonthShort(month),
    ...summaryForMonth(transactions, month),
  }))
  // Los meses anteriores al primer registro no son "cero ingresos": se omiten
  const first = all.findIndex(hasData)
  return first < 0 ? [] : all.slice(first)
}

/** Promedios solo sobre meses con datos, para que los meses vacíos no los diluyan. */
export function historyStats(rows: HistoryRow[]) {
  const active = rows.filter(hasData)
  const avg = (pick: (r: HistoryRow) => number) =>
    active.length ? active.reduce((s, r) => s + pick(r), 0) / active.length : 0
  const totalIncome = active.reduce((s, r) => s + r.income, 0)
  const totalSavings = active.reduce((s, r) => s + r.savings, 0)
  return {
    avgExpenses: Math.round(avg((r) => r.expenses)),
    avgSavings: Math.round(avg((r) => r.savings)),
    savingsRate: totalIncome > 0 ? totalSavings / totalIncome : null,
    best: active.length ? active.reduce((a, b) => (b.available > a.available ? b : a)) : null,
  }
}

/** Segmento de más arriba (con valor) de la pila: el único con esquinas redondeadas. */
export const topOfStack = (row: MonthSummary): TransactionType | undefined =>
  [...STACK].reverse().find((k) => row[k] > 0)

/** Marcas "redondas" del eje Y (0, 250 mil, 500 mil…) que cubren `max`. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0]
  const rough = max / count
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? 10 * magnitude
  const ticks: number[] = []
  for (let v = 0; v < max + step; v += step) ticks.push(v)
  return ticks
}
