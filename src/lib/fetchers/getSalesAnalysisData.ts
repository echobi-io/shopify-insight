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
  granularity: 'daily' | 'weekly' | 'monthly' = 'daily',
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
  granularity: 'daily' | 'weekly' | 'monthly',
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

export async function getSalesAnalysisData(filters: FilterState, merchant_id: string = HARDCODED_MERCHANT_ID) {
  try {
    console.log('🔄 Fetching complete sales analysis data')

    const [kpis, timeSeriesData, channelData] = await Promise.all([
      getSalesAnalysisKPIs(filters, merchant_id),
      getRevenueTimeSeries(filters, 'daily', merchant_id),
      getChannelRevenueBreakdown(filters, merchant_id)
    ])

    const insights = await generateSalesInsights(kpis, timeSeriesData, channelData)

    return {
      kpis,
      timeSeriesData,
      channelData,
      insights
    }

  } catch (error) {
    console.error('❌ Error in getSalesAnalysisData:', error)
    throw error
  }
}