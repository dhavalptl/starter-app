import { JSDOM } from 'jsdom'

const previous = new Map<string, PropertyDescriptor | undefined>()
let activeDom: JSDOM | null = null
let installedKeys: string[] = []

function setGlobal(key: string, value: unknown) {
  if (!previous.has(key)) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    installedKeys.push(key)
  }
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    enumerable: true,
    value,
  })
}

/**
 * Install jsdom so @testing-library/react can run inside Node PVT.
 * Must run before importing React / RTL / expect(jest-dom) for that test.
 */
export function installDom(url = 'http://127.0.0.1/'): void {
  if (activeDom) {
    uninstallDom()
  }

  const dom = new JSDOM(
    '<!doctype html><html><body><div id="root"></div></body></html>',
    {
      url,
      pretendToBeVisual: true,
    },
  )
  activeDom = dom
  const { window } = dom

  setGlobal('window', window)
  setGlobal('self', window)
  setGlobal('document', window.document)
  setGlobal('navigator', window.navigator)
  setGlobal('location', window.location)
  setGlobal('history', window.history)
  setGlobal('getComputedStyle', window.getComputedStyle.bind(window))
  setGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
    window.setTimeout(() => cb(Date.now()), 0),
  )
  setGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id))
  setGlobal('IS_REACT_ACT_ENVIRONMENT', true)

  for (const key of Object.getOwnPropertyNames(window)) {
    if (key in globalThis) continue
    try {
      setGlobal(key, (window as unknown as Record<string, unknown>)[key])
    } catch {
      // skip non-configurable window props
    }
  }
}

export function uninstallDom(): void {
  if (activeDom) {
    activeDom.window.close()
    activeDom = null
  }

  for (const key of installedKeys.reverse()) {
    const descriptor = previous.get(key)
    if (descriptor) {
      Object.defineProperty(globalThis, key, descriptor)
    } else {
      Reflect.deleteProperty(globalThis, key)
    }
  }
  installedKeys = []
  previous.clear()
}
