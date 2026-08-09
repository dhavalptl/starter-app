import { test, type Page } from '@playwright/test'

/** Capture a named full-page screenshot and attach it to the report. */
export async function attachEvidence(
  page: Page,
  name: string,
  options?: { fullPage?: boolean },
) {
  const body = await page.screenshot({
    fullPage: options?.fullPage ?? true,
    animations: 'disabled',
  })
  await test.info().attach(name, {
    body,
    contentType: 'image/png',
  })
}
