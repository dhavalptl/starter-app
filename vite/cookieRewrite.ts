/**
 * Rewrite upstream Set-Cookie for local http:// Vite proxy only.
 * Never used by the production Express server.
 *
 * Call this from each service proxy's `proxyRes` when the upstream may
 * set cookies (auth, refresh, logout). It is NOT needed so the browser
 * "keeps sending" cookies — once stored, the browser attaches them
 * automatically. This only rewrites Domain/Secure/SameSite so the cookie
 * can be stored under localhost in the first place.
 */
export function applySetCookieRewrite(
  headers: Record<string, unknown>,
): void {
  if (!('set-cookie' in headers)) return
  const value = headers['set-cookie']
  if (value == null) return

  const list = Array.isArray(value) ? value.map(String) : [String(value)]
  headers['set-cookie'] = list.map((cookie) =>
    cookie
      .replace(/;\s*Domain=[^;]*/gi, '')
      .replace(/;\s*Secure/gi, '')
      .replace(/;\s*SameSite=None/gi, '; SameSite=Lax'),
  )
}
