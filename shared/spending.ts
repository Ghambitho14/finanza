import type { CategorySpending } from './calculations'

/** Desde aquí el presupuesto se marca "por agotarse". */
export const WARNING_RATIO = 0.8

/** Colores de la dona: chart 1..5 en orden; desde la sexta categoría, "Otras". */
export type DonutSlot = 1 | 2 | 3 | 4 | 5 | 'other'
const SLOT_COUNT = 5

export interface SpendingSegment {
  key: string
  label: string
  value: number
  slot: DonutSlot
}

export interface SpendingRow {
  key: string
  /** Segmento de la dona al que corresponde (las chicas van a "otras"). */
  segmentKey: string
  name: string
  spent: number
  budget: number | null
  slot: DonutSlot
  /** Gastado / presupuesto (null sin presupuesto). */
  ratio: number | null
  over: boolean
  near: boolean
}

/** Dona y leyenda de gastos variables por categoría (las filas vienen de mayor a menor). */
export function spendingBreakdown(rows: CategorySpending[]) {
  const keyOf = (row: CategorySpending) => row.category?.id ?? `none-${row.type}`
  const spending = rows.filter((r) => r.spent > 0)
  const total = spending.reduce((s, r) => s + r.spent, 0)
  const otherTotal = spending.slice(SLOT_COUNT).reduce((s, r) => s + r.spent, 0)

  const segments: SpendingSegment[] = [
    ...spending.slice(0, SLOT_COUNT).map((r, i) => ({
      key: keyOf(r),
      label: r.category?.name ?? 'Sin categoría',
      value: r.spent,
      slot: (i + 1) as DonutSlot,
    })),
    ...(otherTotal > 0 ? [{ key: 'otras', label: 'Otras categorías', value: otherTotal, slot: 'other' as const }] : []),
  ]

  const legend: SpendingRow[] = rows.map((row, index) => {
    const slot: DonutSlot = row.spent > 0 && index < SLOT_COUNT ? ((index + 1) as DonutSlot) : 'other'
    const ratio = row.budget ? row.spent / row.budget : null
    const over = row.budget !== null && row.spent > row.budget
    return {
      key: keyOf(row),
      segmentKey: slot === 'other' ? 'otras' : keyOf(row),
      name: row.category?.name ?? 'Sin categoría',
      spent: row.spent,
      budget: row.budget,
      slot,
      ratio,
      over,
      near: ratio !== null && !over && ratio >= WARNING_RATIO,
    }
  })

  return { total, segments, legend }
}
