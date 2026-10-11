import { useState, type ReactNode, type Ref } from 'react'
import { RefreshControl, ScrollView, View } from 'react-native'
import { CloudOff } from 'lucide-react-native'
import { useFinance } from '@/lib/finance-store'
import { useTheme } from '@/lib/theme'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { EmptyState, PageSkeleton } from '@/ui/misc'

/** Margen de las pantallas (px-4 pt-5 en el teléfono, como la web). */
export const SCREEN_PADDING = { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 }

/** Mientras cargan los datos muestra la silueta; si fallan, el aviso con Reintentar. */
export function DataGate({ children }: { children: ReactNode }) {
  const { status, loadError, reload } = useFinance()
  if (status === 'loading') {
    return (
      <View style={SCREEN_PADDING}>
        <PageSkeleton />
      </View>
    )
  }
  if (status === 'error') {
    return (
      <View style={SCREEN_PADDING}>
        <Card>
          <EmptyState
            icon={CloudOff}
            title="No se pudieron cargar tus datos"
            action={<Button variant="secondary" onPress={reload}>Reintentar</Button>}
          >
            {loadError}
          </EmptyState>
        </Card>
      </View>
    )
  }
  return <>{children}</>
}

/** Recargar deslizando hacia abajo. */
export function useRefresh() {
  const { reload } = useFinance()
  const { palette } = useTheme()
  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = async () => {
    setRefreshing(true)
    await reload()
    setRefreshing(false)
  }
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[palette.accent]}
      progressBackgroundColor={palette.surface.raised}
    />
  )
}

/** Pantalla con scroll, separación de 24 px entre bloques y recarga. */
export function Screen({ children, scrollRef }: { children: ReactNode; scrollRef?: Ref<ScrollView> }) {
  const refresh = useRefresh()
  return (
    <DataGate>
      <ScrollView
        ref={scrollRef}
        refreshControl={refresh}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[SCREEN_PADDING, { gap: 24 }]}
      >
        {children}
      </ScrollView>
    </DataGate>
  )
}
