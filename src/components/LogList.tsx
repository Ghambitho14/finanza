import { formatCLP, typeSign, typeColorClass } from '@/lib/calculations'
import type { Transaction } from '@/types/finance'

interface Props {
  transactions: Transaction[]
  onDelete?: (id: string) => void
}

export function LogList({ transactions, onDelete }: Props) {
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  return (
    <div className="py-1">
      {sorted.length === 0 ? (
        <div className="px-4 py-6 text-center font-mono text-sm text-txt-tertiary">
          sin movimientos este mes — agrega el primero abajo
        </div>
      ) : (
        sorted.map((t, i) => {
          const colors = typeColorClass(t.type)
          const sign = typeSign(t.type)

          return (
            <div
              key={t.id}
              className="grid grid-cols-[16px_1fr_auto] items-center gap-3 border-b border-border-muted px-4 py-2 font-mono text-sm last:border-b-0"
            >
              <span className={`sign ${colors.text}`}>{sign}</span>
              <span className="text-txt-primary">
                {t.description}
                <span className="ml-2 text-[11px] text-txt-tertiary">
                  #{1000 + sorted.length - i}
                </span>
              </span>
              <div className="flex items-center gap-3">
                <span className={`amount text-right ${colors.text}`}>
                  {formatCLP(t.amount)}
                </span>
                {onDelete && (
                  <button
                    onClick={() => onDelete(t.id)}
                    className="text-xs text-txt-tertiary hover:text-red"
                    aria-label={`Eliminar ${t.description}`}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
