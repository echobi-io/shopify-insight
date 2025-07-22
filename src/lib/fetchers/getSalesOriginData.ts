import { supabase } from '../supabaseClient'
import { FilterState } from './getKpis'
import { getAllRows, getTruncationWarning } from '../utils/supabaseUtils'

export interface SalesOriginData {
  channel: string
  order_count: number
  total_revenue: number
  percentage: number
}

export async function getSalesOriginData(
  merchant_id: string, 
  filters?: FilterState
): Promise<SalesOriginData[]> {
  try {
    console.log('🔍 getSalesOriginData called with:', {
      merchant_id,
      filters
    })

    // Build the base query for orders
    let query = supabase
      .from('orders')
      .select('channel, total_price')
      .eq('merchant_id', merchant_id)

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    console.log('📊 Executing sales origin query with filters:', {
      merchant_id,
      startDate: filters?.startDate,
      endDate: filters?.endDate
    })

    // Use getAllRows to handle potential large datasets
    const orders = await getAllRows(query.order('created_at'), 50000)

    console.log('📈 Sales origin query result:', {
      ordersCount: orders?.length || 0,
      firstOrder: orders?.[0],
      truncationWarning: getTruncationWarning(orders?.length || 0)
    })

    // Log warning if we might be hitting limits
    const warning = getTruncationWarning(orders?.length || 0)
    if (warning) {
      console.warn('⚠️', warning)
    }

    if (!orders || orders.length === 0) {
      console.log('⚠️ No orders found for sales origin analysis')
      return []
    }

    // Process data by channel
    const channelTotals: Record<string, { orders: number; revenue: number }> = {}
    
    orders.forEach((order, index) => {
      try {
        const channel = order.channel || 'unknown'
        const revenue = parseFloat(order.total_price) || 0
        
        if (!channelTotals[channel]) {
          channelTotals[channel] = { orders: 0, revenue: 0 }
        }
        
        channelTotals[channel].orders += 1
        channelTotals[channel].revenue += revenue
      } catch (error) {
        console.error(`❌ Error processing order ${index} for sales origin:`, error, order)
      }
    })

    console.log('📊 Channel totals processed:', {
      channelTotalsCount: Object.keys(channelTotals).length,
      channelTotals
    })

    // Calculate totals for percentage calculation
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0)

    // Convert to array format with percentages
    const salesOriginData = Object.entries(channelTotals)
      .map(([channel, totals]) => ({
        channel: channel.charAt(0).toUpperCase() + channel.slice(1), // Capitalize first letter
        order_count: totals.orders,
        total_revenue: totals.revenue,
        percentage: totalOrders > 0 ? (totals.orders / totalOrders) * 100 : 0
      }))
      .sort((a, b) => b.order_count - a.order_count) // Sort by order count descending

    console.log('📈 Final sales origin data result:', {
      salesOriginDataCount: salesOriginData.length,
      totalOrdersProcessed: totalOrders,
      totalRevenueProcessed: totalRevenue,
      salesOriginData
    })

    return salesOriginData

  } catch (error) {
    console.error('❌ Error processing sales origin data:', error)
    return []
  }
}

// Helper function to get channel display name
export function getChannelDisplayName(channel: string): string {
  // Safety check for undefined/null channel
  if (!channel || typeof channel !== 'string') {
    return 'Unknown'
  }
  
  const channelMap: Record<string, string> = {
    'online': 'Online Store',
    'mobile': 'Mobile App',
    'social': 'Social Media',
    'email': 'Email Marketing',
    'direct': 'Direct Sales',
    'unknown': 'Unknown'
  }
  
  return channelMap[channel.toLowerCase()] || channel
}

// Helper function to get channel color for charts
export function getChannelColor(channel: string): string {
  // Safety check for undefined/null channel
  if (!channel || typeof channel !== 'string') {
    return '#6b7280' // Gray for unknown
  }
  
  const colorMap: Record<string, string> = {
    'online': '#0ea5e9', // Blue
    'mobile': '#10b981', // Green
    'social': '#f59e0b', // Yellow
    'email': '#ef4444', // Red
    'direct': '#8b5cf6', // Purple
    'unknown': '#6b7280' // Gray
  }
  
  return colorMap[channel.toLowerCase()] || '#6b7280'
}