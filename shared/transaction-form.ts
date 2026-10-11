import { parseAmountInput, parseISODate, toISODate } from './format'
import type { Transaction, TransactionInput, TransactionType } from './types'

export const toInput = (t: Transaction): TransactionInput => ({
  description: t.description,
  amount: t.amount,
  type: t.type,
  date: t.date,
  category_id: t.category_id,
  recurring: t.recurring,
})

export const DESCRIPTION_EXAMPLES: Record<TransactionType, string> = {
  income: 'Ej: sueldo',
  fixed: 'Ej: arriendo',
  variable: 'Ej: almuerzo, supermercado',
  savings: 'Ej: fondo de emergencia',
}

/** Fecha ISO desplazada en días (en hora local). */
export function shiftDays(date: string, days: number): string {
  const d = parseISODate(date)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

interface FormFields {
  type: TransactionType
  description: string
  /** Monto tal como está escrito ("12.500"). */
  amount: string
  date: string
  categoryId: string
  recurring: boolean
}

/** Valida el formulario de movimiento y arma lo que se guarda. */
export function validateTransaction(fields: FormFields): { input: TransactionInput } | { error: string } {
  const amount = parseAmountInput(fields.amount)
  if (!fields.description.trim()) return { error: 'Escribe una descripción' }
  if (Number.isNaN(amount) || amount <= 0) return { error: 'El monto debe ser mayor a 0' }
  if (!fields.date) return { error: 'Elige una fecha' }
  return {
    input: {
      description: fields.description.trim(),
      amount,
      type: fields.type,
      date: fields.date,
      category_id: fields.categoryId || null,
      recurring: fields.recurring,
    },
  }
}
