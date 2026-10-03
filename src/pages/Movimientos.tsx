import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Search, Upload } from 'lucide-react'
import { Modal } from '@/components/Modal'
import { useToast } from '@/components/Toaster'
import { TransactionRow } from '@/components/TransactionRow'
import { errorMessage } from '@/lib/api'
import { byDateDesc, currentMonth, monthOf, prevMonth, shiftMonth, summarize } from '@/lib/calculations'
import { downloadText, parseImportCSV, transactionsToCSV, type ParsedImport } from '@/lib/csv'
import { useFinance } from '@/lib/finance-store'
import { formatCLP, formatMonthLabel, todayISO } from '@/lib/format'
import { TYPE_META, TYPE_ORDER } from '@/lib/transaction-types'
import type { Transaction, TransactionType } from '@/types/finance'

const PERIODS = [
  { value: 'todo', label: 'Todo' },
  { value: 'mes', label: 'Este mes' },
  { value: 'mes-anterior', label: 'Mes anterior' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: 'anio', label: 'Este año' },
] as const

type Period = (typeof PERIODS)[number]['value']

const PAGE_SIZE = 100

function inPeriod(t: Transaction, period: Period): boolean {
  const month = monthOf(t.date)
  const now = currentMonth()
  switch (period) {
    case 'mes': return month === now
    case 'mes-anterior': return month === prevMonth(now)
    case '3m': return month >= shiftMonth(now, -2) && month <= now
    case 'anio': return month.slice(0, 4) === now.slice(0, 4)
    default: return true
  }
}

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function Movimientos() {
  const { transactions, categories, categoryById } = useFinance()
  const [params, setParams] = useSearchParams()
  const [visible, setVisible] = useState(PAGE_SIZE)

  const query = params.get('q') ?? ''
  const type = (params.get('tipo') ?? '') as TransactionType | ''
  const categoryId = params.get('categoria') ?? ''
  const period = (PERIODS.some((p) => p.value === params.get('periodo')) ? params.get('periodo') : 'todo') as Period

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    // La categoría depende del tipo
    if (key === 'tipo') next.delete('categoria')
    setParams(next, { replace: true })
    setVisible(PAGE_SIZE)
  }

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    return transactions
      .filter((t) => (!type || t.type === type)
        && (!categoryId || (categoryId === 'none' ? !t.category_id : t.category_id === categoryId))
        && inPeriod(t, period)
        && (!q || normalize(t.description).includes(q)
          || normalize((t.category_id && categoryById.get(t.category_id)?.name) || '').includes(q)))
      .sort(byDateDesc)
  }, [transactions, categoryById, query, type, categoryId, period])

  const totals = summarize(filtered)
  const shown = filtered.slice(0, visible)
  const groups = groupByMonth(shown)
  const filterCategories = type ? categories.filter((c) => c.type === type) : categories
  const hasFilters = !!(query || type || categoryId || period !== 'todo')

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Movimientos</h1>
        <div className="flex gap-2">
          <ImportButton />
          <button
            onClick={() => downloadText(`finanzas-${todayISO()}.csv`, transactionsToCSV(filtered, categoryById))}
            disabled={filtered.length === 0}
            className="btn-secondary"
          >
            <Download size={15} aria-hidden />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="search">
        <div className="relative min-w-0 flex-[1_1_14rem]">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setFilter('q', e.target.value)}
            placeholder="Buscar por descripción o categoría"
            aria-label="Buscar movimientos"
            className="field w-full pl-9"
          />
        </div>
        <select value={type} onChange={(e) => setFilter('tipo', e.target.value)} aria-label="Tipo" className="field">
          <option value="">Todos los tipos</option>
          {TYPE_ORDER.map((t) => <option key={t} value={t}>{TYPE_META[t].plural}</option>)}
        </select>
        <select value={categoryId} onChange={(e) => setFilter('categoria', e.target.value)} aria-label="Categoría" className="field max-w-[12rem]">
          <option value="">Todas las categorías</option>
          <option value="none">Sin categoría</option>
          {filterCategories.map((c) => (
            <option key={c.id} value={c.id}>{type ? c.name : `${c.name} · ${TYPE_META[c.type].label.toLowerCase()}`}</option>
          ))}
        </select>
        <select value={period} onChange={(e) => setFilter('periodo', e.target.value === 'todo' ? '' : e.target.value)} aria-label="Período" className="field">
          {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <div className="flex gap-1.5"><dt className="text-ink-secondary">Movimientos</dt><dd className="amount font-medium">{filtered.length}</dd></div>
        <div className="flex gap-1.5"><dt className="text-ink-secondary">Ingresos</dt><dd className="amount font-medium text-positive">+{formatCLP(totals.income)}</dd></div>
        <div className="flex gap-1.5"><dt className="text-ink-secondary">Gastos</dt><dd className="amount font-medium">−{formatCLP(totals.expenses)}</dd></div>
        <div className="flex gap-1.5"><dt className="text-ink-secondary">Ahorro</dt><dd className="amount font-medium">{formatCLP(totals.savings)}</dd></div>
      </dl>

      {filtered.length === 0 ? (
        <div className="card px-4 py-12 text-center">
          <p className="font-medium">{hasFilters ? 'Ningún movimiento coincide con los filtros' : 'Todavía no hay movimientos'}</p>
          {hasFilters && (
            <button onClick={() => setParams({}, { replace: true })} className="btn-ghost mt-3">Quitar filtros</button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <section key={group.month} className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line-muted px-4 py-2.5 text-xs text-ink-secondary">
                <h2 className="font-medium text-ink">{formatMonthLabel(group.month)}</h2>
                <span>{group.items.length} {group.items.length === 1 ? 'movimiento' : 'movimientos'}</span>
              </div>
              <ul className="divide-y divide-line-muted">
                {group.items.map((t) => <TransactionRow key={t.id} transaction={t} showType />)}
              </ul>
            </section>
          ))}
          {filtered.length > visible && (
            <div className="text-center">
              <button onClick={() => setVisible((v) => v + PAGE_SIZE)} className="btn-secondary">
                Mostrar más ({filtered.length - visible} restantes)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function groupByMonth(items: Transaction[]): { month: string; items: Transaction[] }[] {
  const groups: { month: string; items: Transaction[] }[] = []
  for (const t of items) {
    const month = monthOf(t.date)
    const last = groups[groups.length - 1]
    if (last?.month === month) last.items.push(t)
    else groups.push({ month, items: [t] })
  }
  return groups
}

function ImportButton() {
  const { importTransactions } = useFinance()
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [parsed, setParsed] = useState<(ParsedImport & { fileName: string }) | null>(null)
  const [busy, setBusy] = useState(false)

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 1_500_000) {
      toast({ kind: 'error', text: 'El archivo es demasiado grande (máximo 1,5 MB)' })
      return
    }
    setParsed({ ...parseImportCSV(await file.text()), fileName: file.name })
  }

  const handleImport = async () => {
    if (!parsed) return
    setBusy(true)
    try {
      const { imported, skipped, categoriesCreated } = await importTransactions(parsed.rows)
      const extras = [
        skipped > 0 ? `${skipped} ya existían` : '',
        categoriesCreated > 0 ? `${categoriesCreated} ${categoriesCreated === 1 ? 'categoría nueva' : 'categorías nuevas'}` : '',
      ].filter(Boolean).join(', ')
      toast({ text: `${imported} ${imported === 1 ? 'movimiento importado' : 'movimientos importados'}${extras ? ` (${extras})` : ''}` })
      setParsed(null)
    } catch (err) {
      toast({ kind: 'error', text: errorMessage(err, 'No se pudo importar') })
    } finally {
      setBusy(false)
    }
  }

  const counts = parsed
    ? TYPE_ORDER.map((t) => ({ type: t, n: parsed.rows.filter((r) => r.type === t).length })).filter((c) => c.n > 0)
    : []

  return (
    <>
      <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
      <button onClick={() => inputRef.current?.click()} className="btn-secondary">
        <Upload size={15} aria-hidden />
        Importar CSV
      </button>

      <Modal
        open={parsed !== null}
        title="Importar movimientos"
        description={parsed?.fileName}
        onClose={() => setParsed(null)}
      >
        {parsed && (
          <div className="space-y-4 text-sm">
            {parsed.rows.length > 0 ? (
              <div className="rounded-lg border border-line bg-surface-raised p-3">
                <p className="font-medium">
                  {parsed.rows.length} {parsed.rows.length === 1 ? 'movimiento listo' : 'movimientos listos'} para importar
                </p>
                <ul className="mt-2 space-y-1 text-ink-secondary">
                  {counts.map((c) => (
                    <li key={c.type} className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-sm ${TYPE_META[c.type].dot}`} aria-hidden />
                      {TYPE_META[c.type].plural}: {c.n}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-ink-muted">
                  Las filas que ya existen (misma fecha, tipo, monto y descripción) se omiten.
                </p>
              </div>
            ) : (
              <p className="text-ink-secondary">No se encontraron movimientos válidos en el archivo.</p>
            )}

            {parsed.errors.length > 0 && (
              <div>
                <p className="font-medium text-negative">
                  {parsed.errors.length} {parsed.errors.length === 1 ? 'fila con problemas' : 'filas con problemas'} (no se importarán)
                </p>
                <ul className="mt-1 max-h-32 overflow-y-auto text-xs text-ink-secondary">
                  {parsed.errors.slice(0, 50).map((e) => <li key={e.line}>Fila {e.line}: {e.message}</li>)}
                </ul>
              </div>
            )}

            <p className="text-xs text-ink-muted">
              Columnas: fecha, descripcion, monto, tipo (ingreso, gasto fijo, gasto variable o ahorro), categoria y recurrente (si/no).
              Exporta tus datos para ver un ejemplo del formato.
            </p>

            <div className="flex justify-end gap-2 border-t border-line-muted pt-4">
              <button onClick={() => setParsed(null)} className="btn-ghost">Cancelar</button>
              <button onClick={handleImport} disabled={busy || parsed.rows.length === 0} className="btn-primary">
                {busy ? 'Importando…' : `Importar ${parsed.rows.length}`}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
