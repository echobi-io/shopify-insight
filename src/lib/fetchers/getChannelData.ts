import { supabase } from '../supabaseClient'
import { FilterState } from './getKpis'

export async function getChannelData(filters: FilterState) {
  try {
    // Fetch orders within date range
    let ordersQuery = supabase
      .from('orders')
      .select('total_price, channel')
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate)

    if (filters.segment && filters.segment !== 'all') {
      ordersQuery = ordersQuery.eq('customer_segment', filters.segment)
    }

    const { data: orders, error } = await ordersQuery

    if (error) {
      console.error('Error fetching channel data:', error)
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
          revenue: 0
        }
      }
      
      acc[channel].revenue += order.total_price || 0
      
      return acc
    }, {} as Record<string, any>)

    const totalRevenue = Object.values(channels).reduce((sum: number, ch: any) => sum + ch.revenue, 0)

    // Define colors for channels
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7280']

    return Object.values(channels).map((ch: any, index) => ({
      channel: ch.channel,
      revenue: parseFloat(ch.revenue.toFixed(2)),
      percentage: totalRevenue > 0 ? parseFloat(((ch.revenue / totalRevenue) * 100).toFixed(1)) : 0,
      color: colors[index % colors.length]
    }))
  } catch (error) {
    console.error('Error fetching channel data:', error)
    throw error
  }
}