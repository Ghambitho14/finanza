import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { Appearance, Platform, StyleSheet, useColorScheme } from 'react-native'
import * as SystemUI from 'expo-system-ui'
import { StatusBar } from 'expo-status-bar'
import {
  palettes,
  THEME_STORAGE_KEY,
  type Palette,
  type ThemeName,
  type ThemePreference,
} from '@shared/theme'
import { storage } from './storage'

export type { Palette, ThemePreference }

/** Familias cargadas en el layout raíz (en Android el peso va por familia). */
export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const

function readPreference(): ThemePreference {
  const value = storage.get(THEME_STORAGE_KEY)
  return value === 'light' || value === 'dark' ? value : 'system'
}

interface ThemeState {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
  /** Tema efectivo después de resolver "system". */
  theme: ThemeName
  palette: Palette
}

const ThemeContext = createContext<ThemeState | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference)

  // Fija el esquema de toda la app (también selectores de fecha y diálogos nativos)
  useEffect(() => {
    if (Platform.OS !== 'web') Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference)
  }, [preference])

  const scheme = useColorScheme()
  const theme: ThemeName = preference === 'system' ? (scheme === 'dark' ? 'dark' : 'light') : preference
  const palette = palettes[theme]

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(palette.page).catch(() => {})
  }, [palette])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    if (next === 'system') storage.remove(THEME_STORAGE_KEY)
    else storage.set(THEME_STORAGE_KEY, next)
  }, [])

  return (
    <ThemeContext.Provider value={{ preference, setPreference, theme, palette }}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return ctx
}

/**
 * Estilos que dependen de la paleta, creados una vez por tema:
 * `const useStyles = createStyles((c) => ({ ... }))` y en el componente
 * `const s = useStyles()`.
 */
export function createStyles<T extends StyleSheet.NamedStyles<T>>(factory: (c: Palette) => T) {
  const cache = new Map<Palette, T>()
  return function useStyles(): T {
    const { palette } = useTheme()
    let styles = cache.get(palette)
    if (!styles) {
      styles = StyleSheet.create(factory(palette))
      cache.set(palette, styles)
    }
    return styles
  }
}
