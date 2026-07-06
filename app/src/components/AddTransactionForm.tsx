import { useState } from 'react'
import type { Category, TransactionType } from '@/types/finance'

interface Props {
  categories: Category[]
  onAdd: (data: {
    description: string
    amount: number
    type: TransactionType
    categoryId: string | null
    recurring: boolean
  }) => void
}

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'income', label: '+ ingreso' },
  { value: 'fixed', label: '− gasto fijo' },
  { value: 'variable', label: '− gasto variable' },
  { value: 'savings', label: '» ahorro' },
]

export function AddTransactionForm({ categories, onAdd }: Props) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<TransactionType>('variable')
  const [categoryId, setCategoryId] = useState('')
  const [recurring, setRecurring] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = Number(amount)
    if (!description.trim() || Number.isNaN(parsed) || parsed <= 0) return

    onAdd({
      description: description.trim(),
      amount: parsed,
      type,
      categoryId: categoryId || null,
      recurring,
    })

    setDescription('')
    setAmount('')
    setCategoryId('')
    setRecurring(false)
  }

  const filteredCategories = categories.filter((c) => c.type === type)

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-border-muted px-4 py-3 font-mono text-sm"
    >
      <div className="grid grid-cols-[14px_1fr] items-center gap-2 sm:grid-cols-[14px_1fr_120px_130px_auto]">
        <span className="text-green">$</span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="descripción del movimiento"
          className="w-full rounded-md border border-border bg-bg-elevated-2 px-2.5 py-1.5 font-mono text-xs text-txt-primary placeholder:text-txt-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue focus-visible:outline-offset-1"
        />
        <input
          type="number"
          min={0}
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="monto"
          className="col-span-2 w-full rounded-md border border-border bg-bg-elevated-2 px-2.5 py-1.5 font-mono text-xs text-txt-primary placeholder:text-txt-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue focus-visible:outline-offset-1 sm:col-span-1"
        />
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as TransactionType)
            setCategoryId('')
          }}
          className="col-span-2 w-full rounded-md border border-border bg-bg-elevated-2 px-2.5 py-1.5 font-mono text-xs text-txt-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue focus-visible:outline-offset-1 sm:col-span-1"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="col-span-2 rounded-md border border-green bg-green-bg px-3.5 py-1.5 font-mono text-xs font-semibold text-green transition-colors hover:bg-green-hover sm:col-span-1"
        >
          commit
        </button>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        {filteredCategories.length > 0 && (
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-md border border-border bg-bg-elevated-2 px-2.5 py-1.5 font-mono text-xs text-txt-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue focus-visible:outline-offset-1"
          >
            <option value="">sin categoría</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        <label className="flex items-center gap-2 text-xs text-txt-secondary">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            className="rounded border-border bg-bg-elevated-2 text-green focus:ring-green"
          />
          recurrente
        </label>
      </div>
    </form>
  )
}
