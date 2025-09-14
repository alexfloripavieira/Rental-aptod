import { test, expect } from '@playwright/test'

test.describe('Apartment Listing Page', () => {
  test('loads page and shows header', async ({ page }) => {
    await page.goto('/aptos')
    await expect(page.locator('h1')).toHaveText(/Apartamentos/i)
  })
})

