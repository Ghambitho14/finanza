import { useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { Check, Rocket, X } from 'lucide-react-native'
import { isFixedBill } from '@shared/calculations'
import { withAlpha } from '@shared/theme'
import { useAuth } from '@/lib/auth'
import { useFinance } from '@/lib/finance-store'
import { storage } from '@/lib/storage'
import { useTheme } from '@/lib/theme'
import { Button, IconButton } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { ProgressBar } from '@/ui/misc'
import { Text } from '@/ui/Text'
import { useTransactionEditor } from './TransactionEditor'

interface Step {
  id: string
  title: string
  text: string
  done: boolean
  action: { label: string; onPress: () => void }
}

/**
 * Lista de primeros pasos para quien recién empieza. Cada paso se marca solo
 * a partir de sus datos; la guía desaparece al completarlos o al ocultarla.
 */
export function GettingStarted({ onQuickAdd }: { onQuickAdd: () => void }) {
  const { palette: c } = useTheme()
  const { transactions, categories } = useFinance()
  const { session } = useAuth()
  const { openNew } = useTransactionEditor()
  const storageKey = `finanzas:guia-oculta:${session?.user.id ?? ''}`
  const [hidden, setHidden] = useState(() => storage.get(storageKey) === '1')

  const steps: Step[] = [
    {
      id: 'income',
      title: 'Registra tu ingreso',
      text: 'Tu sueldo u otra entrada de dinero. Es la base para saber cuánto te queda.',
      done: transactions.some((t) => t.type === 'income'),
      action: { label: 'Agregar ingreso', onPress: () => openNew({ type: 'income' }) },
    },
    {
      id: 'bills',
      title: 'Pon el monto de tus cuentas fijas',
      text: 'Arriendo, luz, internet… Así cada mes las marcas como pagadas con un clic.',
      done: categories.some(isFixedBill),
      action: { label: 'Ir a categorías', onPress: () => router.navigate('/categorias') },
    },
    {
      id: 'budget',
      title: 'Define un presupuesto',
      text: 'Un tope mensual para supermercado, delivery u otra categoría de gasto variable.',
      done: categories.some((cat) => cat.type === 'variable' && cat.budget),
      action: { label: 'Definir presupuesto', onPress: () => router.navigate('/categorias') },
    },
    {
      id: 'expense',
      title: 'Anota tu primer gasto',
      text: 'Escribe en qué gastaste y cuánto. Toma segundos.',
      done: transactions.some((t) => t.type === 'variable'),
      action: { label: 'Anotar gasto', onPress: onQuickAdd },
    },
  ]

  const doneCount = steps.filter((s) => s.done).length
  if (hidden || doneCount === steps.length) return null

  const hide = () => {
    storage.set(storageKey, '1')
    setHidden(true)
  }

  return (
    <Card style={{ overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 20, paddingBottom: 16 }}>
        <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: withAlpha(c.accent, 0.1), alignItems: 'center', justifyContent: 'center' }}>
          <Rocket size={17} color={c.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text size={16} weight="semibold">Primeros pasos</Text>
          <Text tone="secondary" style={{ marginTop: 2 }}>Completa estos pasos y tendrás tu mes bajo control.</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <ProgressBar ratio={doneCount / steps.length} color={c.accent} style={{ flex: 1 }} />
            <Text size={12} weight="medium" tone="secondary">{doneCount} de {steps.length}</Text>
          </View>
        </View>
        <IconButton icon={X} label="Ocultar primeros pasos" onPress={hide} style={{ marginRight: -6, marginTop: -4 }} />
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: c.line.muted }}>
        {steps.map((step, i) => (
          <View
            key={step.id}
            style={{ flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: c.line.muted }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: step.done ? c.status.good : 'transparent',
                borderWidth: step.done ? 0 : 1,
                borderColor: c.line.DEFAULT,
              }}
            >
              {step.done
                ? <Check size={13} strokeWidth={3} color="#ffffff" />
                : <Text size={12} weight="semibold" tone="secondary">{i + 1}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                weight="medium"
                tone={step.done ? 'muted' : 'ink'}
                style={step.done ? { textDecorationLine: 'line-through' } : undefined}
                accessibilityLabel={step.done ? `${step.title} (listo)` : undefined}
              >
                {step.title}
              </Text>
              {!step.done && (
                <>
                  <Text size={12} tone="secondary" style={{ marginTop: 2 }}>{step.text}</Text>
                  <Button variant="secondary" small onPress={step.action.onPress} style={{ alignSelf: 'flex-start', marginTop: 10 }}>
                    {step.action.label}
                  </Button>
                </>
              )}
            </View>
          </View>
        ))}
      </View>
    </Card>
  )
}
