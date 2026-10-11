import type { ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'
import { createStyles, useTheme } from '@/lib/theme'
import { Text } from './Text'

const useStyles = createStyles((c) => ({
  card: {
    backgroundColor: c.surface.DEFAULT,
    borderColor: c.line.DEFAULT,
    borderWidth: 1,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.line.DEFAULT,
  },
}))

/** Tarjeta (`.card` en la web). */
export function Card({ style, ...rest }: ViewProps) {
  const s = useStyles()
  const { theme } = useTheme()
  // En el tema claro la web suma una sombra muy suave
  return <View {...rest} style={[s.card, theme === 'light' && { elevation: 1 }, style]} />
}

interface HeaderProps {
  title: string
  /** Ícono o elemento antes del título. */
  icon?: ReactNode
  /** Acción o dato a la derecha. */
  right?: ReactNode
}

/** Encabezado de tarjeta con borde inferior (`.card-header`). */
export function CardHeader({ title, icon, right }: HeaderProps) {
  const s = useStyles()
  return (
    <View style={s.header}>
      {icon}
      <Text weight="semibold" style={{ flex: 1 }}>{title}</Text>
      {right}
    </View>
  )
}
