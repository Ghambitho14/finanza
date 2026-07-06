import { formatCLP, summarizeByCategory, typeColorClass } from '@/lib/calculations'
import type { Transaction } from '@/types/finance'

interface Props {
  transactions: Transaction[]
  month: string
}

export function ActivityChart({ transactions, month }: Props) {
  const groups = summarizeByCategory(transactions, month)
  const maxAmount = Math.max(...groups.map((g) => g.amount), 1)

  return (
    <div className="px-4 py-3.5">
      {groups.length === 0 ? (
        <div className="py-4 text-center font-mono text-sm text-txt-tertiary">
          sin actividad por categoría
        </div>
      ) : (
        groups.map((g) => {
          const colors = typeColorClass(g.type)
          const pct = (g.amount / maxAmount) * 100

          return (
            <div
              key={g.name}
              className="mb-2.5 grid grid-cols-[90px_1fr_60px] items-center gap-2 font-mono text-xs last:mb-0 sm:grid-cols-[120px_1fr_70px] sm:gap-2.5"
            >
              <span className="truncate text-txt-secondary">{g.name}</span>
              <span className="h-2 overflow-hidden rounded bg-bg-elevated-2">
                <span
                  className={`block h-full rounded ${colors.bar}`}
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="text-right text-txt-secondary">
                {formatCLP(g.amount)}
              </span>
            </div>
          )
        })
      )}
    </div>
  )
}
