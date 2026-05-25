/** MVP: автозаполнение полей регистрации GP Service */
export function buildTestClientCredentials(data = {}) {
  const ts = Date.now()
  return {
    email: data.email?.trim() || `test_${ts}@gp.local`,
    password: data.password?.length >= 6 ? data.password : '123456',
    phone: data.phone?.trim() || `test_phone_${ts}`,
    name: data.name?.trim() || data.companyName?.trim() || data.contactPerson?.trim() || 'Тест GP',
  }
}

/** MVP: автозаполнение полей регистрации GP Partner */
export function buildTestPartnerCredentials(data = {}) {
  const ts = Date.now()
  return {
    email: data.email?.trim() || `test_partner_${ts}@gp.local`,
    password: data.password?.length >= 6 ? data.password : '123456',
    phone: data.phone?.trim() || `test_phone_${ts}`,
    name: data.name?.trim() || data.company?.trim() || 'Тест партнёр GP',
  }
}
