import { PRIMARY_AUTH_PATH } from '../config/services'

export type AuthResult = {
  ok: boolean
}

/**
 * Local/dev session bootstrap via Vite proxy or auth stub.
 * Call from `main.tsx` only when `import.meta.env.DEV` is true.
 */
export async function ensureAuth(): Promise<AuthResult> {
  const response = await fetch(PRIMARY_AUTH_PATH, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Auth failed with status ${response.status}`)
  }

  return (await response.json()) as AuthResult
}
