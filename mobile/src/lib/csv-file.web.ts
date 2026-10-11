// Vista web de desarrollo: descarga y `<input type="file">` del navegador.

export interface PickedText {
  name: string
  size: number
  text: string
}

export async function shareCSV(filename: string, content: string): Promise<void> {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function pickCSV(maxBytes: number): Promise<PickedText | 'too-big' | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,text/csv'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      if (file.size > maxBytes) return resolve('too-big')
      resolve({ name: file.name, size: file.size, text: await file.text() })
    }
    input.click()
  })
}
