/**
 * Tokens de color compartidos por Tailwind y los gráficos (Recharts necesita
 * los valores, no clases). Los colores de serie identifican cada tipo de
 * movimiento y están validados para daltonismo y contraste sobre `surface`.
 */
export const colors = {
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
  // Solo para estados (bien / alerta / excedido), siempre con ícono y texto.
  status: {
    good: '#0ca30c',
    warning: '#fab219',
    critical: '#d03b3b',
  },
  // Texto de montos con signo: más claros que los de estado para leerse bien.
  positive: '#4ac26b',
  negative: '#ff7b72',
} as const
