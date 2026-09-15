// A real DOM (jsdom) for the smoke test, so pages mount with their effects running
// exactly as they do in the browser — skeleton gates, schedule lookups and all.
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
})

const { window } = dom
globalThis.window = window
globalThis.document = window.document
globalThis.navigator = window.navigator
globalThis.localStorage = window.localStorage
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window)
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window)
globalThis.getComputedStyle = window.getComputedStyle.bind(window)

// Carry over the constructors framer-motion and friends feature-detect against.
for (const k of ['Element', 'HTMLElement', 'SVGElement', 'Node', 'Event', 'CustomEvent',
  'MouseEvent', 'KeyboardEvent', 'DOMRect', 'Blob', 'File', 'FileReader', 'URL',
  'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLSelectElement', 'HTMLButtonElement', 'NodeList',
  'AbortController', 'AbortSignal']) {
  if (window[k]) globalThis[k] = window[k]  // always jsdom's, so cross-realm IDL checks pass
}

const noop = () => {}
window.matchMedia = window.matchMedia || ((q) => ({
  matches: false, media: q, onchange: null,
  addEventListener: noop, removeEventListener: noop, addListener: noop, removeListener: noop,
  dispatchEvent: () => false,
}))
globalThis.matchMedia = window.matchMedia.bind(window)

class Obs { constructor(cb) { this.cb = cb } observe() {} unobserve() {} disconnect() {} takeRecords() { return [] } }
globalThis.IntersectionObserver = window.IntersectionObserver = Obs
globalThis.ResizeObserver = window.ResizeObserver = Obs
window.scrollTo = noop
if (!window.URL.createObjectURL) window.URL.createObjectURL = () => 'blob:stub'
if (!window.URL.revokeObjectURL) window.URL.revokeObjectURL = noop

export { dom, window }

// jsdom rejects listener option bags carrying `signal: undefined`, which some
// animation libraries pass. Normalise them so mounting doesn't throw in the harness.
for (const target of [window.EventTarget.prototype]) {
  const orig = target.addEventListener
  target.addEventListener = function (t, l, o) {
    if (o && typeof o === 'object' && 'signal' in o && !o.signal) { const { signal, ...rest } = o; o = rest }
    return orig.call(this, t, l, o)
  }
}
