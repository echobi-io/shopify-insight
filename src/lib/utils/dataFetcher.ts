import { createClient } from '@/util/supabase/component'

// Types for data fetching
export interface DataFetcherOptions {
  timeout?: number
  retries?: number
  retryDelay?: number
  fallbackData?: any
  cacheKey?: string
  cacheTTL?: number
}

export interface DataFetcherResult<T> {
  data: T | null
  error: Error | null
  loading: boolean
  success: boolean
  fromCache?: boolean
}

export interface QueryConfig {
  table: string
  select?: string
  filters?: Record<string, any>
  orderBy?: { column: string; ascending?: boolean }
  limit?: number
  single?: boolean
}

// Simple in-memory cache
class DataCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttl: number = 300000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  clear() {
    this.cache.clear()
  }

  delete(key: string) {
    this.cache.delete(key)
  }
}

const dataCache = new DataCache()

// Utility to create timeout promise
function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms)
  })
}

// Utility to delay execution
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Enhanced data fetcher with error handling, retries, and caching
export async function fetchWithRetry<T>(
  fetchFunction: () => Promise<T>,
  options: DataFetcherOptions = {}
): Promise<DataFetcherResult<T>> {
  const {
    timeout = 30000, // 30 seconds
    retries = 3,
    retryDelay = 1000,
    fallbackData = null,
    cacheKey,
    cacheTTL = 300000 // 5 minutes
  } = options

  // Check cache first
  if (cacheKey) {
    const cachedData = dataCache.get(cacheKey)
    if (cachedData) {
      console.log(`📦 Cache hit for key: ${cacheKey}`)
      return {
        data: cachedData,
        error: null,
        loading: false,
        success: true,
        fromCache: true
      }
    }
  }

  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt + 1}/${retries + 1}${cacheKey ? ` for ${cacheKey}` : ''}`)
      
      // Race between fetch and timeout
      const data = await Promise.race([
        fetchFunction(),
        createTimeoutPromise(timeout)
      ])

      // Cache successful result
      if (cacheKey && data) {
        dataCache.set(cacheKey, data, cacheTTL)
      }

      console.log(`✅ Success${cacheKey ? ` for ${cacheKey}` : ''}`)
      return {
        data,
        error: null,
        loading: false,
        success: true,
        fromCache: false
      }

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn(`⚠️ Attempt ${attempt + 1} failed${cacheKey ? ` for ${cacheKey}` : ''}: ${lastError.message}`)

      // Don't retry on the last attempt
      if (attempt < retries) {
        await delay(retryDelay * (attempt + 1)) // Exponential backoff
      }
    }
  }

  console.error(`❌ All attempts failed${cacheKey ? ` for ${cacheKey}` : ''}: ${lastError?.message}`)

  // Return fallback data if available
  if (fallbackData !== null) {
    console.log(`🔄 Using fallback data${cacheKey ? ` for ${cacheKey}` : ''}`)
    return {
      data: fallbackData,
      error: lastError,
      loading: false,
      success: false,
      fromCache: false
    }
  }

  return {
    data: null,
    error: lastError,
    loading: false,
    success: false,
    fromCache: false
  }
}

// Enhanced Supabase query builder with error handling
export async function executeQuery<T>(
  config: QueryConfig,
  merchantId?: string,
  options: DataFetcherOptions = {}
): Promise<DataFetcherResult<T>> {
  const supabase = createClient()

  const fetchFunction = async (): Promise<T> => {
    let query = supabase.from(config.table)

    // Apply select
    if (config.select) {
      query = query.select(config.select)
    } else {
      query = query.select('*')
    }

    // Apply merchant filter if provided
    if (merchantId) {
      query = query.eq('merchant_id', merchantId)
    }

    // Apply additional filters
    if (config.filters) {
      Object.entries(config.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key.includes('gte_')) {
            query = query.gte(key.replace('gte_', ''), value)
          } else if (key.includes('lte_')) {
            query = query.lte(key.replace('lte_', ''), value)
          } else if (key.includes('gt_')) {
            query = query.gt(key.replace('gt_', ''), value)
          } else if (key.includes('lt_')) {
            query = query.lt(key.replace('lt_', ''), value)
          } else if (key.includes('in_')) {
            query = query.in(key.replace('in_', ''), Array.isArray(value) ? value : [value])
          } else if (key.includes('neq_')) {
            query = query.neq(key.replace('neq_', ''), value)
          } else {
            query = query.eq(key, value)
          }
        }
      })
    }

    // Apply ordering
    if (config.orderBy) {
      query = query.order(config.orderBy.column, { ascending: config.orderBy.ascending ?? true })
    }

    // Apply limit
    if (config.limit) {
      query = query.limit(config.limit)
    }

    // Execute query
    const { data, error } = config.single ? await query.single() : await query

    if (error) {
      throw new Error(`Database query failed: ${error.message}`)
    }

    return data as T
  }

  return fetchWithRetry(fetchFunction, options)
}

// RPC function caller with error handling
export async function executeRPC<T>(
  functionName: string,
  params: Record<string, any> = {},
  options: DataFetcherOptions = {}
): Promise<DataFetcherResult<T>> {
  const supabase = createClient()

  const fetchFunction = async (): Promise<T> => {
    const { data, error } = await supabase.rpc(functionName, params)

    if (error) {
      throw new Error(`RPC function '${functionName}' failed: ${error.message}`)
    }

    return data as T
  }

  return fetchWithRetry(fetchFunction, {
    ...options,
    cacheKey: options.cacheKey || `rpc_${functionName}_${JSON.stringify(params)}`
  })
}

// Batch data fetcher for multiple queries
export async function fetchBatch<T extends Record<string, any>>(
  queries: Record<keyof T, () => Promise<DataFetcherResult<any>>>,
  options: { failFast?: boolean } = {}
): Promise<Record<keyof T, DataFetcherResult<any>>> {
  const { failFast = false } = options

  if (failFast) {
    // Fail fast - if any query fails, stop all
    const results = {} as Record<keyof T, DataFetcherResult<any>>
    
    for (const [key, queryFn] of Object.entries(queries)) {
      const result = await queryFn()
      results[key as keyof T] = result
      
      if (!result.success) {
        console.error(`❌ Batch query failed at ${String(key)}: ${result.error?.message}`)
        break
      }
    }
    
    return results
  } else {
    // Execute all queries in parallel, collect all results
    const queryEntries = Object.entries(queries) as [keyof T, () => Promise<DataFetcherResult<any>>][]
    const results = await Promise.all(
      queryEntries.map(async ([key, queryFn]) => {
        try {
          const result = await queryFn()
          return [key, result] as [keyof T, DataFetcherResult<any>]
        } catch (error) {
          return [key, {
            data: null,
            error: error instanceof Error ? error : new Error(String(error)),
            loading: false,
            success: false
          }] as [keyof T, DataFetcherResult<any>]
        }
      })
    )

    return Object.fromEntries(results) as Record<keyof T, DataFetcherResult<any>>
  }
}

// Data aggregation utilities
export function aggregateData<T>(
  data: T[],
  groupBy: keyof T,
  aggregations: Record<string, {
    field: keyof T
    operation: 'sum' | 'avg' | 'count' | 'min' | 'max'
  }>
): Record<string, any>[] {
  const groups = new Map<any, T[]>()

  // Group data
  data.forEach(item => {
    const key = item[groupBy]
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(item)
  })

  // Apply aggregations
  return Array.from(groups.entries()).map(([groupKey, items]) => {
    const result: any = { [groupBy]: groupKey }

    Object.entries(aggregations).forEach(([resultKey, config]) => {
      const values = items.map(item => Number(item[config.field]) || 0)

      switch (config.operation) {
        case 'sum':
          result[resultKey] = values.reduce((sum, val) => sum + val, 0)
          break
        case 'avg':
          result[resultKey] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
          break
        case 'count':
          result[resultKey] = items.length
          break
        case 'min':
          result[resultKey] = values.length > 0 ? Math.min(...values) : 0
          break
        case 'max':
          result[resultKey] = values.length > 0 ? Math.max(...values) : 0
          break
      }
    })

    return result
  })
}

// Clear cache utility
export function clearDataCache(pattern?: string) {
  if (pattern) {
    // Clear specific pattern (simple string matching)
    const keys = Array.from((dataCache as any).cache.keys())
    keys.forEach(key => {
      if (key.includes(pattern)) {
        dataCache.delete(key)
      }
    })
  } else {
    dataCache.clear()
  }
}

// Export cache for debugging
export { dataCache }