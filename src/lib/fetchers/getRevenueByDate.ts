import { supabase } from '../supabaseClient'
import { FilterState } from './getKpis'

export interface RevenueByDateData {
  date: string
  revenue: number
  orders: number
  customers: number
  orderingRate: number
  month?: string
  week?: string
}

export async function getRevenueByDate(filters: FilterState, merchant_id?: string): Promise<RevenueByDateData[]> {
  try {
    // Use materialized view for better performance
    let summaryQuery = supabase
      .from('daily_revenue_summary')
      .select('*')
      .gte('date', filters.startDate.split('T')[0])
      .lte('date', filters.endDate.split('T')[0])
      .order('date')

    // Apply merchant_id filter
    if (merchant_id) {
      summaryQuery = summaryQuery.eq('merchant_id', merchant_id)
    }

    // Apply filters
    if (filters.segment && filters.segment !== 'all') {
      summaryQuery = summaryQuery.eq('customer_segment', filters.segment)
    }
    if (filters.channel && filters.channel !== 'all') {
      summaryQuery = summaryQuery.eq('channel', filters.channel)
    }

    const { data: summaryData, error } = await summaryQuery

    if (error) {
      console.error('Error fetching revenue by date:', error)
      throw error
    }

    if (!summaryData || summaryData.length === 0) {
      return []
    }

    // Group by date and aggregate if multiple segments/channels per day
    const grouped = summaryData.reduce((acc, row) => {
      const dateKey = row.date
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          revenue: 0,
          orders: 0,
          customers: 0
        }
      }
      
      acc[dateKey].revenue += row.total_revenue || 0
      acc[dateKey].orders += row.total_orders || 0
      acc[dateKey].customers += row.unique_customers || 0
      
      return acc
    }, {} as Record<string, any>)

    // Convert to array and calculate ordering rate
    const result = Object.values(grouped).map((day: any) => ({
      date: day.date,
      revenue: parseFloat(day.revenue.toFixed(2)),
      orders: day.orders,
      customers: day.customers,
      orderingRate: day.customers > 0 ? parseFloat(((day.orders / day.customers) * 100).toFixed(1)) : 0,
      // Add month and week for grouping
      month: new Date(day.date).toLocaleDateString('en-US', { month: 'short' }),
      week: `Week ${Math.ceil(new Date(day.date).getDate() / 7)}`
    })).sort((a, b) => a.date.localeCompare(b.date))

    return result
  } catch (error) {
    console.error('Error fetching revenue by date:', error)
    return []
  }
}

// Get revenue data grouped by week
export async function getRevenueByWeek(filters: FilterState, merchant_id?: string): Promise<RevenueByDateData[]> {
  try {
    const dailyData = await getRevenueByDate(filters, merchant_id)
    
    if (!dailyData.length) return []

    // Group by week
    const weeklyGroups = dailyData.reduce((acc, day) => {
      const date = new Date(day.date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0]
      
      if (!acc[weekKey]) {
        acc[weekKey] = {
          week: `Week ${Math.ceil(date.getDate() / 7)}`,
          date: weekKey,
          revenue: 0,
          orders: 0,
          customers: 0
        }
      }
      
      acc[weekKey].revenue += day.revenue
      acc[weekKey].orders += day.orders
      acc[weekKey].customers += day.customers
      
      return acc
    }, {} as Record<string, any>)

    return Object.values(weeklyGroups).map((week: any) => ({
      date: week.date,
      week: week.week,
      revenue: parseFloat(week.revenue.toFixed(2)),
      orders: week.orders,
      customers: week.customers,
      orderingRate: week.customers > 0 ? parseFloat(((week.orders / week.customers) * 100).toFixed(1)) : 0
    })).sort((a, b) => a.date.localeCompare(b.date))
  } catch (error) {
    console.error('Error fetching weekly revenue:', error)
    return []
  }
}

// Get revenue data grouped by month
export async function getRevenueByMonth(filters: FilterState, merchant_id?: string): Promise<RevenueByDateData[]> {
  try {
    const dailyData = await getRevenueByDate(filters, merchant_id)
    
    if (!dailyData.length) return []

    // Group by month
    const monthlyGroups = dailyData.reduce((acc, day) => {
      const date = new Date(day.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          date: `${monthKey}-01`,
          revenue: 0,
          orders: 0,
          customers: 0
        }
      }
      
      acc[monthKey].revenue += day.revenue
      acc[monthKey].orders += day.orders
      acc[monthKey].customers += day.customers
      
      return acc
    }, {} as Record<string, any>)

    return Object.values(monthlyGroups).map((month: any) => ({
      date: month.date,
      month: month.month,
      revenue: parseFloat(month.revenue.toFixed(2)),
      orders: month.orders,
      customers: month.customers,
      orderingRate: month.customers > 0 ? parseFloat(((month.orders / month.customers) * 100).toFixed(1)) : 0
    })).sort((a, b) => a.date.localeCompare(b.date))
  } catch (error) {
    console.error('Error fetching monthly revenue:', error)
    return []
  }
}

// Get revenue data based on time range preference
export async function getRevenueByTimeRange(filters: FilterState, timeRange: 'daily' | 'weekly' | 'monthly' = 'daily', merchant_id?: string): Promise<RevenueByDateData[]> {
  switch (timeRange) {
    case 'weekly':
      return getRevenueByWeek(filters, merchant_id)
    case 'monthly':
      return getRevenueByMonth(filters, merchant_id)
    default:
      return getRevenueByDate(filters, merchant_id)
  }
}