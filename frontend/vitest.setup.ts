import '@testing-library/jest-dom'

// Polyfill IntersectionObserver for jsdom environment
class MockIntersectionObserver {
  private _callback: IntersectionObserverCallback
  constructor(callback: IntersectionObserverCallback) {
    this._callback = callback
  }
  observe() {
    // Immediately invoke with intersecting true to simulate visibility
    const entry = [{ isIntersecting: true } as IntersectionObserverEntry]
    // Delay to simulate async behavior
    setTimeout(() => this._callback(entry, this as unknown as IntersectionObserver), 0)
  }
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] { return [] }
}

// @ts-ignore
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver
