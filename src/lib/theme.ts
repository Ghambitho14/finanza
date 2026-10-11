/**
 * Puente de la paleta (shared/theme) a Tailwind: variables CSS por tema para
 * cambiar de tema sin volver a renderizar. Recharts usa la paleta directa.
 * Import relativo: tailwind.config.ts carga este archivo sin los alias de Vite.
 */
import { palettes, type Palette } from '../../shared/theme'

export { palettes, type Palette, type ThemeName } from '../../shared/theme'

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
  Object.entries(palettes.dark).map(([name, value]) => [
    name,
    typeof value === 'string'
      ? cssColor(name)
      : Object.fromEntries(Object.keys(value).map((sub) => [sub, cssColor(sub === 'DEFAULT' ? name : `${name}-${sub}`)])),
  ]),
)
