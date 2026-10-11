import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Check, Rocket, X } from 'lucide-react'
import { useTransactionEditor } from '@/components/TransactionEditor'
import { useAuth } from '@/lib/auth'
import { isFixedBill } from '@/lib/calculations'
import { useFinance } from '@/lib/finance-store'

/** Id del campo de la anotación rápida de gastos (QuickAddExpense). */
export const QUICK_ADD_INPUT_ID = 'gasto-rapido'

function readHidden(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

interface Step {
  id: string
  title: string
  text: string
  done: boolean
  action: ReactNode
}

/**
 * Lista de primeros pasos para quien recién empieza. Cada paso se marca solo
 * a partir de sus datos; la guía desaparece al completarlos o al ocultarla.
 */
export function GettingStarted() {
  const { transactions, categories } = useFinance()
  const { session } = useAuth()
  const { openNew } = useTransactionEditor()
  const storageKey = `finanzas:guia-oculta:${session?.user.id ?? ''}`
  const [hidden, setHidden] = useState(() => readHidden(storageKey))

  const linkClass = 'btn-secondary h-8 px-3 text-xs sm:h-8'
  const steps: Step[] = [
    {
      id: 'income',
      title: 'Registra tu ingreso',
      text: 'Tu sueldo u otra entrada de dinero. Es la base para saber cuánto te queda.',
      done: transactions.some((t) => t.type === 'income'),
      action: <button onClick={() => openNew({ type: 'income' })} className={linkClass}>Agregar ingreso</button>,
    },
    {
      id: 'bills',
      title: 'Pon el monto de tus cuentas fijas',
      text: 'Arriendo, luz, internet… Así cada mes las marcas como pagadas con un clic.',
      done: categories.some(isFixedBill),
      action: <Link to="/categorias" className={linkClass}>Ir a categorías</Link>,
    },
    {
      id: 'budget',
      title: 'Define un presupuesto',
      text: 'Un tope mensual para supermercado, delivery u otra categoría de gasto variable.',
      done: categories.some((c) => c.type === 'variable' && c.budget),
      action: <Link to="/categorias" className={linkClass}>Definir presupuesto</Link>,
    },
    {
      id: 'expense',
      title: 'Anota tu primer gasto',
      text: 'Escribe en qué gastaste y cuánto. Toma segundos.',
      done: transactions.some((t) => t.type === 'variable'),
      action: (
        <button
          onClick={() => {
            const input = document.getElementById(QUICK_ADD_INPUT_ID)
            input?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            input?.focus({ preventScroll: true })
          }}
          className={linkClass}
        >
          Anotar gasto
        </button>
      ),
    },
  ]

  const doneCount = steps.filter((s) => s.done).length
  if (hidden || doneCount === steps.length) return null

  const hide = () => {
    try {
      localStorage.setItem(storageKey, '1')
    } catch {
      // Sin almacenamiento solo se oculta hasta recargar
    }
    setHidden(true)
  }

  return (
    <section className="card overflow-hidden" aria-labelledby="primeros-pasos">
      <div className="flex items-start gap-3 p-5 pb-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent" aria-hidden>
          <Rocket size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="primeros-pasos" className="text-base font-semibold">Primeros pasos</h2>
          <p className="mt-0.5 text-sm text-ink-secondary">Completa estos pasos y tendrás tu mes bajo control.</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 max-w-xs flex-1 overflow-hidden rounded-full bg-surface-hover">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${(doneCount / steps.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-ink-secondary">{doneCount} de {steps.length}</span>
          </div>
        </div>
        <button onClick={hide} className="icon-btn -mr-1.5 -mt-1" aria-label="Ocultar primeros pasos" title="Ocultar">
          <X size={16} />
        </button>
      </div>

      <ol className="grid gap-px border-t border-line-muted bg-line-muted sm:grid-cols-2">
        {steps.map((step, i) => (
          <li key={step.id} className="flex gap-3 bg-surface p-4">
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                step.done ? 'bg-status-good text-white' : 'border border-line text-ink-secondary'
              }`}
              aria-hidden
            >
              {step.done ? <Check size={13} strokeWidth={3} /> : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${step.done ? 'text-ink-muted line-through' : 'text-ink'}`}>
                {step.title}
                {step.done && <span className="sr-only"> (listo)</span>}
              </p>
              {!step.done && (
                <>
                  <p className="mt-0.5 text-xs text-ink-secondary">{step.text}</p>
                  <div className="mt-2.5">{step.action}</div>
                </>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
