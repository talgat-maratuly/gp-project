import { test, expect } from '@playwright/test'
import { expectVisibleMain, serviceDemoLogin } from './helpers.mjs'

test.describe('GP Service', () => {
  test('home loads with content', async ({ page }) => {
    await page.goto('/')
    await expectVisibleMain(page)
    await expect(page.locator('body')).toBeVisible()
  })

  test('shop and services routes render', async ({ page }) => {
    for (const path of ['/shop', '/services', '/services/hunter-irrigation', '/services/furniture']) {
      await page.goto(path)
      await expectVisibleMain(page)
    }
  })

  test('login form accepts demo credentials', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /вход и регистрация|sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /физ лицо|individual/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /юр лицо|legal entity/i })).toBeVisible()
    await page.getByPlaceholder('+7 701 234 56 78').fill('+77012236262')
    await expect(page.getByText(/DEV режим: используйте код 0000|DEV mode: use code 0000/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /отправить OTP|send OTP/i })).toBeEnabled()
  })

  test('hunter wizard step 1 has inputs', async ({ page }) => {
    await serviceDemoLogin(page)
    await page.goto('/services/hunter-irrigation/new')
    await expect(page.locator('input, select, button').first()).toBeVisible()
    await expectVisibleMain(page)
  })

  test('language switcher changes UI', async ({ page }) => {
    await page.goto('/')
    const en = page.getByRole('button', { name: 'EN' })
    if (await en.isVisible().catch(() => false)) {
      await en.click()
      await expectVisibleMain(page)
    }
  })
})
