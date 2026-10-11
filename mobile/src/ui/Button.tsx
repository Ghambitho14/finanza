import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'
import { useTheme } from '@/lib/theme'
import { Text } from './Text'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface Props extends Omit<PressableProps, 'children' | 'style'> {
  variant?: Variant
  icon?: LucideIcon
  loading?: boolean
  /** Botón más bajo (32 px), para acciones dentro de tarjetas. */
  small?: boolean
  style?: StyleProp<ViewStyle>
  children: ReactNode
}

/** Botones de la web: `primary` invierte colores (fondo tinta, texto del fondo). */
export function Button({ variant = 'primary', icon: Icon, loading, small, disabled, style, children, ...rest }: Props) {
  const { palette: c } = useTheme()
  const colors: Record<Variant, { bg: string; pressed: string; fg: string; border?: string }> = {
    primary: { bg: c.ink.DEFAULT, pressed: c.ink.secondary, fg: c.page },
    secondary: { bg: c.surface.raised, pressed: c.surface.hover, fg: c.ink.DEFAULT, border: c.line.DEFAULT },
    ghost: { bg: 'transparent', pressed: c.surface.hover, fg: c.ink.secondary },
    danger: { bg: c.status.critical, pressed: c.status.critical, fg: '#ffffff' },
  }
  const v = colors[variant]
  const inactive = disabled || loading

  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      {...rest}
      style={({ pressed }) => [
        {
          height: small ? 32 : 40,
          paddingHorizontal: small ? 10 : 14,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          backgroundColor: pressed ? v.pressed : v.bg,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border,
          opacity: inactive ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : (
        Icon && <Icon size={small ? 14 : 16} color={v.fg} />
      )}
      {typeof children === 'string' ? (
        <Text size={small ? 13 : 14} weight="medium" color={v.fg} numberOfLines={1}>
          {children}
        </Text>
      ) : (
        <View>{children}</View>
      )}
    </Pressable>
  )
}

interface IconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  icon: LucideIcon
  label: string
  color?: string
  size?: number
  style?: StyleProp<ViewStyle>
}

/** Botón cuadrado de ícono (`.icon-btn`), 32 px con área táctil de 44. */
export function IconButton({ icon: Icon, label, color, size = 16, style, ...rest }: IconButtonProps) {
  const { palette: c } = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      {...rest}
      style={({ pressed }) => [
        {
          width: 32,
          height: 32,
          borderRadius: 6,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? c.surface.hover : 'transparent',
        },
        style,
      ]}
    >
      <Icon size={size} color={color ?? c.ink.muted} />
    </Pressable>
  )
}
