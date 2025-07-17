// Utility functions for handling Supabase query limits and pagination

export interface PaginationOptions {
  page?: number
  pageSize?: number
  maxRows?: number
}

export interface QueryResult<T> {
  data: T[]
  count: number | null
  hasMore: boolean
  totalPages: number
}

/**
 * Default Supabase row limit is 1000. This utility helps manage larger datasets.
 */
export const SUPABASE_DEFAULT_LIMIT = 1000
export const SUPABASE_MAX_LIMIT = 10000 // Reasonable upper limit for performance

/**
 * Apply pagination to a Supabase query
 */
export function applyPagination<T>(
  query: any,
  options: PaginationOptions = {}
): any {
  const {
    page = 1,
    pageSize = SUPABASE_DEFAULT_LIMIT,
    maxRows = SUPABASE_MAX_LIMIT
  } = options

  // Ensure we don't exceed reasonable limits
  const effectivePageSize = Math.min(pageSize, maxRows)
  const from = (page - 1) * effectivePageSize
  const to = from + effectivePageSize - 1

  return query.range(from, to)
}

/**
 * Get all rows from a table with automatic pagination
 * Use with caution - only for datasets you know are reasonably sized
 */
export async function getAllRows<T>(
  query: any,
  maxRows: number = SUPABASE_MAX_LIMIT
): Promise<T[]> {
  const allData: T[] = []
  let page = 1
  const pageSize = SUPABASE_DEFAULT_LIMIT
  let hasMore = true

  while (hasMore && allData.length < maxRows) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    
    const { data, error } = await query.range(from, to)
    
    if (error) {
      console.error('Error fetching paginated data:', error)
      throw error
    }

    if (data && data.length > 0) {
      allData.push(...data)
      hasMore = data.length === pageSize
      page++
    } else {
      hasMore = false
    }

    // Safety check to prevent infinite loops
    if (allData.length >= maxRows) {
      console.warn(`Reached maximum row limit of ${maxRows}. Consider using pagination instead.`)
      break
    }
  }

  return allData.slice(0, maxRows)
}

/**
 * Execute a query with explicit limit handling
 */
export async function executeWithLimit<T>(
  query: any,
  limit?: number
): Promise<{ data: T[], count: number | null }> {
  if (limit && limit > SUPABASE_DEFAULT_LIMIT) {
    // For large limits, use pagination
    const data = await getAllRows<T>(query, limit)
    return { data, count: data.length }
  } else {
    // For normal limits, use standard query
    if (limit) {
      query = query.limit(limit)
    }
    const { data, error, count } = await query
    
    if (error) {
      throw error
    }
    
    return { data: data || [], count }
  }
}

/**
 * Check if a dataset might be hitting the Supabase limit
 */
export function isLikelyHittingLimit(count: number): boolean {
  return count === SUPABASE_DEFAULT_LIMIT
}

/**
 * Get a warning message if data might be truncated
 */
export function getTruncationWarning(count: number): string | null {
  if (isLikelyHittingLimit(count)) {
    return `Data may be truncated. Showing ${count} rows (Supabase default limit). Consider using date filters or pagination for complete data.`
  }
  return null
}