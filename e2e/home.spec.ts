import { expect, test } from '@playwright/test'
import { HomePage } from './pages/HomePage'

test.describe('Starter App home', () => {
  let home: HomePage

  test.beforeEach(async ({ page }) => {
    // Relative to baseURL (.../starter-app/) — avoid goto('/') which hits host root
    await page.goto('./')
    home = new HomePage(page)
  })

  test('loads the home screen', async () => {
    await test.step('Verify the brand heading and counter are visible', async () => {
      await home.expectLoaded()
    })
  })

  test('increments and decrements the counter', async () => {
    await test.step('Increment twice, then decrement once', async () => {
      await home.expectCount(0)
      await home.increment()
      await home.increment()
      await home.expectCount(2)
      await home.decrementOnce()
      await home.expectCount(1)
    })
  })

  test('does not break when counter is clicked repeatedly', async () => {
    await test.step('Click the counter twice and confirm Count is 2', async () => {
      await home.increment()
      await home.increment()
      await home.expectCount(2)
    })
  })
})
