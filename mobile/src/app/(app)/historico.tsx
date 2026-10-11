import { useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { ChartColumn, Percent, TrendingDown, Trophy } from 'lucide-react-native'
import { formatCLP, formatMonthLabel, formatPercent } from '@shared/format'
import { HISTORY_RANGES, SERIES, STACK, buildHistoryRows, historyStats, type HistoryRange } from '@shared/history'
import { TYPE_INFO } from '@shared/transaction-types'
import { CardTitle } from '@/components/cards'
import { HistoryChart } from '@/components/HistoryChart'
import { Screen } from '@/components/Screen'
import { useFinance } from '@/lib/finance-store'
import { useTheme } from '@/lib/theme'
import { TYPE_ICON, typeColor } from '@/lib/type-visuals'
import { Card } from '@/ui/Card'
import { EmptyState, PageHeader, SegmentedControl, StatCard } from '@/ui/misc'
import { Text } from '@/ui/Text'

const COLUMN = 104

export default function Historico() {
  const { palette: c } = useTheme()
  const { transactions } = useFinance()
  const [range, setRange] = useState<HistoryRange>(12)

  const rows = useMemo(() => buildHistoryRows(transactions, range), [transactions, range])
  const { avgExpenses, avgSavings, savingsRate, best } = historyStats(rows)

  const header = (
    <PageHeader
      title="Histórico"
      description="Cómo evolucionan tus ingresos, gastos y ahorro mes a mes."
      actions={
        <SegmentedControl
          options={HISTORY_RANGES.map((r) => ({ value: r, label: `${r} meses` }))}
          value={range}
          onChange={setRange}
          style={{ flex: 1 }}
        />
      }
    />
  )

  if (rows.length === 0) {
    return (
      <Screen>
        {header}
        <Card>
          <EmptyState icon={ChartColumn} title="Aún no hay datos para mostrar">
            Registra tus movimientos y aquí verás cómo evolucionan mes a mes.
          </EmptyState>
        </Card>
      </Screen>
    )
  }

  return (
    <Screen>
      {header}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <StatCard icon={TrendingDown} color={typeColor(c, 'variable')} label="Gasto promedio al mes" value={formatCLP(avgExpenses)} />
        <StatCard icon={TYPE_ICON.savings} color={typeColor(c, 'savings')} label="Ahorro promedio al mes" value={formatCLP(avgSavings)} />
        <StatCard icon={Percent} color={c.accent} label="Tasa de ahorro" value={savingsRate !== null ? formatPercent(savingsRate) : '—'} />
        <StatCard icon={Trophy} color={typeColor(c, 'income')} label="Mejor mes" value={best ? formatMonthLabel(best.month) : '—'}>
          {best && <Text size={12} tone="muted" style={{ marginTop: 2 }}>{formatCLP(best.available)} disponible</Text>}
        </StatCard>
      </View>

      <Card style={{ padding: 16 }}>
        <Text weight="semibold">Ingresos frente a gastos y ahorro</Text>
        <Text size={12} tone="muted" style={{ marginTop: 2 }}>
          Si la pila supera la línea de ingresos, ese mes gastaste más de lo que ganaste.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4, marginTop: 12, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 14, height: 2, borderRadius: 1, backgroundColor: c.series.income }} />
            <Text size={12} tone="secondary">Ingresos</Text>
          </View>
          {STACK.map((key) => (
            <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: typeColor(c, key) }} />
              <Text size={12} tone="secondary">{TYPE_INFO[key].plural}</Text>
            </View>
          ))}
        </View>
        <HistoryChart rows={rows} />
      </Card>

      <Card style={{ overflow: 'hidden' }}>
        <CardTitle title="Detalle por mes" />
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View>
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: c.line.muted }}>
              <Cell first header>Mes</Cell>
              {SERIES.map((key) => <Cell key={key} header>{TYPE_INFO[key].plural}</Cell>)}
              <Cell header>Disponible</Cell>
              <Cell header>% ahorro</Cell>
            </View>
            {[...rows].reverse().map((row, i) => (
              <View key={row.month} style={{ flexDirection: 'row', borderTopWidth: i > 0 ? 1 : 0, borderTopColor: c.line.muted }}>
                <Cell first>{formatMonthLabel(row.month)}</Cell>
                {SERIES.map((key) => <Cell key={key} muted={!row[key]}>{formatCLP(row[key])}</Cell>)}
                <Cell strong color={row.available < 0 ? c.negative : undefined}>{formatCLP(row.available)}</Cell>
                <Cell muted>{row.savingsRate !== null ? formatPercent(row.savingsRate) : '—'}</Cell>
              </View>
            ))}
          </View>
        </ScrollView>
      </Card>
    </Screen>
  )
}

interface CellProps {
  children: string
  first?: boolean
  header?: boolean
  muted?: boolean
  strong?: boolean
  color?: string
}

function Cell({ children, first, header, muted, strong, color }: CellProps) {
  return (
    <View style={{ width: first ? 128 : COLUMN, paddingHorizontal: 16, paddingVertical: 10 }}>
      <Text
        size={header ? 12 : 14}
        weight={header || strong ? 'medium' : 'regular'}
        tone={header ? 'secondary' : muted ? 'muted' : 'ink'}
        color={color}
        amount={!first}
        align={first ? 'left' : 'right'}
        numberOfLines={1}
      >
        {children}
      </Text>
    </View>
  )
}
