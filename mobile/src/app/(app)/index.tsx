import { useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Coins, Plus, Repeat, X } from 'lucide-react-native'
import {
  SMALL_EXPENSE_LIMIT,
  byDateAsc,
  byDateDesc,
  currentMonth,
  defaultDateForMonth,
  fixedBillsForMonth,
  groupByDate,
  inMonth,
  isMonthKey,
  missingRecurring,
  prevMonth,
  smallExpenses,
  summarize,
} from '@shared/calculations'
import { formatCLP, formatDayHeading, formatMonthName } from '@shared/format'
import { withAlpha } from '@shared/theme'
import type { Transaction, TransactionType } from '@shared/types'
import { CardActions, CardTitle } from '@/components/cards'
import { CategorySpendingCard } from '@/components/CategorySpendingCard'
import { FixedBillsCard } from '@/components/FixedBillsCard'
import { GettingStarted } from '@/components/GettingStarted'
import { MonthNav } from '@/components/MonthNav'
import { MonthOverview } from '@/components/MonthOverview'
import { QuickAddExpense, type QuickAddHandle } from '@/components/QuickAddExpense'
import { Screen } from '@/components/Screen'
import { useTransactionEditor } from '@/components/TransactionEditor'
import { DayHeader, TransactionRow } from '@/components/TransactionRow'
import { errorMessage } from '@/lib/api'
import { useFinance } from '@/lib/finance-store'
import { storage } from '@/lib/storage'
import { useTheme } from '@/lib/theme'
import { Button, IconButton } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { PageHeader, TypeIcon } from '@/ui/misc'
import { Text } from '@/ui/Text'
import { useToast } from '@/ui/Toaster'

const DISMISS_KEY = 'finanzas:recurrentes-ocultos'

function readDismissed(): string[] {
  try {
    return JSON.parse(storage.get(DISMISS_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export default function Resumen() {
  const { palette: c } = useTheme()
  const params = useLocalSearchParams<{ mes?: string }>()
  const month = isMonthKey(params.mes ?? null) ? params.mes! : currentMonth()
  const setMonth = (next: string) => router.setParams({ mes: next === currentMonth() ? undefined : next })

  const { transactions, categories } = useFinance()
  const { openNew } = useTransactionEditor()
  const scrollRef = useRef<ScrollView>(null)
  const quickAddRef = useRef<QuickAddHandle>(null)
  const variableCardY = useRef(0)

  const monthTxs = inMonth(transactions, month)
  const previous = prevMonth(month)
  const summary = summarize(monthTxs)
  const previousSummary = summarize(inMonth(transactions, previous))
  const ofType = (...types: TransactionType[]) => monthTxs.filter((t) => types.includes(t.type))

  const variable = ofType('variable').sort(byDateDesc)
  const fixed = fixedBillsForMonth(monthTxs, categories)
  const incomeAndSavings = ofType('income', 'savings').sort(byDateAsc)
  const small = smallExpenses(monthTxs)
  const newDefaults = (type: TransactionType) => ({ type, date: defaultDateForMonth(month) })

  const goToQuickAdd = () => {
    scrollRef.current?.scrollTo({ y: Math.max(variableCardY.current - 16, 0), animated: true })
    setTimeout(() => quickAddRef.current?.focus(), 300)
  }

  return (
    <Screen scrollRef={scrollRef}>
      <PageHeader
        title="Resumen"
        description="Cuánto te queda, qué falta por pagar y en qué se va tu plata."
        actions={<MonthNav month={month} onChange={setMonth} />}
      />

      <GettingStarted onQuickAdd={goToQuickAdd} />

      <MonthOverview summary={summary} previous={previousSummary} previousMonth={previous} pendingFixed={fixed.pending} />

      <RecurringBanner key={month} month={month} transactions={transactions} />

      <View onLayout={(e) => { variableCardY.current = e.nativeEvent.layout.y }}>
        <Card>
          <CardTitle
            icon={<TypeIcon type="variable" />}
            title="Gastos variables"
            subtitle="Compras del día a día: comida, antojos, transporte"
            right={<Text weight="semibold" amount>{formatCLP(summary.variable)}</Text>}
          />
          <QuickAddExpense ref={quickAddRef} month={month} />
          {small.count > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: c.line.muted,
                backgroundColor: withAlpha(c.surface.raised, 0.5),
              }}
            >
              <Coins size={14} color={c.ink.muted} />
              <Text size={12} tone="secondary" style={{ flex: 1 }}>
                <Text size={12} weight="medium">Gastos hormiga:</Text>{' '}
                {small.count === 1 ? '1 compra' : `${small.count} compras`} de hasta {formatCLP(SMALL_EXPENSE_LIMIT)}{' '}
                {small.count === 1 ? 'suma' : 'suman'}{' '}
                <Text size={12} weight="medium" amount>{formatCLP(small.total)}</Text>
              </Text>
            </View>
          )}
          {variable.length === 0 ? (
            <Text tone="muted" align="center" style={{ paddingHorizontal: 16, paddingVertical: 32 }}>
              Sin gastos variables este mes. Anota el primero arriba.
            </Text>
          ) : (
            groupByDate(variable).map((group) => (
              <View key={group.date}>
                <DayHeader label={formatDayHeading(group.date)} total={group.total} />
                {group.items.map((t, i) => <TransactionRow key={t.id} transaction={t} dateStyle="none" divider={i > 0} />)}
              </View>
            ))
          )}
        </Card>
      </View>

      <TransactionListCard
        title="Ingresos y ahorro"
        subtitle="Sueldo, otras entradas y lo que apartas"
        items={incomeAndSavings}
        empty="Sin ingresos ni ahorro este mes."
        actions={[
          { label: 'Ingreso', onPress: () => openNew(newDefaults('income')) },
          { label: 'Ahorro', onPress: () => openNew(newDefaults('savings')) },
        ]}
      />

      <FixedBillsCard month={month} bills={fixed.bills} others={fixed.others} />
      <CategorySpendingCard monthTransactions={monthTxs} />
    </Screen>
  )
}

interface ListCardProps {
  title: string
  subtitle?: string
  items: Transaction[]
  empty: string
  actions: { label: string; onPress: () => void }[]
}

function TransactionListCard({ title, subtitle, items, empty, actions }: ListCardProps) {
  return (
    <Card>
      <CardTitle icon={<TypeIcon type="income" />} title={title} subtitle={subtitle} />
      {items.length === 0 ? (
        <Text tone="muted" align="center" style={{ paddingHorizontal: 16, paddingVertical: 24 }}>{empty}</Text>
      ) : (
        items.map((t, i) => <TransactionRow key={t.id} transaction={t} showType divider={i > 0} />)
      )}
      <CardActions>
        {actions.map((a) => (
          <Button key={a.label} variant="ghost" small icon={Plus} onPress={a.onPress}>{a.label}</Button>
        ))}
      </CardActions>
    </Card>
  )
}

/** Ofrece copiar los recurrentes del mes anterior que faltan en este mes. */
function RecurringBanner({ month, transactions }: { month: string; transactions: Transaction[] }) {
  const { palette: c } = useTheme()
  const { cloneRecurring, categoryById } = useFinance()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [dismissed, setDismissed] = useState(() => readDismissed().includes(month))

  const missing = missingRecurring(transactions, month, categoryById)
  if (missing.length === 0 || dismissed) return null

  const previous = prevMonth(month)
  const total = missing.reduce((s, t) => s + t.amount, 0)
  const names = missing.slice(0, 3).map((t) => t.description).join(', ')
  const rest = missing.length - 3

  const handleCopy = async () => {
    setBusy(true)
    try {
      const { cloned } = await cloneRecurring(month)
      toast({ text: `${cloned} ${cloned === 1 ? 'movimiento copiado' : 'movimientos copiados'} de ${formatMonthName(previous)}` })
    } catch (err) {
      toast({ kind: 'error', text: errorMessage(err, 'No se pudieron copiar') })
    } finally {
      setBusy(false)
    }
  }

  const handleDismiss = () => {
    storage.set(DISMISS_KEY, JSON.stringify([...readDismissed(), month].slice(-24)))
    setDismissed(true)
  }

  return (
    <Card style={{ padding: 16, gap: 12, borderColor: withAlpha(c.accent, 0.3) }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: withAlpha(c.accent, 0.1), alignItems: 'center', justifyContent: 'center' }}>
          <Repeat size={16} color={c.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text weight="medium">
            {missing.length} {missing.length === 1 ? 'movimiento recurrente' : 'movimientos recurrentes'} de {formatMonthName(previous)} aún no {missing.length === 1 ? 'está' : 'están'} en {formatMonthName(month)}
          </Text>
          <Text size={12} tone="secondary" numberOfLines={1} style={{ marginTop: 2 }}>
            {names}{rest > 0 ? ` y ${rest} más` : ''} · {formatCLP(total)}
          </Text>
        </View>
        <IconButton icon={X} label="Ocultar sugerencia" onPress={handleDismiss} style={{ marginRight: -6, marginTop: -4 }} />
      </View>
      <Button variant="secondary" onPress={handleCopy} disabled={busy}>
        {busy ? 'Copiando…' : `Copiar a ${formatMonthName(month)}`}
      </Button>
    </Card>
  )
}
