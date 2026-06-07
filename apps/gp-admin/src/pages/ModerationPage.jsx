import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import PageHeader from '../components/PageHeader'
import PartnerModerationPanel from '../components/PartnerModerationPanel'
import OfferingModerationPanel from '../components/OfferingModerationPanel'

const BLOCKS = [
  { id: 'partners', titleKey: 'moderation_block_partners', descKey: 'moderation_block_partners_desc' },
  { id: 'shops', titleKey: 'moderation_block_shops', descKey: 'moderation_block_shops_desc', scope: 'shop' },
  { id: 'specialists', titleKey: 'moderation_block_specialists', descKey: 'moderation_block_specialists_desc', scope: 'specialist' },
  { id: 'legal', titleKey: 'moderation_block_legal', descKey: 'moderation_block_legal_desc', scope: 'specialist', partnerTypeFilter: 'legal', initialTab: 'PENDING_REVIEW' },
  { id: 'profile', titleKey: 'moderation_block_profile', descKey: 'moderation_block_profile_desc', scope: 'specialist', initialTab: 'NEEDS_REVISION' },
  { id: 'offerings', titleKey: 'moderation_block_offerings', descKey: 'moderation_block_offerings_desc', kind: 'offerings' },
]

export default function ModerationPage() {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const [block, setBlock] = useState('partners')

  useEffect(() => {
    const fromUrl = searchParams.get('block')
    if (fromUrl && BLOCKS.some((b) => b.id === fromUrl)) setBlock(fromUrl)
  }, [searchParams])
  const current = BLOCKS.find((b) => b.id === block) || BLOCKS[0]

  return (
    <div className="space-y-4">
      <PageHeader title={t('nav_moderation')} description={t('moderation_hub_desc')} />

      <div className="flex flex-wrap gap-2">
        {BLOCKS.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setBlock(b.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              block === b.id ? 'admin-tab-active' : 'admin-tab'
            }`}
          >
            {t(b.titleKey)}
          </button>
        ))}
      </div>

      {current.kind === 'offerings' ? (
        <OfferingModerationPanel
          scope="specialist"
          title={t(current.titleKey)}
          subtitle={t(current.descKey)}
        />
      ) : (
        <PartnerModerationPanel
          scope={current.scope}
          title={t(current.titleKey)}
          subtitle={t(current.descKey)}
          initialTab={current.initialTab}
          partnerTypeFilter={current.partnerTypeFilter}
        />
      )}
    </div>
  )
}
