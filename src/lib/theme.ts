/**
 * Tokens de color compartidos por Tailwind y los gráficos (Recharts necesita
 * los valores, no clases). Hay una paleta por tema; Tailwind usa variables CSS
 * para cambiar de tema sin volver a renderizar. Los colores de serie
 * identifican cada tipo de movimiento y están validados para daltonismo y
 * contraste sobre `surface` en cada tema.
 */
const dark = {
  page: '#0e0f11',
  surface: {
    DEFAULT: '#16171a',
    raised: '#1d1f23',
    hover: '#25272c',
  },
  line: {
    DEFAULT: '#2a2c31',
    muted: '#1f2125',
  },
  ink: {
    DEFAULT: '#f2f2f0',
    secondary: '#b4b3ad',
    muted: '#8b8a85',
  },
  accent: '#3987e5',
  series: {
    fixed: '#3987e5',
    variable: '#d95926',
    savings: '#199e70',
    income: '#c98500',
  },
  // Categorías del gráfico de dona, en este orden (validado para daltonismo
  // entre vecinos); más allá de 5 se agrupan en "Otras".
  chart: {
    1: '#3987e5',
    2: '#d95926',
    3: '#199e70',
    4: '#c98500',
    5: '#d55181',
  },
  // Solo para estados (bien / alerta / excedido), siempre con ícono y texto.
  status: {
    good: '#0ca30c',
    warning: '#fab219',
    critical: '#d03b3b',
  },
  // Texto de montos con signo: más claros que los de estado para leerse bien.
  positive: '#4ac26b',
  negative: '#ff7b72',
}

export type Palette = typeof dark
export type ThemeName = 'dark' | 'light'

const light: Palette = {
  page: '#f5f6f8',
  surface: {
    DEFAULT: '#ffffff',
    raised: '#f3f4f6',
    hover: '#e8eaee',
  },
  line: {
    DEFAULT: '#e2e4e9',
    muted: '#eceef1',
  },
  ink: {
    DEFAULT: '#15171c',
    secondary: '#4a4f58',
    muted: '#6b707a',
  },
  accent: '#2563c9',
  series: {
    fixed: '#2f74d0',
    variable: '#c94f1d',
    savings: '#148a62',
    income: '#c27f00',
  },
  chart: {
    1: '#2f74d0',
    2: '#c94f1d',
    3: '#148a62',
    4: '#c27f00',
    5: '#c9467a',
  },
  status: {
    good: '#12891a',
    warning: '#d99400',
    critical: '#c93434',
  },
  // En fondo claro el texto con signo necesita ser más oscuro
  positive: '#1a7f37',
  negative: '#cf222e',
}

export const palettes: Record<ThemeName, Palette> = { dark, light }

/** Recorre la paleta como pares `nombre-del-token → valor` (`DEFAULT` no suma sufijo). */
function tokens(palette: Palette): [string, string][] {
  return Object.entries(palette).flatMap(([name, value]) =>
    typeof value === 'string'
      ? [[name, value]]
      : Object.entries(value).map(([sub, hex]): [string, string] => [sub === 'DEFAULT' ? name : `${name}-${sub}`, hex]),
  )
}

const rgbChannels = (hex: string): string => {
  const n = parseInt(hex.slice(1), 16)
  return `${n >> 16} ${(n >> 8) & 255} ${n & 255}`
}

/** Variables CSS (`--c-ink-muted: 139 138 133`) de una paleta, para el CSS base. */
export const cssVariables = (palette: Palette): Record<string, string> =>
  Object.fromEntries(tokens(palette).map(([name, hex]) => [`--c-${name}`, rgbChannels(hex)]))

const cssColor = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`

/** Colores para Tailwind: misma forma que la paleta, apuntando a las variables. */
export const colors = Object.fromEntries(
  Object.entries(dark).map(([name, value]) => [
    name,
    typeof value === 'string'
      ? cssColor(name)
      : Object.fromEntries(Object.keys(value).map((sub) => [sub, cssColor(sub === 'DEFAULT' ? name : `${name}-${sub}`)])),
  ]),
)
