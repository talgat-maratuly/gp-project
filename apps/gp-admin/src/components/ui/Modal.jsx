import { X } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'

export default function Modal({ open, onClose, title, children, wide }) {
  const { t } = useLanguage()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 z-0 bg-black/60"
        aria-label={t('close')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto admin-card rounded-t-2xl sm:rounded-2xl m-0 sm:m-4 pointer-events-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 mb-4 sticky top-0 bg-slate-900/95 py-2 -mt-1 z-10">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
