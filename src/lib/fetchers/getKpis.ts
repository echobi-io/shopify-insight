import { supabase } from '../supabaseClient'

export interface FilterState {
  startDate: string
  endDate: string
  segment?: string
  channel?: string
  product?: string
}

export async function getKPIs(filters: FilterState) {
  try {
    // Fetch orders within date range
    let ordersQuery = supabase
      .from('orders')
      .select('*')
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate)

    // Apply filters
    if (filters.segment && filters.segment !== 'all') {
      ordersQuery = ordersQuery.eq('customer_segment', filters.segment)
    }
    if (filters.channel && filters.channel !== 'all') {
      ordersQuery = ordersQuery.eq('channel', filters.channel)
    }

    const { data: orders, error: ordersError } = await ordersQuery

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      throw ordersError
    }

    const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0
    const totalOrders = orders?.length || 0
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Get unique customers from orders
    const customerSet = new Set(orders?.map(o => o.customer_id).filter(Boolean) || [])
    
    // Get total customers count
    const { count: totalCustomersCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })

    const percentOrdering = totalCustomersCount ? (customerSet.size / totalCustomersCount) * 100 : 0

    // Get new customers count
    const { count: newCustomersCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate)

    // Calculate churn risk (simplified - customers with no orders in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('customer_id')
      .gte('created_at', thirtyDaysAgo.toISOString())

    const recentCustomerSet = new Set(recentOrders?.map(o => o.customer_id).filter(Boolean) || [])
    const churnRisk = totalCustomersCount ? 
      ((totalCustomersCount - recentCustomerSet.size) / totalCustomersCount) * 100 : 0

    return {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders,
      avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      percentOrdering: parseFloat(percentOrdering.toFixed(1)),
      newCustomers: newCustomersCount || 0,
      churnRisk: parseFloat(churnRisk.toFixed(1))
    }
  } catch (error) {
    console.error('Error fetching KPIs:', error)
    throw error
  }
}