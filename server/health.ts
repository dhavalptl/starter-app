export const APP_VERSION = '0.0.0'
export const APP_SERVICE = 'starter-app'

export type HealthStatus = {
  status: 'ok'
  service: string
  version: string
}

export function healthPayload(version = APP_VERSION): HealthStatus {
  return {
    status: 'ok',
    service: APP_SERVICE,
    version,
  }
}
