const ACCENTS: Record<string, string> = {
  á: 'a', à: 'a', ä: 'a', â: 'a', ã: 'a',
  é: 'e', è: 'e', ë: 'e', ê: 'e',
  í: 'i', ì: 'i', ï: 'i', î: 'i',
  ó: 'o', ò: 'o', ö: 'o', ô: 'o', õ: 'o',
  ú: 'u', ù: 'u', ü: 'u', û: 'u',
  ñ: 'n', ç: 'c',
}

/**
 * Minúsculas y sin tildes, para buscar y comparar ("Café" = "cafe"). Si el
 * motor no tiene `normalize` (algunos Android), usa una tabla propia.
 */
export function foldText(value: string): string {
  const lower = value.toLowerCase()
  try {
    return lower.normalize('NFD').replace(/[̀-ͯ]/g, '')
  } catch {
    return lower.replace(/[^\x00-\x7f]/g, (ch) => ACCENTS[ch] ?? ch)
  }
}
