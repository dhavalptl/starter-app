import { http, HttpResponse } from 'msw'
import { ensureAuth } from '../../../src/api/auth'
import { PRIMARY_AUTH_PATH } from '../../../src/config/services'
import { server } from '../../mocks/server'

describe('ensureAuth', () => {
  it('succeeds when auth endpoint returns ok', async () => {
    await expect(ensureAuth()).resolves.toEqual({ ok: true })
  })

  it('throws when auth endpoint fails', async () => {
    server.use(
      http.post(PRIMARY_AUTH_PATH, () =>
        HttpResponse.json({ ok: false }, { status: 401 }),
      ),
    )

    await expect(ensureAuth()).rejects.toThrow('Auth failed with status 401')
  })
})
