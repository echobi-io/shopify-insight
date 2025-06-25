import { supabase } from '../supabaseClient'
import { FilterState } from './getKpis'

export interface SegmentData {
  segment: string
  revenue: number
  orders: number
  customers: number
  percentage: number
  avgOrderValue: number
  customerLifetimeValue?: number
}

export async function getSegmentData(filters: FilterState, merchant_id?: string): Promise<SegmentData[]> {
  try {
    // Use materialized view for better performance
    let summaryQuery = supabase
      .from('customer_segment_summary')
      .select('*')
      .gte('date', filters.startDate.split('T')[0])
      .lte('date', filters.endDate.split('T')[0])

    // Apply merchant_id filter
    if (merchant_id) {
      summaryQuery = summaryQuery.eq('merchant_id', merchant_id)
    }

    const { data: summaryData, error } = await summaryQuery

    if (error) {
      console.error('Error fetching segment data:', error)
      console.error('Error details:', error)
      throw error
    }

    if (!summaryData || summaryData.length === 0) {
      console.log('No segment data found for filters:', filters, 'merchant_id:', merchant_id)
      return []
    }

    // Group by segment and aggregate across dates
    const segments = summaryData.reduce((acc, row) => {
      const segment = row.customer_segment || 'Unknown'
      
      if (!acc[segment]) {
        acc[segment] = {
          segment,
          revenue: 0,
          orders: 0,
          customers: 0
        }
      }
      
      acc[segment].revenue += row.total_revenue || 0
      acc[segment].orders += row.orders_count || 0
      acc[segment].customers += row.customers_count || 0
      
      return acc
    }, {} as Record<string, any>)

    const totalRevenue = Object.values(segments).reduce((sum: number, seg: any) => sum + seg.revenue, 0)

    // Get additional customer retention data for enhanced segment analysis
    let retentionQuery = supabase
      .from('customer_retention_summary')
      .select('*')

    if (merchant_id) {
      retentionQuery = retentionQuery.eq('merchant_id', merchant_id)
    }

    const { data: retentionData } = await retentionQuery

    const result = Object.values(segments).map((seg: any) => {
      const retentionInfo = retentionData?.find(r => r.calculated_segment === seg.segment.toLowerCase())
      
      return {
        segment: seg.segment,
        revenue: parseFloat(seg.revenue.toFixed(2)),
        orders: seg.orders,
        customers: seg.customers,
        percentage: totalRevenue > 0 ? parseFloat(((seg.revenue / totalRevenue) * 100).toFixed(1)) : 0,
        avgOrderValue: seg.orders > 0 ? parseFloat((seg.revenue / seg.orders).toFixed(2)) : 0,
        customerLifetimeValue: retentionInfo?.avg_customer_ltv || 0
      }
    }).sort((a, b) => b.revenue - a.revenue)

    return result
  } catch (error) {
    console.error('Error in getSegmentData:', error)
    return []
  }
}

// Get segment performance over time
export async function getSegmentTrends(filters: FilterState, merchant_id?: string): Promise<any[]> {
  try {
    let summaryQuery = supabase
      .from('customer_segment_summary')
      .select('*')
      .gte('date', filters.startDate.split('T')[0])
      .lte('date', filters.endDate.split('T')[0])
      .order('date')

    // Apply merchant_id filter
    if (merchant_id) {
      summaryQuery = summaryQuery.eq('merchant_id', merchant_id)
    }

    const { data: summaryData, error } = await summaryQuery

    if (error) {
      console.error('Error fetching segment trends:', error)
      throw error
    }

    if (!summaryData || summaryData.length === 0) {
      return []
    }

    // Group by date and create trend data
    const trendData = summaryData.reduce((acc, row) => {
      const dateKey = row.date
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          segments: {}
        }
      }
      
      const segment = row.customer_segment || 'Unknown'
      acc[dateKey].segments[segment] = {
        revenue: row.total_revenue || 0,
        orders: row.orders_count || 0,
        customers: row.customers_count || 0
      }
      
      return acc
    }, {} as Record<string, any>)

    return Object.values(trendData).sort((a: any, b: any) => a.date.localeCompare(b.date))
  } catch (error) {
    console.error('Error fetching segment trends:', error)
    return []
  }
}

// Get detailed segment comparison
export async function getSegmentComparison(filters: FilterState, merchant_id?: string): Promise<any> {
  try {
    const currentSegments = await getSegmentData(filters, merchant_id)
    
    // Get previous period for comparison
    const startDate = new Date(filters.startDate)
    const endDate = new Date(filters.endDate)
    const duration = endDate.getTime() - startDate.getTime()
    
    const previousEndDate = new Date(startDate.getTime() - 1)
    const previousStartDate = new Date(previousEndDate.getTime() - duration)

    const previousFilters: FilterState = {
      ...filters,
      startDate: previousStartDate.toISOString(),
      endDate: previousEndDate.toISOString()
    }

    const previousSegments = await getSegmentData(previousFilters, merchant_id)

    // Compare segments
    const comparison = currentSegments.map(current => {
      const previous = previousSegments.find(p => p.segment === current.segment)
      
      const calculateChange = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0
        return ((curr - prev) / prev) * 100
      }

      return {
        segment: current.segment,
        current: {
          revenue: current.revenue,
          orders: current.orders,
          customers: current.customers,
          avgOrderValue: current.avgOrderValue
        },
        previous: {
          revenue: previous?.revenue || 0,
          orders: previous?.orders || 0,
          customers: previous?.customers || 0,
          avgOrderValue: previous?.avgOrderValue || 0
        },
        changes: {
          revenue: calculateChange(current.revenue, previous?.revenue || 0),
          orders: calculateChange(current.orders, previous?.orders || 0),
          customers: calculateChange(current.customers, previous?.customers || 0),
          avgOrderValue: calculateChange(current.avgOrderValue, previous?.avgOrderValue || 0)
        }
      }
    })

    return comparison
  } catch (error) {
    console.error('Error in getSegmentComparison:', error)
    return []
  }
}