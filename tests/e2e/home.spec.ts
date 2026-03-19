import { test, expect } from '@playwright/test'

test('home page loads and displays app name', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('Hegemonia')
})
