import { supabase } from '../supabaseClient'
import { FilterState } from './getKpis'

export interface SalesAnalysisKPIs {
  totalRevenue: number | null
  totalOrders: number | null
  avgOrderValue: number | null
  topChannel: string | null
  growthDriver: 'volume' | 'aov' | 'mixed' | null
  revenueGrowth: number | null
  ordersGrowth: number | null
  aovGrowth: number | null
}

export interface RevenueTimeSeriesData {
  date: string
  revenue: number
  orders: number
  avgOrderValue: number
  previousPeriodRevenue?: number
  previousPeriodOrders?: number
}

export interface ChannelRevenueData {
  channel: string
  revenue: number
  orders: number
  percentage: number
  growth: number | null
}

export interface RevenueAttributionData {
  volumeContribution: number
  aovContribution: number
  channelContribution: number
  productContribution: number
}

export interface SalesInsight {
  type: 'growth' | 'decline' | 'anomaly' | 'channel' | 'product'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  metric?: string
  value?: number
}

export interface TopProduct {
  id: string
  name: string
  revenue: number
  quantity: number
  orders: number
  avgOrderValue: number
}

export interface TopCustomer {
  id: string
  name: string
  email: string
  revenue: number
  orders: number
  avgOrderValue: number
  lastOrderDate: string
}

export interface ProductDrillDown {
  product: TopProduct
  timeSeriesData: RevenueTimeSeriesData[]
  topCustomers: TopCustomer[]
  channelBreakdown: ChannelRevenueData[]
}

export interface CustomerDrillDown {
  customer: TopCustomer
  timeSeriesData: RevenueTimeSeriesData[]
  topProducts: TopProduct[]
  orderHistory: Array<{
    id: string
    orderNumber: string
    date: string
    total: number
    status: string
    channel: string
  }>
}

const HARDCODED_MERCHANT_ID = '11111111-1111-1111-1111-111111111111'

// Helper function to calculate date ranges for comparison
function getPreviousPeriodDates(startDate: string, endDate: string): { prevStartDate: string; prevEndDate: string } {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffMs = end.getTime() - start.getTime()
  
  const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000) // Day before start
  const prevStart = new Date(prevEnd.getTime() - diffMs)
  
  return {
    prevStartDate: prevStart.toISOString(),
    prevEndDate: prevEnd.toISOString()
  }
}

// Fallback function to get KPIs directly from orders table
async function getSalesAnalysisKPIsFromOrders(filters: FilterState, merchant_id: string): Promise<SalesAnalysisKPIs> {
  try {
    console.log('🔄 Falling back to orders table for KPIs')

    // Get current period data from orders table
    let currentQuery = supabase
      .from('orders')
      .select('*')
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate)
      .eq('merchant_id', merchant_id)

    if (filters.channel && filters.channel !== 'all') {
      currentQuery = currentQuery.eq('channel', filters.channel)
    }

    const { data: currentOrders, error: currentError } = await currentQuery

    if (currentError) {
      console.error('❌ Error fetching orders:', currentError)
      throw new Error(`Failed to fetch orders: ${currentError.message}`)
    }

    if (!currentOrders || currentOrders.length === 0) {
      console.log('📭 No orders found for the specified period')
      return {
        totalRevenue: null,
        totalOrders: null,
        avgOrderValue: null,
        topChannel: null,
        growthDriver: null,
        revenueGrowth: null,
        ordersGrowth: null,
        aovGrowth: null
      }
    }

    // Calculate current period metrics
    const currentRevenue = currentOrders.reduce((sum, order) => sum + (order.total_price || 0), 0)
    const currentOrderCount = currentOrders.length
    const currentAOV = currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0

    // Get channel breakdown
    const channelBreakdown = currentOrders.reduce((acc, order) => {
      const channel = order.channel || 'unknown'
      if (!acc[channel]) {
        acc[channel] = { revenue: 0, orders: 0 }
      }
      acc[channel].revenue += order.total_price || 0
      acc[channel].orders += 1
      return acc
    }, {} as Record<string, { revenue: number; orders: number }>)

    const topChannel = Object.entries(channelBreakdown)
      .sort(([,a], [,b]) => b.revenue - a.revenue)[0]?.[0] || null

    // Get previous period for comparison
    const { prevStartDate, prevEndDate } = getPreviousPeriodDates(filters.startDate, filters.endDate)
    
    let prevQuery = supabase
      .from('orders')
      .select('*')
      .gte('created_at', prevStartDate)
      .lte('created_at', prevEndDate)
      .eq('merchant_id', merchant_id)

    if (filters.channel && filters.channel !== 'all') {
      prevQuery = prevQuery.eq('channel', filters.channel)
    }

    const { data: prevOrders } = await prevQuery

    let revenueGrowth = null
    let ordersGrowth = null
    let aovGrowth = null
    let growthDriver: 'volume' | 'aov' | 'mixed' | null = null

    if (prevOrders && prevOrders.length > 0) {
      const prevRevenue = prevOrders.reduce((sum, order) => sum + (order.total_price || 0), 0)
      const prevOrderCount = prevOrders.length
      const prevAOV = prevOrderCount > 0 ? prevRevenue / prevOrderCount : 0

      if (prevRevenue > 0) {
        revenueGrowth = ((currentRevenue - prevRevenue) / prevRevenue) * 100
      }
      if (prevOrderCount > 0) {
        ordersGrowth = ((currentOrderCount - prevOrderCount) / prevOrderCount) * 100
      }
      if (prevAOV > 0) {
        aovGrowth = ((currentAOV - prevAOV) / prevAOV) * 100
      }

      // Determine growth driver
      if (ordersGrowth !== null && aovGrowth !== null) {
        const orderContribution = Math.abs(ordersGrowth || 0)
        const aovContribution = Math.abs(aovGrowth || 0)
        
        if (orderContribution > aovContribution * 1.5) {
          growthDriver = 'volume'
        } else if (aovContribution > orderContribution * 1.5) {
          growthDriver = 'aov'
        } else {
          growthDriver = 'mixed'
        }
      }
    }

    return {
      totalRevenue: currentRevenue,
      totalOrders: currentOrderCount,
      avgOrderValue: parseFloat(currentAOV.toFixed(2)),
      topChannel,
      growthDriver,
      revenueGrowth: revenueGrowth ? parseFloat(revenueGrowth.toFixed(1)) : null,
      ordersGrowth: ordersGrowth ? parseFloat(ordersGrowth.toFixed(1)) : null,
      aovGrowth: aovGrowth ? parseFloat(aovGrowth.toFixed(1)) : null
    }

  } catch (error) {
    console.error('❌ Error in getSalesAnalysisKPIsFromOrders:', error)
    throw error
  }
}

export async function getSalesAnalysisKPIs(filters: FilterState, merchant_id: string = HARDCODED_MERCHANT_ID): Promise<SalesAnalysisKPIs> {
  try {
    console.log('📊 Fetching Sales Analysis KPIs with filters:', filters, 'merchant_id:', merchant_id)

    // First, check if the materialized view exists and has any data at all
    const { data: testData, error: testError } = await supabase
      .from('daily_revenue_summary')
      .select('*')
      .eq('merchant_id', merchant_id)
      .limit(1)

    console.log('🔍 Test query result:', { testData, testError })

    if (testError) {
      console.error('❌ Materialized view does not exist or is not accessible:', testError)
      // Fall back to querying orders table directly
      return await getSalesAnalysisKPIsFromOrders(filters, merchant_id)
    }

    if (!testData || testData.length === 0) {
      console.log('📭 Materialized view exists but has no data for merchant:', merchant_id)
      // Fall back to querying orders table directly
      return await getSalesAnalysisKPIsFromOrders(filters, merchant_id)
    }

    // Get current period data
    let currentQuery = supabase
      .from('daily_revenue_summary')
      .select('*')
      .gte('date', filters.startDate.split('T')[0])
      .lte('date', filters.endDate.split('T')[0])
      .eq('merchant_id', merchant_id)

    if (filters.channel && filters.channel !== 'all') {
      currentQuery = currentQuery.eq('channel', filters.channel)
    }
    if (filters.segment && filters.segment !== 'all') {
      currentQuery = currentQuery.eq('customer_segment', filters.segment)
    }

    const { data: currentData, error: currentError } = await currentQuery

    if (currentError) {
      console.error('❌ Error fetching current period sales data:', currentError)
      // Fall back to querying orders table directly
      return await getSalesAnalysisKPIsFromOrders(filters, merchant_id)
    }

    if (!currentData || currentData.length === 0) {
      console.log('📭 No current period data found for sales analysis, trying orders table')
      // Fall back to querying orders table directly
      return await getSalesAnalysisKPIsFromOrders(filters, merchant_id)
    }

    // Calculate current period metrics
    const currentRevenue = currentData.reduce((sum, row) => sum + (row.total_revenue || 0), 0)
    const currentOrders = currentData.reduce((sum, row) => sum + (row.total_orders || 0), 0)
    const currentAOV = currentOrders > 0 ? currentRevenue / currentOrders : 0

    // Get previous period for comparison
    const { prevStartDate, prevEndDate } = getPreviousPeriodDates(filters.startDate, filters.endDate)
    
    let prevQuery = supabase
      .from('daily_revenue_summary')
      .select('*')
      .gte('date', prevStartDate.split('T')[0])
      .lte('date', prevEndDate.split('T')[0])
      .eq('merchant_id', merchant_id)

    if (filters.channel && filters.channel !== 'all') {
      prevQuery = prevQuery.eq('channel', filters.channel)
    }
    if (filters.segment && filters.segment !== 'all') {
      prevQuery = prevQuery.eq('customer_segment', filters.segment)
    }

    const { data: prevData } = await prevQuery

    let revenueGrowth = null
    let ordersGrowth = null
    let aovGrowth = null
    let growthDriver: 'volume' | 'aov' | 'mixed' | null = null

    if (prevData && prevData.length > 0) {
      const prevRevenue = prevData.reduce((sum, row) => sum + (row.total_revenue || 0), 0)
      const prevOrders = prevData.reduce((sum, row) => sum + (row.total_orders || 0), 0)
      const prevAOV = prevOrders > 0 ? prevRevenue / prevOrders : 0

      if (prevRevenue > 0) {
        revenueGrowth = ((currentRevenue - prevRevenue) / prevRevenue) * 100
      }
      if (prevOrders > 0) {
        ordersGrowth = ((currentOrders - prevOrders) / prevOrders) * 100
      }
      if (prevAOV > 0) {
        aovGrowth = ((currentAOV - prevAOV) / prevAOV) * 100
      }

      // Determine growth driver
      if (ordersGrowth !== null && aovGrowth !== null) {
        const orderContribution = Math.abs(ordersGrowth || 0)
        const aovContribution = Math.abs(aovGrowth || 0)
        
        if (orderContribution > aovContribution * 1.5) {
          growthDriver = 'volume'
        } else if (aovContribution > orderContribution * 1.5) {
          growthDriver = 'aov'
        } else {
          growthDriver = 'mixed'
        }
      }
    }

    // Get top channel
    const channelData = await getChannelRevenueBreakdown(filters, merchant_id)
    const topChannel = channelData.length > 0 ? channelData[0].channel : null

    return {
      totalRevenue: currentRevenue,
      totalOrders: currentOrders,
      avgOrderValue: parseFloat(currentAOV.toFixed(2)),
      topChannel,
      growthDriver,
      revenueGrowth: revenueGrowth ? parseFloat(revenueGrowth.toFixed(1)) : null,
      ordersGrowth: ordersGrowth ? parseFloat(ordersGrowth.toFixed(1)) : null,
      aovGrowth: aovGrowth ? parseFloat(aovGrowth.toFixed(1)) : null
    }

  } catch (error) {
    console.error('❌ Error in getSalesAnalysisKPIs:', error)
    throw error
  }
}

export async function getRevenueTimeSeries(
  filters: FilterState, 
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'daily',
  merchant_id: string = HARDCODED_MERCHANT_ID
): Promise<RevenueTimeSeriesData[]> {
  try {
    console.log('📈 Fetching revenue time series with granularity:', granularity)

    // Try materialized view first
    let query = supabase
      .from('daily_revenue_summary')
      .select('*')
      .gte('date', filters.startDate.split('T')[0])
      .lte('date', filters.endDate.split('T')[0])
      .eq('merchant_id', merchant_id)
      .order('date')

    if (filters.channel && filters.channel !== 'all') {
      query = query.eq('channel', filters.channel)
    }
    if (filters.segment && filters.segment !== 'all') {
      query = query.eq('customer_segment', filters.segment)
    }

    const { data, error } = await query

    if (error || !data || data.length === 0) {
      console.log('📭 No time series data found in materialized view, falling back to orders table')
      return await getRevenueTimeSeriesFromOrders(filters, granularity, merchant_id)
    }

    // Group data based on granularity
    const grouped = data.reduce((acc, row) => {
      let key: string
      const date = new Date(row.date)
      
      switch (granularity) {
        case 'weekly':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
          break
        case 'quarterly':
          const quarter = Math.floor(date.getMonth() / 3) + 1
          const quarterStartMonth = (quarter - 1) * 3 + 1
          key = `${date.getFullYear()}-${String(quarterStartMonth).padStart(2, '0')}-01`
          break
        case 'yearly':
          key = `${date.getFullYear()}-01-01`
          break
        default:
          key = row.date
      }

      if (!acc[key]) {
        acc[key] = {
          date: key,
          revenue: 0,
          orders: 0
        }
      }

      acc[key].revenue += row.total_revenue || 0
      acc[key].orders += row.total_orders || 0

      return acc
    }, {} as Record<string, any>)

    return Object.values(grouped).map((item: any) => ({
      date: item.date,
      revenue: parseFloat(item.revenue.toFixed(2)),
      orders: item.orders,
      avgOrderValue: item.orders > 0 ? parseFloat((item.revenue / item.orders).toFixed(2)) : 0
    })).sort((a, b) => a.date.localeCompare(b.date))

  } catch (error) {
    console.error('❌ Error in getRevenueTimeSeries:', error)
    // Fall back to orders table
    return await getRevenueTimeSeriesFromOrders(filters, granularity, merchant_id)
  }
}

// Fallback function to get time series from orders table
async function getRevenueTimeSeriesFromOrders(
  filters: FilterState,
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
  merchant_id: string
): Promise<RevenueTimeSeriesData[]> {
  try {
    console.log('🔄 Falling back to orders table for time series')

    let query = supabase
      .from('orders')
      .select('created_at, total_price, channel')
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate)
      .eq('merchant_id', merchant_id)
      .order('created_at')

    if (filters.channel && filters.channel !== 'all') {
      query = query.eq('channel', filters.channel)
    }

    const { data: orders, error } = await query

    if (error || !orders || orders.length === 0) {
      console.log('📭 No orders found for time series')
      return []
    }

    // Group orders by date based on granularity
    const grouped = orders.reduce((acc, order) => {
      const date = new Date(order.created_at)
      let key: string
      
      switch (granularity) {
        case 'weekly':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
          break
        case 'quarterly':
          const quarter = Math.floor(date.getMonth() / 3) + 1
          const quarterStartMonth = (quarter - 1) * 3 + 1
          key = `${date.getFullYear()}-${String(quarterStartMonth).padStart(2, '0')}-01`
          break
        case 'yearly':
          key = `${date.getFullYear()}-01-01`
          break
        default:
          key = date.toISOString().split('T')[0]
      }

      if (!acc[key]) {
        acc[key] = {
          date: key,
          revenue: 0,
          orders: 0
        }
      }

      acc[key].revenue += order.total_price || 0
      acc[key].orders += 1

      return acc
    }, {} as Record<string, any>)

    return Object.values(grouped).map((item: any) => ({
      date: item.date,
      revenue: parseFloat(item.revenue.toFixed(2)),
      orders: item.orders,
      avgOrderValue: item.orders > 0 ? parseFloat((item.revenue / item.orders).toFixed(2)) : 0
    })).sort((a, b) => a.date.localeCompare(b.date))

  } catch (error) {
    console.error('❌ Error in getRevenueTimeSeriesFromOrders:', error)
    return []
  }
}

export async function getChannelRevenueBreakdown(
  filters: FilterState,
  merchant_id: string = HARDCODED_MERCHANT_ID
): Promise<ChannelRevenueData[]> {
  try {
    console.log('🏪 Fetching channel revenue breakdown')

    // Try materialized view first
    let query = supabase
      .from('channel_performance_summary')
      .select('*')
      .gte('date', filters.startDate.split('T')[0])
      .lte('date', filters.endDate.split('T')[0])
      .eq('merchant_id', merchant_id)

    if (filters.segment && filters.segment !== 'all') {
      query = query.eq('customer_segment', filters.segment)
    }

    const { data, error } = await query

    if (error || !data || data.length === 0) {
      console.log('📭 No channel data found in materialized view, falling back to orders table')
      return await getChannelRevenueBreakdownFromOrders(filters, merchant_id)
    }

    // Group by channel
    const channelGroups = data.reduce((acc, row) => {
      const channel = row.channel || 'Unknown'
      
      if (!acc[channel]) {
        acc[channel] = {
          channel,
          revenue: 0,
          orders: 0
        }
      }
      
      acc[channel].revenue += row.total_revenue || 0
      acc[channel].orders += row.total_orders || 0
      
      return acc
    }, {} as Record<string, any>)

    const totalRevenue = Object.values(channelGroups).reduce((sum: number, ch: any) => sum + ch.revenue, 0)

    return Object.values(channelGroups)
      .map((ch: any) => ({
        channel: ch.channel,
        revenue: parseFloat(ch.revenue.toFixed(2)),
        orders: ch.orders,
        percentage: totalRevenue > 0 ? parseFloat(((ch.revenue / totalRevenue) * 100).toFixed(1)) : 0,
        growth: null // Would need previous period data for growth calculation
      }))
      .sort((a, b) => b.revenue - a.revenue)

  } catch (error) {
    console.error('❌ Error in getChannelRevenueBreakdown:', error)
    // Fall back to orders table
    return await getChannelRevenueBreakdownFromOrders(filters, merchant_id)
  }
}

// Fallback function to get channel breakdown from orders table
async function getChannelRevenueBreakdownFromOrders(
  filters: FilterState,
  merchant_id: string
): Promise<ChannelRevenueData[]> {
  try {
    console.log('🔄 Falling back to orders table for channel breakdown')

    let query = supabase
      .from('orders')
      .select('channel, total_price')
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate)
      .eq('merchant_id', merchant_id)

    const { data: orders, error } = await query

    if (error || !orders || orders.length === 0) {
      console.log('📭 No orders found for channel breakdown')
      return []
    }

    // Group by channel
    const channelGroups = orders.reduce((acc, order) => {
      const channel = order.channel || 'Unknown'
      
      if (!acc[channel]) {
        acc[channel] = {
          channel,
          revenue: 0,
          orders: 0
        }
      }
      
      acc[channel].revenue += order.total_price || 0
      acc[channel].orders += 1
      
      return acc
    }, {} as Record<string, { channel: string; revenue: number; orders: number }>)

    const totalRevenue = Object.values(channelGroups).reduce((sum, ch) => sum + ch.revenue, 0)

    return Object.values(channelGroups)
      .map((ch) => ({
        channel: ch.channel,
        revenue: parseFloat(ch.revenue.toFixed(2)),
        orders: ch.orders,
        percentage: totalRevenue > 0 ? parseFloat(((ch.revenue / totalRevenue) * 100).toFixed(1)) : 0,
        growth: null // Would need previous period data for growth calculation
      }))
      .sort((a, b) => b.revenue - a.revenue)

  } catch (error) {
    console.error('❌ Error in getChannelRevenueBreakdownFromOrders:', error)
    return []
  }
}

export async function generateSalesInsights(
  kpis: SalesAnalysisKPIs,
  timeSeriesData: RevenueTimeSeriesData[],
  channelData: ChannelRevenueData[]
): Promise<SalesInsight[]> {
  const insights: SalesInsight[] = []

  try {
    // Revenue growth insight
    if (kpis.revenueGrowth !== null) {
      if (Math.abs(kpis.revenueGrowth) > 20) {
        insights.push({
          type: kpis.revenueGrowth > 0 ? 'growth' : 'decline',
          title: `${kpis.revenueGrowth > 0 ? 'Strong' : 'Significant'} Revenue ${kpis.revenueGrowth > 0 ? 'Growth' : 'Decline'}`,
          description: `Revenue ${kpis.revenueGrowth > 0 ? 'increased' : 'decreased'} by ${Math.abs(kpis.revenueGrowth).toFixed(1)}% compared to the previous period.`,
          impact: Math.abs(kpis.revenueGrowth) > 50 ? 'high' : 'medium',
          metric: 'Revenue Growth',
          value: kpis.revenueGrowth
        })
      }
    }

    // Growth driver insight
    if (kpis.growthDriver && kpis.revenueGrowth && kpis.revenueGrowth > 0) {
      let description = ''
      switch (kpis.growthDriver) {
        case 'volume':
          description = `Revenue growth was primarily driven by a ${kpis.ordersGrowth?.toFixed(1)}% increase in order volume.`
          break
        case 'aov':
          description = `Revenue growth was mainly due to a ${kpis.aovGrowth?.toFixed(1)}% increase in average order value.`
          break
        case 'mixed':
          description = `Revenue growth came from both increased order volume (${kpis.ordersGrowth?.toFixed(1)}%) and higher AOV (${kpis.aovGrowth?.toFixed(1)}%).`
          break
      }
      
      insights.push({
        type: 'growth',
        title: 'Growth Driver Analysis',
        description,
        impact: 'medium'
      })
    }

    // Channel performance insight
    if (channelData.length > 0) {
      const topChannel = channelData[0]
      if (topChannel.percentage > 50) {
        insights.push({
          type: 'channel',
          title: 'Channel Concentration',
          description: `${topChannel.channel} accounts for ${topChannel.percentage}% of total revenue, indicating high channel concentration.`,
          impact: topChannel.percentage > 80 ? 'high' : 'medium'
        })
      }
    }

    // Revenue volatility insight
    if (timeSeriesData.length > 7) {
      const revenues = timeSeriesData.map(d => d.revenue)
      const avgRevenue = revenues.reduce((sum, r) => sum + r, 0) / revenues.length
      const variance = revenues.reduce((sum, r) => sum + Math.pow(r - avgRevenue, 2), 0) / revenues.length
      const stdDev = Math.sqrt(variance)
      const coefficientOfVariation = avgRevenue > 0 ? (stdDev / avgRevenue) * 100 : 0

      if (coefficientOfVariation > 30) {
        insights.push({
          type: 'anomaly',
          title: 'High Revenue Volatility',
          description: `Revenue shows high volatility with a coefficient of variation of ${coefficientOfVariation.toFixed(1)}%.`,
          impact: coefficientOfVariation > 50 ? 'high' : 'medium'
        })
      }
    }

    return insights.slice(0, 4) // Return top 4 insights

  } catch (error) {
    console.error('❌ Error generating sales insights:', error)
    return []
  }
}

export async function getTopProducts(
  filters: FilterState,
  merchant_id: string = HARDCODED_MERCHANT_ID,
  limit: number = 10
): Promise<TopProduct[]> {
  try {
    console.log('🏆 Fetching top products with filters:', filters, 'merchant_id:', merchant_id)

    // First, let's check if we have any order_items at all
    const { data: allOrderItems, error: allError } = await supabase
      .from('order_items')
      .select('*')
      .eq('merchant_id', merchant_id)
      .limit(5)

    console.log('🔍 All order items check:', { data: allOrderItems, error: allError })

    // Check if we have any products
    const { data: allProducts, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('merchant_id', merchant_id)
      .limit(5)

    console.log('🔍 All products check:', { data: allProducts, error: productsError })

    // Check if we have any orders
    const { data: allOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('merchant_id', merchant_id)
      .limit(5)

    console.log('🔍 All orders check:', { data: allOrders, error: ordersError })

    // Now try the original query
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        total,
        order_id,
        products!inner(id, name),
        orders!inner(id, created_at, merchant_id)
      `)
      .gte('orders.created_at', filters.startDate)
      .lte('orders.created_at', filters.endDate)
      .eq('orders.merchant_id', merchant_id)
      .eq('merchant_id', merchant_id)

    console.log('🔍 Order items query result:', { data: orderItems, error })

    if (error) {
      console.error('❌ Error fetching top products:', error)
      
      // Try a simpler query without joins
      console.log('🔄 Trying simpler query without joins...')
      const { data: simpleOrderItems, error: simpleError } = await supabase
        .from('order_items')
        .select('*')
        .eq('merchant_id', merchant_id)
        .limit(10)

      console.log('🔍 Simple order items result:', { data: simpleOrderItems, error: simpleError })
      
      return []
    }

    if (!orderItems || orderItems.length === 0) {
      console.log('📭 No order items found for top products')
      return []
    }

    console.log('📦 Found', orderItems.length, 'order items')

    // Group by product and calculate metrics
    const productGroups = orderItems.reduce((acc, item) => {
      const productId = item.product_id
      const productName = (item.products as any)?.name || 'Unknown Product'
      const orderId = (item.orders as any)?.id
      
      if (!acc[productId]) {
        acc[productId] = {
          id: productId,
          name: productName,
          revenue: 0,
          quantity: 0,
          orders: new Set()
        }
      }
      
      acc[productId].revenue += item.total || 0
      acc[productId].quantity += item.quantity || 0
      if (orderId) {
        acc[productId].orders.add(orderId)
      }
      
      return acc
    }, {} as Record<string, any>)

    console.log('📊 Product groups:', Object.keys(productGroups).length, 'unique products')

    const topProducts = Object.values(productGroups)
      .map((product: any) => ({
        id: product.id,
        name: product.name,
        revenue: parseFloat(product.revenue.toFixed(2)),
        quantity: product.quantity,
        orders: product.orders.size,
        avgOrderValue: product.orders.size > 0 ? parseFloat((product.revenue / product.orders.size).toFixed(2)) : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)

    console.log('🏆 Top products result:', topProducts)

    return topProducts

  } catch (error) {
    console.error('❌ Error in getTopProducts:', error)
    return []
  }
}

export async function getTopCustomers(
  filters: FilterState,
  merchant_id: string = HARDCODED_MERCHANT_ID,
  limit: number = 10
): Promise<TopCustomer[]> {
  try {
    console.log('👥 Fetching top customers')

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        customer_id,
        total_price,
        created_at,
        customers!inner(id, first_name, last_name, email)
      `)
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate)
      .eq('merchant_id', merchant_id)
      .not('customer_id', 'is', null)

    if (error) {
      console.error('❌ Error fetching top customers:', error)
      return []
    }

    if (!orders || orders.length === 0) {
      console.log('📭 No orders found for top customers')
      return []
    }

    // Group by customer and calculate metrics
    const customerGroups = orders.reduce((acc, order) => {
      const customerId = order.customer_id
      const customer = order.customers as any
      
      if (!customerId || !customer) return acc
      
      if (!acc[customerId]) {
        acc[customerId] = {
          id: customerId,
          name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown Customer',
          email: customer.email || '',
          revenue: 0,
          orders: 0,
          lastOrderDate: order.created_at
        }
      }
      
      acc[customerId].revenue += order.total_price || 0
      acc[customerId].orders += 1
      
      // Keep track of the most recent order date
      if (new Date(order.created_at) > new Date(acc[customerId].lastOrderDate)) {
        acc[customerId].lastOrderDate = order.created_at
      }
      
      return acc
    }, {} as Record<string, any>)

    return Object.values(customerGroups)
      .map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        revenue: parseFloat(customer.revenue.toFixed(2)),
        orders: customer.orders,
        avgOrderValue: customer.orders > 0 ? parseFloat((customer.revenue / customer.orders).toFixed(2)) : 0,
        lastOrderDate: customer.lastOrderDate
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)

  } catch (error) {
    console.error('❌ Error in getTopCustomers:', error)
    return []
  }
}

export async function getProductDrillDown(
  productId: string,
  filters: FilterState,
  merchant_id: string = HARDCODED_MERCHANT_ID
): Promise<ProductDrillDown | null> {
  try {
    console.log('🔍 Fetching product drill-down for:', productId)

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('merchant_id', merchant_id)
      .single()

    if (productError || !product) {
      console.error('❌ Product not found:', productError)
      return null
    }

    // Get product time series data
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        quantity,
        total,
        orders!inner(created_at, customer_id, channel)
      `)
      .eq('product_id', productId)
      .eq('merchant_id', merchant_id)
      .gte('orders.created_at', filters.startDate)
      .lte('orders.created_at', filters.endDate)

    if (itemsError) {
      console.error('❌ Error fetching product order items:', itemsError)
      return null
    }

    // Generate time series data
    const timeSeriesData: RevenueTimeSeriesData[] = []
    if (orderItems && orderItems.length > 0) {
      const dailyData = orderItems.reduce((acc, item) => {
        const date = new Date((item.orders as any).created_at).toISOString().split('T')[0]
        
        if (!acc[date]) {
          acc[date] = { revenue: 0, orders: new Set(), quantity: 0 }
        }
        
        acc[date].revenue += item.total || 0
        acc[date].orders.add((item.orders as any).id)
        acc[date].quantity += item.quantity || 0
        
        return acc
      }, {} as Record<string, any>)

      Object.entries(dailyData).forEach(([date, data]: [string, any]) => {
        timeSeriesData.push({
          date,
          revenue: parseFloat(data.revenue.toFixed(2)),
          orders: data.orders.size,
          avgOrderValue: data.orders.size > 0 ? parseFloat((data.revenue / data.orders.size).toFixed(2)) : 0
        })
      })
    }

    // Get top customers for this product
    const customerData = orderItems?.reduce((acc, item) => {
      const customerId = (item.orders as any).customer_id
      if (!customerId) return acc
      
      if (!acc[customerId]) {
        acc[customerId] = { revenue: 0, orders: 0, quantity: 0 }
      }
      
      acc[customerId].revenue += item.total || 0
      acc[customerId].orders += 1
      acc[customerId].quantity += item.quantity || 0
      
      return acc
    }, {} as Record<string, any>) || {}

    // Fetch customer details for top customers
    const topCustomerIds = Object.entries(customerData)
      .sort(([,a], [,b]) => (b as any).revenue - (a as any).revenue)
      .slice(0, 5)
      .map(([id]) => id)

    let topCustomers: TopCustomer[] = []
    if (topCustomerIds.length > 0) {
      const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .in('id', topCustomerIds)
        .eq('merchant_id', merchant_id)

      if (customers) {
        topCustomers = customers.map(customer => {
          const data = customerData[customer.id]
          return {
            id: customer.id,
            name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown Customer',
            email: customer.email || '',
            revenue: parseFloat(data.revenue.toFixed(2)),
            orders: data.orders,
            avgOrderValue: data.orders > 0 ? parseFloat((data.revenue / data.orders).toFixed(2)) : 0,
            lastOrderDate: customer.last_order_date || ''
          }
        }).sort((a, b) => b.revenue - a.revenue)
      }
    }

    // Get channel breakdown for this product
    const channelData = orderItems?.reduce((acc, item) => {
      const channel = (item.orders as any).channel || 'Unknown'
      
      if (!acc[channel]) {
        acc[channel] = { revenue: 0, orders: new Set() }
      }
      
      acc[channel].revenue += item.total || 0
      acc[channel].orders.add((item.orders as any).id)
      
      return acc
    }, {} as Record<string, any>) || {}

    const totalRevenue = Object.values(channelData).reduce((sum: number, ch: any) => sum + ch.revenue, 0)
    const channelBreakdown: ChannelRevenueData[] = Object.entries(channelData).map(([channel, data]: [string, any]) => ({
      channel,
      revenue: parseFloat(data.revenue.toFixed(2)),
      orders: data.orders.size,
      percentage: totalRevenue > 0 ? parseFloat(((data.revenue / totalRevenue) * 100).toFixed(1)) : 0,
      growth: null
    })).sort((a, b) => b.revenue - a.revenue)

    const productSummary: TopProduct = {
      id: product.id,
      name: product.name,
      revenue: parseFloat(Object.values(customerData).reduce((sum: number, data: any) => sum + data.revenue, 0).toFixed(2)),
      quantity: Object.values(customerData).reduce((sum: number, data: any) => sum + data.quantity, 0),
      orders: Object.values(customerData).reduce((sum: number, data: any) => sum + data.orders, 0),
      avgOrderValue: 0
    }
    productSummary.avgOrderValue = productSummary.orders > 0 ? parseFloat((productSummary.revenue / productSummary.orders).toFixed(2)) : 0

    return {
      product: productSummary,
      timeSeriesData: timeSeriesData.sort((a, b) => a.date.localeCompare(b.date)),
      topCustomers,
      channelBreakdown
    }

  } catch (error) {
    console.error('❌ Error in getProductDrillDown:', error)
    return null
  }
}

export async function getCustomerDrillDown(
  customerId: string,
  filters: FilterState,
  merchant_id: string = HARDCODED_MERCHANT_ID
): Promise<CustomerDrillDown | null> {
  try {
    console.log('🔍 Fetching customer drill-down for:', customerId)

    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('merchant_id', merchant_id)
      .single()

    if (customerError || !customer) {
      console.error('❌ Customer not found:', customerError)
      return null
    }

    // Get customer orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total_price,
        status,
        channel,
        created_at,
        order_items!inner(product_id, quantity, total, products!inner(name))
      `)
      .eq('customer_id', customerId)
      .eq('merchant_id', merchant_id)
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate)
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('❌ Error fetching customer orders:', ordersError)
      return null
    }

    if (!orders || orders.length === 0) {
      console.log('📭 No orders found for customer')
      return null
    }

    // Generate time series data
    const dailyData = orders.reduce((acc, order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0]
      
      if (!acc[date]) {
        acc[date] = { revenue: 0, orders: 0 }
      }
      
      acc[date].revenue += order.total_price || 0
      acc[date].orders += 1
      
      return acc
    }, {} as Record<string, any>)

    const timeSeriesData: RevenueTimeSeriesData[] = Object.entries(dailyData).map(([date, data]: [string, any]) => ({
      date,
      revenue: parseFloat(data.revenue.toFixed(2)),
      orders: data.orders,
      avgOrderValue: data.orders > 0 ? parseFloat((data.revenue / data.orders).toFixed(2)) : 0
    })).sort((a, b) => a.date.localeCompare(b.date))

    // Get top products for this customer
    const productData = orders.reduce((acc, order) => {
      (order.order_items as any[]).forEach(item => {
        const productId = item.product_id
        const productName = item.products?.name || 'Unknown Product'
        
        if (!acc[productId]) {
          acc[productId] = {
            id: productId,
            name: productName,
            revenue: 0,
            quantity: 0,
            orders: new Set()
          }
        }
        
        acc[productId].revenue += item.total || 0
        acc[productId].quantity += item.quantity || 0
        acc[productId].orders.add(order.id)
      })
      
      return acc
    }, {} as Record<string, any>)

    const topProducts: TopProduct[] = Object.values(productData).map((product: any) => ({
      id: product.id,
      name: product.name,
      revenue: parseFloat(product.revenue.toFixed(2)),
      quantity: product.quantity,
      orders: product.orders.size,
      avgOrderValue: product.orders.size > 0 ? parseFloat((product.revenue / product.orders.size).toFixed(2)) : 0
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 10)

    // Prepare order history
    const orderHistory = orders.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      date: order.created_at,
      total: order.total_price || 0,
      status: order.status || 'unknown',
      channel: order.channel || 'unknown'
    }))

    const customerSummary: TopCustomer = {
      id: customer.id,
      name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown Customer',
      email: customer.email || '',
      revenue: parseFloat(orders.reduce((sum, order) => sum + (order.total_price || 0), 0).toFixed(2)),
      orders: orders.length,
      avgOrderValue: 0,
      lastOrderDate: orders[0]?.created_at || ''
    }
    customerSummary.avgOrderValue = customerSummary.orders > 0 ? parseFloat((customerSummary.revenue / customerSummary.orders).toFixed(2)) : 0

    return {
      customer: customerSummary,
      timeSeriesData,
      topProducts,
      orderHistory
    }

  } catch (error) {
    console.error('❌ Error in getCustomerDrillDown:', error)
    return null
  }
}

export async function getSalesAnalysisData(filters: FilterState, merchant_id: string = HARDCODED_MERCHANT_ID) {
  try {
    console.log('🔄 Fetching complete sales analysis data')

    const [kpis, timeSeriesData, channelData, topProducts, topCustomers] = await Promise.all([
      getSalesAnalysisKPIs(filters, merchant_id),
      getRevenueTimeSeries(filters, 'daily', merchant_id),
      getChannelRevenueBreakdown(filters, merchant_id),
      getTopProducts(filters, merchant_id, 10),
      getTopCustomers(filters, merchant_id, 10)
    ])

    const insights = await generateSalesInsights(kpis, timeSeriesData, channelData)

    return {
      kpis,
      timeSeriesData,
      channelData,
      topProducts,
      topCustomers,
      insights
    }

  } catch (error) {
    console.error('❌ Error in getSalesAnalysisData:', error)
    throw error
  }
}