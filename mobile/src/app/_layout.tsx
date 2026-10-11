import { useEffect } from 'react'
import { View } from 'react-native'
import { Stack, SplashScreen, type ErrorBoundaryProps } from 'expo-router'
import { useFonts } from 'expo-font'
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular'
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium'
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold'
import { CircleAlert } from 'lucide-react-native'
import { AuthProvider, useAuth } from '@/lib/auth'
import { env } from '@/lib/env'
import { ThemeProvider, useTheme } from '@/lib/theme'
import { Button } from '@/ui/Button'
import { EmptyState } from '@/ui/misc'
import { ToastProvider } from '@/ui/Toaster'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold })
  const ready = fontsLoaded || !!fontError

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          {ready && <Navigation />}
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

function Navigation() {
  const { session, loading } = useAuth()
  const { palette } = useTheme()

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync()
  }, [loading])

  if (!env.ok) return <MissingConfig />
  if (loading) return null

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.page }, animation: 'fade' }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  )
}

function MissingConfig() {
  const { palette } = useTheme()
  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: palette.page }}>
      <EmptyState icon={CircleAlert} title="Falta configurar la app">
        Faltan EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ver mobile/.env.example).
      </EmptyState>
    </View>
  )
}

/** Error inesperado en una pantalla (el ErrorBoundary de la web). */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <ThemeProvider>
      <ErrorScreen retry={retry} />
    </ThemeProvider>
  )
}

function ErrorScreen({ retry }: { retry: () => Promise<void> }) {
  const { palette } = useTheme()
  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: palette.page }}>
      <EmptyState icon={CircleAlert} title="Algo salió mal" action={<Button onPress={retry}>Reintentar</Button>}>
        Tus datos están a salvo. Vuelve a intentarlo para continuar.
      </EmptyState>
    </View>
  )
}
