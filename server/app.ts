import express from 'express'
import helmet from 'helmet'
import path from 'node:path'
import { healthPayload, APP_VERSION } from './health.js'

export function createApp(staticDir: string) {
  const app = express()

  app.disable('x-powered-by')
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'img-src': ["'self'", 'data:'],
          'connect-src': ["'self'"],
          'font-src': ["'self'"],
          'object-src': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
          'frame-ancestors': ["'none'"],
          // Keep local http:// deployments (and Playwright) working
          'upgrade-insecure-requests': null,
        },
      },
      referrerPolicy: { policy: 'no-referrer' },
      crossOriginEmbedderPolicy: false,
    }),
  )

  // Production server: health only (no service1 proxy / auth stub)
  app.get('/health', (_req, res) => {
    res.status(200).json(healthPayload(APP_VERSION))
  })

  app.use(
    '/starter-app',
    express.static(staticDir, {
      index: 'index.html',
      fallthrough: true,
    }),
  )

  // SPA fallback for client-side routes under /starter-app
  app.get(/\/starter-app\/.*/, (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'))
  })

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  return app
}
