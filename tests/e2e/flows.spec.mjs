import { test, expect } from '@playwright/test'
import { serviceDemoLogin, expectVisibleMain } from './helpers.mjs'

test.describe('GP cross-flows (Service)', () => {
  test('furniture wizard opens', async ({ page }) => {
    await page.goto('/services/furniture/new')
    await expectVisibleMain(page)
    await expect(page.locator('input, button').first()).toBeVisible()
  })

  test('market category navigation', async ({ page }) => {
    await page.goto('/shop')
    await expectVisibleMain(page)
    const link = page.locator('a[href*="market"], a[href*="shop"]').first()
    if (await link.isVisible().catch(() => false)) {
      await link.click()
      await expectVisibleMain(page)
    }
  })

  test('no uncaught React error overlay', async ({ page }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/')
    await page.waitForTimeout(1500)
    const overlay = page.locator('vite-error-overlay, [data-vite-error]')
    await expect(overlay).toHaveCount(0)
    if (errors.length) {
      throw new Error(`Page errors: ${errors.slice(0, 3).join('; ')}`)
    }
  })
})
