import { PiggyBank, ReceiptText, ShoppingBag, TrendingUp, type LucideIcon } from 'lucide-react-native'
import type { Palette } from '@shared/theme'
import type { TransactionType } from '@shared/types'

/** Ícono y color de cada tipo de movimiento (los textos están en shared). */
export const TYPE_ICON: Record<TransactionType, LucideIcon> = {
  income: TrendingUp,
  fixed: ReceiptText,
  variable: ShoppingBag,
  savings: PiggyBank,
}

export const typeColor = (palette: Palette, type: TransactionType): string => palette.series[type]
