import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, errorMessage } from './api'
import { byName, cloneInputs, importInputs, newCategoriesForImport } from '@shared/finance-ops'
import type {
  Category,
  CategoryInput,
  CloneResult,
  ImportResult,
  ImportRow,
  Transaction,
  TransactionInput,
} from '@shared/types'

interface FinanceState {
  transactions: Transaction[]
  categories: Category[]
  categoryById: Map<string, Category>
  status: 'loading' | 'ready' | 'error'
  loadError: string | null
  reload: () => Promise<void>
  createTransaction: (input: TransactionInput) => Promise<Transaction>
  updateTransaction: (id: string, input: TransactionInput) => Promise<Transaction>
  deleteTransaction: (id: string) => Promise<void>
  /** Copia a `month` los recurrentes del mes anterior que aún no están. */
  cloneRecurring: (month: string) => Promise<CloneResult>
  importTransactions: (rows: ImportRow[]) => Promise<ImportResult>
  createCategory: (input: CategoryInput) => Promise<Category>
  updateCategory: (id: string, input: Pick<CategoryInput, 'name' | 'budget'>) => Promise<Category>
  deleteCategory: (id: string) => Promise<void>
}

const FinanceContext = createContext<FinanceState | null>(null)

/**
 * Datos del usuario en memoria: el volumen de una persona es pequeño, así que
 * se cargan una vez y cada cambio actualiza el estado local con lo que devuelve
 * Supabase (sin recargar todo).
 */
export function FinanceProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [status, setStatus] = useState<FinanceState['status']>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      const [txs, cats] = await Promise.all([api.transactions.list(), api.categories.list()])
      setTransactions(txs)
      setCategories(cats.sort(byName))
      setLoadError(null)
      setStatus('ready')
    } catch (err) {
      setLoadError(errorMessage(err, 'No se pudieron cargar los datos'))
      setStatus((s) => (s === 'ready' ? s : 'error'))
    }
  }, [])

  useEffect(() => {
    // Carga inicial: los setState ocurren al llegar la respuesta, no durante el efecto
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload()
  }, [reload])

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const createTransaction = useCallback(async (input: TransactionInput) => {
    const created = await api.transactions.create(input)
    setTransactions((list) => [created, ...list])
    return created
  }, [])

  const updateTransaction = useCallback(async (id: string, input: TransactionInput) => {
    const updated = await api.transactions.update(id, input)
    setTransactions((list) => list.map((t) => (t.id === id ? updated : t)))
    return updated
  }, [])

  const deleteTransaction = useCallback(async (id: string) => {
    await api.transactions.remove(id)
    setTransactions((list) => list.filter((t) => t.id !== id))
  }, [])

  const cloneRecurring = useCallback(async (month: string): Promise<CloneResult> => {
    const created = await api.transactions.createMany(cloneInputs(transactions, month, categoryById))
    setTransactions((list) => [...created, ...list])
    return { cloned: created.length, transactions: created }
  }, [transactions, categoryById])

  const importTransactions = useCallback(async (rows: ImportRow[]): Promise<ImportResult> => {
    // Categorías por nombre: se crean las que no existen
    const createdCategories = await api.categories.createMany(newCategoriesForImport(rows, categories))
    const inputs = importInputs(rows, [...categories, ...createdCategories], transactions)

    await api.transactions.createMany(inputs)
    await reload()
    return { imported: inputs.length, skipped: rows.length - inputs.length, categoriesCreated: createdCategories.length }
  }, [categories, transactions, reload])

  const createCategory = useCallback(async (input: CategoryInput) => {
    const created = await api.categories.create(input)
    setCategories((list) => [...list, created].sort(byName))
    return created
  }, [])

  const updateCategory = useCallback(async (id: string, input: Pick<CategoryInput, 'name' | 'budget'>) => {
    const updated = await api.categories.update(id, input)
    setCategories((list) => list.map((c) => (c.id === id ? updated : c)).sort(byName))
    return updated
  }, [])

  const deleteCategory = useCallback(async (id: string) => {
    await api.categories.remove(id)
    setCategories((list) => list.filter((c) => c.id !== id))
    setTransactions((list) => list.map((t) => (t.category_id === id ? { ...t, category_id: null } : t)))
  }, [])

  const value: FinanceState = {
    transactions,
    categories,
    categoryById,
    status,
    loadError,
    reload,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    cloneRecurring,
    importTransactions,
    createCategory,
    updateCategory,
    deleteCategory,
  }

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance(): FinanceState {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance debe usarse dentro de FinanceProvider')
  return ctx
}
