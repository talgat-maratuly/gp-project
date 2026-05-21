import { useLanguage } from '../i18n/LanguageContext'

export default function FormActions({ onSave, onCancel, saveLabel }) {
  const { t } = useLanguage()
  return (
    <div className="flex gap-2 pt-4">
      <button type="button" onClick={onSave} className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 font-semibold text-sm">
        {saveLabel || t('save')}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl border border-white/10 text-sm hover:bg-white/5">
          {t('cancel')}
        </button>
      )}
    </div>
  )
}
