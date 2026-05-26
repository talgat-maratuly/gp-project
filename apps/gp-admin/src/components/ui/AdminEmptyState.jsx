import { useLanguage } from '../../i18n/LanguageContext'

/** Пустой список / таблица */
export default function AdminEmptyState({ messageKey = 'noData', className = '' }) {
  const { t } = useLanguage()
  return (
    <p className={`text-sm text-slate-500 py-8 text-center ${className}`}>
      {t(messageKey)}
    </p>
  )
}
