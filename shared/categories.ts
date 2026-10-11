import { parseAmountInput } from './format'
import type { TransactionType } from './types'

/**
 * El monto de una categoría significa cosas distintas según el tipo: en fijos
 * es la cuenta mensual (aparece por pagar en el Resumen); en variables, el tope.
 */
export const AMOUNT_COPY: Partial<Record<TransactionType, { field: string; empty: string; hint: string }>> = {
  fixed: {
    field: 'Monto mensual',
    empty: 'Sin monto',
    hint: 'Con monto mensual, cada mes aparecen en el Resumen como cuentas para marcar pagadas.',
  },
  variable: {
    field: 'Presupuesto',
    empty: 'Sin presupuesto',
    hint: 'El presupuesto es lo máximo que quieres gastar al mes en cada una.',
  },
}

/** Monto opcional: vacío es "sin monto"; texto no numérico es un error. */
export function parseBudget(value: string): number | null | 'invalid' {
  if (!value.trim()) return null
  const n = parseAmountInput(value)
  return Number.isNaN(n) || n <= 0 ? 'invalid' : n
}

/** Texto de confirmación al borrar una categoría con `usage` movimientos. */
export const deleteCategoryDescription = (usage: number): string =>
  usage > 0
    ? `Sus ${usage} ${usage === 1 ? 'movimiento se conserva' : 'movimientos se conservan'}, pero quedará${usage === 1 ? '' : 'n'} sin categoría.`
    : 'Esta categoría no tiene movimientos.'
