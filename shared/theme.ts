/**
 * Tokens de color de la web (Tailwind y gráficos) y de la app. Hay una paleta
 * por tema. Los colores de serie identifican cada tipo de movimiento y están
 * validados para daltonismo y contraste sobre `surface` en cada tema.
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
export type ThemePreference = 'system' | ThemeName

/** Clave del tema elegido (la web la lee también en index.html antes de pintar). */
export const THEME_STORAGE_KEY = 'finanzas:tema'

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

/** "#3987e5" + 0.1 → "rgba(57, 135, 229, 0.1)" */
export const withAlpha = (hex: string, alpha: number): string => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}
