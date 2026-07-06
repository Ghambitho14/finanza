import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import {
  getCategories,
  getTransactions,
  addTransaction,
  deleteTransaction,
  cloneRecurringTransactions,
} from '@/lib/db-service'
import {
  formatCLP,
  monthOptions,
  summaryForMonth,
  firstDayOfMonth,
  nextMonth,
} from '@/lib/calculations'
import { MonthSelector } from '@/components/MonthSelector'
import { DiffBar } from '@/components/DiffBar'
import { ResumenCard } from '@/components/ResumenCard'
import { LogList } from '@/components/LogList'
import { AddTransactionForm } from '@/components/AddTransactionForm'
import { ActivityChart } from '@/components/ActivityChart'
import { CloneRecurringButton } from '@/components/CloneRecurringButton'
import type { Transaction, Category, TransactionType } from '@/types/finance'

export function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [month, setMonth] = useState(monthOptions(1)[0])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadCategories = useCallback(async () => {
    const data = await getCategories()
    setCategories(data)
  }, [])

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    const data = await getTransactions(user!.id)
    setTransactions(data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadCategories()
    loadTransactions()
  }, [loadCategories, loadTransactions])

  const monthTransactions = transactions.filter(
    (t) => t.month === firstDayOfMonth(month),
  )
  const summary = summaryForMonth(transactions, month)

  const handleAdd = async (data: {
    description: string
    amount: number
    type: TransactionType
    categoryId: string | null
    recurring: boolean
  }) => {
    setSaving(true)

    await addTransaction({
      description: data.description,
      amount: data.amount,
      type: data.type,
      month: firstDayOfMonth(month),
      category_id: data.categoryId,
      recurring: data.recurring,
      owner_id: user!.id,
    })

    setSaving(false)
    await loadTransactions()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este movimiento?')) return

    await deleteTransaction(id)
    await loadTransactions()
  }

  const handleCloneRecurring = async () => {
    const previous = monthOptions(24).find((m) => nextMonth(m) === month)
    if (!previous) return

    const previousTransactions = transactions.filter(
      (t) => t.month === firstDayOfMonth(previous) && t.recurring,
    )

    if (previousTransactions.length === 0) {
      alert('No hay transacciones recurrentes en el mes anterior')
      return
    }

    await cloneRecurringTransactions(
      firstDayOfMonth(previous),
      firstDayOfMonth(month),
      user!.id,
    )
    await loadTransactions()
  }

  return (
    <div className="mx-auto max-w-[840px] px-5 pb-20 pt-8">
      {/* header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border-muted pb-5">
        <div className="flex items-center gap-2.5 text-[15px]">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-green to-green-dark font-mono text-sm font-bold text-bg">
            G
          </div>
          <span className="text-txt-secondary">{user!.name}</span>
          <span className="text-txt-tertiary">/</span>
          <span className="font-semibold text-txt-primary">finanzas</span>
          <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-txt-secondary">
            private
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/historico')}
            className="rounded-md border border-border bg-bg-elevated px-3 py-1.5 font-mono text-xs text-txt-secondary transition-colors hover:text-txt-primary"
          >
            histórico
          </button>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="rounded-md border border-border bg-bg-elevated px-3 py-1.5 font-mono text-xs text-txt-tertiary transition-colors hover:text-red"
          >
            salir
          </button>
          <CloneRecurringButton
            onClone={handleCloneRecurring}
            loading={saving}
          />
          <MonthSelector value={month} onChange={setMonth} />
        </div>
      </div>

      {/* hero */}
      <div className="mb-7">
        <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-2.5">
          <div>
            <div className="text-xs uppercase tracking-widest text-txt-secondary">
              balance del mes
            </div>
            <div className="flex items-baseline gap-3 font-mono text-[30px] font-bold leading-tight sm:text-[40px]">
              <span>{formatCLP(summary.balance)}</span>
              <span
                className="inline-block h-6 w-2.5 animate-blink bg-green align-middle"
                aria-hidden="true"
              />
            </div>
          </div>
          <div
            className={`rounded-full border px-2.5 py-0.5 font-mono text-xs font-medium ${
              summary.balance >= 0
                ? 'border-green bg-green-bg text-green'
                : 'border-red bg-red-bg text-red'
            }`}
          >
            {summary.balance >= 0 ? 'balance positivo' : 'balance negativo'}
          </div>
        </div>
        <DiffBar summary={summary} />
      </div>

      {loading ? (
        <div className="py-10 text-center font-mono text-sm text-txt-tertiary">
          cargando datos…
        </div>
      ) : (
        <>
          <ResumenCard summary={summary} />

          <section className="card">
            <div className="card-head">
              <span className="text-txt-primary">
                git log --oneline · movimientos
              </span>
              <span>{monthTransactions.length} commits</span>
            </div>
            <LogList transactions={monthTransactions} onDelete={handleDelete} />
            <AddTransactionForm categories={categories} onAdd={handleAdd} />
          </section>

          <section className="card">
            <div className="card-head">
              <span className="text-txt-primary">actividad por categoría</span>
            </div>
            <ActivityChart transactions={transactions} month={month} />
          </section>
        </>
      )}

      <footer className="mt-9 text-center font-mono text-[11.5px] text-txt-tertiary">
        hecho por Belandria Jhon · datos locales
        <br />
        <span className="text-txt-secondary">commit finanzas-v2</span>
      </footer>
    </div>
  )
}
