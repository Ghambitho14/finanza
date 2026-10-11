import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { router } from 'expo-router'
import { Check, Plus } from 'lucide-react-native'
import { byDateAsc, defaultDateForMonth, type FixedBill } from '@shared/calculations'
import { formatCLP, formatShortDate } from '@shared/format'
import { toInput } from '@shared/transaction-form'
import type { Transaction } from '@shared/types'
import { errorMessage } from '@/lib/api'
import { useFinance } from '@/lib/finance-store'
import { useTheme } from '@/lib/theme'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { ProgressBar, TypeIcon } from '@/ui/misc'
import { Text } from '@/ui/Text'
import { useToast } from '@/ui/Toaster'
import { CardTitle, CardActions } from './cards'
import { useTransactionEditor } from './TransactionEditor'
import { TransactionRow } from './TransactionRow'

interface Props {
  month: string
  bills: FixedBill[]
  others: Transaction[]
}

/**
 * Cuentas fijas como lista de pendientes: marcar una registra el pago con su
 * monto mensual; desmarcarla elimina el pago. Cada mes parten pendientes.
 */
export function FixedBillsCard({ month, bills, others }: Props) {
  const { palette: c } = useTheme()
  const { createTransaction, deleteTransaction } = useFinance()
  const { openNew, openEdit } = useTransactionEditor()
  const toast = useToast()
  const [busy, setBusy] = useState<Set<string>>(new Set())

  const paidTotal = bills.reduce((s, b) => s + b.paid, 0) + others.reduce((s, t) => s + t.amount, 0)
  const expectedTotal = bills.reduce((s, b) => s + (b.isPaid ? b.paid : b.category.budget), 0)
    + others.reduce((s, t) => s + t.amount, 0)
  const paidCount = bills.filter((b) => b.isPaid).length

  const setBillBusy = (id: string, value: boolean) =>
    setBusy((prev) => {
      const next = new Set(prev)
      if (value) next.add(id)
      else next.delete(id)
      return next
    })

  const undoFailed = (err: unknown) => toast({ kind: 'error', text: errorMessage(err, 'No se pudo deshacer') })

  const toggle = async (bill: FixedBill) => {
    const { category } = bill
    setBillBusy(category.id, true)
    try {
      if (!bill.isPaid) {
        const payment = await createTransaction({
          description: category.name,
          amount: category.budget,
          type: 'fixed',
          date: defaultDateForMonth(month),
          category_id: category.id,
          recurring: false,
        })
        toast({
          text: `${category.name}: pagado`,
          action: { label: 'Deshacer', onClick: () => void deleteTransaction(payment.id).catch(undoFailed) },
        })
      } else {
        const payments = bill.payments
        await Promise.all(payments.map((p) => deleteTransaction(p.id)))
        toast({
          text: `${category.name}: pendiente`,
          action: {
            label: 'Deshacer',
            onClick: () => payments.forEach((p) => void createTransaction(toInput(p)).catch(undoFailed)),
          },
        })
      }
    } catch (err) {
      toast({ kind: 'error', text: errorMessage(err, 'No se pudo actualizar la cuenta') })
    } finally {
      setBillBusy(category.id, false)
    }
  }

  // Sin pagar: abre un pago prellenado (para registrar otro monto o fecha).
  // Pagada: edita el pago.
  const openBill = (bill: FixedBill) => {
    if (bill.isPaid) {
      openEdit(bill.payments[0])
      return
    }
    openNew({
      type: 'fixed',
      date: defaultDateForMonth(month),
      description: bill.category.name,
      amount: bill.category.budget,
      category_id: bill.category.id,
    })
  }

  return (
    <Card>
      <CardTitle
        icon={<TypeIcon type="fixed" />}
        title="Cuentas del mes"
        subtitle={bills.length > 0
          ? `${paidCount} de ${bills.length} ${bills.length === 1 ? 'cuenta pagada' : 'cuentas pagadas'}`
          : 'Arriendo, luz, internet…'}
        right={
          <Text weight="semibold" amount>
            {formatCLP(paidTotal)}
            {expectedTotal > paidTotal && <Text tone="muted"> de {formatCLP(expectedTotal)}</Text>}
          </Text>
        }
      />

      {bills.length > 0 && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <ProgressBar ratio={expectedTotal ? paidTotal / expectedTotal : 0} color={c.series.fixed} />
        </View>
      )}

      {bills.length === 0 ? (
        <Text tone="muted" align="center" style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
          Agrega tus cuentas con su monto mensual en{' '}
          <Text weight="medium" color={c.accent} onPress={() => router.navigate('/categorias')}>Categorías</Text>{' '}
          y aquí podrás marcarlas como pagadas cada mes.
        </Text>
      ) : (
        <View style={{ paddingVertical: 6 }}>
          {bills.map((bill) => {
            const { category, isPaid, paid } = bill
            const differs = isPaid && paid !== category.budget
            const disabled = busy.has(category.id)
            return (
              <View key={category.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 16 }}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isPaid, disabled }}
                  accessibilityLabel={`${category.name} pagado`}
                  disabled={disabled}
                  hitSlop={10}
                  onPress={() => toggle(bill)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: isPaid ? c.status.good : c.ink.muted,
                    backgroundColor: isPaid ? c.status.good : 'transparent',
                    opacity: disabled ? 0.5 : 1,
                  }}
                >
                  {isPaid && <Check size={13} strokeWidth={3} color={c.page} />}
                </Pressable>
                <Pressable
                  onPress={() => openBill(bill)}
                  accessibilityRole="button"
                  accessibilityLabel={isPaid ? `Editar pago de ${category.name}` : `Registrar pago de ${category.name} con otro monto`}
                  style={({ pressed }) => ({
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 10,
                    paddingRight: 16,
                    backgroundColor: pressed ? c.surface.raised : 'transparent',
                  })}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text tone={isPaid ? 'secondary' : 'ink'} numberOfLines={1}>{category.name}</Text>
                    <Text size={12} tone="muted" style={{ marginTop: 2 }}>
                      {isPaid ? `Pagado el ${formatShortDate(bill.payments[0].date)}` : 'Pendiente'}
                      {differs ? ` · previsto ${formatCLP(category.budget)}` : ''}
                    </Text>
                  </View>
                  <Text weight="medium" amount tone={isPaid ? 'secondary' : 'ink'}>
                    {formatCLP(isPaid ? paid : category.budget)}
                  </Text>
                </Pressable>
              </View>
            )
          })}
        </View>
      )}

      {others.length > 0 && (
        <>
          <Text
            size={12}
            weight="medium"
            tone="muted"
            style={{ borderTopWidth: 1, borderTopColor: c.line.muted, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}
          >
            Otros gastos fijos
          </Text>
          {[...others].sort(byDateAsc).map((t, i) => <TransactionRow key={t.id} transaction={t} divider={i > 0} />)}
        </>
      )}

      <CardActions>
        <Button variant="ghost" small icon={Plus} onPress={() => router.navigate('/categorias')}>Nueva cuenta fija</Button>
        <Button variant="ghost" small icon={Plus} onPress={() => openNew({ type: 'fixed', date: defaultDateForMonth(month) })}>
          Otro gasto fijo
        </Button>
      </CardActions>
    </Card>
  )
}
