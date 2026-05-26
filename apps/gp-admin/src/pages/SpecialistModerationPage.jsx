import PartnerModerationPanel from '../components/PartnerModerationPanel'
import { useLanguage } from '../i18n/LanguageContext'

export default function SpecialistModerationPage() {
  const { t } = useLanguage()
  return (
    <PartnerModerationPanel
      scope="specialist"
      title={t('specialist_moderation')}
      subtitle={t('specialist_moderation_desc')}
    />
  )
}
