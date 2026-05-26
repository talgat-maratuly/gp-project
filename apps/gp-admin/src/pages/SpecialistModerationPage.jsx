import { Link } from 'react-router-dom'
import PartnerModerationPanel from '../components/PartnerModerationPanel'
import { useLanguage } from '../i18n/LanguageContext'

export default function SpecialistModerationPage() {
  const { t } = useLanguage()
  return (
    <div className="space-y-3">
      <Link
        to="/specialists/offerings"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600/20 text-sky-200 text-sm font-semibold hover:bg-sky-600/30"
      >
        {t('specialist_offerings_moderation')} →
      </Link>
      <PartnerModerationPanel
        scope="specialist"
        title={t('specialist_moderation')}
        subtitle={t('specialist_moderation_desc')}
      />
    </div>
  )
}
