import { importKey, missingRecurring, sameDayIn } from './calculations'
import type { Category, CategoryInput, ImportRow, Transaction, TransactionInput } from './types'

export const byName = (a: Category, b: Category): number => a.name.localeCompare(b.name, 'es')

const categoryKey = (type: string, name: string): string => `${type}|${name.trim().toLowerCase()}`

/** Categorías del archivo importado que todavía no existen (por tipo y nombre). */
export function newCategoriesForImport(rows: ImportRow[], categories: Category[]): CategoryInput[] {
  const existing = new Set(categories.map((c) => categoryKey(c.type, c.name)))
  const created = new Map<string, CategoryInput>()
  for (const row of rows) {
    const key = row.category ? categoryKey(row.type, row.category) : null
    if (key && !existing.has(key) && !created.has(key)) {
      created.set(key, { name: row.category!.trim(), type: row.type, budget: null })
    }
  }
  return [...created.values()]
}

/**
 * Movimientos a insertar al importar. Las filas que ya existen (o se repiten en
 * el archivo) se omiten; `categories` ya debe incluir las recién creadas.
 */
export function importInputs(rows: ImportRow[], categories: Category[], transactions: Transaction[]): TransactionInput[] {
  const ids = new Map(categories.map((c) => [categoryKey(c.type, c.name), c.id]))
  const seen = new Set(transactions.map(importKey))
  const inputs: TransactionInput[] = []
  for (const row of rows) {
    const key = importKey(row)
    if (seen.has(key)) continue
    seen.add(key)
    inputs.push({
      description: row.description,
      amount: row.amount,
      type: row.type,
      date: row.date,
      category_id: row.category ? ids.get(categoryKey(row.type, row.category)) ?? null : null,
      recurring: row.recurring,
    })
  }
  return inputs
}

/** Copias en `month` de los recurrentes del mes anterior que aún no están. */
export function cloneInputs(
  transactions: Transaction[],
  month: string,
  categoryById: Map<string, Category>,
): TransactionInput[] {
  return missingRecurring(transactions, month, categoryById).map((t) => ({
    description: t.description,
    amount: t.amount,
    type: t.type,
    date: sameDayIn(month, t.date),
    category_id: t.category_id,
    recurring: true,
  }))
}
