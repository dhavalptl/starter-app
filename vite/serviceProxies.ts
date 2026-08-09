import type { ProxyOptions } from 'vite'
import { applySetCookieRewrite } from './cookieRewrite.ts'
import {
  envKeyForService,
  services,
  type ServiceDefinition,
} from '../src/config/services.ts'

/**
 * Build Vite `server.proxy` map for every configured service.
 * Each entry reuses the same Set-Cookie rewrite for localhost.
 */
export function buildServiceProxies(
  env: Record<string, string>,
): Record<string, ProxyOptions> | undefined {
  if (process.env.SERVICE_STUB === '1' || process.env.SERVICE1_STUB === '1') {
    // Stub mode: no upstream proxies (auth stub plugin handles /service1/auth)
    return undefined
  }

  const proxy: Record<string, ProxyOptions> = {}

  for (const service of services) {
    const options = proxyOptionsForService(service, env)
    if (options) {
      proxy[service.proxyPath] = options
    }
  }

  return Object.keys(proxy).length > 0 ? proxy : undefined
}

function proxyOptionsForService(
  service: ServiceDefinition,
  env: Record<string, string>,
): ProxyOptions | undefined {
  const targetKey = envKeyForService(service.id, 'TARGET')
  const secureKey = envKeyForService(service.id, 'SECURE')

  const target =
    process.env[targetKey] || env[targetKey] || service.defaultTarget

  // Skip if explicitly disabled
  if (process.env[targetKey] === '' || env[targetKey] === '') {
    return undefined
  }

  return {
    target,
    changeOrigin: true,
    secure: process.env[secureKey] === '1' || env[secureKey] === '1',
    cookieDomainRewrite: '',
    cookiePathRewrite: '/',
    configure(proxyServer) {
      // Only touches responses that include Set-Cookie (login/refresh/etc.).
      // Browser then stores the cookie and sends it automatically on later calls.
      proxyServer.on('proxyRes', (proxyRes) => {
        applySetCookieRewrite(proxyRes.headers as Record<string, unknown>)
      })
      proxyServer.on('error', (err) => {
        console.error(`[vite] ${service.id} proxy error`, err.message)
      })
    },
  }
}
