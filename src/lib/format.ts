const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

const compact = new Intl.NumberFormat('es-CL', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const percent = new Intl.NumberFormat('es-CL', {
  style: 'percent',
  maximumFractionDigits: 0,
})

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export const formatCLP = (n: number): string => clp.format(n)

/** Para ejes de gráficos: $1,2 M · $450 mil. */
export const formatCompactCLP = (n: number): string => `$${compact.format(n)}`

export const formatPercent = (ratio: number): string => percent.format(ratio)

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

/** "2026-10" → "Octubre 2026" */
export const formatMonthLabel = (month: string): string => {
  const [year, m] = month.split('-').map(Number)
  return `${capitalize(MONTHS[m - 1])} ${year}`
}

/** "2026-10" → "octubre" */
export const formatMonthName = (month: string): string => MONTHS[Number(month.slice(5, 7)) - 1]

/** "2026-10" → "oct 26" */
export const formatMonthShort = (month: string): string => {
  const [year, m] = month.split('-').map(Number)
  return `${MONTHS_SHORT[m - 1]} ${String(year).slice(2)}`
}

/** Fecha local (sin desfase de zona horaria) a partir de YYYY-MM-DD. */
export const parseISODate = (date: string): Date => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const toISODate = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const todayISO = (): string => toISODate(new Date())

/** "2026-10-05" → "5 oct" */
export const formatShortDate = (date: string): string => {
  const d = parseISODate(date)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

/** Encabezado de día en listas: "Hoy", "Ayer" o "Lunes 28 sep". */
export const formatDayHeading = (date: string): string => {
  const today = todayISO()
  if (date === today) return 'Hoy'
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (date === toISODate(yesterday)) return 'Ayer'
  const d = parseISODate(date)
  return `${capitalize(WEEKDAYS[d.getDay()])} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

/**
 * Montos en CLP (sin decimales): puntos, comas y espacios se tratan como
 * separadores de miles, así "400.000" es 400000 y no 400.
 */
export const parseAmountInput = (value: string): number => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : NaN
}

export const formatAmountInput = (value: string | number): string => {
  const n = typeof value === 'number' ? Math.round(value) : parseAmountInput(value)
  return Number.isNaN(n) ? '' : new Intl.NumberFormat('es-CL').format(n)
}
