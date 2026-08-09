/**
 * Lightweight fetch mock for PVT (Node). No MSW — safe for production bundles.
 *
 * Per-test usage:
 * - `handlers` — map path/URL → handler (same reply every call)
 * - `sequences` — map path/URL → ordered replies (call 1, call 2, …)
 * - unmatched API-like requests auto-stub 200 when `autoStubApis` is true
 */

export type FetchInput = Parameters<typeof fetch>[0]
export type FetchInit = Parameters<typeof fetch>[1]

export type FetchMockHandler = (
  url: URL,
  init?: FetchInit,
) => Response | Promise<Response>

export type MockJsonReply = {
  status?: number
  body: unknown
  headers?: Record<string, string>
}

export type SequenceReply = Response | MockJsonReply | FetchMockHandler

export type InstallFetchMockOptions = {
  handlers?: Record<string, FetchMockHandler>
  /**
   * Ordered replies per path/URL. Each fetch consumes the next item.
   * Example: sequences: { '/api/a': [{ body: { n: 1 } }, { body: { n: 2 } }] }
   */
  sequences?: Record<string, SequenceReply[]>
  autoStubApis?: boolean
  passthroughUnhandled?: boolean
}

const API_HINT =
  /\/api\/|\/health(?:\?|$)|graphql|api\.|localhost:\d+\/health/i

function toUrl(input: FetchInput): URL {
  if (input instanceof URL) return input
  if (typeof input === 'string') {
    return new URL(input, 'http://127.0.0.1')
  }
  return new URL(input.url, 'http://127.0.0.1')
}

function looksLikeApi(url: URL): boolean {
  return API_HINT.test(url.href) || API_HINT.test(url.pathname)
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function resolveReply(
  reply: SequenceReply,
  url: URL,
  init?: FetchInit,
): Response | Promise<Response> {
  if (typeof reply === 'function') {
    return reply(url, init)
  }
  if (reply instanceof Response) {
    return reply
  }
  return new Response(JSON.stringify(reply.body), {
    status: reply.status ?? 200,
    headers: {
      'content-type': 'application/json',
      ...reply.headers,
    },
  })
}

function lookupKey(
  map: Record<string, unknown>,
  url: URL,
): string | undefined {
  const candidates = [
    `${url.origin}${url.pathname}`,
    url.pathname,
    url.href,
  ]
  return candidates.find((key) => key in map)
}

export function installFetchMock(
  options: InstallFetchMockOptions = {},
): () => void {
  const {
    handlers = {},
    sequences = {},
    autoStubApis = true,
    passthroughUnhandled = false,
  } = options

  const queues: Record<string, SequenceReply[]> = Object.fromEntries(
    Object.entries(sequences).map(([key, replies]) => [key, [...replies]]),
  )

  const original = globalThis.fetch.bind(globalThis)

  globalThis.fetch = (async (input: FetchInput, init?: FetchInit) => {
    const url = toUrl(input)

    const sequenceKey = lookupKey(queues, url)
    if (sequenceKey) {
      const next = queues[sequenceKey].shift()
      if (next) {
        return resolveReply(next, url, init)
      }
      // Queue exhausted — fall through to handler / auto-stub
    }

    const handlerKey = lookupKey(handlers, url)
    if (handlerKey) {
      return handlers[handlerKey](url, init)
    }

    if (autoStubApis && looksLikeApi(url)) {
      return jsonResponse({
        status: 'ok',
        service: 'starter-app',
        version: '0.0.0',
        mocked: true,
        path: url.pathname,
      })
    }

    if (passthroughUnhandled) {
      return original(input, init)
    }

    return jsonResponse(
      {
        status: 'ok',
        mocked: true,
        path: url.pathname,
      },
      200,
    )
  }) as typeof fetch

  return () => {
    globalThis.fetch = original
  }
}
