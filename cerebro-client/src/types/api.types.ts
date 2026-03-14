export interface ApiSuccess<T> {
  success: true
  data: T
  meta?: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: Array<{ field: string; message: string }>
  }
}
