import { useRef, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { AmountInput } from '@/components/AmountInput'
import { useToast } from '@/components/Toaster'
import { errorMessage } from '@/lib/api'
import { defaultDateForMonth } from '@/lib/calculations'
import { useFinance } from '@/lib/finance-store'
import { formatShortDate, parseAmountInput, todayISO } from '@/lib/format'

/** Anotar un gasto chico en segundos: descripción, monto y listo. */
export function QuickAddExpense({ month }: { month: string }) {
  const { categories, createTransaction } = useFinance()
  const toast = useToast()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [saving, setSaving] = useState(false)
  const descriptionRef = useRef<HTMLInputElement>(null)

  const date = defaultDateForMonth(month)
  const variableCategories = categories.filter((c) => c.type === 'variable')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = parseAmountInput(amount)
    if (!description.trim()) {
      descriptionRef.current?.focus()
      return
    }
    if (Number.isNaN(parsed) || parsed <= 0) {
      toast({ kind: 'error', text: 'Escribe el monto del gasto' })
      return
    }

    setSaving(true)
    try {
      await createTransaction({
        description: description.trim(),
        amount: parsed,
        type: 'variable',
        date,
        category_id: categoryId || null,
        recurring: false,
      })
      setDescription('')
      setAmount('')
      setCategoryId('')
      descriptionRef.current?.focus()
    } catch (err) {
      toast({ kind: 'error', text: errorMessage(err, 'No se pudo guardar el gasto') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-b border-line-muted p-3" aria-label="Agregar gasto variable">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_7.5rem_9rem_auto]">
        <input
          ref={descriptionRef}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="¿En qué gastaste?"
          aria-label="Descripción del gasto"
          maxLength={200}
          autoComplete="off"
          className="field col-span-2 min-w-0 sm:col-span-1"
        />
        <AmountInput
          value={amount}
          onChange={setAmount}
          placeholder="Monto"
          aria-label="Monto del gasto"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          aria-label="Categoría del gasto"
          className="field min-w-0"
        >
          <option value="">Sin categoría</option>
          {variableCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button type="submit" disabled={saving} className="btn-secondary col-span-2 sm:col-span-1">
          <Plus size={15} aria-hidden />
          Agregar
        </button>
      </div>
      {date !== todayISO() && (
        <p className="mt-2 text-xs text-ink-muted">
          Se anotará con fecha {formatShortDate(date)}. Para otra fecha usa «Nuevo movimiento».
        </p>
      )}
    </form>
  )
}
