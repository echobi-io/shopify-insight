import { useState, useEffect } from 'react'
import { getInitialTimeframe } from '@/lib/utils/settingsUtils'
import { getDateRangeFromTimeframe, formatDateForSQL } from '@/lib/utils/dateUtils'
import { FilterState } from '@/lib/fetchers/getKpis'

interface UsePageStateOptions {
  initialTimeframe?: string
  initialGranularity?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  onDataLoad?: (filters: FilterState, granularity?: string) => Promise<void>
}

export const usePageState = (options: UsePageStateOptions = {}) => {
  const {
    initialTimeframe = getInitialTimeframe() || 'financial_current',
    initialGranularity = 'daily',
    onDataLoad
  } = options

  // Filter states
  const [timeframe, setTimeframe] = useState(initialTimeframe)
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>(initialGranularity)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  
  // Loading state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Generate filters from current state
  const getFilters = (): FilterState => {
    const dateRange = getDateRangeFromTimeframe(timeframe, customStartDate, customEndDate)
    return {
      startDate: formatDateForSQL(dateRange.startDate),
      endDate: formatDateForSQL(dateRange.endDate)
    }
  }

  // Load data function
  const loadData = async () => {
    if (!onDataLoad) return

    try {
      setLoading(true)
      setError(null)
      const filters = getFilters()
      await onDataLoad(filters, granularity)
    } catch (err) {
      console.error('❌ Error loading page data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Auto-load data when dependencies change
  useEffect(() => {
    loadData()
  }, [timeframe, customStartDate, customEndDate, granularity])

  return {
    // Filter states
    timeframe,
    setTimeframe,
    granularity,
    setGranularity,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    
    // Loading states
    loading,
    setLoading,
    error,
    setError,
    
    // Utilities
    getFilters,
    loadData
  }
}