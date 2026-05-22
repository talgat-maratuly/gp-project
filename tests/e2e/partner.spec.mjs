import { test, expect } from '@playwright/test'
import { expectLightBackground, expectPartnerShell, expectVisibleMain, partnerDemoLogin } from './helpers.mjs'

test.describe('GP Partner', () => {
  test('auth page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByPlaceholder('Пароль')).toBeVisible()
  })

  test('login form accepts demo email', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('Email').fill('uralsk_partner@gp.kz')
    await page.getByPlaceholder('Пароль').fill('1234')
    await expect(page.locator('form button[type="submit"]')).toBeEnabled()
  })
})
