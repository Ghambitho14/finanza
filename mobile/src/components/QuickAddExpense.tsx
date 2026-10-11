import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { TextInput, View } from 'react-native'
import { Plus } from 'lucide-react-native'
import { defaultDateForMonth } from '@shared/calculations'
import { formatShortDate, parseAmountInput, todayISO } from '@shared/format'
import { errorMessage } from '@/lib/api'
import { useFinance } from '@/lib/finance-store'
import { useTheme } from '@/lib/theme'
import { Button } from '@/ui/Button'
import { AmountField, TextField } from '@/ui/Field'
import { SelectField } from '@/ui/SelectField'
import { Text } from '@/ui/Text'
import { useToast } from '@/ui/Toaster'

export interface QuickAddHandle {
  focus: () => void
}

/** Anotar un gasto chico en segundos: descripción, monto y listo. */
export const QuickAddExpense = forwardRef<QuickAddHandle, { month: string }>(function QuickAddExpense({ month }, ref) {
  const { palette: c } = useTheme()
  const { categories, createTransaction } = useFinance()
  const toast = useToast()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [saving, setSaving] = useState(false)
  const descriptionRef = useRef<TextInput>(null)
  const amountRef = useRef<TextInput>(null)

  useImperativeHandle(ref, () => ({ focus: () => descriptionRef.current?.focus() }), [])

  const date = defaultDateForMonth(month)
  const variableCategories = categories.filter((cat) => cat.type === 'variable')

  const handleSubmit = async () => {
    const parsed = parseAmountInput(amount)
    if (!description.trim()) {
      descriptionRef.current?.focus()
      return
    }
    if (Number.isNaN(parsed) || parsed <= 0) {
      toast({ kind: 'error', text: 'Escribe el monto del gasto' })
      return
    }

    setSaving(true)
    try {
      await createTransaction({
        description: description.trim(),
        amount: parsed,
        type: 'variable',
        date,
        category_id: categoryId || null,
        recurring: false,
      })
      setDescription('')
      setAmount('')
      setCategoryId('')
      descriptionRef.current?.focus()
    } catch (err) {
      toast({ kind: 'error', text: errorMessage(err, 'No se pudo guardar el gasto') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={{ padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: c.line.muted }} accessibilityLabel="Agregar gasto variable">
      <TextField
        ref={descriptionRef}
        value={description}
        onChangeText={setDescription}
        placeholder="¿En qué gastaste?"
        accessibilityLabel="Descripción del gasto"
        maxLength={200}
        autoComplete="off"
        returnKeyType="next"
        onSubmitEditing={() => amountRef.current?.focus()}
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <AmountField
            ref={amountRef}
            value={amount}
            onChangeText={setAmount}
            placeholder="Monto"
            accessibilityLabel="Monto del gasto"
          />
        </View>
        <SelectField
          title="Categoría del gasto"
          value={categoryId}
          onChange={setCategoryId}
          options={[{ value: '', label: 'Sin categoría' }, ...variableCategories.map((cat) => ({ value: cat.id, label: cat.name }))]}
          style={{ flex: 1 }}
        />
      </View>
      <Button variant="secondary" icon={Plus} onPress={handleSubmit} disabled={saving}>Agregar</Button>
      {date !== todayISO() && (
        <Text size={12} tone="muted">
          Se anotará con fecha {formatShortDate(date)}. Para otra fecha usa «Nuevo movimiento».
        </Text>
      )}
    </View>
  )
})
