/** @param {import('@playwright/test').Page} page */
export async function waitForRealApi(page) {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      const res = await page.request.get('http://localhost:4000/health/db')
      if (res.ok()) return
    } catch {
      /* retry */
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('Real GP API is not ready on http://localhost:4000/health/db')
}

/** @param {import('@playwright/test').Page} page */
export async function serviceDemoLogin(page) {
  await waitForRealApi(page)
  const phone = `+7701${Date.now().toString().slice(-7)}`
  await page.goto('/login')
  await page.getByPlaceholder('+7 701 234 56 78').fill(phone)
  await page.getByRole('button', { name: /отправить OTP|send OTP|OTP жіберу/i }).click()
  await page.getByPlaceholder(/4-8|digits|сан/i).fill('0000')
  await page.getByRole('button', { name: /подтвердить|confirm|растау/i }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 })
}

/** @param {import('@playwright/test').Page} page */
export async function partnerDemoLogin(page) {
  await page.goto('/login')
  await page.getByRole('button', { name: /Email \/ пароль|email/i }).click()
  await page.getByPlaceholder(/uralsk_partner|partner@gp\.kz/i).fill('partner@gp.kz')
  await page.locator('input[type="password"]').fill('password123')
  await page.locator('form button[type="submit"]').click()
  await page.waitForURL((url) => url.pathname === '/', { timeout: 20_000 })
}

/** @param {import('@playwright/test').Page} page */
export async function adminDemoLogin(page, username = 'admin@gp.kz', password = 'password123') {
  await page.goto('/login')
  await page.getByRole('button', { name: /Email \/ пароль|email/i, exact: true }).click()
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
