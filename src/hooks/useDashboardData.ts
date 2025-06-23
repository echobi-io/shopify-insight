import { useState, useEffect, useCallback } from 'react'
import { getKPIs, FilterState } from '@/lib/fetchers/getKpis'
import { getRevenueByDate } from '@/lib/fetchers/getRevenueByDate'
import { getProductData } from '@/lib/fetchers/getProductData'
import { getSegmentData } from '@/lib/fetchers/getSegmentData'
import { getChannelData } from '@/lib/fetchers/getChannelData'
import { getProductPerformanceData, ProductPerformanceData } from '@/lib/fetchers/getProductPerformanceData'

export function useDashboardData(timeRange: string, selectedSegment: string) {
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

  // Generate date filters based on timeRange
  const getDateFilters = useCallback((): FilterState => {
    // Use fixed date range that matches our sample data (April 2024 - June 2024)
    let startDate: string
    let endDate: string

    switch (timeRange) {
      case 'daily':
        // Last 2 weeks of sample data
        startDate = '2024-06-10'
        endDate = '2024-06-22'
        break
      case 'weekly':
        // Last month of sample data
        startDate = '2024-05-01'
        endDate = '2024-06-22'
        break
      case 'monthly':
      default:
        // All sample data (3 months)
        startDate = '2024-04-01'
        endDate = '2024-06-22'
        break
    }

    return {
      startDate,
      endDate,
      segment: selectedSegment !== 'all' ? selectedSegment : undefined
    }
  }, [timeRange, selectedSegment])

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const filters = getDateFilters()

      // Fetch all data in parallel
      const [
        kpis,
        revenue,
        products,
        segments,
        channels,
        productPerformance
      ] = await Promise.all([
        getKPIs(filters),
        getRevenueByDate(filters),
        getProductData(filters),
        getSegmentData(filters),
        getChannelData(filters),
        getProductPerformanceData(filters)
      ])

      // Set KPI data
      setKpiData(kpis)
      
      // Set sales KPI data (same structure for now)
      setSalesKpiData({
        totalRevenue: kpis.totalRevenue,
        totalOrders: kpis.totalOrders,
        avgOrderValue: kpis.avgOrderValue,
        refundRate: 2.1,
        repeatOrderRate: 68.5
      })

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