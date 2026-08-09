# starter-app

Reusable Vite + React 19 + TypeScript CSR scaffold.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite + proxy to configured services |
| `npm run dev:stub` | Vite with local auth stub (`SERVICE_STUB=1`) |
| `npm run dev:mock` | Stub + MSW browser mocks |
| `npm run build` | `dist/static` + `dist/server.js` + `dist/pvt.js` |
| `npm start` | PVT then Express |
| `npm test` | Jest unit tests under `tests/app` |
| `npm run test:pvt` | PVT: App RTL (expect/jsdom), 30s timeout |
| `npm run test:e2e` | Playwright (system Chrome) |

## Layout

```text
src/                 # App only (UI, api clients, config)
tests/
  app/               # Unit / RTL tests (Jest)
  pvt/               # Production verify (expect/jsdom; bundled to dist/pvt.js)
  mocks/             # MSW handlers (Jest + browser mock mode)
  setup.ts
vite/                # Dev-only proxy helpers (cookie rewrite, multi-service)
server/              # Express + deploy package.json
e2e/                 # Playwright
```

## Multi-service Vite proxy

Edit `src/config/services.ts`. Each entry uses a **regex-style path** so `/service1` does not match `/service10`:

```ts
{ id: 'service1', proxyPath: '^/service1(?:/|$)', defaultTarget: 'http://127.0.0.1:8000', authPath: '/service1/auth' }
```

`vite/serviceProxies.ts` builds the Vite `server.proxy` map and applies `applySetCookieRewrite` on each service’s `proxyRes`.

## Set-Cookie rewrite

Applied on **responses that include `Set-Cookie`** (auth/refresh). The browser then stores the cookie and sends it automatically on later requests — you do **not** rewrite on every API call for cookies to “keep working.” Share one helper across all service proxies that may set cookies.

## FAQ

**eslint-plugin-react-refresh** — Vite Fast Refresh: warns when a file exports non-components next to components (breaks HMR). Safe to keep for app UI files.

**tsx** — optional runner for TypeScript without a build step. Removed from this scaffold (esbuild/Jest/Vite cover builds & tests).

**Local auth** — DEV-only `ensureAuth()` in `main.tsx` POSTs `PRIMARY_AUTH_PATH` with `credentials: 'include'` so the browser stores `Set-Cookie` from the Vite stub or proxied upstream. Not in the production client bundle.

**PVT** — App UI checks with `expect` + jsdom + Testing Library under `tests/pvt` (same style as `tests/app`). Runs in a **child process** before Express listens, so jsdom/fetch mocks never touch the server. Timeout defaults to **30s**, override at start: `PVT_TIMEOUT_MS=45000 node dist/server.js`. Skip with `SKIP_PVT=1`. No MSW in prod — `tests/pvt/fetchMock.ts` stubs fetch.
