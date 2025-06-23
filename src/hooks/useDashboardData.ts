import { useState, useEffect, useCallback } from 'react'
import { getKPIs, getPreviousKPIs, calculateKPIChanges, FilterState, KPIData } from '@/lib/fetchers/getKpis'
import { getRevenueByTimeRange, RevenueByDateData } from '@/lib/fetchers/getRevenueByDate'
import { getProductData } from '@/lib/fetchers/getProductData'
import { getSegmentData, SegmentData } from '@/lib/fetchers/getSegmentData'
import { getChannelData, ChannelData } from '@/lib/fetchers/getChannelData'
import { getProductPerformanceData, ProductPerformanceData } from '@/lib/fetchers/getProductPerformanceData'
import { getSalesKPIs } from '@/lib/fetchers/getSalesData'
import { getDateRangeFromTimeframe, formatDateForSQL } from '@/lib/utils/dateUtils'

export interface DashboardData {
  kpiData: KPIData | null
  kpiChanges: any | null
  salesKpiData: any | null
  revenueData: RevenueByDateData[]
  productData: any[]
  segmentData: SegmentData[]
  channelData: ChannelData[]
  productPerformanceData: ProductPerformanceData | null
}

export function useDashboardData(globalDateRange: string, selectedSegment: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Data states
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [kpiChanges, setKpiChanges] = useState<any>(null)
  const [salesKpiData, setSalesKpiData] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<RevenueByDateData[]>([])
  const [productData, setProductData] = useState<any[]>([])
  const [segmentData, setSegmentData] = useState<SegmentData[]>([])
  const [channelData, setChannelData] = useState<ChannelData[]>([])
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

  // Determine time range for revenue data grouping
  const getTimeRangeType = useCallback((): 'daily' | 'weekly' | 'monthly' => {
    const { startDate, endDate } = getDateRangeFromTimeframe(globalDateRange)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff <= 14) return 'daily'
    if (daysDiff <= 90) return 'weekly'
    return 'monthly'
  }, [globalDateRange])

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const filters = getDateFilters()
      const timeRangeType = getTimeRangeType()

      // Fetch all data in parallel
      const [
        currentKpis,
        previousKpis,
        salesKpis,
        revenue,
        products,
        segments,
        channels,
        productPerformance
      ] = await Promise.all([
        getKPIs(filters),
        getPreviousKPIs(filters),
        getSalesKPIs(filters),
        getRevenueByTimeRange(filters, timeRangeType),
        getProductData(filters),
        getSegmentData(filters),
        getChannelData(filters),
        getProductPerformanceData(filters)
      ])

      // Calculate KPI changes
      const changes = calculateKPIChanges(currentKpis, previousKpis)

      // Set all data
      setKpiData(currentKpis)
      setKpiChanges(changes)
      setSalesKpiData(salesKpis)
      setRevenueData(revenue)
      setProductData(products)
      setSegmentData(segments)
      setChannelData(channels)
      setProductPerformanceData(productPerformance)

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      
      // Set empty data on error to prevent crashes
      setKpiData(null)
      setKpiChanges(null)
      setSalesKpiData(null)
      setRevenueData([])
      setProductData([])
      setSegmentData([])
      setChannelData([])
      setProductPerformanceData(null)
    } finally {
      setLoading(false)
    }
  }, [getDateFilters, getTimeRangeType])

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

  // Check if we have any real data
  const hasRealData = useCallback(() => {
    return !!(kpiData && (
      kpiData.totalRevenue > 0 || 
      kpiData.totalOrders > 0 || 
      revenueData.length > 0 ||
      segmentData.length > 0 ||
      channelData.length > 0
    ))
  }, [kpiData, revenueData, segmentData, channelData])

  return {
    // Data
    kpiData,
    kpiChanges,
    salesKpiData,
    revenueData,
    productData,
    segmentData,
    channelData,
    productPerformanceData,
    
    // State
    loading,
    error,
    hasRealData: hasRealData(),
    
    // Actions
    refetch,
    updateFilters
  }
}