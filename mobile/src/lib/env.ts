// Expo solo incluye las variables EXPO_PUBLIC_* si se leen de forma literal
// (process.env.EXPO_PUBLIC_X): no desestructurar.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

/** Web donde terminan los enlaces de los correos (confirmar cuenta, nueva clave). */
export const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://finanza-bay.vercel.app').replace(/\/$/, '')

export const env = {
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_KEY,
  ok: SUPABASE_URL.startsWith('http') && SUPABASE_KEY.length > 0,
}
