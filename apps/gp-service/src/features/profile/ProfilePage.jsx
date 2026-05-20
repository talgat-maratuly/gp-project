import { Link } from 'react-router-dom'
import { useService } from '../../context/ServiceContext'
import { GP_CONTACTS, getAccountTypeLabel } from '@gp/shared/constants'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function ProfilePage() {
  const { profile, setProfile, isLoggedIn, authUser, logout } = useService()
  const set = (k) => (e) => setProfile({ ...profile, [k]: e.target.value })

  return (
    <div className="px-4 py-4">
      <h1 className="text-2xl font-bold mb-6">Профиль</h1>

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
                <p className="text-xs text-gp-green-700">БИН {authUser.clientProfile.bin}</p>
              )}
              {authUser.clientProfile.legalAddress && (
                <p className="text-xs text-gp-green-700">{authUser.clientProfile.legalAddress}</p>
              )}
            </>
          )}
          <p className="text-sm text-gp-green-700">{authUser?.email}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={logout}>Выйти</Button>
        </div>
      ) : (
        <div className="gp-card p-4 mb-4">
          <p className="text-sm text-slate-600 mb-3">Войдите, чтобы оформлять заказы</p>
          <Link to="/login"><Button className="w-full">Войти / Регистрация</Button></Link>
        </div>
      )}

      <form className="gp-card p-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Input label="Имя" value={profile.name} onChange={set('name')} />
        <Input label="Телефон" type="tel" value={profile.phone} onChange={set('phone')} />
        <Input label="Email" type="email" value={profile.email} onChange={set('email')} />
        <Input label="Город" value={profile.city} onChange={set('city')} />
        <Button type="submit" className="w-full">Сохранить локально</Button>
      </form>
      <div className="gp-card p-5 mt-4 text-sm text-slate-500 space-y-1">
        <p>{GP_CONTACTS.phone}</p>
        <p>{GP_CONTACTS.email}</p>
        <p>{GP_CONTACTS.address}, {GP_CONTACTS.addressLine}</p>
      </div>
    </div>
  )
}
