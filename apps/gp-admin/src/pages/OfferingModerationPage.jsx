import OfferingModerationPanel from '../components/OfferingModerationPanel'
import { useLanguage } from '../i18n/LanguageContext'

export default function OfferingModerationPage() {
  const { t } = useLanguage()
  return (
    <OfferingModerationPanel
      title={t('service_moderation')}
      subtitle={t('service_moderation_desc')}
    />
  )
}
