---
name: playwright-e2e
description: >-
  Authors Playwright end-to-end tests with Page Object Model, human-readable
  test.step() report descriptions, selective evidence screenshots, positive and
  negative cases, and system Chrome via channel. Use when writing, extending, or
  refactoring Playwright e2e specs, page objects, e2e helpers, playwright.config,
  or when the user asks for e2e, Playwright, POM, test steps, or evidence screenshots.
---

# Playwright E2E (POM + readable steps + evidence)

## When this skill applies

Follow these rules whenever creating or changing Playwright e2e tests. Prefer adapting to the repo’s existing `e2e/` layout; if none exists, create the structure below.

## Required stack defaults

- Use `@playwright/test` (not playwright-cli for app e2e suites).
- Prefer **installed Google Chrome**: `use: { channel: 'chrome' }` — do **not** require `npx playwright install` unless the user asks for bundled Chromium.
- Auto screenshots: `screenshot: 'only-on-failure'`.
- Video: `off`. Trace: `on-first-retry`.
- Reporters: `list` + `html` (`open: 'never'`).
- `webServer` should serve a production-like build (`preview` after `build`) unless the project already standardizes on `dev`.

## Project layout

```text
e2e/
  helpers.ts              # seed state, attachEvidence, attachRingEvidence
  pages/
    <Feature>Page.ts      # page objects (actions + locators)
    <Dialog>.ts           # dialogs/modals as separate objects
  <feature>.spec.ts       # specs: test.step + page objects only
playwright.config.ts
```

## Hard rules

1. **Page Object Model is required** for any non-trivial suite (2+ tests or repeated locators). Specs must not scatter raw `page.getByRole(...)` chains for shared UI.
2. **Every test uses `test.step('…', …)`** with **user-facing descriptions** (what a QA/product reader should understand). Never use step titles that read like code (`click getByRole button`).
3. **Evidence screenshots are rare and intentional**:
   - Do **not** screenshot every step.
   - Do **not** take cropped element-only shots (e.g. ring-only) unless the user explicitly asks.
   - Prefer **one full-page** `attachEvidence` only when the assertion is primarily visual (progress fill, theme) or the outcome is hard to prove from text alone.
   - Keep `screenshot: 'only-on-failure'` for automatic failure evidence.
   - Most happy-path and negative tests should rely on assertions only.
4. Cover **happy path and negative cases** (blocked actions, validation/clamping, permission denied, ignored shortcuts while typing, no-ops).
5. Prefer **role/label locators** (`getByRole`, `getByLabel`, `getByText` with `exact` when needed). Avoid brittle CSS unless asserting visual internals (e.g. SVG progress).
6. **Seed test data carefully**: init scripts must not overwrite `localStorage` on reload after the user/app changed settings mid-test (seed once per tab / session flag).

## Page object pattern

```ts
// e2e/pages/FeaturePage.ts
import { expect, type Locator, type Page } from '@playwright/test'

export class FeaturePage {
  readonly page: Page
  readonly primaryAction: Locator

  constructor(page: Page) {
    this.page = page
    this.primaryAction = page.getByRole('button', { name: 'Start timer' })
  }

  async start() {
    await this.primaryAction.click()
  }
}
```

- Locators as fields; user actions as methods; assertions either in methods (`expectX`) or in the step after the action.
- Put dialogs in their own class (`SettingsDialog`).
- Keep time-travel (`page.clock`), evidence capture, and complex waits behind page/helper methods.

## Spec pattern (readable report steps)

```ts
test('starts and pauses the timer', async () => {
  await test.step('Start the focus timer', async () => {
    await app.start()
    await app.captureFullPage('timer-running')
  })

  await test.step('Pause and confirm Resume is available', async () => {
    await app.pause()
    await expect(app.startButton).toContainText('Resume')
  })
})
```

**Step title style**
- ✅ `Verify the app loads on Focus mode with a full minute remaining`
- ✅ `Advance near the end and capture almost-full progress circle`
- ❌ `Click start button`
- ❌ `Expect locator timer-display__status`

## Evidence helpers

Provide shared helpers (names may match the project):

```ts
export async function attachEvidence(page: Page, name: string) {
  const body = await page.screenshot({ fullPage: true, animations: 'disabled' })
  await test.info().attach(name, { body, contentType: 'image/png' })
}
```

For visual components (progress rings, charts), add a **cropped** attach helper and assert the underlying metric when possible (attribute/computed value), not only a screenshot.

## Time-based UI

- Use `page.clock.install()` **before** navigation when controlling timers.
- Fast-forward to mid/near-complete states when progress UI matters; capture ring + full-page evidence at those checkpoints.

## Negative cases checklist

Include when relevant:

- [ ] Action blocked in invalid state (disabled controls, force-click does not change state)
- [ ] Invalid input clamped/rejected
- [ ] Permissions denied → feature stays off
- [ ] Global shortcuts ignored while focusing inputs
- [ ] Skip/cancel paths that must **not** increment success metrics
- [ ] Idempotent no-ops (reset while idle, double-start)

## Workflow

1. Read existing `e2e/`, `playwright.config.ts`, and page objects.
2. Extend page objects before adding duplicated locators in specs.
3. Write/adjust specs with `test.step` descriptions + selective evidence.
4. Add/adjust negative coverage for the changed behavior.
5. Run the project’s e2e command (often `npm run test:e2e` or `npx playwright test`).
6. Fix failures; keep steps readable in the HTML report (`npx playwright show-report`).

## Anti-patterns

- Installing Playwright browsers when `channel: 'chrome'` is the project standard
- Specs full of raw locators with no POM after the suite grows
- Step titles that mirror implementation details
- Screenshot on every step (noisy reports)
- Only happy-path tests
- Seeding storage on every navigation and wiping mid-test persistence

## More detail

- Templates and naming: [examples.md](examples.md)
