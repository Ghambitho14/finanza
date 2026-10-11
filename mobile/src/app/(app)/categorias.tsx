import { useState } from 'react'
import { View } from 'react-native'
import { Pencil, Plus, Trash2 } from 'lucide-react-native'
import { currentMonth, inMonth } from '@shared/calculations'
import { AMOUNT_COPY, deleteCategoryDescription, parseBudget } from '@shared/categories'
import { formatAmountInput, formatCLP } from '@shared/format'
import { TYPE_INFO, TYPE_ORDER } from '@shared/transaction-types'
import type { Category, TransactionType } from '@shared/types'
import { Screen } from '@/components/Screen'
import { errorMessage } from '@/lib/api'
import { useFinance } from '@/lib/finance-store'
import { useTheme } from '@/lib/theme'
import { Button, IconButton } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { ConfirmSheet } from '@/ui/ConfirmSheet'
import { AmountField, TextField } from '@/ui/Field'
import { PageHeader, TypeIcon } from '@/ui/misc'
import { Text } from '@/ui/Text'
import { useToast } from '@/ui/Toaster'

export default function Categorias() {
  const { categories, transactions } = useFinance()
  const [toDelete, setToDelete] = useState<Category | null>(null)

  const usage = new Map<string, number>()
  for (const t of transactions) {
    if (t.category_id) usage.set(t.category_id, (usage.get(t.category_id) ?? 0) + 1)
  }
  const spentThisMonth = new Map<string, number>()
  for (const t of inMonth(transactions, currentMonth())) {
    if (t.category_id) spentThisMonth.set(t.category_id, (spentThisMonth.get(t.category_id) ?? 0) + t.amount)
  }

  return (
    <Screen>
      <PageHeader
        title="Categorías"
        description="Organiza tus movimientos, registra tus cuentas fijas y define cuánto quieres gastar al mes."
      />

      {TYPE_ORDER.map((type) => (
        <TypeSection
          key={type}
          type={type}
          categories={categories.filter((cat) => cat.type === type)}
          usage={usage}
          spentThisMonth={spentThisMonth}
          onDelete={setToDelete}
        />
      ))}

      <DeleteCategorySheet
        category={toDelete}
        usage={toDelete ? usage.get(toDelete.id) ?? 0 : 0}
        onClose={() => setToDelete(null)}
      />
    </Screen>
  )
}

interface SectionProps {
  type: TransactionType
  categories: Category[]
  usage: Map<string, number>
  spentThisMonth: Map<string, number>
  onDelete: (category: Category) => void
}

function TypeSection({ type, categories, usage, spentThisMonth, onDelete }: SectionProps) {
  const { palette: c } = useTheme()
  const { createCategory } = useFinance()
  const toast = useToast()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')
  const [error, setError] = useState('')
  const amountCopy = AMOUNT_COPY[type]

  const handleCreate = async () => {
    const parsedBudget = parseBudget(budget)
    if (!name.trim()) return setError('Escribe un nombre')
    if (parsedBudget === 'invalid') return setError('Monto inválido')
    setError('')
    try {
      await createCategory({ name: name.trim(), type, budget: amountCopy ? parsedBudget : null })
      toast({ text: `Categoría «${name.trim()}» creada` })
      setName('')
      setBudget('')
    } catch (err) {
      setError(errorMessage(err, 'No se pudo crear'))
    }
  }

  return (
    <Card>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: c.line.DEFAULT,
        }}
      >
        <TypeIcon type={type} size="sm" />
        <Text weight="semibold" style={{ flex: 1 }}>{type === 'fixed' ? 'Cuentas fijas' : TYPE_INFO[type].plural}</Text>
        <Text size={12} tone="muted">{categories.length} {categories.length === 1 ? 'categoría' : 'categorías'}</Text>
      </View>

      {amountCopy && (
        <Text size={12} tone="muted" style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.line.muted }}>
          {amountCopy.hint}
        </Text>
      )}

      {categories.map((cat, i) =>
        editingId === cat.id ? (
          <EditRow key={cat.id} category={cat} onDone={() => setEditingId(null)} />
        ) : (
          <View
            key={cat.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 8,
              paddingLeft: 16,
              paddingRight: 8,
              borderTopWidth: i > 0 ? 1 : 0,
              borderTopColor: c.line.muted,
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1}>{cat.name}</Text>
              <Text size={12} tone="muted" style={{ marginTop: 2 }}>
                {usage.get(cat.id) ?? 0} {usage.get(cat.id) === 1 ? 'movimiento' : 'movimientos'}
                {spentThisMonth.get(cat.id) ? ` · ${formatCLP(spentThisMonth.get(cat.id)!)} este mes` : ''}
              </Text>
            </View>
            {amountCopy && (
              <Text size={12} amount tone={cat.budget ? 'ink' : 'muted'}>
                {cat.budget ? `${formatCLP(cat.budget)} / mes` : amountCopy.empty}
              </Text>
            )}
            <View style={{ flexDirection: 'row' }}>
              <IconButton icon={Pencil} size={14} label={`Editar ${cat.name}`} onPress={() => setEditingId(cat.id)} />
              <IconButton icon={Trash2} size={14} label={`Eliminar ${cat.name}`} onPress={() => onDelete(cat)} />
            </View>
          </View>
        ),
      )}

      <View
        style={{ padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: c.line.muted }}
        accessibilityLabel={`Nueva categoría de ${TYPE_INFO[type].plural.toLowerCase()}`}
      >
        <TextField
          value={name}
          onChangeText={setName}
          placeholder={type === 'fixed' ? 'Nueva cuenta (ej: luz)' : 'Nueva categoría'}
          accessibilityLabel="Nombre de la categoría"
          maxLength={60}
          returnKeyType="done"
          onSubmitEditing={amountCopy ? undefined : handleCreate}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {amountCopy && (
            <View style={{ flex: 1 }}>
              <AmountField
                value={budget}
                onChangeText={setBudget}
                placeholder={amountCopy.field}
                accessibilityLabel={`${amountCopy.field} (opcional)`}
              />
            </View>
          )}
          <Button variant="secondary" icon={Plus} onPress={handleCreate} style={amountCopy ? undefined : { flex: 1 }}>Agregar</Button>
        </View>
        {error ? <Text size={12} color={c.negative} accessibilityRole="alert">{error}</Text> : null}
      </View>
    </Card>
  )
}

function EditRow({ category, onDone }: { category: Category; onDone: () => void }) {
  const { palette: c } = useTheme()
  const { updateCategory } = useFinance()
  const [name, setName] = useState(category.name)
  const [budget, setBudget] = useState(category.budget ? formatAmountInput(category.budget) : '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const amountCopy = AMOUNT_COPY[category.type]

  const handleSubmit = async () => {
    const parsedBudget = parseBudget(budget)
    if (!name.trim()) return setError('Escribe un nombre')
    if (parsedBudget === 'invalid') return setError('Monto inválido')
    setSaving(true)
    try {
      await updateCategory(category.id, { name: name.trim(), budget: amountCopy ? parsedBudget : null })
      onDone()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo guardar'))
      setSaving(false)
    }
  }

  return (
    <View style={{ padding: 12, gap: 8, backgroundColor: c.surface.raised }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <TextField value={name} onChangeText={setName} accessibilityLabel="Nombre de la categoría" maxLength={60} autoFocus />
        </View>
        {amountCopy && (
          <View style={{ flex: 1 }}>
            <AmountField value={budget} onChangeText={setBudget} placeholder={amountCopy.empty} accessibilityLabel={`${amountCopy.field} (opcional)`} />
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="ghost" small onPress={onDone}>Cancelar</Button>
        <Button small onPress={handleSubmit} disabled={saving}>Guardar</Button>
      </View>
      {error ? <Text size={12} color={c.negative} accessibilityRole="alert">{error}</Text> : null}
    </View>
  )
}

function DeleteCategorySheet({ category, usage, onClose }: { category: Category | null; usage: number; onClose: () => void }) {
  const { deleteCategory } = useFinance()
  const toast = useToast()
  // El nombre se conserva mientras la hoja baja
  const [last, setLast] = useState<Category | null>(category)
  if (category && category !== last) setLast(category)

  return (
    <ConfirmSheet
      open={category !== null}
      title={`¿Eliminar «${last?.name ?? ''}»?`}
      description={deleteCategoryDescription(usage)}
      confirmLabel="Eliminar categoría"
      onClose={onClose}
      onConfirm={async () => {
        if (!category) return
        try {
          await deleteCategory(category.id)
          toast({ text: `Categoría «${category.name}» eliminada` })
          onClose()
        } catch (err) {
          toast({ kind: 'error', text: errorMessage(err, 'No se pudo eliminar') })
        }
      }}
    />
  )
}
