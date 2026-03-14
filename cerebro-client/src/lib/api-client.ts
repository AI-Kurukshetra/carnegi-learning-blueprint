import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_CONFIG } from '../config/api.config'
import { mockRegistry } from '../mocks'
import { useAuthStore } from '../store/auth.store'

export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach auth headers ──────────────

apiClient.interceptors.request.use((config) => {
  const { accessToken, tenantId } = useAuthStore.getState()
  const headers = config.headers ?? {}

  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  if (tenantId) headers['X-Tenant-ID'] = tenantId

  config.headers = headers

  return config
})

// ── Mock interceptor ──────────────────────────────────────

if (API_CONFIG.USE_MOCK) {
  apiClient.interceptors.request.use(async (config) => {
    const method = config.method ?? 'get'
    const url = config.url ?? ''
    const handler = mockRegistry.find(method, url)

    if (!handler) {
      const errMsg = `[Mock] No handler registered for ${method.toUpperCase()} ${url}`
      console.warn(errMsg)
      return Promise.reject({
        __isMock: true,
        data: {
          status: 501,
          success: false,
          error: { code: 'MOCK_NOT_IMPLEMENTED', message: errMsg },
        },
        status: 501,
        config,
      })
    }

    await new Promise((resolve) => setTimeout(resolve, API_CONFIG.MOCK_DELAY_MS))
    const mockResponse = await handler(config)
    const status =
      typeof mockResponse === 'object' &&
      mockResponse !== null &&
      'status' in mockResponse &&
      typeof mockResponse.status === 'number'
        ? mockResponse.status
        : 200

    return Promise.reject({
      __isMock: true,
      data: mockResponse,
      status,
      config,
    })
  })

  apiClient.interceptors.response.use(
    (response) => response,
    (error: { __isMock?: boolean; data?: unknown; status?: number; config?: unknown }) => {
      if (!error.__isMock) return Promise.reject(error)

      if ((error.status ?? 200) >= 400) {
        return Promise.reject({
          response: {
            status: error.status,
            data: error.data,
          },
          config: error.config,
        })
      }

      return Promise.resolve({
        data: error.data,
        status: error.status ?? 200,
        headers: {},
        config: error.config,
      })
    },
  )
}

// ── Response interceptor: silent token refresh on 401 ─────

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null) {
  for (const promise of failedQueue) {
    if (token) {
      promise.resolve(token)
    } else {
      promise.reject(error)
    }
  }
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Skip refresh for non-401 errors, auth endpoints, or already retried requests
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/refresh') || originalRequest?.url?.includes('/auth/login')
    if (error.response?.status !== 401 || isAuthEndpoint || originalRequest?._retry) {
      // On 401 from refresh endpoint itself, clear auth
      if (error.response?.status === 401 && originalRequest?.url?.includes('/auth/refresh')) {
        useAuthStore.getState().clearAuth()
      }
      return Promise.reject(error)
    }

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return apiClient(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    const { refreshToken } = useAuthStore.getState()

    if (!refreshToken) {
      isRefreshing = false
      useAuthStore.getState().clearAuth()
      return Promise.reject(error)
    }

    try {
      const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken })
      const body = response.data as { success?: boolean; data?: { access_token: string; refresh_token: string } }

      if (!body.success || !body.data) {
        throw new Error('Refresh failed')
      }

      const { access_token, refresh_token } = body.data
      useAuthStore.getState().updateTokens({ accessToken: access_token, refreshToken: refresh_token })

      // Retry the original request with new token
      originalRequest.headers.Authorization = `Bearer ${access_token}`
      processQueue(null, access_token)

      return apiClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      useAuthStore.getState().clearAuth()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
