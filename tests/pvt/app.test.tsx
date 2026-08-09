import { after, afterEach, describe, it } from './bdd.js'
import { installDom, uninstallDom } from './rtl-env.js'

/**
 * App PVT with expect + jsdom + RTL (same style as tests/app unit tests).
 *
 * Install jsdom BEFORE importing expect/RTL — jest-dom pulls Testing Library,
 * which captures `document` at module load.
 *
 * Cleanup restores DOM globals before the process exits. Express runs in a
 * separate process, so PVT cannot leak into the live server either way.
 */
describe('PVT — App', () => {
  async function teardown(): Promise<void> {
    try {
      const { cleanup } = await import('@testing-library/react')
      cleanup()
    } catch {
      // RTL may not have loaded if the test failed early
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    uninstallDom()
  }

  afterEach(async () => {
    await teardown()
  })

  after(async () => {
    await teardown()
  })

  it('renders brand and increments / decrements the counter', async () => {
    installDom()

    try {
      const { expect } = await import('./expect.js')
      const { render } = await import('@testing-library/react')
      const { default: userEvent } = await import('@testing-library/user-event')
      const { default: App } = await import('../../src/App')

      const user = userEvent.setup()
      const view = render(<App />)

      expect(
        view.getByRole('heading', { name: 'Starter App' }),
      ).toBeInTheDocument()

      await user.click(view.getByRole('button', { name: /count is 0/i }))
      expect(
        view.getByRole('button', { name: /count is 1/i }),
      ).toBeInTheDocument()

      await user.click(view.getByRole('button', { name: 'Decrement' }))
      expect(
        view.getByRole('button', { name: /count is 0/i }),
      ).toBeInTheDocument()

      view.unmount()
    } catch (error) {
      await teardown()
      throw error
    }
  })
})
