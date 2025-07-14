import { useState, useEffect, useCallback, useRef } from 'react'
import { DataFetcherResult, DataFetcherOptions } from '@/lib/utils/dataFetcher'

export interface UseDataFetcherOptions<T> extends DataFetcherOptions {
  enabled?: boolean
  refetchOnWindowFocus?: boolean
  refetchInterval?: number
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export interface UseDataFetcherReturn<T> extends DataFetcherResult<T> {
  refetch: () => Promise<void>
  isRefetching: boolean
  lastFetched: Date | null
}

export function useDataFetcher<T>(
  fetchFunction: () => Promise<DataFetcherResult<T>>,
  options: UseDataFetcherOptions<T> = {}
): UseDataFetcherReturn<T> {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    refetchInterval,
    onSuccess,
    onError,
    ...fetcherOptions
  } = options

  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)
  const [isRefetching, setIsRefetching] = useState(false)
  const [success, setSuccess] = useState(false)
  const [fromCache, setFromCache] = useState(false)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const executeFetch = useCallback(async (isRefetch = false) => {
    if (!enabled) return

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    try {
      if (isRefetch) {
        setIsRefetching(true)
      } else {
        setLoading(true)
      }

      const result = await fetchFunction()

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      setData(result.data)
      setError(result.error)
      setSuccess(result.success)
      setFromCache(result.fromCache || false)
      setLastFetched(new Date())

      if (result.success && result.data && onSuccess) {
        onSuccess(result.data)
      }

      if (!result.success && result.error && onError) {
        onError(result.error)
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      setSuccess(false)
      setFromCache(false)
      
      if (onError) {
        onError(error)
      }
    } finally {
      setLoading(false)
      setIsRefetching(false)
    }
  }, [enabled, fetchFunction, onSuccess, onError])

  const refetch = useCallback(async () => {
    await executeFetch(true)
  }, [executeFetch])

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      executeFetch()
    }
  }, [enabled, executeFetch])

  // Refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(() => {
        executeFetch(true)
      }, refetchInterval)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [refetchInterval, enabled, executeFetch])

  // Refetch on window focus
  useEffect(() => {
    if (refetchOnWindowFocus && enabled) {
      const handleFocus = () => {
        executeFetch(true)
      }

      window.addEventListener('focus', handleFocus)
      return () => window.removeEventListener('focus', handleFocus)
    }
  }, [refetchOnWindowFocus, enabled, executeFetch])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    data,
    error,
    loading,
    success,
    fromCache,
    refetch,
    isRefetching,
    lastFetched
  }
}

// Hook for multiple data fetchers
export function useMultipleDataFetchers<T extends Record<string, any>>(
  fetchers: Record<keyof T, () => Promise<DataFetcherResult<any>>>,
  options: UseDataFetcherOptions<any> = {}
) {
  const [results, setResults] = useState<Record<keyof T, UseDataFetcherReturn<any>>>({} as any)
  const [globalLoading, setGlobalLoading] = useState(false)
  const [globalError, setGlobalError] = useState<Error | null>(null)

  const fetchAll = useCallback(async () => {
    setGlobalLoading(true)
    setGlobalError(null)

    try {
      const fetchPromises = Object.entries(fetchers).map(async ([key, fetchFn]) => {
        const result = await fetchFn()
        return [key, result] as [keyof T, DataFetcherResult<any>]
      })

      const fetchResults = await Promise.all(fetchPromises)
      const newResults = {} as Record<keyof T, UseDataFetcherReturn<any>>

      fetchResults.forEach(([key, result]) => {
        newResults[key] = {
          ...result,
          refetch: async () => {
            const newResult = await fetchers[key]()
            setResults(prev => ({
              ...prev,
              [key]: { ...prev[key], ...newResult }
            }))
          },
          isRefetching: false,
          lastFetched: new Date()
        }
      })

      setResults(newResults)

      // Check if any fetch failed
      const hasErrors = fetchResults.some(([, result]) => !result.success)
      if (hasErrors) {
        const firstError = fetchResults.find(([, result]) => result.error)?.[1].error
        setGlobalError(firstError || new Error('Some data fetches failed'))
      }

    } catch (error) {
      setGlobalError(error instanceof Error ? error : new Error(String(error)))
    } finally {
      setGlobalLoading(false)
    }
  }, [fetchers])

  useEffect(() => {
    if (options.enabled !== false) {
      fetchAll()
    }
  }, [fetchAll, options.enabled])

  return {
    results,
    globalLoading,
    globalError,
    refetchAll: fetchAll
  }
}

// Hook for paginated data
export function usePaginatedDataFetcher<T>(
  fetchFunction: (page: number, limit: number) => Promise<DataFetcherResult<{ data: T[]; total: number; hasMore: boolean }>>,
  options: UseDataFetcherOptions<{ data: T[]; total: number; hasMore: boolean }> & {
    initialPage?: number
    pageSize?: number
  } = {}
) {
  const { initialPage = 1, pageSize = 10, ...fetcherOptions } = options
  
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [allData, setAllData] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const fetchPage = useCallback(async (page: number) => {
    return fetchFunction(page, pageSize)
  }, [fetchFunction, pageSize])

  const result = useDataFetcher(
    () => fetchPage(currentPage),
    {
      ...fetcherOptions,
      onSuccess: (data) => {
        if (currentPage === 1) {
          setAllData(data.data)
        } else {
          setAllData(prev => [...prev, ...data.data])
        }
        setTotal(data.total)
        setHasMore(data.hasMore)
        
        if (fetcherOptions.onSuccess) {
          fetcherOptions.onSuccess(data)
        }
      }
    }
  )

  const loadMore = useCallback(() => {
    if (hasMore && !result.loading) {
      setCurrentPage(prev => prev + 1)
    }
  }, [hasMore, result.loading])

  const reset = useCallback(() => {
    setCurrentPage(initialPage)
    setAllData([])
    setTotal(0)
    setHasMore(true)
  }, [initialPage])

  return {
    ...result,
    data: allData,
    total,
    hasMore,
    currentPage,
    loadMore,
    reset
  }
}