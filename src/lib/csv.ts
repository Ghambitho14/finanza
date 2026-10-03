import { parseAmountInput } from '@/lib/format'
import type { Category, ImportRow, Transaction, TransactionType } from '@/types/finance'

/**
 * Formato CSV de la app: separado por `;` (lo que Excel espera en español) y
 * con BOM para que reconozca los acentos.
 */
const HEADER = ['fecha', 'descripcion', 'monto', 'tipo', 'categoria', 'recurrente']

const TYPE_TO_CSV: Record<TransactionType, string> = {
  income: 'ingreso',
  fixed: 'gasto fijo',
  variable: 'gasto variable',
  savings: 'ahorro',
}

const normalize = (value: string): string =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()

const CSV_TO_TYPE: Record<string, TransactionType> = {
  ingreso: 'income',
  ingresos: 'income',
  income: 'income',
  'gasto fijo': 'fixed',
  'gastos fijos': 'fixed',
  fijo: 'fixed',
  fixed: 'fixed',
  'gasto variable': 'variable',
  'gastos variables': 'variable',
  variable: 'variable',
  gasto: 'variable',
  ahorro: 'savings',
  savings: 'savings',
}

const COLUMN_ALIASES: Record<string, string[]> = {
  fecha: ['fecha', 'date'],
  descripcion: ['descripcion', 'description', 'detalle', 'glosa'],
  monto: ['monto', 'amount', 'valor', 'importe'],
  tipo: ['tipo', 'type'],
  categoria: ['categoria', 'category'],
  recurrente: ['recurrente', 'recurring', 'mensual'],
}

const escapeCell = (value: string): string =>
  /[";\r\n]/.test(value) || value !== value.trim() ? `"${value.replace(/"/g, '""')}"` : value

export function transactionsToCSV(transactions: Transaction[], categoryById: Map<string, Category>): string {
  const rows = transactions.map((t) => [
    t.date,
    t.description,
    String(t.amount),
    TYPE_TO_CSV[t.type],
    (t.category_id && categoryById.get(t.category_id)?.name) || '',
    t.recurring ? 'si' : 'no',
  ])
  return '﻿' + [HEADER, ...rows].map((r) => r.map(escapeCell).join(';')).join('\r\n')
}

export function downloadText(filename: string, content: string, type = 'text/csv;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/** Separador más frecuente fuera de comillas en la primera línea. */
function detectDelimiter(firstLine: string): string {
  const counts: Record<string, number> = { ';': 0, ',': 0, '\t': 0 }
  let quoted = false
  for (const ch of firstLine) {
    if (ch === '"') quoted = !quoted
    else if (!quoted && ch in counts) counts[ch]++
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
}

/** CSV con comillas, comillas dobles escapadas y saltos de línea dentro de celdas. */
export function parseCSV(text: string): string[][] {
  const delimiter = detectDelimiter(text.split(/\r?\n/, 1)[0] ?? '')
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') {
        quoted = false
      } else {
        cell += ch
      }
    } else if (ch === '"') {
      quoted = true
    } else if (ch === delimiter) {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += ch
    }
  }
  if (cell || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

/** Acepta 2026-10-05, 05-10-2026, 05/10/2026 y 05.10.2026. */
function parseDate(value: string): string | null {
  const v = value.trim()
  let y: number, m: number, d: number
  let match = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (match) {
    [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])]
  } else {
    match = v.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)
    if (!match) return null
    ;[d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])]
  }
  const date = new Date(Date.UTC(y, m - 1, d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null
  return date.toISOString().slice(0, 10)
}

export interface ParsedImport {
  rows: ImportRow[]
  errors: { line: number; message: string }[]
}

export function parseImportCSV(text: string): ParsedImport {
  const records = parseCSV(text.replace(/^﻿/, ''))
  if (records.length < 2) {
    return { rows: [], errors: [{ line: 1, message: 'El archivo no tiene movimientos' }] }
  }

  const header = records[0].map(normalize)
  const column = Object.fromEntries(
    Object.entries(COLUMN_ALIASES).map(([key, aliases]) => [key, header.findIndex((h) => aliases.includes(h))]),
  )
  const missing = ['fecha', 'descripcion', 'monto', 'tipo'].filter((key) => column[key] < 0)
  if (missing.length > 0) {
    return { rows: [], errors: [{ line: 1, message: `Faltan columnas: ${missing.join(', ')}` }] }
  }

  const rows: ImportRow[] = []
  const errors: ParsedImport['errors'] = []

  records.slice(1).forEach((record, index) => {
    const line = index + 2
    const cell = (key: string) => (column[key] >= 0 ? record[column[key]] ?? '' : '').trim()

    const date = parseDate(cell('fecha'))
    const description = cell('descripcion').slice(0, 200)
    const amount = parseAmountInput(cell('monto'))
    const type = CSV_TO_TYPE[normalize(cell('tipo'))]

    const problem = !date ? 'fecha inválida'
      : !description ? 'falta la descripción'
      : Number.isNaN(amount) || amount <= 0 ? 'monto inválido'
      : !type ? `tipo desconocido «${cell('tipo')}»`
      : null
    if (problem) {
      errors.push({ line, message: problem })
      return
    }

    rows.push({
      date: date!,
      description,
      amount,
      type,
      category: cell('categoria').slice(0, 60) || null,
      recurring: ['si', 'yes', 'true', '1', 'x'].includes(normalize(cell('recurrente'))),
    })
  })

  return { rows, errors }
}
