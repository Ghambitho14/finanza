import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0D1117',
          elevated: '#161B22',
          'elevated-2': '#1C2128',
        },
        border: {
          DEFAULT: '#30363D',
          muted: '#21262D',
        },
        txt: {
          primary: '#E6EDF3',
          secondary: '#8B949E',
          tertiary: '#6E7681',
        },
        green: {
          DEFAULT: '#3FB950',
          dark: '#238636',
          bg: 'rgba(63,185,80,0.12)',
          hover: 'rgba(63,185,80,0.22)',
        },
        red: {
          DEFAULT: '#F85149',
          bg: 'rgba(248,81,73,0.12)',
        },
        amber: {
          DEFAULT: '#D29922',
          bg: 'rgba(210,153,34,0.12)',
        },
        blue: {
          DEFAULT: '#58A6FF',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        blink: 'blink 1.1s steps(1) infinite',
      },
      keyframes: {
        blink: {
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
