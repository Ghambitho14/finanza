import { formatCLP, typeSign, typeColorClass } from '@/lib/calculations'
import type { Transaction } from '@/types/finance'

interface Props {
  transactions: Transaction[]
  editingId?: string | null
  onEdit?: (transaction: Transaction) => void
  onDelete?: (id: string) => void
}

export function LogList({ transactions, editingId, onEdit, onDelete }: Props) {
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
          const isEditing = t.id === editingId

          return (
            <div
              key={t.id}
              className={`grid grid-cols-[16px_1fr_auto] items-center gap-3 border-b border-border-muted px-4 py-2 font-mono text-sm last:border-b-0 ${
                isEditing ? 'bg-blue/10' : ''
              }`}
            >
              <span className={`sign ${colors.text}`}>{sign}</span>
              <span className="min-w-0 text-txt-primary">
                <span className="break-words">{t.description}</span>
                {t.recurring && (
                  <span className="ml-1.5 text-[11px] text-blue" title="recurrente">
                    ↻
                  </span>
                )}
                {t.categories && (
                  <span className="ml-2 rounded border border-border px-1.5 py-px text-[10.5px] text-txt-secondary">
                    {t.categories.name}
                  </span>
                )}
                <span className="ml-2 text-[11px] text-txt-tertiary">
                  #{1000 + sorted.length - i}
                </span>
              </span>
              <div className="flex items-center gap-3">
                <span className={`amount text-right ${colors.text}`}>
                  {formatCLP(t.amount)}
                </span>
                {onEdit && (
                  <button
                    onClick={() => onEdit(t)}
                    className="text-xs text-txt-tertiary transition-colors hover:text-blue"
                    aria-label={`Editar ${t.description}`}
                    title="editar"
                  >
                    ✎
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(t.id)}
                    className="text-xs text-txt-tertiary transition-colors hover:text-red"
                    aria-label={`Eliminar ${t.description}`}
                    title="eliminar"
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
