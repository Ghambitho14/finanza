import { Tabs } from 'expo-router/js-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomNav, NAV, TAB_BAR_HEIGHT, TopBar } from '@/components/shell'
import { TransactionEditorProvider } from '@/components/TransactionEditor'
import { useAuth } from '@/lib/auth'
import { FinanceProvider } from '@/lib/finance-store'
import { useTheme } from '@/lib/theme'
import { useToastBottomInset } from '@/ui/Toaster'

export default function AppLayout() {
  const { session } = useAuth()
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  // Los avisos van por encima de la barra inferior
  useToastBottomInset(TAB_BAR_HEIGHT)

  // `key`: al cambiar de usuario, los datos del anterior no quedan en memoria
  return (
    <FinanceProvider key={session?.user.id}>
      <TransactionEditorProvider>
        <Tabs
          tabBar={(props) => <BottomNav {...props} />}
          screenOptions={{
            header: () => <TopBar />,
            sceneStyle: { backgroundColor: palette.page },
            tabBarHideOnKeyboard: true,
          }}
          safeAreaInsets={{ bottom: insets.bottom }}
        >
          {Object.entries(NAV).map(([name, { label }]) => (
            <Tabs.Screen key={name} name={name} options={{ title: label }} />
          ))}
        </Tabs>
      </TransactionEditorProvider>
    </FinanceProvider>
  )
}
