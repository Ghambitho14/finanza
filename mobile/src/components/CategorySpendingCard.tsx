import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { router } from 'expo-router'
import { CircleAlert, PieChart, TriangleAlert } from 'lucide-react-native'
import { spendingByCategory, summarize } from '@shared/calculations'
import { formatCLP, formatPercent } from '@shared/format'
import { moneyBreakdown, spendingBreakdown } from '@shared/spending'
import type { Transaction } from '@shared/types'
import { useFinance } from '@/lib/finance-store'
import { useTheme } from '@/lib/theme'
import { typeColor } from '@/lib/type-visuals'
import { Card } from '@/ui/Card'
import { Donut } from '@/ui/Donut'
import { EmptyState, ProgressBar } from '@/ui/misc'
import { Text } from '@/ui/Text'
import { CardTitle } from './cards'

export function CategorySpendingCard({ monthTransactions }: { monthTransactions: Transaction[] }) {
  const { palette: c } = useTheme()
  const { categories } = useFinance()
  const [active, setActive] = useState<string | null>(null)
  const rows = spendingByCategory(monthTransactions, categories)
  const hasBudgets = categories.some((cat) => cat.type === 'variable' && cat.budget)
  const money = moneyBreakdown(summarize(monthTransactions))
  const { total: variableTotal, legend } = spendingBreakdown(rows)

  return (
    <Card>
      <CardTitle
        title="En qué se va tu plata"
        subtitle="Gastos fijos, variables y ahorro del mes"
        right={
          <Text size={12} weight="medium" color={c.accent} onPress={() => router.navigate('/categorias')} accessibilityRole="link">
            {hasBudgets ? 'Editar presupuestos' : 'Definir presupuestos'}
          </Text>
        }
      />

      {money.total === 0 && rows.length === 0 ? (
        <EmptyState icon={PieChart} title="Sin gastos ni ahorro aún" compact>
          Cuando anotes gastos y ahorro verás aquí en qué se va tu plata. Ponles un presupuesto para saber cuánto te queda.
        </EmptyState>
      ) : (
        <>
          {money.segments.length > 0 && (
            <View style={{ alignItems: 'center', paddingHorizontal: 16, paddingTop: 20 }}>
              <Donut
                segments={money.segments.map((s) => ({ ...s, color: typeColor(c, s.key) }))}
                activeKey={active}
                center={
                  <View style={{ alignItems: 'center' }}>
                    <Text size={12} tone="secondary">Total</Text>
                    <Text size={16} weight="semibold" amount style={{ marginTop: 2 }}>{formatCLP(money.total)}</Text>
                  </View>
                }
              />
            </View>
          )}
          <View style={{ padding: 8, paddingTop: 16, gap: 4 }}>
            {money.parts.map((part) => (
              <Pressable
                key={part.key}
                disabled={part.value === 0}
                onPress={() => setActive((a) => (a === part.key ? null : part.key))}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 8,
                  backgroundColor: active === part.key ? c.surface.raised : 'transparent',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: typeColor(c, part.key) }} />
                  <Text numberOfLines={1} style={{ flexShrink: 1 }}>{part.label}</Text>
                  {money.total > 0 && part.value > 0 && <Text size={12} tone="muted">{formatPercent(part.value / money.total)}</Text>}
                </View>
                <Text weight="medium" amount>{formatCLP(part.value)}</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: c.line.muted }}>
            <Text size={12} weight="medium" tone="secondary" style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              Gastos variables por categoría
            </Text>
            {legend.length === 0 ? (
              <Text tone="muted" align="center" style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
                Sin gastos variables este mes.
              </Text>
            ) : (
              <View style={{ padding: 8, gap: 4 }}>
                {legend.map((row) => {
                  const fill = row.over ? c.status.critical : row.near ? c.status.warning : typeColor(c, 'variable')
                  return (
                    <View key={row.key} style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
                          <Text numberOfLines={1} style={{ flexShrink: 1 }}>{row.name}</Text>
                          {variableTotal > 0 && row.spent > 0 && (
                            <Text size={12} tone="muted">{formatPercent(row.spent / variableTotal)}</Text>
                          )}
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
                    </View>
                  )
                })}
              </View>
            )}
          </View>
        </>
      )}
    </Card>
  )
}
