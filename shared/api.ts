import type { Category, CategoryInput, Transaction, TransactionInput } from './types'

/**
 * Lo mínimo que se usa del cliente de Supabase. Es una interfaz propia (y no
 * `SupabaseClient`) porque la web y la app instalan cada una su copia del
 * paquete y sus tipos no serían compatibles entre sí.
 */
export interface DbClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from(table: string): any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rpc(fn: string, args?: Record<string, unknown>): any
}

interface DbError {
  code: string
  message: string
}

interface DbResult {
  data: unknown
  error: DbError | null
}

export class ApiError extends Error {
  code: string

  constructor(message: string, code = '') {
    super(message)
    this.code = code
  }
}

/** Errores de Postgres que el usuario puede provocar, en español. */
const PG_MESSAGES: Record<string, string> = {
  '23505': 'Ya existe una categoría con ese nombre para este tipo',
  '23503': 'La categoría no corresponde al tipo de movimiento',
  '23514': 'Hay datos inválidos',
  '22P02': 'Hay datos inválidos',
  '42501': 'No tienes permiso para hacer esto',
  PGRST301: 'Tu sesión expiró. Vuelve a entrar.',
}

function toApiError(error: DbError): ApiError {
  if (/fetch|network/i.test(error.message) && !error.code) {
    return new ApiError('No hay conexión con el servidor')
  }
  return new ApiError(PG_MESSAGES[error.code] ?? 'Error del servidor', error.code)
}

/** Lanza el error de Supabase como ApiError o devuelve los datos. */
function unwrap<T>({ data, error }: DbResult): T {
  if (error) throw toApiError(error)
  return data as T
}

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback
}

const CATEGORY_COLUMNS = 'id, name, type, budget, created_at'
const TRANSACTION_COLUMNS = 'id, category_id, description, amount, type, date, recurring, created_at'

/** PostgREST entrega como máximo 1000 filas por consulta: se pide por páginas. */
const PAGE_SIZE = 1000
/** Inserciones grandes (importar) en lotes. */
const BATCH_SIZE = 500

export function createApi(db: DbClient) {
  async function listAllTransactions(): Promise<Transaction[]> {
    const all: Transaction[] = []
    for (let from = 0; ; from += PAGE_SIZE) {
      const page = unwrap<Transaction[]>(
        await db
          .from('transactions')
          .select(TRANSACTION_COLUMNS)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })
          .order('id')
          .range(from, from + PAGE_SIZE - 1),
      )
      all.push(...page)
      if (page.length < PAGE_SIZE) return all
    }
  }

  async function insertTransactions(inputs: TransactionInput[]): Promise<Transaction[]> {
    const created: Transaction[] = []
    for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
      const batch = inputs.slice(i, i + BATCH_SIZE)
      created.push(...unwrap<Transaction[]>(await db.from('transactions').insert(batch).select(TRANSACTION_COLUMNS)))
    }
    return created
  }

  return {
    categories: {
      list: async () =>
        unwrap<Category[]>(await db.from('categories').select(CATEGORY_COLUMNS).order('name')),
      create: async (input: CategoryInput) =>
        unwrap<Category>(await db.from('categories').insert(input).select(CATEGORY_COLUMNS).single()),
      createMany: async (inputs: CategoryInput[]): Promise<Category[]> =>
        inputs.length === 0
          ? []
          : unwrap<Category[]>(await db.from('categories').insert(inputs).select(CATEGORY_COLUMNS)),
      // El tipo no se cambia: los movimientos asociados quedarían inconsistentes.
      update: async (id: string, input: Pick<CategoryInput, 'name' | 'budget'>) =>
        unwrap<Category>(await db.from('categories').update(input).eq('id', id).select(CATEGORY_COLUMNS).single()),
      remove: async (id: string) => {
        unwrap(await db.from('categories').delete().eq('id', id))
      },
    },
    transactions: {
      list: listAllTransactions,
      create: async (input: TransactionInput) =>
        unwrap<Transaction>(await db.from('transactions').insert(input).select(TRANSACTION_COLUMNS).single()),
      createMany: insertTransactions,
      update: async (id: string, input: TransactionInput) =>
        unwrap<Transaction>(await db.from('transactions').update(input).eq('id', id).select(TRANSACTION_COLUMNS).single()),
      remove: async (id: string) => {
        unwrap(await db.from('transactions').delete().eq('id', id))
      },
    },
    account: {
      /** Borra la cuenta y todos sus datos (función delete_my_account en la base). */
      remove: async () => {
        unwrap(await db.rpc('delete_my_account'))
      },
    },
  }
}

export type Api = ReturnType<typeof createApi>
