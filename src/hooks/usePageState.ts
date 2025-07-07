import { useState, useEffect, useCallback } from 'react'
import { FilterState } from '@/lib/fetchers/getKpis'
import { getDateRangeFromTimeframe, formatDateForSQL } from '@/lib/utils/dateUtils'

interface UsePageStateProps {
  onDataLoad: (filters: FilterState, granularity?: string) => Promise<void>
  defaultTimeframe?: string
  defaultGranularity?: string
}

export const usePageState = ({
  onDataLoad,
  defaultTimeframe = 'financial_current',
  defaultGranularity = 'daily'
}: UsePageStateProps) => {
  const [timeframe, setTimeframe] = useState(defaultTimeframe)
  const [granularity, setGranularity] = useState(defaultGranularity)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const dateRange = getDateRangeFromTimeframe(timeframe, customStartDate, customEndDate)
      const filters: FilterState = {
        startDate: formatDateForSQL(dateRange.startDate),
        endDate: formatDateForSQL(dateRange.endDate)
      }
      
      await onDataLoad(filters, granularity)
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while loading data')
    } finally {
      setLoading(false)
    }
  }, [timeframe, granularity, customStartDate, customEndDate, onDataLoad])

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    timeframe,
    setTimeframe,
    granularity,
    setGranularity,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    loading,
    error,
    setError,
    loadData
  }
}