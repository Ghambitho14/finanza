import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useTheme } from '@/lib/theme'
import { Text } from '@/ui/Text'

interface TitleProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  /** Total o acción a la derecha. */
  right?: ReactNode
}

/** Encabezado de tarjeta con ícono, título, subtítulo y total (`.card-header`). */
export function CardTitle({ title, subtitle, icon, right }: TitleProps) {
  const { palette: c } = useTheme()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: c.line.DEFAULT,
      }}
    >
      {icon}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text weight="semibold">{title}</Text>
        {subtitle ? <Text size={12} tone="muted" style={{ marginTop: 2 }}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  )
}

/** Fila de botones al pie de una tarjeta. */
export function CardActions({ children }: { children: ReactNode }) {
  const { palette: c } = useTheme()
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: c.line.muted,
      }}
    >
      {children}
    </View>
  )
}
