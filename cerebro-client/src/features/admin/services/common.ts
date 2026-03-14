import type { ApiSuccess } from '@/types/api.types'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
}

interface NestedListPayload<T> {
  data: T[]
  meta?: PaginationMeta
}

function isNestedListPayload<T>(value: unknown): value is NestedListPayload<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    'data' in value &&
    Array.isArray((value as { data?: unknown }).data)
  )
}

export function unwrapListResponse<T>(
  body: ApiSuccess<T[] | NestedListPayload<T>>,
  fallback: { page?: number; limit?: number } = {},
): PaginatedResult<T> {
  const nested = isNestedListPayload<T>(body.data) ? body.data : null
  const rows: T[] = nested ? nested.data : (body.data as T[])
  const meta = nested?.meta ?? body.meta

  return {
    data: rows,
    meta: meta ?? {
      page: fallback.page ?? 1,
      limit: fallback.limit ?? Math.max(1, rows.length),
      total: rows.length,
      total_pages: 1,
    },
  }
}
