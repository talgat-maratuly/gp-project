import OfferingModerationPanel from '../components/OfferingModerationPanel'
import { useLanguage } from '../i18n/LanguageContext'

export default function SpecialistOfferingsModerationPage() {
  const { t } = useLanguage()
  return (
    <OfferingModerationPanel
      scope="specialist"
      backTo="/specialists/moderation"
      title={t('specialist_offerings_moderation')}
      subtitle={t('specialist_offerings_moderation_desc')}
    />
  )
}
