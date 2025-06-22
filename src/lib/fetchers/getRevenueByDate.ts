import { supabase } from '../supabaseClient'
import { FilterState } from './getKpis'

export async function getRevenueByDate(filters: FilterState) {
  try {
    // Fetch orders within date range
    let ordersQuery = supabase
      .from('orders')
      .select('created_at, total_price, customer_id')
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate)
      .order('created_at')

    // Apply filters
    if (filters.segment && filters.segment !== 'all') {
      ordersQuery = ordersQuery.eq('customer_segment', filters.segment)
    }
    if (filters.channel && filters.channel !== 'all') {
      ordersQuery = ordersQuery.eq('channel', filters.channel)
    }

    const { data: orders, error } = await ordersQuery

    if (error) {
      console.error('Error fetching revenue by date:', error)
      throw error
    }

    if (!orders || orders.length === 0) {
      return []
    }

    // Group orders by date
    const grouped = orders.reduce((acc, order) => {
      const day = order.created_at.slice(0, 10)
      if (!acc[day]) {
        acc[day] = {
          date: day,
          revenue: 0,
          orders: 0,
          customers: new Set()
        }
      }
      
      acc[day].revenue += order.total_price || 0
      acc[day].orders += 1
      if (order.customer_id) {
        acc[day].customers.add(order.customer_id)
      }
      
      return acc
    }, {} as Record<string, any>)

    // Convert to array and calculate ordering rate
    return Object.values(grouped).map((day: any) => ({
      date: day.date,
      revenue: parseFloat(day.revenue.toFixed(2)),
      orders: day.orders,
      customers: day.customers.size,
      orderingRate: day.orders > 0 ? parseFloat(((day.customers.size / day.orders) * 100).toFixed(1)) : 0
    })).sort((a, b) => a.date.localeCompare(b.date))
  } catch (error) {
    console.error('Error fetching revenue by date:', error)
    throw error
  }
}