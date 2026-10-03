export type TransactionType = 'income' | 'fixed' | 'variable' | 'savings'

export interface Category {
  id: string
  name: string
  type: TransactionType
  /** Presupuesto mensual en CLP (solo gastos). */
  budget: number | null
  created_at: string
}

export interface Transaction {
  id: string
  category_id: string | null
  description: string
  amount: number
  type: TransactionType
  /** YYYY-MM-DD */
  date: string
  recurring: boolean
  created_at: string
}

export type TransactionInput = Omit<Transaction, 'id' | 'created_at'>

export interface CategoryInput {
  name: string
  type: TransactionType
  budget: number | null
}

export interface CloneResult {
  cloned: number
  transactions: Transaction[]
}

/** Fila de importación: la categoría va por nombre y se crea si no existe. */
export interface ImportRow extends Omit<TransactionInput, 'category_id'> {
  category: string | null
}

export interface ImportResult {
  imported: number
  skipped: number
  categoriesCreated: number
}

export interface MonthSummary {
  income: number
  fixed: number
  variable: number
  savings: number
  expenses: number
  /** Lo que queda del ingreso tras gastos y ahorro. */
  available: number
  /** Ahorro / ingresos, entre 0 y 1 (null si no hay ingresos). */
  savingsRate: number | null
}
