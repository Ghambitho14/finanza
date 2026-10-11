import { Text as RNText, type TextProps, type TextStyle } from 'react-native'
import { font, useTheme } from '@/lib/theme'

type Tone = 'ink' | 'secondary' | 'muted'

interface Props extends TextProps {
  /** Tamaño en px (14 = cuerpo de la web). */
  size?: number
  weight?: keyof typeof font
  tone?: Tone
  /** Color explícito (gana a `tone`). */
  color?: string
  /** Cifras de ancho fijo, como `.amount` en la web. */
  amount?: boolean
  /** Interletrado ajustado de los títulos (`tracking-tight`). */
  tight?: boolean
  align?: TextStyle['textAlign']
}

export function Text({ size = 14, weight = 'regular', tone = 'ink', color, amount, tight, align, style, ...rest }: Props) {
  const { palette } = useTheme()
  const toneColor = tone === 'ink' ? palette.ink.DEFAULT : palette.ink[tone]
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: font[weight],
          fontSize: size,
          lineHeight: Math.round(size * 1.4),
          color: color ?? toneColor,
          textAlign: align,
        },
        amount && { fontVariant: ['tabular-nums'] },
        tight && { letterSpacing: -0.02 * size },
        style,
      ]}
    />
  )
}
