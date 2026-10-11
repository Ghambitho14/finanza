import { useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { MailCheck } from 'lucide-react-native'
import { AuthError, AuthScreen, FooterLink } from '@/components/AuthScreen'
import { authErrorMessage, useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { Button } from '@/ui/Button'
import { Label, TextField } from '@/ui/Field'
import { Text } from '@/ui/Text'

export default function RecuperarClave() {
  const { sendPasswordReset } = useAuth()
  const { palette } = useTheme()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!email.trim()) return setError('Escribe tu email')
    setBusy(true)
    setError('')
    try {
      await sendPasswordReset(email.trim())
      setSent(true)
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthScreen
      title="Recuperar contraseña"
      subtitle={sent ? undefined : 'Te enviaremos un enlace para elegir una nueva.'}
      footer={<FooterLink label="Volver a entrar" onPress={() => (router.canGoBack() ? router.back() : router.replace('/entrar'))} />}
    >
      {sent ? (
        <View style={{ alignItems: 'center', gap: 12 }}>
          <MailCheck size={28} color={palette.status.good} />
          <Text tone="secondary" align="center">
            Si existe una cuenta con <Text weight="medium">{email.trim()}</Text>, te llegará un correo con el enlace para
            elegir una nueva contraseña.
          </Text>
        </View>
      ) : (
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
              autoFocus
              returnKeyType="send"
              onSubmitEditing={handleSubmit}
            />
          </View>
          <AuthError message={error} />
          <Button onPress={handleSubmit} disabled={busy}>{busy ? 'Enviando…' : 'Enviar enlace'}</Button>
        </View>
      )}
    </AuthScreen>
  )
}
