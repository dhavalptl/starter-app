import { expect, type Locator, type Page } from '@playwright/test'
import { attachEvidence } from '../helpers'

export class HomePage {
  readonly page: Page
  readonly brand: Locator
  readonly counter: Locator
  readonly decrement: Locator

  constructor(page: Page) {
    this.page = page
    this.brand = page.getByRole('heading', { name: 'Starter App' })
    this.counter = page.getByRole('button', { name: /count is/i })
    this.decrement = page.getByRole('button', { name: 'Decrement' })
  }

  async expectLoaded() {
    await expect(this.brand).toBeVisible()
    await expect(this.counter).toBeVisible()
    await expect(this.decrement).toBeVisible()
  }

  async increment() {
    await this.counter.click()
  }

  async decrementOnce() {
    await this.decrement.click()
  }

  async expectCount(value: number) {
    await expect(
      this.page.getByRole('button', { name: `Count is ${value}` }),
    ).toBeVisible()
  }

  async captureFullPage(name: string) {
    await attachEvidence(this.page, name)
  }
}
