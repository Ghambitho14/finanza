import { useState } from 'react'
import { View } from 'react-native'
import Svg, { Circle, G, Line, Path, Polyline, Rect, Text as SvgText } from 'react-native-svg'
import { formatCLP, formatCompactCLP, formatMonthLabel } from '@shared/format'
import { SERIES, STACK, niceTicks, topOfStack, type HistoryRow } from '@shared/history'
import { TYPE_INFO } from '@shared/transaction-types'
import { useTheme, font } from '@/lib/theme'
import { typeColor } from '@/lib/type-visuals'
import { Text } from '@/ui/Text'

const HEIGHT = 240
const AXIS_WIDTH = 56
const TOP = 8
const BOTTOM = 22
const MAX_BAR = 24

/**
 * Barras apiladas de fijos, variables y ahorro con la línea de ingresos encima
 * (el gráfico de recharts de la web). Tocar un mes muestra su detalle debajo.
 */
export function HistoryChart({ rows }: { rows: HistoryRow[] }) {
  const { palette: c } = useTheme()
  const [width, setWidth] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)

  const max = Math.max(1, ...rows.map((r) => Math.max(r.income, r.fixed + r.variable + r.savings)))
  const ticks = niceTicks(max)
  const top = ticks[ticks.length - 1]
  const plotW = Math.max(width - AXIS_WIDTH, 0)
  const plotH = HEIGHT - TOP - BOTTOM
  const slot = rows.length ? plotW / rows.length : 0
  const barW = Math.min(MAX_BAR, slot * 0.7)
  const y = (v: number) => TOP + plotH - (v / top) * plotH
  const cx = (i: number) => AXIS_WIDTH + slot * i + slot / 2
  // Con muchos meses, una etiqueta cada tanto para que no se encimen
  const labelEvery = Math.max(1, Math.ceil(rows.length / Math.max(1, Math.floor(plotW / 44))))
  const detail = rows.find((r) => r.month === selected) ?? rows[rows.length - 1]

  return (
    <View>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: HEIGHT }}>
        {width > 0 && (
          <Svg width={width} height={HEIGHT}>
            {ticks.map((t) => (
              <G key={t}>
                <Line x1={AXIS_WIDTH} x2={width} y1={y(t)} y2={y(t)} stroke={t === 0 ? c.line.DEFAULT : c.line.muted} strokeWidth={1} />
                <SvgText x={AXIS_WIDTH - 6} y={y(t) + 4} fontSize={11} fontFamily={font.regular} fill={c.ink.muted} textAnchor="end">
                  {formatCompactCLP(t)}
                </SvgText>
              </G>
            ))}

            {rows.map((row, i) => {
              const x = cx(i) - barW / 2
              const topKey = topOfStack(row)
              let base = 0
              return (
                <G key={row.month} onPress={() => setSelected(row.month)}>
                  {/* Área táctil de toda la columna */}
                  <Rect
                    x={AXIS_WIDTH + slot * i}
                    y={TOP}
                    width={slot}
                    height={plotH}
                    fill={row.month === detail?.month ? c.surface.hover : 'transparent'}
                    opacity={0.6}
                  />
                  {STACK.map((key) => {
                    const value = row[key]
                    if (value <= 0) return null
                    const y1 = y(base + value)
                    const h = y(base) - y1
                    base += value
                    const r = key === topKey ? Math.min(4, h, barW / 2) : 0
                    const d = `M${x},${y1 + h} L${x},${y1 + r} Q${x},${y1} ${x + r},${y1} L${x + barW - r},${y1} Q${x + barW},${y1} ${x + barW},${y1 + r} L${x + barW},${y1 + h} Z`
                    return <Path key={key} d={d} fill={typeColor(c, key)} stroke={c.surface.DEFAULT} strokeWidth={2} />
                  })}
                  {i % labelEvery === 0 || i === rows.length - 1 ? (
                    <SvgText x={cx(i)} y={HEIGHT - 6} fontSize={11} fontFamily={font.regular} fill={c.ink.muted} textAnchor="middle">
                      {row.label}
                    </SvgText>
                  ) : null}
                </G>
              )
            })}

            <Polyline
              points={rows.map((r, i) => `${cx(i)},${y(r.income)}`).join(' ')}
              fill="none"
              stroke={c.series.income}
              strokeWidth={2}
            />
            {rows.map((r, i) => (
              <Circle
                key={r.month}
                cx={cx(i)}
                cy={y(r.income)}
                r={r.month === detail?.month ? 5 : 4}
                fill={c.series.income}
                stroke={c.surface.DEFAULT}
                strokeWidth={2}
                onPress={() => setSelected(r.month)}
              />
            ))}
          </Svg>
        )}
      </View>

      {detail && (
        <View style={{ marginTop: 12, borderRadius: 8, borderWidth: 1, borderColor: c.line.DEFAULT, backgroundColor: c.surface.raised, padding: 12 }}>
          <Text size={12} weight="medium" style={{ marginBottom: 8 }}>{formatMonthLabel(detail.month)}</Text>
          <View style={{ gap: 4 }}>
            {SERIES.map((key) => (
              <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: typeColor(c, key) }} />
                  <Text size={12} tone="secondary">{TYPE_INFO[key].plural}</Text>
                </View>
                <Text size={12} amount>{formatCLP(detail[key])}</Text>
              </View>
            ))}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: c.line.muted }}>
              <Text size={12} tone="secondary">Disponible</Text>
              <Text size={12} weight="medium" amount color={detail.available < 0 ? c.negative : undefined}>{formatCLP(detail.available)}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
