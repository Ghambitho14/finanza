import { percentChange } from './calculations'
import { TYPE_INFO } from './transaction-types'
import type { MonthSummary, TransactionType } from './types'

export type SegmentKey = 'fixed' | 'pending' | 'variable' | 'savings'

export interface OverviewSegment {
  key: SegmentKey
  value: number
  label: string
}

/** Números del panorama del mes: barra de reparto del ingreso y alertas. */
export function monthOverview(summary: MonthSummary, pendingFixed: number) {
  const { income, available } = summary
  const afterBills = available - pendingFixed
  const outflow = summary.fixed + pendingFixed + summary.variable + summary.savings
  const scale = Math.max(income, outflow, 1)
  const overspent = income > 0 && available < 0
  const billsAtRisk = income > 0 && !overspent && afterBills < 0

  const segments = ([
    { key: 'fixed', value: summary.fixed, label: 'Fijos pagados' },
    { key: 'pending', value: pendingFixed, label: 'Fijos por pagar' },
    { key: 'variable', value: summary.variable, label: 'Variables' },
    { key: 'savings', value: summary.savings, label: 'Ahorro' },
  ] as OverviewSegment[]).filter((s) => s.value > 0)
  const showFree = afterBills > 0 || segments.length === 0

  return { afterBills, scale, overspent, billsAtRisk, segments, showFree }
}

export const OVERVIEW_TILES: TransactionType[] = ['income', 'fixed', 'variable', 'savings']

/** Variación frente al mes anterior y parte del ingreso de una cifra del mes. */
export function tileStats(type: TransactionType, summary: MonthSummary, previous: MonthSummary) {
  const value = summary[type]
  // Sin registros aún en el mes, "−100%" solo confunde
  const change = value > 0 ? percentChange(value, previous[type]) : null
  // En gastos, subir es malo; en ingresos y ahorro, subir es bueno
  const upIsGood = !TYPE_INFO[type].isExpense
  const good = change !== null && (change >= 0) === upIsGood
  const share = type !== 'income' && summary.income > 0 ? value / summary.income : null
  return { value, change, good, share }
}
