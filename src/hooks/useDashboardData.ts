import { useState, useEffect, useCallback } from 'react'
import { getKPIs, FilterState } from '@/lib/fetchers/getKpis'
import { getRevenueByDate } from '@/lib/fetchers/getRevenueByDate'
import { getProductData } from '@/lib/fetchers/getProductData'
import { getSegmentData } from '@/lib/fetchers/getSegmentData'
import { getChannelData } from '@/lib/fetchers/getChannelData'
import { getProductPerformanceData, ProductPerformanceData } from '@/lib/fetchers/getProductPerformanceData'
import { getSalesKPIs } from '@/lib/fetchers/getSalesData'
import { getDateRangeFromTimeframe, formatDateForSQL } from '@/lib/utils/dateUtils'

export function useDashboardData(globalDateRange: string, selectedSegment: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Data states
  const [kpiData, setKpiData] = useState<any>(null)
  const [salesKpiData, setSalesKpiData] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [productData, setProductData] = useState<any[]>([])
  const [segmentData, setSegmentData] = useState<any[]>([])
  const [channelData, setChannelData] = useState<any[]>([])
  const [productPerformanceData, setProductPerformanceData] = useState<ProductPerformanceData | null>(null)

  // Generate date filters based on globalDateRange
  const getDateFilters = useCallback((): FilterState => {
    const { startDate, endDate } = getDateRangeFromTimeframe(globalDateRange)

    return {
      startDate: formatDateForSQL(startDate),
      endDate: formatDateForSQL(endDate),
      segment: selectedSegment !== 'all' ? selectedSegment : undefined
    }
  }, [globalDateRange, selectedSegment])

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const filters = getDateFilters()

      // Fetch all data in parallel
      const [
        kpis,
        salesKpis,
        revenue,
        products,
        segments,
        channels,
        productPerformance
      ] = await Promise.all([
        getKPIs(filters),
        getSalesKPIs(filters),
        getRevenueByDate(filters),
        getProductData(filters),
        getSegmentData(filters),
        getChannelData(filters),
        getProductPerformanceData(filters)
      ])

      // Set KPI data
      setKpiData(kpis)
      
      // Set sales KPI data
      setSalesKpiData(salesKpis)

      // Set other data
      setRevenueData(revenue)
      setProductData(products)
      setSegmentData(segments)
      setChannelData(channels)
      setProductPerformanceData(productPerformance)

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [getDateFilters])

  // Update filters function
  const updateFilters = useCallback((newTimeRange?: string, newSegment?: string) => {
    // This would trigger a re-fetch with new filters
    // For now, we'll just refetch with current filters
    fetchData()
  }, [fetchData])

  // Refetch function
  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    // Data
    kpiData,
    salesKpiData,
    revenueData,
    productData,
    segmentData,
    channelData,
    productPerformanceData,
    
    // State
    loading,
    error,
    
    // Actions
    refetch,
    updateFilters
  }
}