import { useEffect, useState, type ReactNode } from 'react'
import { Animated, Pressable, Switch as RNSwitch, View, type StyleProp, type ViewStyle } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'
import { withAlpha } from '@shared/theme'
import type { TransactionType } from '@shared/types'
import { createStyles, useTheme } from '@/lib/theme'
import { TYPE_ICON, typeColor } from '@/lib/type-visuals'
import { Card } from './Card'
import { Text } from './Text'

/** Ícono del tipo de movimiento sobre su color suave. */
export function TypeIcon({ type, size = 'md' }: { type: TransactionType; size?: 'sm' | 'md' }) {
  const { palette } = useTheme()
  return <IconTile icon={TYPE_ICON[type]} color={typeColor(palette, type)} size={size === 'sm' ? 28 : 32} />
}

/** Cuadro redondeado con un ícono sobre su color al 10 %. */
export function IconTile({ icon: Icon, color, size = 28 }: { icon: LucideIcon; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: withAlpha(color, 0.1),
      }}
    >
      <Icon size={size <= 28 ? 15 : 16} color={color} />
    </View>
  )
}

interface StatCardProps {
  icon: LucideIcon
  color: string
  label: string
  value: string
  children?: ReactNode
  style?: StyleProp<ViewStyle>
}

/** Cifra destacada con ícono: ingresos, gastos, ahorro, promedios. */
export function StatCard({ icon, color, label, value, children, style }: StatCardProps) {
  return (
    <Card style={[{ padding: 16, flexGrow: 1, flexBasis: '45%' }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <IconTile icon={icon} color={color} />
        <Text size={12} weight="medium" tone="secondary" style={{ flexShrink: 1 }}>{label}</Text>
      </View>
      <Text size={20} weight="semibold" amount tight style={{ marginTop: 12 }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {children}
    </Card>
  )
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  children?: ReactNode
  action?: ReactNode
  compact?: boolean
}

export function EmptyState({ icon: Icon, title, children, action, compact = false }: EmptyStateProps) {
  const { palette: c } = useTheme()
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: compact ? 16 : 24, paddingVertical: compact ? 32 : 56 }}>
      <View
        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.surface.raised, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon size={20} color={c.ink.muted} />
      </View>
      <Text weight="medium" align="center" style={{ marginTop: 12 }}>{title}</Text>
      {children ? (
        <Text tone="secondary" align="center" style={{ marginTop: 4, maxWidth: 320 }}>{children}</Text>
      ) : null}
      {action ? <View style={{ marginTop: 16 }}>{action}</View> : null}
    </View>
  )
}

/** Encabezado de sección: título, para qué sirve y sus acciones. */
export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <View>
        <Text size={24} weight="semibold" tight>{title}</Text>
        {description ? <Text tone="secondary" style={{ marginTop: 4 }}>{description}</Text> : null}
      </View>
      {actions ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>{actions}</View> : null}
    </View>
  )
}

interface SegmentedProps<T extends string | number> {
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  style?: StyleProp<ViewStyle>
}

/** Grupo de botones donde uno queda elegido (períodos, vistas). */
export function SegmentedControl<T extends string | number>({ options, value, onChange, style }: SegmentedProps<T>) {
  const { palette: c } = useTheme()
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: c.line.DEFAULT,
          backgroundColor: c.surface.raised,
          padding: 2,
        },
        style,
      ]}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              alignItems: 'center',
              backgroundColor: active ? c.surface.DEFAULT : 'transparent',
              elevation: active ? 1 : 0,
            }}
          >
            <Text weight={active ? 'medium' : 'regular'} tone={active ? 'ink' : 'secondary'} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

/** Barra de progreso (presupuestos, cuentas pagadas). */
export function ProgressBar({ ratio, color, style }: { ratio: number; color: string; style?: StyleProp<ViewStyle> }) {
  const { palette: c } = useTheme()
  return (
    <View style={[{ height: 6, borderRadius: 3, backgroundColor: c.surface.hover, overflow: 'hidden' }, style]}>
      <View
        style={{ width: `${Math.min(100, Math.max(0, ratio * 100))}%`, height: '100%', borderRadius: 3, backgroundColor: color }}
      />
    </View>
  )
}

/** Interruptor con el color de acento. */
export function Switch({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  const { palette: c } = useTheme()
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: c.surface.hover, true: c.accent }}
      thumbColor="#ffffff"
    />
  )
}

const useSkeletonStyles = createStyles((c) => ({ block: { backgroundColor: c.surface.hover, borderRadius: 6 } }))

/** Bloque gris animado que ocupa el lugar del contenido mientras carga. */
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const s = useSkeletonStyles()
  const [opacity] = useState(() => new Animated.Value(1))
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])
  return <Animated.View style={[s.block, { opacity }, style]} />
}

/** Silueta de una página: encabezado, cifra grande y tarjetas. */
export function PageSkeleton() {
  return (
    <View style={{ gap: 24 }} accessibilityLabel="Cargando">
      <View style={{ gap: 8 }}>
        <Skeleton style={{ height: 28, width: 160 }} />
        <Skeleton style={{ height: 16, width: 240 }} />
      </View>
      <Skeleton style={{ height: 160, borderRadius: 12 }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} style={{ height: 96, borderRadius: 12, flexGrow: 1, flexBasis: '45%' }} />
        ))}
      </View>
      <Skeleton style={{ height: 288, borderRadius: 12 }} />
    </View>
  )
}
