import { supabase } from '../supabaseClient'
import { FilterState } from './getKpis'

export async function getSegmentData(filters: FilterState) {
  try {
    // Fetch orders within date range
    let ordersQuery = supabase
      .from('orders')
      .select('customer_segment, total_price, customer_id')
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate)

    if (filters.channel && filters.channel !== 'all') {
      ordersQuery = ordersQuery.eq('channel', filters.channel)
    }

    const { data: orders, error } = await ordersQuery

    if (error) {
      console.error('Error fetching segment data:', error)
      throw error
    }

    if (!orders || orders.length === 0) {
      return []
    }

    // Group by segment
    const segments = orders.reduce((acc, order) => {
      const segment = order.customer_segment || 'Unknown'
      
      if (!acc[segment]) {
        acc[segment] = {
          segment,
          revenue: 0,
          orders: 0,
          customers: new Set()
        }
      }
      
      acc[segment].revenue += order.total_price || 0
      acc[segment].orders += 1
      if (order.customer_id) {
        acc[segment].customers.add(order.customer_id)
      }
      
      return acc
    }, {} as Record<string, any>)

    const totalRevenue = Object.values(segments).reduce((sum: number, seg: any) => sum + seg.revenue, 0)

    return Object.values(segments).map((seg: any) => ({
      segment: seg.segment,
      revenue: parseFloat(seg.revenue.toFixed(2)),
      orders: seg.orders,
      percentage: totalRevenue > 0 ? parseFloat(((seg.revenue / totalRevenue) * 100).toFixed(1)) : 0
    }))
  } catch (error) {
    console.error('Error fetching segment data:', error)
    throw error
  }
}