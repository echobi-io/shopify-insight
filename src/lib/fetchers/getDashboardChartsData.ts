import { supabase } from '../supabaseClient'
import { FilterState } from './getKpis'

export interface DashboardChartData {
  date: string
  total_revenue: number
  total_orders: number
  hour?: number
  orders_by_hour?: number
}

export interface OrderTimingData {
  hour: number
  order_count: number
  percentage: number
}

export async function getDashboardChartsData(
  merchant_id: string, 
  filters?: FilterState,
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'daily'
): Promise<{
  dailyData: DashboardChartData[]
  orderTimingData: OrderTimingData[]
}> {
  try {
    console.log('📊 Fetching dashboard charts data for merchant:', merchant_id, 'with filters:', filters)

    // Build the base query for orders
    let query = supabase
      .from('orders')
      .select('created_at, total_price')
      .eq('merchant_id', merchant_id)

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    const { data: orders, error } = await query.order('created_at')

    if (error) {
      console.error('❌ Error fetching dashboard charts data:', error)
      return { dailyData: [], orderTimingData: [] }
    }

    if (!orders || orders.length === 0) {
      console.log('📭 No orders data found for charts')
      return { dailyData: [], orderTimingData: [] }
    }

    // Process data based on granularity
    const periodTotals: Record<string, { revenue: number; orders: number }> = {}
    
    // Process hourly data (order count by hour of day)
    const hourlyTotals: Record<number, number> = {}
    
    // Initialize hourly totals (0-23 hours)
    for (let hour = 0; hour < 24; hour++) {
      hourlyTotals[hour] = 0
    }

    // Helper function to get period key based on granularity
    const getPeriodKey = (date: Date): string => {
      const year = date.getFullYear()
      const month = date.getMonth()
      const day = date.getDate()
      
      switch (granularity) {
        case 'daily':
          return date.toISOString().split('T')[0]
        case 'weekly':
          // Get the Monday of the week
          const monday = new Date(date)
          monday.setDate(date.getDate() - date.getDay() + 1)
          return monday.toISOString().split('T')[0]
        case 'monthly':
          return `${year}-${String(month + 1).padStart(2, '0')}`
        case 'quarterly':
          const quarter = Math.floor(month / 3) + 1
          return `${year}-Q${quarter}`
        case 'yearly':
          return String(year)
        default:
          return date.toISOString().split('T')[0]
      }
    }

    // Helper function to get display label
    const getDisplayLabel = (periodKey: string): string => {
      switch (granularity) {
        case 'daily':
          return periodKey
        case 'weekly':
          return `Week of ${periodKey}`
        case 'monthly':
          const [year, month] = periodKey.split('-')
          return `${year}-${month}`
        case 'quarterly':
          return periodKey
        case 'yearly':
          return periodKey
        default:
          return periodKey
      }
    }

    orders.forEach(order => {
      const orderDate = new Date(order.created_at)
      const periodKey = getPeriodKey(orderDate)
      const hour = orderDate.getHours()
      
      // Period totals based on granularity
      if (!periodTotals[periodKey]) {
        periodTotals[periodKey] = { revenue: 0, orders: 0 }
      }
      periodTotals[periodKey].revenue += parseFloat(order.total_price) || 0
      periodTotals[periodKey].orders += 1
      
      // Hourly totals (always by hour regardless of granularity)
      hourlyTotals[hour] += 1
    })

    // Convert period data to array format
    const dailyData = Object.entries(periodTotals).map(([periodKey, totals]) => ({
      date: getDisplayLabel(periodKey),
      total_revenue: totals.revenue,
      total_orders: totals.orders
    })).sort((a, b) => {
      // Sort by the original period key for proper chronological order
      const aKey = Object.keys(periodTotals).find(key => getDisplayLabel(key) === a.date) || a.date
      const bKey = Object.keys(periodTotals).find(key => getDisplayLabel(key) === b.date) || b.date
      return aKey.localeCompare(bKey)
    })

    // Convert hourly data to array format with percentages
    const totalOrders = orders.length
    const orderTimingData = Object.entries(hourlyTotals).map(([hour, count]) => ({
      hour: parseInt(hour),
      order_count: count,
      percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0
    })).sort((a, b) => a.hour - b.hour) // Sort by hour (time) not by order count

    console.log('✅ Dashboard charts data processed:', {
      dailyDataPoints: dailyData.length,
      hourlyDataPoints: orderTimingData.length,
      totalOrders
    })

    return {
      dailyData,
      orderTimingData
    }

  } catch (error) {
    console.error('❌ Error processing dashboard charts data:', error)
    return { dailyData: [], orderTimingData: [] }
  }
}

export function getHourLabel(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}

export function getBusiestHours(orderTimingData: OrderTimingData[], topN: number = 5): OrderTimingData[] {
  return orderTimingData
    .sort((a, b) => b.order_count - a.order_count)
    .slice(0, topN)
}

export function getQuietestHours(orderTimingData: OrderTimingData[], topN: number = 5): OrderTimingData[] {
  return orderTimingData
    .filter(data => data.order_count > 0) // Exclude hours with no orders
    .sort((a, b) => a.order_count - b.order_count)
    .slice(0, topN)
}