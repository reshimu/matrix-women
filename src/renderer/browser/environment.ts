export type ObserverEntry = Readonly<{ isIntersecting: boolean }>
export type Observer = Readonly<{ observe(target: Element): void; disconnect(): void }>
export type DocumentPort = Readonly<{
  hidden: boolean
  addEventListener(type: 'visibilitychange', listener: () => void): void
  removeEventListener(type: 'visibilitychange', listener: () => void): void
}>

export type BrowserLifecycleEnvironment = Readonly<{
  document: DocumentPort
  createIntersectionObserver(callback: (entries: readonly ObserverEntry[]) => void): Observer
}>

export function createDefaultBrowserEnvironment(): BrowserLifecycleEnvironment {
  return {
    document: window.document,
    createIntersectionObserver: (callback) => new IntersectionObserver(callback),
  }
}
