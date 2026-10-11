import type { TransactionType } from './types'

export interface TypeInfo {
  label: string
  plural: string
  hint: string
  isExpense: boolean
}

export const TYPE_ORDER: TransactionType[] = ['income', 'fixed', 'variable', 'savings']

/** Textos y reglas de cada tipo; los íconos y colores los pone cada app. */
export const TYPE_INFO: Record<TransactionType, TypeInfo> = {
  income: {
    label: 'Ingreso',
    plural: 'Ingresos',
    hint: 'Sueldo y cualquier otra entrada de dinero.',
    isExpense: false,
  },
  fixed: {
    label: 'Gasto fijo',
    plural: 'Gastos fijos',
    hint: 'Se repiten cada mes: arriendo, cuentas, suscripciones.',
    isExpense: true,
  },
  variable: {
    label: 'Gasto variable',
    plural: 'Gastos variables',
    hint: 'Compras del día a día: comida, antojos, transporte.',
    isExpense: true,
  },
  savings: {
    label: 'Ahorro',
    plural: 'Ahorro',
    hint: 'Lo que apartas para el futuro.',
    isExpense: false,
  },
}

/**
 * Ingresos y ahorro se copian mes a mes. Los gastos fijos no: se repiten como
 * cuentas (categorías con monto mensual) que cada mes se marcan como pagadas.
 */
export const recurringByDefault = (type: TransactionType): boolean => type === 'income' || type === 'savings'
