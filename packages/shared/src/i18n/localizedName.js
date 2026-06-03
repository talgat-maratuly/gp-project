import { DEFAULT_LANG } from './translations.js'

export const EMPTY_NAMES = { ru: '', kk: '', en: '' }

/** Legacy `name` → names { ru, kk, en } */
export function normalizeNames(entity) {
  if (entity?.names && typeof entity.names === 'object') {
    return {
      ru: String(entity.names.ru || '').trim(),
      kk: String(entity.names.kk || '').trim(),
      en: String(entity.names.en || '').trim(),
    }
  }
  const legacy = String(entity?.name || '').trim()
  return { ru: legacy, kk: '', en: '' }
}

export function resolveLocalizedName(entity, lang = DEFAULT_LANG) {
  if (!entity) return ''
  const names = normalizeNames(entity)
  const order = [lang, DEFAULT_LANG, 'ru', 'kk', 'en']
  for (const code of order) {
    if (names[code]) return names[code]
  }
  return String(entity.name || '').trim()
}

export function withLocalizedName(payload) {
  const names = payload.names ? normalizeNames({ names: payload.names }) : normalizeNames(payload)
  const primary = names.ru || names.kk || names.en || ''
  return { ...payload, names, name: primary }
}

export function hasAllLocalizedNames(names) {
  const n = normalizeNames({ names })
  return Boolean(n.ru && n.kk && n.en)
}
