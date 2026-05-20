/**
 * Читает текст характеристик товара: строки вида «Ключ: значение» или свободный текст.
 */
export function parseProductSpecifications(text) {
  if (text == null || typeof text !== 'string') return []
  const out = []
  for (let line of text.split(/\r?\n/)) {
    line = line.trim()
    if (!line) continue
    const colon = line.match(/^([^:]+):\s*(.+)$/)
    if (colon && colon[1].length <= 128) {
      out.push({ name: colon[1].trim(), value: colon[2].trim() })
      continue
    }
    const emDash = /^(.+?)\s*[–—]\s*(.+)$/.exec(line)
    if (emDash && emDash[1].length <= 128) {
      out.push({ name: emDash[1].trim(), value: emDash[2].trim() })
      continue
    }
    const spacedHyphen = /^(.+?)\s+-\s+(.+)$/.exec(line)
    if (spacedHyphen && spacedHyphen[1].length <= 128) {
      out.push({ name: spacedHyphen[1].trim(), value: spacedHyphen[2].trim() })
      continue
    }
    out.push({ name: '', value: line })
  }
  return out
}
