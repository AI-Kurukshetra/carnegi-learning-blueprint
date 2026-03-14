export const API_CONFIG = {
  USE_MOCK: import.meta.env.VITE_USE_MOCK === 'true',
  BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
  MOCK_DELAY_MS: Number(import.meta.env.VITE_MOCK_DELAY_MS ?? 400),
  APP_PHASE: Number(import.meta.env.VITE_APP_PHASE ?? 1),
}
