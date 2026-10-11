import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { router } from 'expo-router'
import { CircleAlert, PieChart, TriangleAlert } from 'lucide-react-native'
import { spendingByCategory } from '@shared/calculations'
import { formatCLP, formatPercent } from '@shared/format'
import { spendingBreakdown, type DonutSlot } from '@shared/spending'
import { withAlpha, type Palette } from '@shared/theme'
import type { Transaction } from '@shared/types'
import { useFinance } from '@/lib/finance-store'
import { useTheme } from '@/lib/theme'
import { Card } from '@/ui/Card'
import { Donut } from '@/ui/Donut'
import { EmptyState, ProgressBar } from '@/ui/misc'
import { Text } from '@/ui/Text'
import { CardTitle } from './cards'

const slotColor = (c: Palette, slot: DonutSlot): string => (slot === 'other' ? withAlpha(c.ink.muted, 0.5) : c.chart[slot])

export function CategorySpendingCard({ monthTransactions }: { monthTransactions: Transaction[] }) {
  const { palette: c } = useTheme()
  const { categories } = useFinance()
  const [active, setActive] = useState<string | null>(null)
  const rows = spendingByCategory(monthTransactions, categories)
  const hasBudgets = categories.some((cat) => cat.type === 'variable' && cat.budget)
  const { total, segments, legend } = spendingBreakdown(rows)

  return (
    <Card>
      <CardTitle
        title="En qué se va tu plata"
        subtitle="Gastos variables por categoría"
        right={
          <Text size={12} weight="medium" color={c.accent} onPress={() => router.navigate('/categorias')} accessibilityRole="link">
            {hasBudgets ? 'Editar presupuestos' : 'Definir presupuestos'}
          </Text>
        }
      />

      {rows.length === 0 ? (
        <EmptyState icon={PieChart} title="Sin gastos variables aún" compact>
          Cuando anotes gastos verás aquí en qué se va tu plata. Ponles un presupuesto para saber cuánto te queda.
        </EmptyState>
      ) : (
        <>
          {segments.length > 0 && (
            <View style={{ alignItems: 'center', paddingHorizontal: 16, paddingTop: 20 }}>
              <Donut
                segments={segments.map((s) => ({ ...s, color: slotColor(c, s.slot) }))}
                activeKey={active}
                onActiveChange={setActive}
                center={
                  <View style={{ alignItems: 'center' }}>
                    <Text size={12} tone="secondary">Total</Text>
                    <Text size={16} weight="semibold" amount style={{ marginTop: 2 }}>{formatCLP(total)}</Text>
                  </View>
                }
              />
            </View>
          )}
          <View style={{ padding: 8, paddingTop: 16, gap: 4 }}>
            {legend.map((row) => {
              const fill = row.over ? c.status.critical : row.near ? c.status.warning : slotColor(c, row.slot)
              return (
                <Pressable
                  key={row.key}
                  disabled={row.spent === 0}
                  onPress={() => setActive((a) => (a === row.segmentKey ? null : row.segmentKey))}
                  style={{
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 8,
                    backgroundColor: active === row.segmentKey ? c.surface.raised : 'transparent',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: slotColor(c, row.slot) }} />
                      <Text numberOfLines={1} style={{ flexShrink: 1 }}>{row.name}</Text>
                      {total > 0 && row.spent > 0 && <Text size={12} tone="muted">{formatPercent(row.spent / total)}</Text>}
                    </View>
                    <Text weight="medium" amount>
                      {formatCLP(row.spent)}
                      {row.budget !== null && <Text tone="muted"> / {formatCLP(row.budget)}</Text>}
                    </Text>
                  </View>
                  {row.ratio !== null && row.budget !== null && (
                    <>
                      <ProgressBar ratio={Math.min(row.ratio, 1)} color={fill} style={{ marginTop: 8 }} />
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        {row.over && <CircleAlert size={12} color={c.status.critical} />}
                        {row.near && <TriangleAlert size={12} color={c.status.warning} />}
                        <Text size={12} tone="muted">
                          {row.over ? `Excedido por ${formatCLP(row.spent - row.budget)}` : `Quedan ${formatCLP(row.budget - row.spent)}`}
                        </Text>
                      </View>
                    </>
                  )}
                </Pressable>
              )
            })}
          </View>
        </>
      )}
    </Card>
  )
}
