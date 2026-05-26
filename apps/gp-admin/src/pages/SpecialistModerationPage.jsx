import { useSearchParams } from 'react-router-dom'
import PartnerModerationPanel from '../components/PartnerModerationPanel'
import OfferingModerationPanel from '../components/OfferingModerationPanel'
import { useLanguage } from '../i18n/LanguageContext'

export default function SpecialistModerationPage() {
  const { t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const view = searchParams.get('view') === 'offerings' ? 'offerings' : 'profiles'

  const setView = (next) => {
    if (next === 'profiles') setSearchParams({})
    else setSearchParams({ view: 'offerings' })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-slate-900/80 border border-white/10 w-fit">
        <button
          type="button"
          onClick={() => setView('profiles')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold min-h-[44px] ${
            view === 'profiles' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t('specialist_moderation')}
        </button>
        <button
          type="button"
          onClick={() => setView('offerings')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold min-h-[44px] ${
            view === 'offerings' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t('specialist_offerings_moderation')}
        </button>
      </div>

      {view === 'profiles' ? (
        <PartnerModerationPanel
          scope="specialist"
          title={t('specialist_moderation')}
          subtitle={t('specialist_moderation_desc')}
        />
      ) : (
        <OfferingModerationPanel
          scope="specialist"
          title={t('specialist_offerings_moderation')}
          subtitle={t('specialist_offerings_moderation_desc')}
        />
      )}
    </div>
  )
}
