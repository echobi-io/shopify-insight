import { supabase } from '../supabaseClient'
import { FilterState } from './getKpis'
import { getSettings } from '../utils/settingsUtils'

export interface EnhancedCustomerData {
  id: string
  name: string
  email: string
  phone: string | null
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  firstOrderDate: string | null
  lastOrderDate: string | null
  daysSinceLastOrder: number | null
  customerLifetimeValue: number
  isChurned: boolean
  churnRisk: 'low' | 'medium' | 'high'
  customerSegment: string
  totalSpent: number
  ordersCount: number
  favoriteChannel: string | null
  favoriteProduct: string | null
  refundCount: number
  refundAmount: number
  createdAt: string
}


// Helper function to calculate churn risk
function calculateChurnRisk(daysSinceLastOrder: number | null, avgOrderFrequency: number, isChurned: boolean, churnPeriodDays: number): 'low' | 'medium' | 'high' {
  if (!daysSinceLastOrder) return 'low'
  
  // If customer is churned, always return high risk
  if (isChurned) return 'high'
  
  // Calculate risk thresholds based on churn period
  const highRiskThreshold = Math.floor(churnPeriodDays * 0.5) // 50% of churn period
  const mediumRiskThreshold = Math.floor(churnPeriodDays * 0.33) // 33% of churn period
  
  // If no orders in the high risk threshold and average frequency is less than 30 days
  if (daysSinceLastOrder > highRiskThreshold && avgOrderFrequency < 30) return 'high'
  
  // If no orders in the medium risk threshold and average frequency is less than 45 days
  if (daysSinceLastOrder > mediumRiskThreshold && avgOrderFrequency < 45) return 'medium'
  
  // If no orders in twice the average frequency
  if (daysSinceLastOrder > avgOrderFrequency * 2) return 'medium'
  
  return 'low'
}

// Helper function to determine if customer is churned
function isCustomerChurned(daysSinceLastOrder: number | null, churnPeriodDays: number): boolean {
  // Consider churned if no orders in the configured churn period
  return daysSinceLastOrder !== null && daysSinceLastOrder > churnPeriodDays
}

// Helper function to calculate intelligent customer segment
function calculateIntelligentCustomerSegment(
  originalSegment: string | null,
  isChurned: boolean,
  lifetimeOrders: number,
  daysSinceLastOrder: number | null,
  firstOrderDate: string | null
): string {
  // If customer is churned, override any "new" classification
  if (isChurned) {
    return 'churned'
  }

  // Calculate days since first order to determine if truly "new"
  let daysSinceFirstOrder: number | null = null
  if (firstOrderDate) {
    daysSinceFirstOrder = Math.floor((new Date().getTime() - new Date(firstOrderDate).getTime()) / (1000 * 60 * 60 * 24))
  }

  // Override "new customer" if they've been around for more than 90 days or have multiple orders
  if (originalSegment === 'new_customer' || originalSegment === 'new') {
    if (daysSinceFirstOrder && daysSinceFirstOrder > 90) {
      // Customer has been around for more than 90 days, reclassify based on behavior
      if (lifetimeOrders >= 5) {
        return 'loyal'
      } else if (lifetimeOrders >= 2) {
        return 'returning'
      } else {
        return 'inactive'
      }
    }
    
    // If they have multiple orders but are still within 90 days, they're returning
    if (lifetimeOrders >= 2) {
      return 'returning'
    }
  }

  // For other segments, apply intelligent logic
  if (originalSegment === 'loyal' && daysSinceLastOrder && daysSinceLastOrder > 120) {
    return 'at_risk'
  }

  if (originalSegment === 'returning' && daysSinceLastOrder && daysSinceLastOrder > 90) {
    return 'at_risk'
  }

  // Return original segment if no overrides apply, or default to 'unknown'
  return originalSegment || 'unknown'
}

export async function getEnhancedCustomerData(
  customerId: string,
  filters: FilterState,
  merchant_id: string
): Promise<EnhancedCustomerData | null> {
  try {
    console.log('🔍 Fetching enhanced customer data for:', customerId)

    // Get customer basic info
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

    // Get all customer orders (not filtered by date for lifetime calculations)
    const { data: allOrders, error: allOrdersError } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .eq('merchant_id', merchant_id)
      .order('created_at', { ascending: true })

    if (allOrdersError) {
      console.error('❌ Error fetching customer orders:', allOrdersError)
      return null
    }

    // Get filtered orders for the current analysis period
    const { data: filteredOrders, error: filteredOrdersError } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .eq('merchant_id', merchant_id)
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate)
      .order('created_at', { ascending: true })

    if (filteredOrdersError) {
      console.error('❌ Error fetching filtered orders:', filteredOrdersError)
      return null
    }

    // Get customer refunds
    const { data: refunds, error: refundsError } = await supabase
      .from('refunds')
      .select('amount')
      .eq('merchant_id', merchant_id)
      .in('order_id', (allOrders || []).map(order => order.id))

    // Calculate lifetime metrics
    const lifetimeRevenue = (allOrders || []).reduce((sum, order) => sum + (order.total_price || 0), 0)
    const lifetimeOrders = (allOrders || []).length
    const lifetimeAOV = lifetimeOrders > 0 ? lifetimeRevenue / lifetimeOrders : 0

    // Calculate filtered period metrics
    const filteredRevenue = (filteredOrders || []).reduce((sum, order) => sum + (order.total_price || 0), 0)
    const filteredOrderCount = (filteredOrders || []).length
    const filteredAOV = filteredOrderCount > 0 ? filteredRevenue / filteredOrderCount : 0

    // Calculate date-related metrics
    const firstOrderDate = (allOrders && allOrders.length > 0) ? allOrders[0].created_at : null
    const lastOrderDate = (allOrders && allOrders.length > 0) ? allOrders[allOrders.length - 1].created_at : null
    
    let daysSinceLastOrder: number | null = null
    if (lastOrderDate) {
      const daysDiff = Math.floor((new Date().getTime() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
      daysSinceLastOrder = daysDiff
    }

    // Calculate average order frequency (days between orders)
    let avgOrderFrequency = 365 // Default to yearly if can't calculate
    if (allOrders && allOrders.length > 1 && firstOrderDate && lastOrderDate) {
      const totalDays = Math.floor((new Date(lastOrderDate).getTime() - new Date(firstOrderDate).getTime()) / (1000 * 60 * 60 * 24))
      avgOrderFrequency = totalDays / (allOrders.length - 1)
    }

    // Get settings for churn period
    const settings = getSettings()
    const churnPeriodDays = settings.churnPeriodDays

    // Calculate Customer Lifetime Value (simple version: total spent)
    const customerLifetimeValue = lifetimeRevenue

    // Determine churn status and risk
    const churned = isCustomerChurned(daysSinceLastOrder, churnPeriodDays)
    const churnRisk = calculateChurnRisk(daysSinceLastOrder, avgOrderFrequency, churned, churnPeriodDays)

    // Calculate intelligent customer segment based on behavior and churn status
    const intelligentCustomerSegment = calculateIntelligentCustomerSegment(
      customer.customer_segment,
      churned,
      lifetimeOrders,
      daysSinceLastOrder,
      firstOrderDate
    )

    // Get favorite channel
    let favoriteChannel: string | null = null
    if (allOrders && allOrders.length > 0) {
      const channelCounts = allOrders.reduce((acc, order) => {
        const channel = order.channel || 'unknown'
        acc[channel] = (acc[channel] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      favoriteChannel = Object.entries(channelCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || null
    }

    // Get favorite product
    let favoriteProduct: string | null = null
    try {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          products!inner(name)
        `)
        .eq('merchant_id', merchant_id)
        .in('order_id', (allOrders || []).map(order => order.id))

      if (orderItems && orderItems.length > 0) {
        const productCounts = orderItems.reduce((acc, item) => {
          const productName = (item.products as any)?.name || 'Unknown'
          acc[productName] = (acc[productName] || 0) + (item.quantity || 0)
          return acc
        }, {} as Record<string, number>)
        
        favoriteProduct = Object.entries(productCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || null
      }
    } catch (error) {
      console.warn('Could not fetch favorite product:', error)
    }

    // Calculate refund metrics
    const refundCount = (refunds || []).length
    const refundAmount = (refunds || []).reduce((sum, refund) => sum + (refund.amount || 0), 0)

    return {
      id: customer.id,
      name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown Customer',
      email: customer.email || '',
      phone: customer.phone,
      totalRevenue: parseFloat(filteredRevenue.toFixed(2)),
      totalOrders: filteredOrderCount,
      avgOrderValue: parseFloat(filteredAOV.toFixed(2)),
      firstOrderDate,
      lastOrderDate,
      daysSinceLastOrder,
      customerLifetimeValue: parseFloat(customerLifetimeValue.toFixed(2)),
      isChurned: churned,
      churnRisk,
      customerSegment: intelligentCustomerSegment,
      totalSpent: parseFloat(lifetimeRevenue.toFixed(2)),
      ordersCount: lifetimeOrders,
      favoriteChannel,
      favoriteProduct,
      refundCount,
      refundAmount: parseFloat(refundAmount.toFixed(2)),
      createdAt: customer.created_at
    }

  } catch (error) {
    console.error('❌ Error in getEnhancedCustomerData:', error)
    return null
  }
}