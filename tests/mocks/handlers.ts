import { http, HttpResponse } from 'msw'
import { PRIMARY_AUTH_PATH } from '../../src/config/services'

/**
 * Shared MSW handlers for Jest unit tests and local browser mock mode.
 * Never imported by production server or PVT bundles.
 */
export const handlers = [
  http.post(PRIMARY_AUTH_PATH, () => {
    return HttpResponse.json(
      { ok: true },
      {
        headers: {
          'Set-Cookie': 'session=msw-session; Path=/; HttpOnly; SameSite=Lax',
        },
      },
    )
  }),
]
