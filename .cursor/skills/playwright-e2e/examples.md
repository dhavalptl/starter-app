# Playwright E2E examples

## Config snippet

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: 'chrome',
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],
})
```

## Seed once per tab (persistence-safe)

```ts
await page.addInitScript(
  ({ key, value, flag }) => {
    if (!sessionStorage.getItem(flag)) {
      localStorage.setItem(key, value)
      sessionStorage.setItem(flag, '1')
    }
  },
  { key: STORAGE_KEY, value: JSON.stringify(state), flag: 'e2e:seeded' },
)
```

## Spec + steps + POM

```ts
test.describe('Checkout', () => {
  let shop: ShopPage

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    shop = new ShopPage(page)
  })

  test('applies a discount code', async () => {
    await test.step('Add an item and open the cart', async () => {
      await shop.addFirstItem()
      await shop.openCart()
    })

    await test.step('Apply a valid code and capture the discounted total', async () => {
      await shop.applyCode('SAVE10')
      await expect(shop.total).toContainText('$')
      await shop.captureFullPage('cart-discount-applied')
    })
  })
})
```

## Negative case example

```ts
test('ignores shortcuts while typing in settings', async () => {
  await test.step('Focus a settings field and press shortcut keys', async () => {
    await app.openSettings()
    await settings.spinbutton('Focus').click()
    await app.page.keyboard.press('Space')
  })

  await test.step('Confirm the timer did not start', async () => {
    await settings.expectOpen()
    await expect(app.timerStatus).toHaveText('Ready')
    await app.captureFullPage('negative-shortcuts-ignored-while-typing')
  })
})
```
