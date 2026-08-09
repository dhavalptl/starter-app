import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

async function enableMocking() {
  // Local/dev only — never enabled in production builds
  if (!import.meta.env.DEV || import.meta.env.VITE_ENABLE_MSW !== 'true') {
    return
  }

  const { worker } = await import('../tests/mocks/browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
    },
  })
}

async function bootstrapLocalAuth() {
  // Local/dev only — Vite proxy/stub. Stripped from production client bundle.
  if (!import.meta.env.DEV) {
    return
  }

  const { ensureAuth } = await import('./api/auth.ts')
  await ensureAuth()
}

async function bootstrap() {
  await enableMocking()
  await bootstrapLocalAuth()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap().catch((error: unknown) => {
  console.error('[bootstrap] failed', error)
  const root = document.getElementById('root')
  if (root) {
    root.textContent =
      error instanceof Error
        ? `Failed to start: ${error.message}`
        : 'Failed to start application'
  }
})
