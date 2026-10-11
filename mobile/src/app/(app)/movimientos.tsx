import { useMemo, useState } from 'react'
import { FlatList, ScrollView, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeftRight, Download, Inbox, Plus, Search, SearchX, TrendingDown, Upload, X } from 'lucide-react-native'
import { summarize } from '@shared/calculations'
import { parseImportCSV, transactionsToCSV, type ParsedImport } from '@shared/csv'
import { formatCLP, formatMonthLabel, todayISO } from '@shared/format'
import {
  MAX_IMPORT_BYTES,
  PAGE_SIZE,
  PERIODS,
  filterTransactions,
  groupByMonth,
  importResultMessage,
  isPeriod,
  type Period,
} from '@shared/movements'
import { TYPE_INFO, TYPE_ORDER } from '@shared/transaction-types'
import type { TransactionType } from '@shared/types'
import { DataGate, SCREEN_PADDING, useRefresh } from '@/components/Screen'
import { useTransactionEditor } from '@/components/TransactionEditor'
import { TransactionRow } from '@/components/TransactionRow'
import { errorMessage } from '@/lib/api'
import { pickCSV, shareCSV, type PickedText } from '@/lib/csv-file'
import { useFinance } from '@/lib/finance-store'
import { useTheme } from '@/lib/theme'
import { TYPE_ICON, typeColor } from '@/lib/type-visuals'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { Chip, Dot } from '@/ui/Chip'
import { TextField } from '@/ui/Field'
import { EmptyState, PageHeader, StatCard } from '@/ui/misc'
import { SelectField } from '@/ui/SelectField'
import { Sheet } from '@/ui/Sheet'
import { Text } from '@/ui/Text'
import { useToast } from '@/ui/Toaster'

type Params = { tipo?: string; categoria?: string; periodo?: string }

export default function Movimientos() {
  return (
    <DataGate>
      <MovimientosList />
    </DataGate>
  )
}

function MovimientosList() {
  const { palette: c } = useTheme()
  const { transactions, categories, categoryById } = useFinance()
  const { openNew } = useTransactionEditor()
  const toast = useToast()
  const refresh = useRefresh()
  const params = useLocalSearchParams<Params>()
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(PAGE_SIZE)

  const type = (TYPE_ORDER.includes(params.tipo as TransactionType) ? params.tipo : '') as TransactionType | ''
  const categoryId = params.categoria ?? ''
  const period: Period = isPeriod(params.periodo) ? params.periodo : 'todo'

  const setFilter = (key: keyof Params, value: string) => {
    // La categoría depende del tipo
    router.setParams({ [key]: value || undefined, ...(key === 'tipo' ? { categoria: undefined } : {}) })
    setVisible(PAGE_SIZE)
  }
  const clearFilters = () => {
    setQuery('')
    router.setParams({ tipo: undefined, categoria: undefined, periodo: undefined })
    setVisible(PAGE_SIZE)
  }

  const filtered = useMemo(
    () => filterTransactions(transactions, categoryById, { query, type, categoryId, period }),
    [transactions, categoryById, query, type, categoryId, period],
  )

  const totals = summarize(filtered)
  const groups = groupByMonth(filtered.slice(0, visible))
  const filterCategories = type ? categories.filter((cat) => cat.type === type) : categories
  const hasFilters = !!(query || type || categoryId || period !== 'todo')

  const handleExport = async () => {
    try {
      await shareCSV(`finanzas-${todayISO()}.csv`, transactionsToCSV(filtered, categoryById))
    } catch (err) {
      toast({ kind: 'error', text: err instanceof Error ? err.message : 'No se pudo exportar' })
    }
  }

  const header = (
    <View style={{ gap: 24, marginBottom: 16 }}>
      <PageHeader
        title="Movimientos"
        description="Todos tus registros. Busca, filtra y exporta o importa desde Excel."
        actions={
          <>
            <ImportButton />
            <Button variant="secondary" icon={Download} onPress={handleExport} disabled={filtered.length === 0}>
              Exportar CSV
            </Button>
          </>
        }
      />

      <Card style={{ padding: 12, gap: 12 }} accessibilityRole="search">
        <View style={{ justifyContent: 'center' }}>
          <Search size={15} color={c.ink.muted} style={{ position: 'absolute', left: 12, zIndex: 1 }} />
          <TextField
            value={query}
            onChangeText={(v) => {
              setQuery(v)
              setVisible(PAGE_SIZE)
            }}
            placeholder="Buscar por descripción o categoría"
            accessibilityLabel="Buscar movimientos"
            returnKeyType="search"
            autoCorrect={false}
            style={{ paddingLeft: 36 }}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <SelectField
            title="Categoría"
            value={categoryId}
            onChange={(v) => setFilter('categoria', v)}
            options={[
              { value: '', label: 'Todas las categorías' },
              { value: 'none', label: 'Sin categoría' },
              ...filterCategories.map((cat) => ({
                value: cat.id,
                label: type ? cat.name : `${cat.name} · ${TYPE_INFO[cat.type].label.toLowerCase()}`,
              })),
            ]}
            style={{ flex: 1 }}
          />
          <SelectField
            title="Período"
            value={period}
            onChange={(v) => setFilter('periodo', v === 'todo' ? '' : v)}
            options={PERIODS}
            style={{ flex: 1 }}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} accessibilityLabel="Tipo">
          <Chip selected={!type} onPress={() => setFilter('tipo', '')}>Todos</Chip>
          {TYPE_ORDER.map((t) => (
            <Chip key={t} selected={type === t} onPress={() => setFilter('tipo', t)} leading={<Dot color={typeColor(c, t)} />}>
              {TYPE_INFO[t].plural}
            </Chip>
          ))}
        </ScrollView>
        {hasFilters && (
          <Button variant="ghost" small icon={X} onPress={clearFilters} style={{ alignSelf: 'flex-end' }}>Quitar filtros</Button>
        )}
      </Card>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <StatCard icon={ArrowLeftRight} color={c.accent} label="Movimientos" value={String(filtered.length)} />
        <StatCard icon={TYPE_ICON.income} color={typeColor(c, 'income')} label="Ingresos" value={`+${formatCLP(totals.income)}`} valueColor={c.positive} />
        <StatCard icon={TrendingDown} color={typeColor(c, 'variable')} label="Gastos" value={`−${formatCLP(totals.expenses)}`} />
        <StatCard icon={TYPE_ICON.savings} color={typeColor(c, 'savings')} label="Ahorro" value={formatCLP(totals.savings)} />
      </View>
    </View>
  )

  return (
    <FlatList
      data={groups}
      keyExtractor={(g) => g.month}
      refreshControl={refresh}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={SCREEN_PADDING}
      ListHeaderComponent={header}
      ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      ListEmptyComponent={
        <Card>
          {hasFilters ? (
            <EmptyState
              icon={SearchX}
              title="Ningún movimiento coincide con los filtros"
              action={<Button variant="secondary" onPress={clearFilters}>Quitar filtros</Button>}
            >
              Prueba con otra búsqueda u otro período.
            </EmptyState>
          ) : (
            <EmptyState
              icon={Inbox}
              title="Todavía no hay movimientos"
              action={<Button icon={Plus} onPress={() => openNew()}>Nuevo movimiento</Button>}
            >
              Registra tu primer ingreso o gasto, o importa tus datos desde un archivo CSV.
            </EmptyState>
          )}
        </Card>
      }
      renderItem={({ item: group }) => (
        <Card style={{ overflow: 'hidden' }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: c.line.muted,
            }}
          >
            <Text size={12} weight="medium">{formatMonthLabel(group.month)}</Text>
            <Text size={12} tone="secondary">
              {group.items.length} {group.items.length === 1 ? 'movimiento' : 'movimientos'}
            </Text>
          </View>
          {group.items.map((t, i) => <TransactionRow key={t.id} transaction={t} showType divider={i > 0} />)}
        </Card>
      )}
      ListFooterComponent={
        filtered.length > visible ? (
          <Button variant="secondary" onPress={() => setVisible((v) => v + PAGE_SIZE)} style={{ alignSelf: 'center', marginTop: 16 }}>
            {`Mostrar más (${filtered.length - visible} restantes)`}
          </Button>
        ) : null
      }
    />
  )
}

function ImportButton() {
  const { palette: c } = useTheme()
  const { importTransactions } = useFinance()
  const toast = useToast()
  const [parsed, setParsed] = useState<(ParsedImport & { fileName: string }) | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const handlePick = async () => {
    let picked: PickedText | 'too-big' | null
    try {
      picked = await pickCSV(MAX_IMPORT_BYTES)
    } catch {
      toast({ kind: 'error', text: 'No se pudo leer el archivo' })
      return
    }
    if (picked === null) return
    if (picked === 'too-big') {
      toast({ kind: 'error', text: 'El archivo es demasiado grande (máximo 1,5 MB)' })
      return
    }
    setParsed({ ...parseImportCSV(picked.text), fileName: picked.name })
    setOpen(true)
  }

  const handleImport = async () => {
    if (!parsed) return
    setBusy(true)
    try {
      toast({ text: importResultMessage(await importTransactions(parsed.rows)) })
      setOpen(false)
    } catch (err) {
      toast({ kind: 'error', text: errorMessage(err, 'No se pudo importar') })
    } finally {
      setBusy(false)
    }
  }

  const counts = parsed
    ? TYPE_ORDER.map((t) => ({ type: t, n: parsed.rows.filter((r) => r.type === t).length })).filter((x) => x.n > 0)
    : []

  return (
    <>
      <Button variant="secondary" icon={Upload} onPress={handlePick}>Importar CSV</Button>

      <Sheet
        open={open}
        title="Importar movimientos"
        description={parsed?.fileName}
        onClose={() => setOpen(false)}
        footer={
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="ghost" onPress={() => setOpen(false)}>Cancelar</Button>
            <Button onPress={handleImport} disabled={busy || !parsed || parsed.rows.length === 0}>
              {busy ? 'Importando…' : `Importar ${parsed?.rows.length ?? 0}`}
            </Button>
          </View>
        }
      >
        {parsed && (
          <View style={{ gap: 16 }}>
            {parsed.rows.length > 0 ? (
              <View style={{ borderRadius: 8, borderWidth: 1, borderColor: c.line.DEFAULT, backgroundColor: c.surface.raised, padding: 12 }}>
                <Text weight="medium">
                  {parsed.rows.length} {parsed.rows.length === 1 ? 'movimiento listo' : 'movimientos listos'} para importar
                </Text>
                <View style={{ marginTop: 8, gap: 4 }}>
                  {counts.map((x) => (
                    <View key={x.type} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Dot color={typeColor(c, x.type)} />
                      <Text tone="secondary">{TYPE_INFO[x.type].plural}: {x.n}</Text>
                    </View>
                  ))}
                </View>
                <Text size={12} tone="muted" style={{ marginTop: 8 }}>
                  Las filas que ya existen (misma fecha, tipo, monto y descripción) se omiten.
                </Text>
              </View>
            ) : (
              <Text tone="secondary">No se encontraron movimientos válidos en el archivo.</Text>
            )}

            {parsed.errors.length > 0 && (
              <View>
                <Text weight="medium" color={c.negative}>
                  {parsed.errors.length} {parsed.errors.length === 1 ? 'fila con problemas' : 'filas con problemas'} (no se importarán)
                </Text>
                <View style={{ marginTop: 4 }}>
                  {parsed.errors.slice(0, 50).map((e) => (
                    <Text key={e.line} size={12} tone="secondary">Fila {e.line}: {e.message}</Text>
                  ))}
                </View>
              </View>
            )}

            <Text size={12} tone="muted">
              Columnas: fecha, descripcion, monto, tipo (ingreso, gasto fijo, gasto variable o ahorro), categoria y recurrente
              (si/no). Exporta tus datos para ver un ejemplo del formato.
            </Text>
          </View>
        )}
      </Sheet>
    </>
  )
}
