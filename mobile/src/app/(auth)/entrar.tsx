import { useRef, useState } from 'react'
import { TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { AuthError, AuthScreen, FooterLink } from '@/components/AuthScreen'
import { authErrorMessage, useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { Button } from '@/ui/Button'
import { Label, PasswordField, TextField } from '@/ui/Field'
import { Text } from '@/ui/Text'

export default function Entrar() {
  const { signIn } = useAuth()
  const { palette } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const passwordRef = useRef<TextInput>(null)

  const handleSubmit = async () => {
    if (!email.trim() || !password) return setError('Escribe tu email y contraseña')
    setBusy(true)
    setError('')
    try {
      // Al entrar, el cambio de sesión lleva solo al resumen
      await signIn(email.trim(), password)
    } catch (err) {
      setError(authErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <AuthScreen
      title="Entrar a Finanzas"
      subtitle="Tus ingresos, gastos y ahorro, mes a mes."
      footer={<FooterLink prefix="¿No tienes cuenta?" label="Crear cuenta" onPress={() => router.replace('/registro')} />}
    >
      <View style={{ gap: 16 }}>
        <View>
          <Label>Email</Label>
          <TextField
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        </View>
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Label>Contraseña</Label>
            <Text size={12} color={palette.accent} onPress={() => router.push('/recuperar')} accessibilityRole="link">
              ¿La olvidaste?
            </Text>
          </View>
          <PasswordField
            ref={passwordRef}
            value={password}
            onChangeText={setPassword}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
          />
        </View>
        <AuthError message={error} />
        <Button onPress={handleSubmit} disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</Button>
      </View>
    </AuthScreen>
  )
}
