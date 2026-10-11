import type { ReactNode } from 'react'
import { Pressable, View, type PressableProps } from 'react-native'
import { useTheme } from '@/lib/theme'
import { Text } from './Text'

interface Props extends Omit<PressableProps, 'children'> {
  selected?: boolean
  /** Punto de color u otro elemento antes del texto. */
  leading?: ReactNode
  children: string
}

/** Opción tipo píldora (`.chip`): al elegirla se invierte, como en la web. */
export function Chip({ selected = false, leading, children, ...rest }: Props) {
  const { palette: c } = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      {...rest}
      style={({ pressed }) => ({
        height: 32,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: selected ? c.ink.DEFAULT : pressed ? c.ink.muted : c.line.DEFAULT,
        backgroundColor: selected ? c.ink.DEFAULT : c.surface.DEFAULT,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      })}
    >
      {leading}
      <Text size={13} weight={selected ? 'medium' : 'regular'} color={selected ? c.page : c.ink.secondary} numberOfLines={1}>
        {children}
      </Text>
    </Pressable>
  )
}

/** Punto de color del tipo de movimiento. */
export function Dot({ color, size = 8 }: { color: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
}
