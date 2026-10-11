import { byDateDesc, currentMonth, monthOf, prevMonth, shiftMonth } from './calculations'
import { foldText } from './text'
import type { Category, ImportResult, Transaction, TransactionType } from './types'

export const PERIODS = [
  { value: 'todo', label: 'Todo' },
  { value: 'mes', label: 'Este mes' },
  { value: 'mes-anterior', label: 'Mes anterior' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: 'anio', label: 'Este año' },
] as const

export type Period = (typeof PERIODS)[number]['value']

export const isPeriod = (value: string | null | undefined): value is Period =>
  PERIODS.some((p) => p.value === value)

/** Movimientos que se muestran de una vez; "Mostrar más" suma otros tantos. */
export const PAGE_SIZE = 100

/** Tamaño máximo del CSV a importar. */
export const MAX_IMPORT_BYTES = 1_500_000

function inPeriod(t: Transaction, period: Period): boolean {
  const month = monthOf(t.date)
  const now = currentMonth()
  switch (period) {
    case 'mes': return month === now
    case 'mes-anterior': return month === prevMonth(now)
    case '3m': return month >= shiftMonth(now, -2) && month <= now
    case 'anio': return month.slice(0, 4) === now.slice(0, 4)
    default: return true
  }
}

export interface MovementFilters {
  query: string
  type: TransactionType | ''
  /** Id de categoría, 'none' (sin categoría) o '' (todas). */
  categoryId: string
  period: Period
}

/** Filtra por tipo, categoría, período y texto (sin distinguir tildes); más recientes primero. */
export function filterTransactions(
  transactions: Transaction[],
  categoryById: Map<string, Category>,
  { query, type, categoryId, period }: MovementFilters,
): Transaction[] {
  const q = foldText(query.trim())
  return transactions
    .filter((t) => (!type || t.type === type)
      && (!categoryId || (categoryId === 'none' ? !t.category_id : t.category_id === categoryId))
      && inPeriod(t, period)
      && (!q || foldText(t.description).includes(q)
        || foldText((t.category_id && categoryById.get(t.category_id)?.name) || '').includes(q)))
    .sort(byDateDesc)
}

export function groupByMonth(items: Transaction[]): { month: string; items: Transaction[] }[] {
  const groups: { month: string; items: Transaction[] }[] = []
  for (const t of items) {
    const month = monthOf(t.date)
    const last = groups[groups.length - 1]
    if (last?.month === month) last.items.push(t)
    else groups.push({ month, items: [t] })
  }
  return groups
}

/** Aviso al terminar de importar: "12 movimientos importados (3 ya existían, 1 categoría nueva)". */
export function importResultMessage({ imported, skipped, categoriesCreated }: ImportResult): string {
  const extras = [
    skipped > 0 ? `${skipped} ya existían` : '',
    categoriesCreated > 0 ? `${categoriesCreated} ${categoriesCreated === 1 ? 'categoría nueva' : 'categorías nuevas'}` : '',
  ].filter(Boolean).join(', ')
  return `${imported} ${imported === 1 ? 'movimiento importado' : 'movimientos importados'}${extras ? ` (${extras})` : ''}`
}
