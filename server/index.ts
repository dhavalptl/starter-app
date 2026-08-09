import type { Server as HttpServer } from 'node:http'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { createApp } from './app.js'

/** Directory containing this file when executed as `node dist/server.js`. */
const distDir = path.dirname(path.resolve(process.argv[1] ?? '.'))
const staticDir = path.join(distDir, 'static')
const pvtEntry = path.join(distDir, 'pvt.js')
const port = Number(process.env.PORT ?? 8080)
const skipPvt = process.env.SKIP_PVT === '1'
/** Overall PVT budget (per-test + hard kill). Configure at prod start: PVT_TIMEOUT_MS=30000 */
const PVT_TIMEOUT_MS = Number(process.env.PVT_TIMEOUT_MS ?? 30_000)
const SHUTDOWN_MS = Number(process.env.SHUTDOWN_TIMEOUT_MS ?? 10_000)

let httpServer: HttpServer | null = null
let shuttingDown = false

/**
 * Run PVT in a child process so jsdom / fetch mocks never mutate this server.
 * Timeout is configurable via PVT_TIMEOUT_MS (default 30s).
 */
function runPvt(): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        '--test',
        '--test-concurrency=1',
        `--test-timeout=${PVT_TIMEOUT_MS}`,
        pvtEntry,
      ],
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          PVT_TIMEOUT_MS: String(PVT_TIMEOUT_MS),
        },
      },
    )

    const timer = setTimeout(() => {
      console.error(
        `[server] PVT timed out after ${PVT_TIMEOUT_MS}ms — killing child`,
      )
      child.kill('SIGKILL')
    }, PVT_TIMEOUT_MS)

    child.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.on('exit', (code, signal) => {
      clearTimeout(timer)
      if (signal === 'SIGKILL') {
        resolve(1)
        return
      }
      if (signal) {
        reject(new Error(`PVT terminated by signal ${signal}`))
        return
      }
      resolve(code ?? 1)
    })
  })
}

async function shutdown(reason: string, exitCode = 0): Promise<void> {
  if (shuttingDown) {
    return
  }
  shuttingDown = true
  console.log(`[server] ${reason} — graceful shutdown…`)

  const forceTimer = setTimeout(() => {
    console.error('[server] shutdown timed out — forcing exit')
    if (httpServer && typeof httpServer.closeAllConnections === 'function') {
      httpServer.closeAllConnections()
    }
    process.exit(exitCode || 1)
  }, SHUTDOWN_MS)
  forceTimer.unref()

  try {
    if (httpServer) {
      const server = httpServer
      httpServer = null

      if (typeof server.closeIdleConnections === 'function') {
        server.closeIdleConnections()
      }

      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      })
    }

    clearTimeout(forceTimer)
    console.log('[server] shutdown complete')
    process.exit(exitCode)
  } catch (error) {
    console.error('[server] shutdown error', error)
    process.exit(1)
  }
}

function registerProcessHandlers() {
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT'] as const) {
    process.on(signal, () => {
      void shutdown(signal, 0)
    })
  }

  process.on('uncaughtException', (error) => {
    console.error('[server] uncaughtException', error)
    void shutdown('uncaughtException', 1)
  })

  process.on('unhandledRejection', (reason) => {
    console.error('[server] unhandledRejection', reason)
    void shutdown('unhandledRejection', 1)
  })
}

async function main() {
  registerProcessHandlers()

  if (!skipPvt) {
    console.log(
      `[server] Running production verify tests (PVT, timeout=${PVT_TIMEOUT_MS}ms)…`,
    )
    const code = await runPvt()
    if (code !== 0) {
      console.error('[server] PVT failed — refusing to start Express')
      process.exit(code)
    }
    console.log('[server] PVT passed — starting Express (PVT ran in a child process)')
  } else {
    console.warn('[server] SKIP_PVT=1 — starting without PVT')
  }

  const app = createApp(staticDir)
  httpServer = app.listen(port, () => {
    console.log(`[server] listening on http://127.0.0.1:${port}`)
    console.log(`[server] health:  http://127.0.0.1:${port}/health`)
    console.log(`[server] app:     http://127.0.0.1:${port}/starter-app/`)
  })

  httpServer.on('error', (error: NodeJS.ErrnoException) => {
    console.error('[server] listen error', error)
    void shutdown(`listen:${error.code ?? 'error'}`, 1)
  })
}

main().catch((error: unknown) => {
  console.error('[server] fatal', error)
  process.exit(1)
})
