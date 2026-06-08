import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expectLightBackground, expectPartnerShell, expectVisibleMain, partnerDemoLogin } from './helpers.mjs'

test.describe('GP Partner', () => {
  test('auth page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: 'WhatsApp OTP', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /Email \/ пароль|email/i })).toBeVisible()
    await expect(page.getByPlaceholder('+7 701 234 56 78')).toBeVisible()
    await expect(page.getByText(/DEV режим: используйте код 0000|DEV mode: use code 0000/i)).toBeVisible()
  })

  test('login form accepts demo email', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /Email \/ пароль|email/i }).click()
    await page.getByPlaceholder(/uralsk_partner|partner@gp\.kz/i).fill('partner@gp.kz')
    await page.locator('input[type="password"]').fill('password123')
    await expect(page.locator('form button[type="submit"]')).toBeEnabled()
  })

  test('specialist onboarding uses specialist endpoint, not shop apply endpoint', async () => {
    const pageSource = readFileSync(join(process.cwd(), 'apps/gp-partner/src/pages/SpecialistOnboardingPage.jsx'), 'utf8')
    const shopSource = readFileSync(join(process.cwd(), 'apps/gp-partner/src/pages/ShopApplyPage.jsx'), 'utf8')
    const apiSource = readFileSync(join(process.cwd(), 'packages/shared/src/api/client.js'), 'utf8')

    expect(pageSource).toContain('api.submitSpecialistApplication')
    expect(pageSource).not.toContain('api.partnerApply')
    expect(shopSource).toContain('api.partnerApply')
    expect(apiSource).toContain("submitSpecialistApplication: (body) => post('/specialist/applications', body)")
  })
})
