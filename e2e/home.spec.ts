import { test, expect } from '@playwright/test'
test('mobile home lets a player begin character creation', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('10 SECONDS.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: /play now/i }).click()
  await expect(page.getByText('MAKE A', { exact: false })).toBeVisible()
})

test('mobile player can create a character without a permission gate', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /play now/i }).click()
  await page.getByPlaceholder('e.g. Captain Tap').fill('Mobile Hero')
  await page.getByRole('button', { name: /ready to rumble/i }).click()
  await expect(page.getByText('LOCKED.', { exact: false })).toBeVisible()
})
