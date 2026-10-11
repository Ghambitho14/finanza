import { PiggyBank, ReceiptText, ShoppingBag, TrendingUp, type LucideIcon } from 'lucide-react'
import type { TransactionType } from '@/types/finance'

interface TypeMeta {
  label: string
  plural: string
  hint: string
  /** Clase del indicador de color (punto o barra) que identifica el tipo. */
  dot: string
  /** Fondo suave y color del ícono del tipo (tarjetas, botones del formulario). */
  tint: string
  icon: LucideIcon
  isExpense: boolean
}

export const TYPE_ORDER: TransactionType[] = ['income', 'fixed', 'variable', 'savings']

export const TYPE_META: Record<TransactionType, TypeMeta> = {
  income: {
    label: 'Ingreso',
    plural: 'Ingresos',
    hint: 'Sueldo y cualquier otra entrada de dinero.',
    dot: 'bg-series-income',
    tint: 'bg-series-income/10 text-series-income',
    icon: TrendingUp,
    isExpense: false,
  },
  fixed: {
    label: 'Gasto fijo',
    plural: 'Gastos fijos',
    hint: 'Se repiten cada mes: arriendo, cuentas, suscripciones.',
    dot: 'bg-series-fixed',
    tint: 'bg-series-fixed/10 text-series-fixed',
    icon: ReceiptText,
    isExpense: true,
  },
  variable: {
    label: 'Gasto variable',
    plural: 'Gastos variables',
    hint: 'Compras del día a día: comida, antojos, transporte.',
    dot: 'bg-series-variable',
    tint: 'bg-series-variable/10 text-series-variable',
    icon: ShoppingBag,
    isExpense: true,
  },
  savings: {
    label: 'Ahorro',
    plural: 'Ahorro',
    hint: 'Lo que apartas para el futuro.',
    dot: 'bg-series-savings',
    tint: 'bg-series-savings/10 text-series-savings',
    icon: PiggyBank,
    isExpense: false,
  },
}

/**
 * Ingresos y ahorro se copian mes a mes. Los gastos fijos no: se repiten como
 * cuentas (categorías con monto mensual) que cada mes se marcan como pagadas.
 */
export const recurringByDefault = (type: TransactionType): boolean => type === 'income' || type === 'savings'
