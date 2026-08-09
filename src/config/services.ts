/**
 * Backend services proxied by Vite in local/dev only.
 * Production Express does not mount these routes.
 *
 * Add entries here for each upstream. Path prefixes become Vite `server.proxy`
 * keys (string prefix or `^`-anchored regex string).
 */
export type ServiceDefinition = {
  /** Stable id used for env vars: `${ID}_TARGET`, `${ID}_SECURE` */
  id: string
  /**
   * Vite proxy match key.
   * Prefer a regex-style string so `/service1` does not steal `/service10`:
   *   `^/service1(?:/|$)`
   */
  proxyPath: string
  /** Default upstream when `${ID}_TARGET` is unset. */
  defaultTarget: string
  /** Optional auth path for local ensureAuth() via Vite proxy/stub. */
  authPath?: string
}

export const services: ServiceDefinition[] = [
  {
    id: 'service1',
    proxyPath: '^/service1(?:/|$)',
    defaultTarget: 'http://127.0.0.1:8000',
    authPath: '/service1/auth',
  },
  // Example second service — set SERVICE2_TARGET to enable in Vite proxy:
  // {
  //   id: 'service2',
  //   proxyPath: '^/service2(?:/|$)',
  //   defaultTarget: 'http://127.0.0.1:8001',
  // },
]

/** First service that declares authPath — used by local ensureAuth(). */
export const PRIMARY_AUTH_PATH =
  services.find((s) => s.authPath)?.authPath ?? '/service1/auth'

/** @deprecated Prefer PRIMARY_AUTH_PATH / services[] */
export const SERVICE1_PREFIX = '/service1'
/** @deprecated Prefer PRIMARY_AUTH_PATH */
export const SERVICE1_AUTH_PATH = PRIMARY_AUTH_PATH
/** @deprecated Prefer services[0].defaultTarget */
export const DEFAULT_SERVICE1_TARGET = 'http://127.0.0.1:8000'

export function envKeyForService(id: string, suffix: string): string {
  return `${id.toUpperCase()}_${suffix}`
}
