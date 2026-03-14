import type { AxiosRequestConfig } from 'axios'
import { loginHandler, refreshHandler, logoutHandler, getMeHandler, updateMeHandler } from './handlers/auth.handlers'
import { tenantsHandlers } from './handlers/tenants.handlers'

type MockHandler = (config: AxiosRequestConfig) => Promise<unknown>

interface HandlerEntry {
  method: string
  pattern: RegExp
  handler: MockHandler
}

class MockRegistry {
  private handlers: HandlerEntry[] = []

  register(method: string, pattern: RegExp, handler: MockHandler) {
    this.handlers.push({ method: method.toLowerCase(), pattern, handler })
  }

  find(method: string, url: string) {
    return this.handlers.find(
      (entry) => entry.method === method.toLowerCase() && entry.pattern.test(url),
    )?.handler
  }
}

export const mockRegistry = new MockRegistry()

// Auth handlers
mockRegistry.register('post', /\/auth\/login$/, loginHandler)
mockRegistry.register('post', /\/auth\/refresh$/, refreshHandler)
mockRegistry.register('post', /\/auth\/logout$/, logoutHandler)
mockRegistry.register('get', /\/auth\/me$/, getMeHandler)
mockRegistry.register('patch', /\/auth\/me$/, updateMeHandler)

// Tenant handlers
for (const entry of tenantsHandlers) {
  mockRegistry.register(entry.method, entry.pattern, entry.handler)
}
