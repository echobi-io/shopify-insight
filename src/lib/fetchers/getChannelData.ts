import { supabase } from '../supabaseClient'
import { FilterState } from './getKpis'

export interface ChannelData {
  channel: string
  revenue: number
  orders: number
  customers: number
  percentage: number
  avgOrderValue: number
  color: string
  conversionRate?: number
  sessions?: number
}

export async function getChannelData(filters: FilterState, merchant_id?: string): Promise<ChannelData[]> {
  try {
    // Use materialized view for better performance
    let summaryQuery = supabase
      .from('channel_performance_summary')
      .select('*')
      .gte('date', filters.startDate.split('T')[0])
      .lte('date', filters.endDate.split('T')[0])

    // Apply merchant_id filter
    if (merchant_id) {
      summaryQuery = summaryQuery.eq('merchant_id', merchant_id)
    }

    if (filters.segment && filters.segment !== 'all') {
      // For channel data, we'll need to join with orders to filter by segment
      // Since materialized view doesn't have segment info, fall back to direct query
      let ordersQuery = supabase
        .from('orders')
        .select('channel, total_price, customer_id')
        .gte('created_at', filters.startDate)
        .lte('created_at', filters.endDate)

      // Apply merchant_id filter to orders query
      if (merchant_id) {
        ordersQuery = ordersQuery.eq('merchant_id', merchant_id)
      }

      if (filters.segment !== 'all') {
        ordersQuery = ordersQuery.eq('customer_segment', filters.segment)
      }

      const { data: orders, error } = await ordersQuery

      if (error) {
        console.error('Error fetching channel data with segment filter:', error)
        throw error
      }

      if (!orders || orders.length === 0) {
        return []
      }

      // Group by channel
      const channels = orders.reduce((acc, order) => {
        const channel = order.channel || 'Direct'
        
        if (!acc[channel]) {
          acc[channel] = {
            channel,
            revenue: 0,
            orders: 0,
            customers: new Set()
          }
        }
        
        acc[channel].revenue += order.total_price || 0
        acc[channel].orders += 1
        if (order.customer_id) {
          acc[channel].customers.add(order.customer_id)
        }
        
        return acc
      }, {} as Record<string, any>)

      const totalRevenue = Object.values(channels).reduce((sum: number, ch: any) => sum + ch.revenue, 0)
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16']

      return Object.values(channels).map((ch: any, index) => ({
        channel: ch.channel,
        revenue: parseFloat(ch.revenue.toFixed(2)),
        orders: ch.orders,
        customers: ch.customers.size,
        percentage: totalRevenue > 0 ? parseFloat(((ch.revenue / totalRevenue) * 100).toFixed(1)) : 0,
        avgOrderValue: ch.orders > 0 ? parseFloat((ch.revenue / ch.orders).toFixed(2)) : 0,
        color: colors[index % colors.length]
      })).sort((a, b) => b.revenue - a.revenue)
    }

    const { data: summaryData, error } = await summaryQuery

    if (error) {
      console.error('Error fetching channel data:', error)
      console.error('Error details:', error)
      throw error
    }

    if (!summaryData || summaryData.length === 0) {
      console.log('No channel data found for filters:', filters, 'merchant_id:', merchant_id)
      return []
    }

    // Group by channel and aggregate across dates
    const channels = summaryData.reduce((acc, row) => {
      const channel = row.channel || 'Direct'
      
      if (!acc[channel]) {
        acc[channel] = {
          channel,
          revenue: 0,
          orders: 0,
          customers: 0
        }
      }
      
      acc[channel].revenue += row.total_revenue || 0
      acc[channel].orders += row.orders_count || 0
      acc[channel].customers += row.customers_count || 0
      
      return acc
    }, {} as Record<string, any>)

    const totalRevenue = Object.values(channels).reduce((sum: number, ch: any) => sum + ch.revenue, 0)

    // Define colors for channels
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16']

    const result = Object.values(channels).map((ch: any, index) => ({
      channel: ch.channel,
      revenue: parseFloat(ch.revenue.toFixed(2)),
      orders: ch.orders,
      customers: ch.customers,
      percentage: totalRevenue > 0 ? parseFloat(((ch.revenue / totalRevenue) * 100).toFixed(1)) : 0,
      avgOrderValue: ch.orders > 0 ? parseFloat((ch.revenue / ch.orders).toFixed(2)) : 0,
      color: colors[index % colors.length],
      // Mock conversion rate and sessions for demo
      conversionRate: parseFloat((Math.random() * 5 + 1).toFixed(1)),
      sessions: Math.floor(Math.random() * 5000 + 1000)
    })).sort((a, b) => b.revenue - a.revenue)

    return result
  } catch (error) {
    console.error('Error in getChannelData:', error)
    return []
  }
}

// Get channel performance over time
export async function getChannelTrends(filters: FilterState, merchant_id?: string): Promise<any[]> {
  try {
    let summaryQuery = supabase
      .from('channel_performance_summary')
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
      console.error('Error fetching channel trends:', error)
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
          channels: {}
        }
      }
      
      const channel = row.channel || 'Direct'
      acc[dateKey].channels[channel] = {
        revenue: row.total_revenue || 0,
        orders: row.orders_count || 0,
        customers: row.customers_count || 0
      }
      
      return acc
    }, {} as Record<string, any>)

    return Object.values(trendData).sort((a: any, b: any) => a.date.localeCompare(b.date))
  } catch (error) {
    console.error('Error fetching channel trends:', error)
    return []
  }
}

// Get detailed channel comparison
export async function getChannelComparison(filters: FilterState, merchant_id?: string): Promise<any> {
  try {
    const currentChannels = await getChannelData(filters, merchant_id)
    
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

    const previousChannels = await getChannelData(previousFilters, merchant_id)

    // Compare channels
    const comparison = currentChannels.map(current => {
      const previous = previousChannels.find(p => p.channel === current.channel)
      
      const calculateChange = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0
        return ((curr - prev) / prev) * 100
      }

      return {
        channel: current.channel,
        current: {
          revenue: current.revenue,
          orders: current.orders,
          customers: current.customers,
          avgOrderValue: current.avgOrderValue,
          conversionRate: current.conversionRate
        },
        previous: {
          revenue: previous?.revenue || 0,
          orders: previous?.orders || 0,
          customers: previous?.customers || 0,
          avgOrderValue: previous?.avgOrderValue || 0,
          conversionRate: previous?.conversionRate || 0
        },
        changes: {
          revenue: calculateChange(current.revenue, previous?.revenue || 0),
          orders: calculateChange(current.orders, previous?.orders || 0),
          customers: calculateChange(current.customers, previous?.customers || 0),
          avgOrderValue: calculateChange(current.avgOrderValue, previous?.avgOrderValue || 0),
          conversionRate: calculateChange(current.conversionRate || 0, previous?.conversionRate || 0)
        }
      }
    })

    return comparison
  } catch (error) {
    console.error('Error in getChannelComparison:', error)
    return []
  }
}