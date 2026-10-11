import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { palettes, type Palette, type ThemeName } from '@/lib/theme'
import { THEME_STORAGE_KEY as STORAGE_KEY, type ThemePreference } from '@shared/theme'

export type { ThemePreference }

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

const systemTheme = (): ThemeName => (darkQuery().matches ? 'dark' : 'light')

interface ThemeState {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
  /** Tema efectivo después de resolver "system". */
  theme: ThemeName
  /** Colores del tema actual, para los gráficos (Recharts no lee clases). */
  palette: Palette
}

const ThemeContext = createContext<ThemeState | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference)
  const [system, setSystem] = useState<ThemeName>(systemTheme)
  const theme = preference === 'system' ? system : preference

  useEffect(() => {
    const query = darkQuery()
    const onChange = () => setSystem(query.matches ? 'dark' : 'light')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', palettes[theme].page)
  }, [theme])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Sin almacenamiento, el tema elegido dura hasta recargar
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ preference, setPreference, theme, palette: palettes[theme] }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return ctx
}
