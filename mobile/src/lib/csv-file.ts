// CSV en Android: exportar abre el menú de compartir (Drive, Gmail, Archivos…)
// e importar abre el selector de archivos. La vista web usa csv-file.web.ts.

import * as DocumentPicker from 'expo-document-picker'
import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'

export interface PickedText {
  name: string
  size: number
  text: string
}

export async function shareCSV(filename: string, content: string): Promise<void> {
  const file = new File(Paths.cache, filename)
  if (file.exists) file.delete()
  file.create()
  file.write(content)
  if (!(await Sharing.isAvailableAsync())) throw new Error('Este dispositivo no permite compartir archivos.')
  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: filename, UTI: 'public.comma-separated-values-text' })
}

/** Elige un archivo; devuelve null si se cancela. `maxBytes` evita leer archivos enormes. */
export async function pickCSV(maxBytes: number): Promise<PickedText | 'too-big' | null> {
  const result = await DocumentPicker.getDocumentAsync({
    // Algunos teléfonos marcan los CSV como texto u hoja de cálculo
    type: ['text/csv', 'text/comma-separated-values', 'text/plain', 'application/vnd.ms-excel', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  })
  if (result.canceled || !result.assets?.length) return null
  const asset = result.assets[0]
  const file = new File(asset.uri)
  try {
    const size = asset.size ?? file.size
    if (size > maxBytes) return 'too-big'
    return { name: asset.name || 'archivo.csv', size, text: await file.text() }
  } finally {
    try {
      if (file.exists) file.delete()
    } catch {
      // Es caché del sistema: no es grave si queda
    }
  }
}
