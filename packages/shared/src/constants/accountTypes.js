export const ACCOUNT_TYPES = [
  { id: 'INDIVIDUAL', label: 'Физическое лицо' },
  { id: 'LEGAL_ENTITY', label: 'Юридическое лицо' },
]

/** Выбор при регистрации: физлицо / ИП / ТОО */
export const BUSINESS_FORMS = [
  { id: 'individual', accountType: 'INDIVIDUAL', label: 'Физлицо' },
  { id: 'ip', accountType: 'LEGAL_ENTITY', label: 'ИП' },
  { id: 'too', accountType: 'LEGAL_ENTITY', label: 'ТОО' },
]

export function getBusinessFormLabel(formId) {
  return BUSINESS_FORMS.find((f) => f.id === formId)?.label || null
}

export function isLegalBusinessForm(formId) {
  return formId === 'ip' || formId === 'too'
}

export const PARTNER_DOCUMENT_KIND_OPTIONS = [
  { id: 'ID_CARD', label: 'Удостоверение личности' },
  { id: 'IIN', label: 'ИИН' },
  { id: 'BIN_CERTIFICATE', label: 'Свидетельство о БИН' },
  { id: 'COMPANY_REGISTRATION', label: 'Свидетельство о регистрации' },
  { id: 'POWER_OF_ATTORNEY', label: 'Доверенность' },
  { id: 'OTHER', label: 'Другое' },
]

export function getAccountTypeLabel(type) {
  return ACCOUNT_TYPES.find((t) => t.id === type)?.label || type
}
