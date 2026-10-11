import { TYPE_META } from '@/lib/transaction-types'
import type { TransactionType } from '@/types/finance'

/** Ícono del tipo de movimiento sobre su color suave (junto a títulos de tarjeta). */
export function TypeIcon({ type, size = 'md' }: { type: TransactionType; size?: 'sm' | 'md' }) {
  const Icon = TYPE_META[type].icon
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-lg ${TYPE_META[type].tint} ${size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'}`}
      aria-hidden
    >
      <Icon size={size === 'sm' ? 15 : 16} />
    </span>
  )
}
