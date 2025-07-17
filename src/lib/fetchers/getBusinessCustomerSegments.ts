import { supabase } from '@/lib/supabaseClient'

export interface BusinessCustomerSegment {
  segment_name: string
  segment_description: string
  customer_count: number
  total_revenue: number
  avg_order_value: number
  avg_orders_per_customer: number
  customers: Array<{
    customer_id: string
    customer_name: string
    customer_email: string
    total_spent: number
    order_count: number
    last_order_date: string
    days_since_last_order: number
  }>
}

export interface BusinessSegmentationData {
  segments: BusinessCustomerSegment[]
  totalCustomers: number
  segmentDistribution: Array<{
    segment_name: string
    percentage: number
    customer_count: number
  }>
}

export async function getBusinessCustomerSegments(merchantId: string, dateFilters?: { startDate: string; endDate: string }): Promise<BusinessSegmentationData> {
  try {
    console.log('🔄 Fetching business customer segments for merchant:', merchantId, 'with filters:', dateFilters)

    // Get all customers with their order data
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, total_spent, created_at')
      .eq('merchant_id', merchantId)

    if (customersError) {
      console.error('❌ Error fetching customers:', customersError)
      throw customersError
    }

    console.log('✅ Customers found:', customers?.length || 0)

    // Get all orders with customer data
    let ordersQuery = supabase
      .from('orders')
      .select('id, customer_id, total_price, created_at')
      .eq('merchant_id', merchantId)
      .not('customer_id', 'is', null)

    if (dateFilters) {
      ordersQuery = ordersQuery
        .gte('created_at', dateFilters.startDate)
        .lte('created_at', dateFilters.endDate)
    }

    const { data: orders, error: ordersError } = await ordersQuery.order('created_at', { ascending: true })

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError)
      throw ordersError
    }

    console.log('✅ Orders found:', orders?.length || 0)

    // Calculate business segments
    const segmentationData = calculateBusinessSegments(customers || [], orders || [])
    
    console.log('📊 Business customer segments calculated:', segmentationData.segments.length)
    return segmentationData
  } catch (error) {
    console.error('❌ Error in getBusinessCustomerSegments:', error)
    throw error
  }
}

function calculateBusinessSegments(customers: any[], orders: any[]): BusinessSegmentationData {
  try {
    if (!customers || customers.length === 0 || !orders || orders.length === 0) {
      console.log('⚠️ No customers or orders data for business segmentation')
      return {
        segments: [],
        totalCustomers: 0,
        segmentDistribution: []
      }
    }

    // Group orders by customer
    const customerOrderMap: { [customerId: string]: any[] } = {}
    orders.forEach(order => {
      if (order.customer_id) {
        if (!customerOrderMap[order.customer_id]) {
          customerOrderMap[order.customer_id] = []
        }
        customerOrderMap[order.customer_id].push(order)
      }
    })

    // Calculate customer metrics and segment them
    const customerMetrics = customers.map(customer => {
      const customerOrders = customerOrderMap[customer.id] || []
      const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total_price || 0), 0)
      const orderCount = customerOrders.length
      const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0
      
      // Calculate days since last order
      const lastOrderDate = customerOrders.length > 0 
        ? Math.max(...customerOrders.map(o => new Date(o.created_at).getTime()))
        : 0
      const daysSinceLastOrder = lastOrderDate > 0 
        ? Math.floor((Date.now() - lastOrderDate) / (1000 * 60 * 60 * 24))
        : 999

      // Apply business segmentation logic
      let segment = 'dormant_customers'
      
      if (orderCount === 0) {
        segment = 'dormant_customers' // No orders = dormant
      } else if (daysSinceLastOrder <= 30 && orderCount >= 4) {
        segment = 'best_customers' // Last 30 days + 4+ orders
      } else if (daysSinceLastOrder >= 30 && daysSinceLastOrder <= 180 && orderCount >= 4) {
        segment = 'loyal_customers' // 1-6 months ago + 4+ orders
      } else if (daysSinceLastOrder <= 180 && orderCount >= 2 && orderCount <= 3) {
        segment = 'promising_customers' // 2-3 orders + within last 6 months
      } else if (daysSinceLastOrder <= 30 && orderCount === 1) {
        segment = 'recent_customers' // Last 30 days + 1 order
      } else if (daysSinceLastOrder >= 30 && daysSinceLastOrder <= 180 && orderCount === 1) {
        segment = 'defecting_customers' // 1-6 months ago + 1 order
      } else if (daysSinceLastOrder >= 180 && daysSinceLastOrder <= 365) {
        segment = 'at_risk_customers' // 6-12 months ago
      } else if (daysSinceLastOrder > 365) {
        segment = 'dormant_customers' // 12+ months ago
      }

      return {
        customer_id: customer.id,
        customer_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown',
        customer_email: customer.email || '',
        totalSpent,
        orderCount,
        avgOrderValue,
        daysSinceLastOrder,
        lastOrderDate: lastOrderDate > 0 ? new Date(lastOrderDate).toISOString() : '',
        segment
      }
    })

    // Group by segment
    const segmentGroups: { [segment: string]: any[] } = {}
    customerMetrics.forEach(customer => {
      if (!segmentGroups[customer.segment]) {
        segmentGroups[customer.segment] = []
      }
      segmentGroups[customer.segment].push(customer)
    })

    // Define segment descriptions
    const segmentDescriptions: { [key: string]: string } = {
      'best_customers': 'Customers who have purchased within the last 30 days and have made 4 or more orders',
      'loyal_customers': 'Customers who last ordered 1-6 months ago and made 4 or more orders',
      'promising_customers': 'Customers who have made 2-3 orders and have been active within the last 6 months',
      'recent_customers': 'Customers who have recently ordered within the last 30 days but have only made 1 order',
      'defecting_customers': 'Customers who ordered 1-6 months ago but only made 1 order',
      'at_risk_customers': 'Customers who were active 6-12 months ago',
      'dormant_customers': 'Customers who were last active over 12 months ago'
    }

    // Create segment summaries
    const segments: BusinessCustomerSegment[] = Object.entries(segmentGroups).map(([segmentName, customers]) => {
      const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
      const avgOrderValue = customers.reduce((sum, c) => sum + c.avgOrderValue, 0) / customers.length
      const avgOrdersPerCustomer = customers.reduce((sum, c) => sum + c.orderCount, 0) / customers.length

      return {
        segment_name: segmentName,
        segment_description: segmentDescriptions[segmentName] || 'Customer segment',
        customer_count: customers.length,
        total_revenue: totalRevenue,
        avg_order_value: avgOrderValue,
        avg_orders_per_customer: avgOrdersPerCustomer,
        customers: customers.map(c => ({
          customer_id: c.customer_id,
          customer_name: c.customer_name,
          customer_email: c.customer_email,
          total_spent: c.totalSpent,
          order_count: c.orderCount,
          last_order_date: c.lastOrderDate,
          days_since_last_order: c.daysSinceLastOrder
        }))
      }
    })

    // Sort segments by priority (best to worst)
    const segmentPriority = [
      'best_customers',
      'loyal_customers', 
      'promising_customers',
      'recent_customers',
      'defecting_customers',
      'at_risk_customers',
      'dormant_customers'
    ]

    const sortedSegments = segments.sort((a, b) => {
      const aIndex = segmentPriority.indexOf(a.segment_name)
      const bIndex = segmentPriority.indexOf(b.segment_name)
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
    })

    // Calculate distribution
    const totalCustomers = customerMetrics.length
    const segmentDistribution = sortedSegments.map(segment => ({
      segment_name: segment.segment_name,
      percentage: totalCustomers > 0 ? (segment.customer_count / totalCustomers) * 100 : 0,
      customer_count: segment.customer_count
    }))

    console.log('✅ Business segments calculated:', {
      totalSegments: sortedSegments.length,
      totalCustomers,
      distribution: segmentDistribution.map(s => `${s.segment_name}: ${s.customer_count} (${s.percentage.toFixed(1)}%)`)
    })

    return {
      segments: sortedSegments,
      totalCustomers,
      segmentDistribution
    }
  } catch (error) {
    console.error('❌ Error calculating business segments:', error)
    return {
      segments: [],
      totalCustomers: 0,
      segmentDistribution: []
    }
  }
}