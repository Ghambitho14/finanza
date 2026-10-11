import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'
import { colors, cssVariables, palettes } from './src/lib/theme'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors,
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      keyframes: {
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-in': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'toast-in': 'toast-in 160ms ease-out',
        'sheet-in': 'sheet-in 220ms cubic-bezier(0.32, 0.72, 0, 1)',
        'pop-in': 'pop-in 140ms ease-out',
      },
    },
  },
  plugins: [
    // Variables de color de cada tema: oscuro por defecto, claro con data-theme="light"
    plugin(({ addBase }) => {
      addBase({
        ':root': { ...cssVariables(palettes.dark), 'color-scheme': 'dark' },
        ':root[data-theme="light"]': { ...cssVariables(palettes.light), 'color-scheme': 'light' },
      })
    }),
  ],
} satisfies Config
