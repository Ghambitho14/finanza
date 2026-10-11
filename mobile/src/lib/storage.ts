import 'expo-sqlite/localStorage/install'

/** localStorage (SQLite en Android) con errores silenciados, como en la web. */
export const storage = {
  get(key: string): string | null {
    try {
      return globalThis.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string): void {
    try {
      globalThis.localStorage.setItem(key, value)
    } catch {
      // Sin almacenamiento, la preferencia dura hasta cerrar la app
    }
  },
  remove(key: string): void {
    try {
      globalThis.localStorage.removeItem(key)
    } catch {
      // Igual que arriba
    }
  },
}
