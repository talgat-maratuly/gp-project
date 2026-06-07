import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  MAIN_SERVICES,
  mainServiceRequiresVehicle,
  mainServiceRequiresWorkTools,
} from '@gp/shared-core/specialist-onboarding'
import { api } from '@gp/shared/api'
import { STATIC_GEO_STORE } from '@gp/shared/geography'
import CitySelector from '@gp/shared/components/CitySelector'
import { PhotoUploadField, PhotoUploadList } from '../components/PhotoUploadField'
import { usePartner } from '../context/PartnerContext'

const STEPS = [
  'Аймақ',
  'Қызмет',
  'Подуслуги',
  'Деректер',
  'Фото және ID',
  'Техника / құрал',
  'Тәжірибе',
  'Келісім',
  'Тексеру',
]

const EMPTY_VEHICLE = {
  vehicleType: 'assenzior',
  vehicleBrand: '',
  licensePlate: '',
  tankVolume: '',
  vehiclePhotoUrl: '',
  registrationPhotoUrls: [],
  driverLicenseCategory: 'C',
  driverLicensePhotoUrl: '',
}

export default function SpecialistOnboardingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, syncPartner, notify, loading } = usePartner()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [regions, setRegions] = useState([])
  const [existingApps, setExistingApps] = useState([])

  const [mainServiceId, setMainServiceId] = useState('SEPTIC')
  const [subserviceIds, setSubserviceIds] = useState(() => new Set())
  const [regionId, setRegionId] = useState('')
  const [cityId, setCityId] = useState('city-uralsk')
  const [cityOblastId, setCityOblastId] = useState('obl-batys')
  const [city, setCity] = useState(user?.city || 'Уральск')
  const [district, setDistrict] = useState('')
  const [citySubs, setCitySubs] = useState([])
  const [subsLoading, setSubsLoading] = useState(false)
  const [availableMainServices, setAvailableMainServices] = useState([])
  const [mainsLoading, setMainsLoading] = useState(false)
  const [fullName, setFullName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('')
  const [idCardFrontUrl, setIdCardFrontUrl] = useState('')
  const [idCardBackUrl, setIdCardBackUrl] = useState('')
  const [vehicle, setVehicle] = useState(EMPTY_VEHICLE)
  const [equipmentUrls, setEquipmentUrls] = useState([])
  const [workExperience, setWorkExperience] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [personalDataAccepted, setPersonalDataAccepted] = useState(false)
  const [resubmitRequestId, setResubmitRequestId] = useState(
    () => location.state?.resubmitRequestId || '',
  )

  const subs = citySubs
  const mainServicesForCity = useMemo(
    () => MAIN_SERVICES.filter((m) => availableMainServices.includes(m.id)),
    [availableMainServices],
  )
  const needsVehicle = mainServiceRequiresVehicle(mainServiceId)
  const needsTools = mainServiceRequiresWorkTools(mainServiceId)

  useEffect(() => {
    api.getRegions().then((list) => {
      setRegions(list)
      const uralsk = list.find((r) => r.code === 'uralsk')
      setRegionId((id) => id || uralsk?.id || list[0]?.id || '')
    }).catch(() => {})
    api.getSpecialistApplications().then((list) => {
      const rows = Array.isArray(list) ? list : []
      setExistingApps(rows)
      const rejected = rows.find(
        (a) => a.status === 'REJECTED' && String(a.mainServiceId) === String(mainServiceId),
      )
      if (!resubmitRequestId && rejected) setResubmitRequestId(rejected.id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!cityId) {
      setAvailableMainServices([])
      return undefined
    }
    let cancelled = false
    setMainsLoading(true)
    api.getSpecialistOnboardingMainServices(cityId)
      .then((list) => {
        if (cancelled) return
        const ids = Array.isArray(list) ? list : []
        setAvailableMainServices(ids)
        if (ids.length && !ids.includes(mainServiceId)) {
          setMainServiceId(ids[0])
        }
      })
      .catch(() => {
        if (!cancelled) setAvailableMainServices([])
      })
      .finally(() => {
        if (!cancelled) setMainsLoading(false)
      })
    return () => { cancelled = true }
  }, [cityId])

  useEffect(() => {
    if (!cityId || !mainServiceId) {
      setCitySubs([])
      return undefined
    }
    let cancelled = false
    setSubsLoading(true)
    api.getSpecialistOnboardingSubservices(cityId, mainServiceId)
      .then((list) => {
        if (!cancelled) setCitySubs(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (!cancelled) setCitySubs([])
      })
      .finally(() => {
        if (!cancelled) setSubsLoading(false)
      })
    return () => { cancelled = true }
  }, [cityId, mainServiceId])

  useEffect(() => {
    setSubserviceIds(new Set())
  }, [mainServiceId, cityId])

  const toggleSub = (id) => {
    setSubserviceIds((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const validateStep = () => {
    if (step === 0) {
      if (!regions.length) return 'Аймақ тізімі жүктелмеді — API байланысын тексеріңіз'
      if (!regionId || !cityId || !city.trim()) return 'Аймақ пен қала'
    }
    if (step === 1) {
      if (mainsLoading) return 'Қызметтер жүктелуде…'
      if (!mainServicesForCity.length) return 'Бұл қалада белсенді қызмет жоқ'
      if (!mainServiceId || !availableMainServices.includes(mainServiceId)) return 'Қызметті таңдаңыз'
    }
    if (step === 2) {
      if (subsLoading) return 'Подуслугалар жүктелуде…'
      if (!subs.length) return 'Бұл қалада белсенді подуслуга жоқ'
      if (subserviceIds.size < 1) return 'Кем дегенде бір подуслуга'
    }
    if (step === 3 && (!fullName.trim() || !phone.trim())) return 'Аты және телефон'
    if (step === 4) {
      if (!profilePhotoUrl.trim()) return 'Профиль фотосы'
      if (!idCardFrontUrl.trim()) return 'ID алдыңғы жағы'
      if (!idCardBackUrl.trim()) return 'ID артқы жағы'
    }
    if (step === 5) {
      if (needsVehicle) {
        if (!vehicle.vehicleBrand.trim()) return 'Көлік маркасы'
        if (!vehicle.licensePlate.trim()) return 'Мемлекеттік нөмір'
        if (!vehicle.vehiclePhotoUrl.trim()) return 'Көлік фотосы'
        if (!vehicle.registrationPhotoUrls.length) return 'Тіркеу фотолары'
        if (!vehicle.driverLicensePhotoUrl.trim()) return 'ЖҚ фотосы'
      }
      if (needsTools) {
        if (!equipmentUrls.length) return 'Жұмыс құралдары фотосы (кем дегенде 1)'
        if (equipmentUrls.length > 3) return 'Ең көбі 3 фото'
      }
    }
    if (step === 7) {
      if (!termsAccepted || !personalDataAccepted) return 'Келісімдерді қабылдаңыз'
    }
    return null
  }

  const next = () => {
    const err = validateStep()
    if (err) {
      setError(err)
      return
    }
    setError('')
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const back = () => {
    setError('')
    setStep((s) => Math.max(s - 1, 0))
  }

  const buildPayload = () => {
    const equipmentPhotoUrls = needsTools ? equipmentUrls : undefined
    const body = {
      mainServiceId,
      subserviceIds: [...subserviceIds],
      regionId,
      cityId,
      city: city.trim(),
      district: district.trim() || undefined,
      fullName: fullName.trim(),
      phone: phone.trim(),
      accountType: user?.accountType || 'INDIVIDUAL',
      profilePhotoUrl: profilePhotoUrl.trim(),
      idCardFrontUrl: idCardFrontUrl.trim(),
      idCardBackUrl: idCardBackUrl.trim(),
      workExperience: workExperience.trim() || undefined,
      termsAccepted: true,
      personalDataAccepted: true,
      ...(resubmitRequestId ? { resubmitRequestId } : {}),
      ...(needsVehicle
        ? {
            vehicle: {
              vehicleType: vehicle.vehicleType.trim(),
              vehicleBrand: vehicle.vehicleBrand.trim(),
              licensePlate: vehicle.licensePlate.trim(),
              tankVolume: vehicle.tankVolume.trim() || '8',
              vehiclePhotoUrl: vehicle.vehiclePhotoUrl.trim(),
              registrationPhotoUrls: vehicle.registrationPhotoUrls,
              driverLicenseCategory: vehicle.driverLicenseCategory.trim(),
              driverLicensePhotoUrl: vehicle.driverLicensePhotoUrl.trim(),
            },
          }
        : {}),
      ...(equipmentPhotoUrls ? { equipmentPhotoUrls } : {}),
    }
    return body
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!regionId?.trim()) {
      setError('Аймақты таңдаңыз (қадам 3)')
      return
    }
    const err = validateStep()
    if (err) {
      setError(err)
      return
    }
    setError('')
    try {
      await api.submitSpecialistApplication(buildPayload())
      await syncPartner()
      notify('Маман өтінімі модерацияға жіберілді')
      navigate('/profile', { replace: true })
    } catch (submitErr) {
      setError(submitErr?.message || 'Жіберу қатесі')
    }
  }

  const pendingForService = existingApps.find(
    (a) => a.status === 'PENDING' && String(a.mainServiceId) === String(mainServiceId),
  )

  return (
    <form onSubmit={submit} className="gp-form-stack max-w-lg mx-auto pb-8 w-full">
      <h1 className="text-xl font-bold text-[var(--gp-text)]">Маман өтінімі</h1>
      <p className="text-sm text-[var(--gp-text-muted)]">
        Бір өтінім — бір негізгі қызмет. Фотоларды телефоннан немесе галереядан жүктеңіз.
      </p>

      {location.state?.fromWhatsappLogin && (
        <p className="text-sm text-emerald-700 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
          Кірдіңіз. Өтінімді толтырып модерацияға жіберіңіз.
        </p>
      )}

      {pendingForService && (
        <p className="text-sm text-amber-700 bg-amber-500/10 rounded-xl px-3 py-2">
          {mainServiceId} бойынша өтінім тексеруде. Жаңасын жіберуге болмайды.
        </p>
      )}

      <div className="flex gap-1 mb-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            title={label}
            className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-emerald-500' : 'bg-white/10'}`}
          />
        ))}
      </div>
      <p className="text-xs text-[var(--gp-text-muted)] mb-2">
        {STEPS[step]} ({step + 1}/{STEPS.length})
      </p>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
      )}

      {step === 0 && (
        <>
          <div className="gp-form-field">
            <label className="gp-form-label">Регион</label>
            <select
              className="gp-input-kaspi"
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              required
              disabled={!regions.length}
            >
              {!regions.length ? (
                <option value="">Аймақтар жүктелуде…</option>
              ) : (
                regions.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))
              )}
            </select>
          </div>
          <div className="gp-form-field">
            <label className="gp-form-label">Қала</label>
            <CitySelector
              store={STATIC_GEO_STORE}
              value={{ oblastId: cityOblastId, cityId }}
              onChange={(sel) => {
                setCityOblastId(sel.oblastId || cityOblastId)
                setCityId(sel.cityId || '')
                setCity(sel.city || '')
              }}
              inputClassName="gp-input-kaspi"
            />
          </div>
          <div className="gp-form-field">
            <label className="gp-form-label">Аудан (міндетті емес)</label>
            <input className="gp-input-kaspi" value={district} onChange={(e) => setDistrict(e.target.value)} />
          </div>
        </>
      )}

      {step === 1 && (
        <div className="space-y-2">
          {mainsLoading && <p className="text-sm text-[var(--gp-text-muted)]">Қызметтер жүктелуде…</p>}
          {!mainsLoading && !mainServicesForCity.length && (
            <p className="text-sm text-amber-700 bg-amber-500/10 rounded-xl px-3 py-2">
              {city} қаласында белсенді қызмет табылмады.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {mainServicesForCity.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMainServiceId(m.id)}
                className={`px-3 py-2 rounded-xl text-sm font-bold ${
                  mainServiceId === m.id ? 'gp-gradient-kaspi text-white' : 'bg-[var(--gp-surface-2)]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-2">
          {subsLoading && <p className="text-sm text-[var(--gp-text-muted)]">Подуслугалар жүктелуде…</p>}
          {!subsLoading && !subs.length && (
            <p className="text-sm text-amber-700 bg-amber-500/10 rounded-xl px-3 py-2">
              {city} қалasında белсенді подуслуга табылмады.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {subs.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSub(s.id)}
                className={`px-2 py-1 rounded-lg text-xs ${
                  subserviceIds.has(s.id) ? 'bg-emerald-600 text-white' : 'border bg-white text-black'
                }`}
              >
                {s.label}
                {s.price != null && <span className="opacity-80"> · {s.price} ₸</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <>
          <div className="gp-form-field">
            <label className="gp-form-label">Толық аты</label>
            <input className="gp-input-kaspi" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="gp-form-field">
            <label className="gp-form-label">Телефон</label>
            <input className="gp-input-kaspi" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <PhotoUploadField label="Профиль фотосы" value={profilePhotoUrl} onChange={setProfilePhotoUrl} kind="profile" onError={setError} />
          <PhotoUploadField label="ID — алдыңғы жағы" value={idCardFrontUrl} onChange={setIdCardFrontUrl} kind="id_front" onError={setError} />
          <PhotoUploadField label="ID — артқы жағы" value={idCardBackUrl} onChange={setIdCardBackUrl} kind="id_back" onError={setError} />
        </>
      )}

      {step === 5 && needsVehicle && (
        <>
          <div className="gp-form-field">
            <label className="gp-form-label">Көлік түрі</label>
            <input className="gp-input-kaspi" value={vehicle.vehicleType} onChange={(e) => setVehicle((v) => ({ ...v, vehicleType: e.target.value }))} />
          </div>
          <div className="gp-form-field">
            <label className="gp-form-label">Марка</label>
            <input className="gp-input-kaspi" value={vehicle.vehicleBrand} onChange={(e) => setVehicle((v) => ({ ...v, vehicleBrand: e.target.value }))} required />
          </div>
          <div className="gp-form-field">
            <label className="gp-form-label">Мемлекеттік нөмір</label>
            <input className="gp-input-kaspi" value={vehicle.licensePlate} onChange={(e) => setVehicle((v) => ({ ...v, licensePlate: e.target.value }))} required />
          </div>
          <div className="gp-form-field">
            <label className="gp-form-label">Цистерна көлемі</label>
            <input className="gp-input-kaspi" value={vehicle.tankVolume} onChange={(e) => setVehicle((v) => ({ ...v, tankVolume: e.target.value }))} />
          </div>
          <PhotoUploadField
            label="Көлік фотосы"
            value={vehicle.vehiclePhotoUrl}
            onChange={(val) => setVehicle((v) => ({ ...v, vehiclePhotoUrl: val }))}
            kind="vehicle"
            onError={setError}
          />
          <PhotoUploadList
            label="Тіркеу құжаты фотолары"
            urls={vehicle.registrationPhotoUrls}
            onChange={(urls) => setVehicle((v) => ({ ...v, registrationPhotoUrls: urls }))}
            kind="registration"
            max={3}
            onError={setError}
          />
          <div className="gp-form-field">
            <label className="gp-form-label">ЖҚ категориясы</label>
            <input className="gp-input-kaspi" value={vehicle.driverLicenseCategory} onChange={(e) => setVehicle((v) => ({ ...v, driverLicenseCategory: e.target.value }))} />
          </div>
          <PhotoUploadField
            label="Жүргізуші куәлігі"
            value={vehicle.driverLicensePhotoUrl}
            onChange={(val) => setVehicle((v) => ({ ...v, driverLicensePhotoUrl: val }))}
            kind="driver_license"
            onError={setError}
          />
        </>
      )}

      {step === 5 && needsTools && (
        <PhotoUploadList
          label="Жұмыс құралдары / жабдық"
          urls={equipmentUrls}
          onChange={setEquipmentUrls}
          kind="equipment"
          max={3}
          onError={setError}
        />
      )}

      {step === 5 && !needsVehicle && !needsTools && (
        <p className="text-sm text-[var(--gp-text-muted)]">Бұл қызмет үшін қосымша техника фотосы қажет емес.</p>
      )}

      {step === 6 && (
        <div className="gp-form-field">
          <label className="gp-form-label">Жұмыс тәжірибесі (міндетті емес)</label>
          <textarea className="gp-textarea-kaspi" value={workExperience} onChange={(e) => setWorkExperience(e.target.value)} rows={4} />
        </div>
      )}

      {step === 7 && (
        <div className="space-y-3 text-sm">
          <label className="flex gap-2 items-start">
            <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
            <span>Пайдалану шарттарын қабылдаймын</span>
          </label>
          <label className="flex gap-2 items-start">
            <input type="checkbox" checked={personalDataAccepted} onChange={(e) => setPersonalDataAccepted(e.target.checked)} />
            <span>Жеке деректерді өңдеуге келісемін</span>
          </label>
        </div>
      )}

      {step === 8 && (
        <dl className="text-sm space-y-2 bg-[var(--gp-surface-2)] rounded-xl p-4">
          <div><dt className="text-[var(--gp-text-muted)]">Қызмет</dt><dd>{MAIN_SERVICES.find((m) => m.id === mainServiceId)?.label}</dd></div>
          <div><dt className="text-[var(--gp-text-muted)]">Подуслуги</dt><dd>{subs.filter((s) => subserviceIds.has(s.id)).map((s) => s.label).join(', ') || '—'}</dd></div>
          <div><dt className="text-[var(--gp-text-muted)]">Қала</dt><dd>{city}</dd></div>
          <div><dt className="text-[var(--gp-text-muted)]">Аты</dt><dd>{fullName}</dd></div>
          {resubmitRequestId && <div><dt className="text-[var(--gp-text-muted)]">Қайта жіберу</dt><dd className="text-xs break-all">{resubmitRequestId}</dd></div>}
        </dl>
      )}

      <div className="flex gap-2 pt-2">
        {step > 0 && (
          <button type="button" onClick={back} className="flex-1 py-3 rounded-xl border border-[var(--gp-border)] font-bold">
            Артқа
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={next} className="flex-1 py-3 rounded-xl gp-gradient-kaspi text-white font-bold">
            Келесі
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading || Boolean(pendingForService)}
            className="flex-1 py-3 rounded-xl gp-gradient-kaspi text-white font-bold disabled:opacity-50"
          >
            Модерацияға жіберу
          </button>
        )}
      </div>
    </form>
  )
}
