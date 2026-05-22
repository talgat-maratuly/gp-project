import { test, expect } from '@playwright/test'
import { adminDemoLogin, expectVisibleMain } from './helpers.mjs'

test.describe('GP Admin', () => {
  test('login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input.admin-input').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /войти|login/i })).toBeVisible()
  })

  test('superadmin dashboard', async ({ page }) => {
    await adminDemoLogin(page)
    await expectVisibleMain(page)
  })

  test('market and service project pages', async ({ page }) => {
    await adminDemoLogin(page)
    for (const path of ['/market', '/market/orders', '/services/hunter-irrigation', '/services/furniture']) {
      await page.goto(path)
      await expectVisibleMain(page)
    }
  })

  test('QA testing report page', async ({ page }) => {
    await adminDemoLogin(page)
    await page.goto('/testing-report')
    await expect(page.getByRole('heading', { name: /QA Dashboard|QA панелі|QA Dashboard/i }).first()).toBeVisible()
    const refresh = page.getByRole('button', { name: /обновить|refresh/i })
    await expect(refresh).toBeVisible()
  })
})
