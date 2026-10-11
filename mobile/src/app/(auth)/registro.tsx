import { useRef, useState } from 'react'
import { TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { MailCheck } from 'lucide-react-native'
import { AuthError, AuthScreen, FooterLink } from '@/components/AuthScreen'
import { MIN_PASSWORD_LENGTH, authErrorMessage, useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { Button } from '@/ui/Button'
import { Label, PasswordField, TextField } from '@/ui/Field'
import { Text } from '@/ui/Text'

export default function Registro() {
  const { signUp } = useAuth()
  const { palette } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const passwordRef = useRef<TextInput>(null)
  const confirmRef = useRef<TextInput>(null)

  const handleSubmit = async () => {
    if (!email.trim()) return setError('Escribe tu email')
    if (password.length < MIN_PASSWORD_LENGTH) {
      return setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`)
    }
    if (password !== confirm) return setError('Las contraseñas no coinciden')

    setBusy(true)
    setError('')
    try {
      const needsConfirmation = await signUp(email.trim(), password)
      // Sin confirmación pendiente, la sesión ya está activa y la app cambia sola
      if (needsConfirmation) setSentTo(email.trim())
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const toLogin = <FooterLink label="Volver a entrar" onPress={() => router.replace('/entrar')} />

  if (sentTo) {
    return (
      <AuthScreen title="Revisa tu correo" footer={toLogin}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <MailCheck size={28} color={palette.status.good} />
          <Text tone="secondary" align="center">
            Te enviamos un enlace a <Text weight="medium">{sentTo}</Text>. Ábrelo para activar tu cuenta y luego entra
            con tu contraseña.
          </Text>
        </View>
      </AuthScreen>
    )
  }

  return (
    <AuthScreen
      title="Crear cuenta"
      subtitle="Empieza con categorías listas para usar."
      footer={<FooterLink prefix="¿Ya tienes cuenta?" label="Entrar" onPress={() => router.replace('/entrar')} />}
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
          <Label>Contraseña</Label>
          <PasswordField
            ref={passwordRef}
            value={password}
            onChangeText={setPassword}
            autoComplete="new-password"
            textContentType="newPassword"
            placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
          />
        </View>
        <View>
          <Label>Repite la contraseña</Label>
          <PasswordField
            ref={confirmRef}
            value={confirm}
            onChangeText={setConfirm}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
          />
        </View>
        <AuthError message={error} />
        <Button onPress={handleSubmit} disabled={busy}>{busy ? 'Creando cuenta…' : 'Crear cuenta'}</Button>
      </View>
    </AuthScreen>
  )
}
