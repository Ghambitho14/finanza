import { PiggyBank, ReceiptText, ShoppingBag, TrendingUp, type LucideIcon } from 'lucide-react'
import { TYPE_INFO, type TypeInfo } from '@shared/transaction-types'
import type { TransactionType } from '@/types/finance'

export { TYPE_ORDER, recurringByDefault } from '@shared/transaction-types'

interface TypeMeta extends TypeInfo {
  /** Clase del indicador de color (punto o barra) que identifica el tipo. */
  dot: string
  /** Fondo suave y color del ícono del tipo (tarjetas, botones del formulario). */
  tint: string
  icon: LucideIcon
}

export const TYPE_META: Record<TransactionType, TypeMeta> = {
  income: {
    ...TYPE_INFO.income,
    dot: 'bg-series-income',
    tint: 'bg-series-income/10 text-series-income',
    icon: TrendingUp,
  },
  fixed: {
    ...TYPE_INFO.fixed,
    dot: 'bg-series-fixed',
    tint: 'bg-series-fixed/10 text-series-fixed',
    icon: ReceiptText,
  },
  variable: {
    ...TYPE_INFO.variable,
    dot: 'bg-series-variable',
    tint: 'bg-series-variable/10 text-series-variable',
    icon: ShoppingBag,
  },
  savings: {
    ...TYPE_INFO.savings,
    dot: 'bg-series-savings',
    tint: 'bg-series-savings/10 text-series-savings',
    icon: PiggyBank,
  },
}
