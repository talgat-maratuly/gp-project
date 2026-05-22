const SERVICE_SESSION = {
  id: 'c1',
  clientId: 'c1',
  role: 'CLIENT',
  name: 'Айдар Клиент',
  franchiseId: 'fr-uralsk',
  city: 'Уральск',
}

const PARTNER_SESSION = {
  id: 'p1',
  partnerId: 'p1',
  role: 'PARTNER',
  name: 'Бауыржан',
  company: 'GP Услуги Уральск',
  franchiseId: 'fr-uralsk',
  city: 'Уральск',
  partnerProfileId: 'p1',
  balance: 0,
  directions: [],
  isOnline: true,
}

/** @param {import('@playwright/test').Page} page */
export async function serviceDemoLogin(page) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill('uralsk_client@gp.kz')
  await page.locator('input[type="password"]').fill('1234')
  await page.locator('form button[type="submit"]').click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 })
}

/** @param {import('@playwright/test').Page} page */
export async function partnerDemoLogin(page) {
  await page.goto('/login')
  await page.getByPlaceholder('Email').fill('uralsk_partner@gp.kz')
  await page.getByPlaceholder('Пароль').fill('1234')
  await page.locator('form button[type="submit"]').click()
  await page.waitForURL((url) => url.pathname === '/', { timeout: 20_000 })
}

/** @param {import('@playwright/test').Page} page */
export async function adminDemoLogin(page, username = 'superadmin', password = '1234') {
  await page.goto('/login')
  const inputs = page.locator('input.admin-input')
  await inputs.nth(0).fill(username)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /войти|login/i }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 })
}

/** @param {import('@playwright/test').Page} page */
export async function expectVisibleMain(page) {
  await page.waitForLoadState('domcontentloaded')
  const body = page.locator('body')
  await body.waitFor({ state: 'visible' })
  const text = await body.innerText()
  if (!text || text.trim().length < 8) {
    throw new Error('Page body appears empty')
  }
}

/** @param {import('@playwright/test').Page} page */
export async function expectPartnerShell(page) {
  await page.locator('header').first().waitFor({ state: 'visible', timeout: 15_000 })
  await page.locator('nav a').first().waitFor({ state: 'visible', timeout: 15_000 })
}

/** @param {import('@playwright/test').Page} page */
export async function expectLightBackground(page) {
  const bg = await page.evaluate(() => {
    const el = document.documentElement
    const s = getComputedStyle(el)
    return s.backgroundColor || s.getPropertyValue('--gp-bg') || ''
  })
  if (/rgb\(\s*0,\s*0,\s*0\s*\)|#000\b/i.test(bg)) {
    throw new Error(`Unexpected dark root background: ${bg}`)
  }
}
