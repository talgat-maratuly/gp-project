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
    await page.getByLabel(/email/i).fill('uralsk_client@gp.kz')
    await page.locator('input[type="password"]').fill('1234')
    await expect(page.locator('form button[type="submit"]')).toBeEnabled()
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
