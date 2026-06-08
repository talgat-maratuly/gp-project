import { Link } from 'react-router-dom'
import { useService } from '../../context/ServiceContext'
import { GP_CONTACTS, getAccountTypeLabel } from '@gp/shared/constants'
import CitySelector from '@gp/shared/components/CitySelector'
import { useLanguage } from '../../i18n'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function ProfilePage() {
  const { profile, setProfile, isLoggedIn, authUser, logout, geoStore } = useService()
  const { t } = useLanguage()
  const set = (k) => (e) => setProfile({ ...profile, [k]: e.target.value })

  return (
    <div className="px-4 py-4">
      <h1 className="text-2xl font-bold mb-6">{t('profileTitle')}</h1>

      {isLoggedIn ? (
        <div className="gp-card p-4 mb-4 bg-gp-green-50 border-gp-green-200">
          <p className="text-xs text-gp-green-700 mb-1">{getAccountTypeLabel(authUser?.clientProfile?.accountType)}</p>
          <p className="font-semibold text-gp-green-800">{authUser?.name}</p>
          {authUser?.clientProfile?.accountType === 'LEGAL_ENTITY' && (
            <>
              {authUser.clientProfile.companyName && (
                <p className="text-sm text-gp-green-800 font-semibold">{authUser.clientProfile.companyName}</p>
              )}
              {authUser.clientProfile.bin && (
                <p className="text-xs text-gp-green-700">{t('profileBin')} {authUser.clientProfile.bin}</p>
              )}
              {authUser.clientProfile.legalAddress && (
                <p className="text-xs text-gp-green-700">{authUser.clientProfile.legalAddress}</p>
              )}
            </>
          )}
          <p className="text-sm text-gp-green-700">{authUser?.email}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={logout}>{t('logout')}</Button>
        </div>
      ) : (
        <div className="gp-card p-4 mb-4">
          <p className="text-sm text-slate-600 mb-3">{t('loginRequiredOrders')}</p>
          <Link to="/login"><Button className="w-full">{t('loginRegister')}</Button></Link>
        </div>
      )}

      <form className="gp-card p-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Input label={t('name')} value={profile.name} onChange={set('name')} />
        <Input label={t('phone')} type="tel" value={profile.phone} onChange={set('phone')} />
        <Input label="Email" type="email" value={profile.email} onChange={set('email')} />
        {geoStore ? (
          <CitySelector
            store={geoStore}
            value={{ oblastId: profile.oblastId, cityId: profile.cityId }}
            inputClassName="w-full rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface)] px-3 py-2.5 text-sm"
            onChange={(sel) => setProfile((p) => ({
              ...p,
              oblastId: sel.oblastId,
              cityId: sel.cityId,
              city: sel.cityId ? (sel.city || p.city) : '',
              franchiseId: sel.cityId ? (sel.franchiseId ?? p.franchiseId) : null,
            }))}
          />
        ) : (
          <Input label={t('city')} value={profile.city} onChange={set('city')} />
        )}
        <Button type="submit" className="w-full">{t('profileSaveDraft')}</Button>
        <p className="text-xs text-slate-500">{t('profileLocalOnly')}</p>
      </form>
      <div className="gp-card p-5 mt-4 text-sm text-slate-500 space-y-1">
        <p>{GP_CONTACTS.phone}</p>
        <p>{GP_CONTACTS.email}</p>
        <p>{GP_CONTACTS.address}, {GP_CONTACTS.addressLine}</p>
      </div>
    </div>
  )
}
