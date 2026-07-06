export type TransactionType = 'income' | 'fixed' | 'variable' | 'savings'

export interface Category {
  id: string
  name: string
  type: TransactionType
  created_at: string
}

export interface Transaction {
  id: string
  category_id: string | null
  description: string
  amount: number
  type: TransactionType
  month: string
  recurring: boolean
  created_at: string
  owner_id?: string
  categories?: Category | null
}

export interface AppUser {
  id: string
  email: string
  name: string
  passwordHash: string
  created_at: string
}

export interface MonthSummary {
  income: number
  fixed: number
  variable: number
  savings: number
  balance: number
}

export interface CategorySummary {
  category: Category
  amount: number
}
