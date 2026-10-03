import { useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { AmountInput } from '@/components/AmountInput'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toaster'
import { errorMessage } from '@/lib/api'
import { currentMonth, inMonth } from '@/lib/calculations'
import { useFinance } from '@/lib/finance-store'
import { formatAmountInput, formatCLP, parseAmountInput } from '@/lib/format'
import { TYPE_META, TYPE_ORDER } from '@/lib/transaction-types'
import type { Category, TransactionType } from '@/types/finance'

/**
 * El monto de una categoría significa cosas distintas según el tipo: en fijos
 * es la cuenta mensual (aparece por pagar en el Resumen); en variables, el tope.
 */
const AMOUNT_COPY: Partial<Record<TransactionType, { field: string; empty: string; hint: string }>> = {
  fixed: {
    field: 'Monto mensual',
    empty: 'Sin monto',
    hint: 'Con monto mensual, cada mes aparecen en el Resumen como cuentas para marcar pagadas.',
  },
  variable: {
    field: 'Presupuesto',
    empty: 'Sin presupuesto',
    hint: 'El presupuesto es lo máximo que quieres gastar al mes en cada una.',
  },
}

/** Monto opcional: vacío es "sin monto"; texto no numérico es un error. */
function parseBudget(value: string): number | null | 'invalid' {
  if (!value.trim()) return null
  const n = parseAmountInput(value)
  return Number.isNaN(n) || n <= 0 ? 'invalid' : n
}

export function Categorias() {
  const { categories, transactions } = useFinance()
  const [toDelete, setToDelete] = useState<Category | null>(null)

  const usage = new Map<string, number>()
  for (const t of transactions) {
    if (t.category_id) usage.set(t.category_id, (usage.get(t.category_id) ?? 0) + 1)
  }
  const spentThisMonth = new Map<string, number>()
  for (const t of inMonth(transactions, currentMonth())) {
    if (t.category_id) spentThisMonth.set(t.category_id, (spentThisMonth.get(t.category_id) ?? 0) + t.amount)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Categorías</h1>
        <p className="mt-1 text-ink-secondary">
          Organiza tus movimientos y define cuánto quieres gastar al mes en cada categoría.
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        {TYPE_ORDER.map((type) => (
          <TypeSection
            key={type}
            type={type}
            categories={categories.filter((c) => c.type === type)}
            usage={usage}
            spentThisMonth={spentThisMonth}
            onDelete={setToDelete}
          />
        ))}
      </div>

      <DeleteCategoryDialog
        category={toDelete}
        usage={toDelete ? usage.get(toDelete.id) ?? 0 : 0}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}

interface SectionProps {
  type: TransactionType
  categories: Category[]
  usage: Map<string, number>
  spentThisMonth: Map<string, number>
  onDelete: (category: Category) => void
}

function TypeSection({ type, categories, usage, spentThisMonth, onDelete }: SectionProps) {
  const { createCategory } = useFinance()
  const toast = useToast()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')
  const [error, setError] = useState('')
  const amountCopy = AMOUNT_COPY[type]

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    const parsedBudget = parseBudget(budget)
    if (!name.trim()) return setError('Escribe un nombre')
    if (parsedBudget === 'invalid') return setError('Monto inválido')
    setError('')
    try {
      await createCategory({ name: name.trim(), type, budget: amountCopy ? parsedBudget : null })
      toast({ text: `Categoría «${name.trim()}» creada` })
      setName('')
      setBudget('')
    } catch (err) {
      setError(errorMessage(err, 'No se pudo crear'))
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title flex items-center gap-2">
          <span className={`h-2 w-2 rounded-sm ${TYPE_META[type].dot}`} aria-hidden />
          {TYPE_META[type].plural}
        </h2>
        <span className="text-xs text-ink-muted">
          {categories.length} {categories.length === 1 ? 'categoría' : 'categorías'}
        </span>
      </div>

      {amountCopy && <p className="border-b border-line-muted px-4 py-2.5 text-xs text-ink-muted">{amountCopy.hint}</p>}

      {categories.length > 0 && (
        <ul className="divide-y divide-line-muted">
          {categories.map((c) =>
            editingId === c.id ? (
              <EditRow key={c.id} category={c} onDone={() => setEditingId(null)} />
            ) : (
              <li key={c.id} className="group flex items-center gap-3 py-2 pl-4 pr-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{c.name}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {usage.get(c.id) ?? 0} {usage.get(c.id) === 1 ? 'movimiento' : 'movimientos'}
                    {spentThisMonth.get(c.id) ? <> · {formatCLP(spentThisMonth.get(c.id)!)} este mes</> : null}
                  </p>
                </div>
                {amountCopy && (
                  <span className={`amount whitespace-nowrap text-xs ${c.budget ? 'text-ink' : 'text-ink-muted'}`}>
                    {c.budget ? `${formatCLP(c.budget)} / mes` : amountCopy.empty}
                  </span>
                )}
                <div className="flex sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  <button onClick={() => setEditingId(c.id)} className="icon-btn" aria-label={`Editar ${c.name}`}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => onDelete(c)} className="icon-btn hover:text-negative" aria-label={`Eliminar ${c.name}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      <form onSubmit={handleCreate} className="border-t border-line-muted p-3" aria-label={`Nueva categoría de ${TYPE_META[type].plural.toLowerCase()}`}>
        <div className={`grid gap-2 ${amountCopy ? 'grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_9rem_auto]' : 'grid-cols-[minmax(0,1fr)_auto]'}`}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === 'fixed' ? 'Nueva cuenta (ej: luz)' : 'Nueva categoría'}
            aria-label="Nombre de la categoría"
            maxLength={60}
            className={`field min-w-0 ${amountCopy ? 'col-span-2 sm:col-span-1' : ''}`}
          />
          {amountCopy && (
            <AmountInput
              value={budget}
              onChange={setBudget}
              placeholder={amountCopy.field}
              aria-label={`${amountCopy.field} (opcional)`}
            />
          )}
          <button type="submit" className="btn-secondary">
            <Plus size={15} aria-hidden />
            Agregar
          </button>
        </div>
        {error && <p role="alert" className="mt-2 text-xs text-negative">{error}</p>}
      </form>
    </section>
  )
}

function EditRow({ category, onDone }: { category: Category; onDone: () => void }) {
  const { updateCategory } = useFinance()
  const [name, setName] = useState(category.name)
  const [budget, setBudget] = useState(category.budget ? formatAmountInput(category.budget) : '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const amountCopy = AMOUNT_COPY[category.type]

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const parsedBudget = parseBudget(budget)
    if (!name.trim()) return setError('Escribe un nombre')
    if (parsedBudget === 'invalid') return setError('Monto inválido')
    setSaving(true)
    try {
      await updateCategory(category.id, { name: name.trim(), budget: amountCopy ? parsedBudget : null })
      onDone()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo guardar'))
      setSaving(false)
    }
  }

  return (
    <li className="bg-surface-raised/50 p-3">
      <form onSubmit={handleSubmit} onKeyDown={(e) => e.key === 'Escape' && onDone()}>
        <div className={`grid gap-2 ${amountCopy ? 'grid-cols-2 sm:grid-cols-[minmax(0,1fr)_9rem]' : ''}`}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Nombre de la categoría"
            maxLength={60}
            autoFocus
            className="field min-w-0"
          />
          {amountCopy && (
            <AmountInput value={budget} onChange={setBudget} placeholder={amountCopy.empty} aria-label={`${amountCopy.field} (opcional)`} />
          )}
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onDone} className="btn-ghost h-8">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primary h-8">Guardar</button>
        </div>
        {error && <p role="alert" className="mt-2 text-xs text-negative">{error}</p>}
      </form>
    </li>
  )
}

function DeleteCategoryDialog({ category, usage, onClose }: { category: Category | null; usage: number; onClose: () => void }) {
  const { deleteCategory } = useFinance()
  const toast = useToast()

  return (
    <ConfirmDialog
      open={category !== null}
      title={`¿Eliminar «${category?.name ?? ''}»?`}
      description={usage > 0
        ? `Sus ${usage} ${usage === 1 ? 'movimiento se conserva' : 'movimientos se conservan'}, pero quedará${usage === 1 ? '' : 'n'} sin categoría.`
        : 'Esta categoría no tiene movimientos.'}
      confirmLabel="Eliminar categoría"
      onClose={onClose}
      onConfirm={async () => {
        if (!category) return
        try {
          await deleteCategory(category.id)
          toast({ text: `Categoría «${category.name}» eliminada` })
          onClose()
        } catch (err) {
          toast({ kind: 'error', text: errorMessage(err, 'No se pudo eliminar') })
        }
      }}
    />
  )
}
