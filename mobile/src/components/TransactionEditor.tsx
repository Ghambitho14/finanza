import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { Trash2 } from 'lucide-react-native'
import { formatAmountInput, todayISO } from '@shared/format'
import { DESCRIPTION_EXAMPLES, shiftDays, toInput, validateTransaction } from '@shared/transaction-form'
import { TYPE_INFO, TYPE_ORDER, recurringByDefault } from '@shared/transaction-types'
import type { Transaction, TransactionType } from '@shared/types'
import { errorMessage } from '@/lib/api'
import { useFinance } from '@/lib/finance-store'
import { useTheme } from '@/lib/theme'
import { TYPE_ICON, typeColor } from '@/lib/type-visuals'
import { Button } from '@/ui/Button'
import { Chip } from '@/ui/Chip'
import { DateField } from '@/ui/DateField'
import { AmountField, Label, TextField } from '@/ui/Field'
import { IconTile, Switch } from '@/ui/misc'
import { Sheet } from '@/ui/Sheet'
import { Text } from '@/ui/Text'
import { useToast } from '@/ui/Toaster'

interface EditorDefaults {
  type?: TransactionType
  date?: string
  description?: string
  amount?: number
  category_id?: string
}

type EditorState =
  | { mode: 'new'; defaults: EditorDefaults }
  | { mode: 'edit'; transaction: Transaction }

interface EditorApi {
  openNew: (defaults?: EditorDefaults) => void
  openEdit: (transaction: Transaction) => void
}

const EditorContext = createContext<EditorApi | null>(null)

/** Elimina con un aviso que permite deshacer (vuelve a crear el movimiento). */
export function useDeleteTransaction() {
  const { deleteTransaction, createTransaction } = useFinance()
  const toast = useToast()

  return useCallback(async (t: Transaction): Promise<boolean> => {
    try {
      await deleteTransaction(t.id)
    } catch (err) {
      toast({ kind: 'error', text: errorMessage(err, 'No se pudo eliminar') })
      return false
    }
    toast({
      text: `Eliminado: ${t.description}`,
      action: {
        label: 'Deshacer',
        onClick: () => {
          createTransaction(toInput(t)).catch((err) =>
            toast({ kind: 'error', text: errorMessage(err, 'No se pudo restaurar') }),
          )
        },
      },
    })
    return true
  }, [deleteTransaction, createTransaction, toast])
}

export function TransactionEditorProvider({ children }: { children: ReactNode }) {
  // El estado se conserva al cerrar para que la hoja baje con su contenido
  const [state, setState] = useState<EditorState | null>(null)
  const [open, setOpen] = useState(false)
  // Cada apertura es un formulario nuevo (key distinta)
  const [session, setSession] = useState(0)

  const api = useMemo<EditorApi>(() => ({
    openNew: (defaults = {}) => {
      setSession((n) => n + 1)
      setState({ mode: 'new', defaults })
      setOpen(true)
    },
    openEdit: (transaction) => {
      setSession((n) => n + 1)
      setState({ mode: 'edit', transaction })
      setOpen(true)
    },
  }), [])

  return (
    <EditorContext.Provider value={api}>
      {children}
      {state && <TransactionSheet key={session} state={state} open={open} onClose={() => setOpen(false)} />}
    </EditorContext.Provider>
  )
}

export function useTransactionEditor(): EditorApi {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useTransactionEditor debe usarse dentro de TransactionEditorProvider')
  return ctx
}

function TransactionSheet({ state, open, onClose }: { state: EditorState; open: boolean; onClose: () => void }) {
  const { palette: c } = useTheme()
  const { categories, createTransaction, updateTransaction } = useFinance()
  const deleteWithUndo = useDeleteTransaction()
  const toast = useToast()

  const editing = state.mode === 'edit' ? state.transaction : null
  const defaults = state.mode === 'new' ? state.defaults : {}
  const initialType = editing?.type ?? defaults.type ?? 'variable'
  const initialAmount = editing?.amount ?? defaults.amount

  const [type, setType] = useState<TransactionType>(initialType)
  const [description, setDescription] = useState(editing?.description ?? defaults.description ?? '')
  const [amount, setAmount] = useState(initialAmount ? formatAmountInput(initialAmount) : '')
  const [date, setDate] = useState(editing?.date ?? defaults.date ?? todayISO())
  const [categoryId, setCategoryId] = useState(editing?.category_id ?? defaults.category_id ?? '')
  const [recurring, setRecurring] = useState(editing?.recurring ?? recurringByDefault(initialType))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const typeCategories = categories.filter((cat) => cat.type === type)

  const handleTypeChange = (next: TransactionType) => {
    setType(next)
    // Las categorías son por tipo: la elegida deja de valer al cambiarlo
    setCategoryId('')
    if (!editing) setRecurring(recurringByDefault(next))
  }

  const handleSubmit = async () => {
    const result = validateTransaction({ type, description, amount, date, categoryId, recurring })
    if ('error' in result) return setError(result.error)

    setSaving(true)
    setError('')
    try {
      if (editing) {
        await updateTransaction(editing.id, result.input)
        toast({ text: 'Cambios guardados' })
      } else {
        await createTransaction(result.input)
        toast({ text: `${TYPE_INFO[type].label} agregado` })
      }
      onClose()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo guardar'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (editing && (await deleteWithUndo(editing))) onClose()
  }

  const today = todayISO()
  const yesterday = shiftDays(today, -1)

  const footer = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {editing && (
        <Button variant="ghost" icon={Trash2} onPress={handleDelete} style={{ paddingHorizontal: 10 }}>
          Eliminar
        </Button>
      )}
      <View style={{ marginLeft: 'auto', flexDirection: 'row', gap: 8, flexShrink: 1 }}>
        <Button variant="ghost" onPress={onClose}>Cancelar</Button>
        <Button onPress={handleSubmit} disabled={saving} style={{ minWidth: 112, flexShrink: 1 }}>
          {saving ? 'Guardando…' : editing ? 'Guardar cambios' : `Agregar ${TYPE_INFO[type].label.toLowerCase()}`}
        </Button>
      </View>
    </View>
  )

  return (
    <Sheet open={open} title={editing ? 'Editar movimiento' : 'Nuevo movimiento'} onClose={onClose} footer={footer}>
      <View style={{ gap: 20 }}>
        <View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel="Tipo de movimiento">
            {TYPE_ORDER.map((t) => {
              const selected = type === t
              return (
                <Pressable
                  key={t}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => handleTypeChange(t)}
                  style={({ pressed }) => ({
                    flexBasis: '47%',
                    flexGrow: 1,
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 12,
                    paddingHorizontal: 8,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: selected ? c.ink.DEFAULT : pressed ? c.ink.muted : c.line.DEFAULT,
                    backgroundColor: selected ? c.surface.raised : 'transparent',
                  })}
                >
                  <IconTile icon={TYPE_ICON[t]} color={typeColor(c, t)} size={32} />
                  <Text size={13} weight={selected ? 'medium' : 'regular'} tone={selected ? 'ink' : 'secondary'}>
                    {TYPE_INFO[t].label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
          <Text size={12} tone="muted" style={{ marginTop: 8 }}>{TYPE_INFO[type].hint}</Text>
        </View>

        <View>
          <Label>Monto</Label>
          <AmountField size="lg" value={amount} onChangeText={setAmount} placeholder="0" autoFocus={!editing} />
        </View>

        <View>
          <Label>Descripción</Label>
          <TextField
            value={description}
            onChangeText={setDescription}
            placeholder={DESCRIPTION_EXAMPLES[type]}
            maxLength={200}
            autoComplete="off"
            returnKeyType="done"
          />
        </View>

        <View>
          <Label>Categoría</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <Chip selected={categoryId === ''} onPress={() => setCategoryId('')}>Sin categoría</Chip>
            {typeCategories.map((cat) => (
              <Chip key={cat.id} selected={categoryId === cat.id} onPress={() => setCategoryId(cat.id)}>
                {cat.name}
              </Chip>
            ))}
          </View>
        </View>

        <View>
          <Label>Fecha</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
            <Chip selected={date === today} onPress={() => setDate(today)}>Hoy</Chip>
            <Chip selected={date === yesterday} onPress={() => setDate(yesterday)}>Ayer</Chip>
            <DateField value={date} onChange={setDate} />
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: c.line.DEFAULT,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text>Se repite cada mes</Text>
            <Text size={12} tone="muted">Podrás copiarlo al mes siguiente con un clic.</Text>
          </View>
          <Switch value={recurring} onValueChange={setRecurring} />
        </View>

        {error ? <Text color={c.negative} accessibilityRole="alert">{error}</Text> : null}
      </View>
    </Sheet>
  )
}
