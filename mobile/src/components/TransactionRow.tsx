import { Pressable, View } from 'react-native'
import { Repeat, Trash2 } from 'lucide-react-native'
import { formatCLP, formatShortDate } from '@shared/format'
import { signedAmount } from '@shared/transaction-types'
import type { Transaction } from '@shared/types'
import { useFinance } from '@/lib/finance-store'
import { useTheme } from '@/lib/theme'
import { typeColor } from '@/lib/type-visuals'
import { IconButton } from '@/ui/Button'
import { Dot } from '@/ui/Chip'
import { Text } from '@/ui/Text'
import { useDeleteTransaction, useTransactionEditor } from './TransactionEditor'

interface Props {
  transaction: Transaction
  /** Punto de color del tipo: útil en listas que mezclan tipos. */
  showType?: boolean
  /** Qué mostrar como fecha en la línea secundaria. */
  dateStyle?: 'short' | 'none'
  /** Línea divisoria arriba (todas menos la primera de la lista). */
  divider?: boolean
}

export function TransactionRow({ transaction: t, showType = false, dateStyle = 'short', divider = false }: Props) {
  const { palette: c } = useTheme()
  const { categoryById } = useFinance()
  const { openEdit } = useTransactionEditor()
  const deleteWithUndo = useDeleteTransaction()

  const category = t.category_id ? categoryById.get(t.category_id) : undefined
  const secondary = [category?.name ?? 'Sin categoría', dateStyle === 'short' ? formatShortDate(t.date) : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 8,
        borderTopWidth: divider ? 1 : 0,
        borderTopColor: c.line.muted,
      }}
    >
      <Pressable
        onPress={() => openEdit(t)}
        accessibilityRole="button"
        accessibilityLabel={`Editar ${t.description}, ${formatCLP(t.amount)}`}
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 10,
          paddingLeft: 16,
          paddingRight: 4,
          backgroundColor: pressed ? c.surface.raised : 'transparent',
        })}
      >
        {showType && <Dot color={typeColor(c, t.type)} />}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1}>{t.description}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Text size={12} tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>{secondary}</Text>
            {t.recurring && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text size={12} tone="muted">·</Text>
                <Repeat size={11} color={c.ink.muted} />
                <Text size={12} tone="muted">Mensual</Text>
              </View>
            )}
          </View>
        </View>
        <Text weight="medium" amount color={t.type === 'income' ? c.positive : c.ink.DEFAULT}>
          {signedAmount(t)}
        </Text>
      </Pressable>
      <IconButton icon={Trash2} size={14} label={`Eliminar ${t.description}`} onPress={() => deleteWithUndo(t)} />
    </View>
  )
}

/** Encabezado de un día dentro de una lista ("Hoy", total del día). */
export function DayHeader({ label, total }: { label: string; total: number }) {
  const { palette: c } = useTheme()
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 6,
        backgroundColor: c.surface.raised,
      }}
    >
      <Text size={12} tone="muted">{label}</Text>
      <Text size={12} tone="muted" amount>{formatCLP(total)}</Text>
    </View>
  )
}
