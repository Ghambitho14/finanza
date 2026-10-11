export const MIN_PASSWORD_LENGTH = 8

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Email o contraseña incorrectos',
  email_not_confirmed: 'Aún no confirmas tu email. Revisa tu correo y abre el enlace.',
  user_already_exists: 'Ese email ya tiene una cuenta',
  email_exists: 'Ese email ya tiene una cuenta',
  weak_password: `La contraseña es muy débil: usa al menos ${MIN_PASSWORD_LENGTH} caracteres`,
  same_password: 'La nueva contraseña debe ser distinta a la anterior',
  email_address_invalid: 'El email no es válido',
  validation_failed: 'Revisa el email y la contraseña',
  over_email_send_rate_limit: 'Se enviaron demasiados correos. Espera unos minutos.',
  over_request_rate_limit: 'Demasiados intentos. Espera unos minutos.',
}

/**
 * Los errores de Supabase Auth se reconocen por la marca `__isAuthError` (la
 * misma que usa `isAuthError` de supabase-js), así no se importa el paquete.
 */
const isAuthError = (err: unknown): err is { code?: string; name: string } =>
  typeof err === 'object' && err !== null && '__isAuthError' in err

export function authErrorMessage(err: unknown): string {
  if (isAuthError(err)) {
    if (err.code && AUTH_MESSAGES[err.code]) return AUTH_MESSAGES[err.code]
    if (err.name === 'AuthRetryableFetchError') return 'No hay conexión con el servidor'
  }
  return 'No se pudo completar. Intenta de nuevo.'
}
