import { createElement } from 'react'
import { useTheme } from '@/lib/theme'

interface Props {
  value: string
  onChange: (value: string) => void
}

/** En la vista web de desarrollo: el `<input type="date">` del navegador. */
export function DateField({ value, onChange }: Props) {
  const { palette: c } = useTheme()
  return createElement('input', {
    type: 'date',
    value,
    'aria-label': 'Elegir otra fecha',
    onChange: (e: { target: { value: string } }) => e.target.value && onChange(e.target.value),
    style: {
      height: 32,
      padding: '0 12px',
      borderRadius: 999,
      border: `1px solid ${c.line.DEFAULT}`,
      background: c.surface.DEFAULT,
      color: c.ink.secondary,
      fontSize: 13,
      colorScheme: 'inherit',
    },
  })
}
