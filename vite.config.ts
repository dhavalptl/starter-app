import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { buildServiceProxies } from './vite/serviceProxies.ts'
import { PRIMARY_AUTH_PATH } from './src/config/services.ts'

/** Local-only auth stub when SERVICE_STUB=1 or SERVICE1_STUB=1. */
function serviceAuthStub(): Plugin {
  return {
    name: 'service-auth-stub',
    apply: 'serve',
    configureServer(viteServer) {
      if (
        process.env.SERVICE_STUB !== '1' &&
        process.env.SERVICE1_STUB !== '1'
      ) {
        return
      }

      viteServer.middlewares.use(
        PRIMARY_AUTH_PATH,
        (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          if (req.method !== 'POST' && req.method !== 'GET') {
            next()
            return
          }
          res.setHeader(
            'Set-Cookie',
            'session=stub-local; Path=/; HttpOnly; SameSite=Lax',
          )
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true, source: 'vite-stub' }))
        },
      )
    },
  }
}

function omitMswWorkerFromProd(): Plugin {
  return {
    name: 'omit-msw-worker-from-prod',
    apply: 'build',
    async closeBundle() {
      const worker = path.join('dist/static', 'mockServiceWorker.js')
      await fs.rm(worker, { force: true })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxy = buildServiceProxies(env)

  return {
    base: '/starter-app/',
    plugins: [react(), serviceAuthStub(), omitMswWorkerFromProd()],
    build: {
      outDir: 'dist/static',
      emptyOutDir: true,
    },
    // Proxy is Vite-dev only — never part of the production Express server
    server: {
      proxy,
    },
  }
})
