import { View } from 'react-native'
import { ArrowDownRight, ArrowUpRight, CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react-native'
import { formatCLP, formatMonthName, formatPercent } from '@shared/format'
import { OVERVIEW_TILES, monthOverview, tileStats, type SegmentKey } from '@shared/overview'
import { withAlpha, type Palette } from '@shared/theme'
import { TYPE_INFO } from '@shared/transaction-types'
import type { MonthSummary } from '@shared/types'
import { useTheme } from '@/lib/theme'
import { TYPE_ICON, typeColor } from '@/lib/type-visuals'
import { Card } from '@/ui/Card'
import { StatCard } from '@/ui/misc'
import { Text } from '@/ui/Text'

interface Props {
  summary: MonthSummary
  previous: MonthSummary
  previousMonth: string
  /** Monto de las cuentas fijas que aún no se marcan como pagadas. */
  pendingFixed: number
}

const segmentColor = (c: Palette, key: SegmentKey): string =>
  key === 'pending' ? withAlpha(c.series.fixed, 0.3) : c.series[key]

export function MonthOverview({ summary, previous, previousMonth, pendingFixed }: Props) {
  const { palette: c } = useTheme()
  const { income, available } = summary
  const { afterBills, scale, overspent, billsAtRisk, segments, showFree } = monthOverview(summary, pendingFixed)

  const status = overspent
    ? { icon: CircleAlert, color: c.status.critical, text: 'Gastas más de lo que ganas' }
    : billsAtRisk
      ? { icon: TriangleAlert, color: c.status.warning, text: 'No alcanza para las cuentas pendientes' }
      : { icon: CircleCheck, color: c.status.good, text: 'Dentro de tu ingreso' }
  const StatusIcon = status.icon

  return (
    <View style={{ gap: 12 }}>
      <Card style={{ padding: 20 }} accessibilityLabel="Panorama del mes">
        <Text weight="medium" tone="secondary">Disponible este mes</Text>
        <Text
          size={36}
          weight="semibold"
          amount
          tight
          color={overspent ? c.negative : undefined}
          style={{ marginTop: 4, lineHeight: 44 }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatCLP(available)}
        </Text>
        <Text tone="secondary" style={{ marginTop: 8 }}>
          {income > 0
            ? `De ${formatCLP(income)} en ingresos${summary.savingsRate ? ` · ahorras el ${formatPercent(summary.savingsRate)}` : ''}`
            : 'Aún no registras ingresos este mes'}
        </Text>
        {pendingFixed > 0 && (
          <Text tone="secondary" style={{ marginTop: 4 }}>
            Faltan <Text weight="medium" amount>{formatCLP(pendingFixed)}</Text> en cuentas por pagar
            {income > 0 && (afterBills >= 0
              ? <> · te quedarían <Text weight="medium" amount>{formatCLP(afterBills)}</Text></>
              : <> · te faltarían <Text weight="medium" amount color={c.negative}>{formatCLP(-afterBills)}</Text></>)}
          </Text>
        )}
        {income > 0 && (
          <View
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: 12,
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: c.line.DEFAULT,
              backgroundColor: c.surface.raised,
            }}
          >
            <StatusIcon size={14} color={status.color} />
            <Text size={12} weight="medium" tone="secondary">{status.text}</Text>
          </View>
        )}

        {/* Cómo se reparte el ingreso: cada segmento es su parte; el resto es lo disponible */}
        <View style={{ marginTop: 24 }}>
          <View
            style={{ flexDirection: 'row', height: 12, gap: 2, borderRadius: 6, overflow: 'hidden' }}
            accessibilityLabel={[
              ...segments.map((s) => `${s.label} ${formatCLP(s.value)}`),
              `disponible ${formatCLP(Math.max(afterBills, 0))}`,
            ].join(', ')}
          >
            {segments.map((s) => (
              <View key={s.key} style={{ flexGrow: s.value, flexBasis: 0, minWidth: 3, backgroundColor: segmentColor(c, s.key) }} />
            ))}
            {showFree && <View style={{ flexGrow: Math.max(afterBills, 1), flexBasis: 0, backgroundColor: c.surface.hover }} />}
          </View>
          {(overspent || billsAtRisk) && (
            <View
              style={{
                position: 'absolute',
                top: -4,
                left: `${(income / scale) * 100}%`,
                marginLeft: -1,
                width: 2,
                height: 20,
                borderRadius: 1,
                backgroundColor: c.ink.DEFAULT,
              }}
            />
          )}
        </View>
        {segments.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4, marginTop: 12 }}>
            {segments.map((s) => (
              <LegendItem key={s.key} color={segmentColor(c, s.key)} label={s.label} />
            ))}
            {showFree && <LegendItem color={c.surface.hover} border={c.line.DEFAULT} label="Disponible" />}
          </View>
        )}
      </Card>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {OVERVIEW_TILES.map((type) => {
          const { value, change, good, share } = tileStats(type, summary, previous)
          const Arrow = change !== null && change > 0 ? ArrowUpRight : ArrowDownRight
          return (
            <StatCard key={type} icon={TYPE_ICON[type]} color={typeColor(c, type)} label={TYPE_INFO[type].plural} value={formatCLP(value)}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 6, marginTop: 4 }}>
                {share !== null && (
                  <Text size={12} tone="muted">{share > 0 && share < 0.005 ? '<1%' : formatPercent(share)} del ingreso</Text>
                )}
                {change !== null && change !== 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Arrow size={12} color={good ? c.positive : c.negative} />
                    <Text size={12} color={good ? c.positive : c.negative} accessibilityLabel={change > 0 ? 'Subió' : 'Bajó'}>
                      {formatPercent(Math.abs(change))}
                    </Text>
                    <Text size={12} tone="muted"> vs {formatMonthName(previousMonth).slice(0, 3)}</Text>
                  </View>
                )}
                {change === 0 && <Text size={12} tone="muted">Igual que {formatMonthName(previousMonth)}</Text>}
                {share === null && value === 0 && <Text size={12} tone="muted">Sin registros este mes</Text>}
              </View>
              {type === 'fixed' && pendingFixed > 0 && (
                <Text size={12} tone="muted" style={{ marginTop: 2 }}>
                  <Text size={12} tone="muted" amount>{formatCLP(pendingFixed)}</Text> por pagar
                </Text>
              )}
            </StatCard>
          )
        })}
      </View>
    </View>
  )
}

function LegendItem({ color, label, border }: { color: string; label: string; border?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color, borderWidth: border ? 1 : 0, borderColor: border }} />
      <Text size={12} tone="secondary">{label}</Text>
    </View>
  )
}
