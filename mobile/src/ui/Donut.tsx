import type { ReactNode } from 'react'
import { View } from 'react-native'
import Svg, { Circle, G } from 'react-native-svg'
import { formatCLP, formatPercent } from '@shared/format'
import { useTheme } from '@/lib/theme'
import { Text } from './Text'

export interface DonutSegment {
  key: string
  label: string
  value: number
  color: string
}

interface Props {
  segments: DonutSegment[]
  /** Contenido del centro cuando no hay un segmento señalado. */
  center: ReactNode
  /** Segmento resaltado (se elige tocando la leyenda: en el teléfono no hay "hover"). */
  activeKey?: string | null
  size?: number
}

const THICKNESS = 14
/** Hueco entre segmentos, del color de la tarjeta. */
const GAP = 2

/** Dona en SVG: cada segmento es un arco del mismo círculo (igual que la web). */
export function Donut({ segments, center, activeKey: active = null, size = 168 }: Props) {
  const { palette: c } = useTheme()

  const total = segments.reduce((s, x) => s + x.value, 0)
  const r = (size - THICKNESS) / 2
  const circumference = 2 * Math.PI * r
  const gap = segments.length > 1 ? GAP : 0
  const activeSegment = segments.find((s) => s.key === active)

  // Cada arco empieza donde termina el anterior
  const lengths = segments.map((s) => (total > 0 ? (s.value / total) * circumference : 0))
  const arcs = segments.map((s, i) => ({
    ...s,
    dash: Math.max(lengths[i] - gap, 0.5),
    offset: lengths.slice(0, i).reduce((sum, l) => sum + l, 0),
  }))

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <Circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={THICKNESS} stroke={c.surface.hover} />
          {arcs.map((a) => (
            <Circle
              key={a.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={active === a.key ? THICKNESS + 4 : THICKNESS}
              strokeDasharray={`${a.dash} ${circumference - a.dash}`}
              strokeDashoffset={-a.offset}
              opacity={active && active !== a.key ? 0.4 : 1}
            />
          ))}
        </G>
      </Svg>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', padding: 24 }}
      >
        {activeSegment ? (
          <View style={{ alignItems: 'center' }}>
            <Text size={12} tone="secondary" numberOfLines={1}>{activeSegment.label}</Text>
            <Text size={16} weight="semibold" amount style={{ marginTop: 2 }}>{formatCLP(activeSegment.value)}</Text>
            <Text size={12} tone="muted">{total > 0 ? formatPercent(activeSegment.value / total) : ''}</Text>
          </View>
        ) : (
          center
        )}
      </View>
    </View>
  )
}
