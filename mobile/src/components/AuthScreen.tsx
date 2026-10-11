import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as WebBrowser from 'expo-web-browser'
import { PRIVACY_PATH } from '@shared/legal'
import { WEB_URL } from '@/lib/env'
import { useTheme } from '@/lib/theme'
import { Card } from '@/ui/Card'
import { Text } from '@/ui/Text'
import { Brand } from './shell'

interface Props {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

/** Marco común de las pantallas de acceso (entrar, crear cuenta, recuperar). */
export function AuthScreen({ title, subtitle, children, footer }: Props) {
  const { palette: c } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: c.page }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 16,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 40,
        }}
      >
        <View style={{ width: '100%', maxWidth: 384, alignSelf: 'center' }}>
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ marginBottom: 16 }}>
              <Brand size="lg" />
            </View>
            <Text size={24} weight="semibold" tight align="center">{title}</Text>
            {subtitle ? <Text tone="secondary" align="center" style={{ marginTop: 6 }}>{subtitle}</Text> : null}
          </View>
          <Card style={{ padding: 20 }}>{children}</Card>
          {footer ? <View style={{ marginTop: 20, alignItems: 'center' }}>{footer}</View> : null}
          <Pressable
            onPress={() => WebBrowser.openBrowserAsync(WEB_URL + PRIVACY_PATH)}
            style={{ marginTop: 32, alignSelf: 'center', padding: 8 }}
            accessibilityRole="link"
          >
            <Text size={12} tone="muted">Política de privacidad</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

/** Mensaje de error del formulario. */
export function AuthError({ message }: { message: string }) {
  const { palette } = useTheme()
  if (!message) return null
  return <Text color={palette.negative} accessibilityRole="alert">{message}</Text>
}

/** Texto con un enlace en color de acento ("¿No tienes cuenta? Crear cuenta"). */
export function FooterLink({ prefix, label, onPress }: { prefix?: string; label: string; onPress: () => void }) {
  const { palette } = useTheme()
  return (
    <Text tone="secondary" align="center">
      {prefix ? `${prefix} ` : ''}
      <Text weight="medium" color={palette.accent} onPress={onPress} accessibilityRole="link">{label}</Text>
    </Text>
  )
}
