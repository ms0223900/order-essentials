/**
 * Repository 模式通用類型定義
 */

export interface RepositoryError {
  message: string
  code?: string
  details?: unknown
}

export interface RepositoryResult<T> {
  data: T | null
  error: RepositoryError | null
}

export interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
