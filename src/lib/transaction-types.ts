import type { TransactionType } from '@/types/finance'

interface TypeMeta {
  label: string
  plural: string
  hint: string
  /** Clase del indicador de color (punto o barra) que identifica el tipo. */
  dot: string
  isExpense: boolean
}

export const TYPE_ORDER: TransactionType[] = ['income', 'fixed', 'variable', 'savings']

export const TYPE_META: Record<TransactionType, TypeMeta> = {
  income: {
    label: 'Ingreso',
    plural: 'Ingresos',
    hint: 'Sueldo y cualquier otra entrada de dinero.',
    dot: 'bg-series-income',
    isExpense: false,
  },
  fixed: {
    label: 'Gasto fijo',
    plural: 'Gastos fijos',
    hint: 'Se repiten cada mes: arriendo, cuentas, suscripciones.',
    dot: 'bg-series-fixed',
    isExpense: true,
  },
  variable: {
    label: 'Gasto variable',
    plural: 'Gastos variables',
    hint: 'Compras del día a día: comida, antojos, transporte.',
    dot: 'bg-series-variable',
    isExpense: true,
  },
  savings: {
    label: 'Ahorro',
    plural: 'Ahorro',
    hint: 'Lo que apartas para el futuro.',
    dot: 'bg-series-savings',
    isExpense: false,
  },
}

/**
 * Ingresos y ahorro se copian mes a mes. Los gastos fijos no: se repiten como
 * cuentas (categorías con monto mensual) que cada mes se marcan como pagadas.
 */
export const recurringByDefault = (type: TransactionType): boolean => type === 'income' || type === 'savings'
