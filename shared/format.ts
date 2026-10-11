/**
 * Formatos en español de Chile. Se arman a mano en vez de con Intl para que la
 * web y la app Android (Hermes) muestren exactamente lo mismo.
 */

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

/** Espacio que no se corta al final de línea (ejes de gráficos). */
const NBSP = ' '

/** Redondeo "hacia afuera" en los medios (como Intl): -0,5 → -1. */
const roundHalfAway = (n: number): number => Math.sign(n) * Math.round(Math.abs(n))

/** 1234567 → "1.234.567" */
const groupThousands = (n: number): string =>
  String(Math.abs(roundHalfAway(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

const sign = (n: number): string => (roundHalfAway(n) < 0 ? '-' : '')

/** 1234567 → "$1.234.567"; -5000 → "-$5.000" */
export const formatCLP = (n: number): string => `${sign(n)}$${groupThousands(n)}`

/** Un decimal con coma, sin ",0": 1.25 → "1,3"; 15 → "15". */
const oneDecimal = (n: number): string => {
  const rounded = roundHalfAway(n * 10) / 10
  const [int, dec] = String(Math.abs(rounded)).split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return dec ? `${grouped},${dec}` : grouped
}

/** Para ejes de gráficos: $1,2 M · $450 mil. */
export const formatCompactCLP = (n: number): string => {
  const abs = Math.abs(n)
  const s = n < 0 ? '-' : ''
  // 999.999 se redondearía a "1.000 mil": mejor mostrarlo como "1 M"
  if (abs >= 999_950) return `${s}$${oneDecimal(abs / 1_000_000)}${NBSP}M`
  if (abs >= 1000) return `${s}$${oneDecimal(abs / 1000)}${NBSP}mil`
  return formatCLP(n)
}

/** 0.45 → "45%" */
export const formatPercent = (ratio: number): string => {
  const pct = roundHalfAway(ratio * 100)
  return `${pct === 0 ? 0 : pct}%`
}

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
  return Number.isNaN(n) ? '' : groupThousands(n)
}
