import { supabase } from '@/lib/supabaseClient'

const MERCHANT_ID = '11111111-1111-1111-1111-111111111111'

export interface ChurnPrediction {
  id: string
  customer_id: string
  churn_probability: number
  churn_band: 'High' | 'Medium' | 'Low'
  revenue_at_risk: number
  predicted_at: string
  customer?: {
    first_name: string
    last_name: string
    email: string
    total_spent: number
    last_order_date: string
  }
}

export interface LtvPrediction {
  id: string
  customer_id: string
  predicted_ltv: number
  confidence_score: number
  ltv_segment: string
  predicted_at: string
  current_spend?: number
  customer?: {
    first_name: string
    last_name: string
    email: string
    total_spent: number
  }
}

export interface CohortData {
  cohort_month: string
  period_month: number
  customers_remaining: number
  retention_rate: number
  cumulative_revenue: number
  avg_revenue_per_customer: number
}

export interface CustomerSegment {
  calculated_segment: string
  customers_count: number
  avg_orders_per_customer: number
  avg_customer_ltv: number
  avg_order_value: number
  active_last_30_days: number
  active_last_60_days: number
}

export interface CustomerCluster {
  cluster_id: string
  cluster_label: string
  customer_count: number
  total_spent: number
  avg_ltv: number
  orders_count: number
  avg_orders: number
  avg_order_value: number
  cluster_description: string
  description: string
}

export interface CustomerClusterPoint {
  customer_id: string
  cluster_id: string
  cluster_label: string
  total_spent: number
  avg_order_value: number
  orders_count: number
  customer_name: string
  customer_email: string
}

export interface ClusterAnalysis {
  clusterSummaries: CustomerCluster[]
  customerPoints: CustomerClusterPoint[]
  clusterCenters: Array<{
    cluster_id: string
    cluster_label: string
    center_total_spent: number
    center_avg_order_value: number
    color: string
  }>
}

export interface CustomerInsightsKpis {
  totalActiveCustomers: number
  customersAtHighRisk: number
  revenueAtRisk: number
  averageLtv: number
  lifetimeValuePotential: number
}

export interface CustomerInsightsData {
  kpis: CustomerInsightsKpis
  churnPredictions: ChurnPrediction[]
  ltvPredictions: LtvPrediction[]
  cohortAnalysis: CohortData[]
  customerSegments: CustomerSegment[]
  customerClusters: CustomerCluster[]
  clusterAnalysis: ClusterAnalysis
  churnTrendData: Array<{
    date: string
    high_risk_count: number
    medium_risk_count: number
    low_risk_count: number
    total_revenue_at_risk: number
  }>
  ltvDistribution: Array<{
    ltv_range: string
    customer_count: number
    total_ltv: number
  }>
}

export async function getCustomerInsightsData(merchantId: string, dateFilters?: { startDate: string; endDate: string }): Promise<CustomerInsightsData> {
  try {
    console.log('🔄 Fetching customer insights data for merchant:', merchantId, 'with filters:', dateFilters)

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

    // Calculate customer segments from actual data
    const customerSegments = await calculateCustomerSegments(customers || [], orders || [])
    
    // Generate cohort analysis from orders
    const cohortAnalysis = await generateCohortAnalysisFromOrders(orders || [])
    
    // Calculate churn predictions based on customer behavior
    const churnPredictions = await calculateChurnPredictions(customers || [], orders || [])
    
    // Calculate LTV predictions
    const ltvPredictions = await calculateLtvPredictions(customers || [], orders || [])
    
    // Generate customer clusters based on behavior
    const customerClusters = await generateCustomerClusters(customers || [], orders || [])
    
    // Generate detailed cluster analysis with individual customer points
    const clusterAnalysis = await generateClusterAnalysis(customers || [], orders || [])

    // Calculate KPIs
    const totalActiveCustomers = await getTotalActiveCustomers(merchantId, dateFilters)
    const customersAtHighRisk = churnPredictions.filter(c => c.churn_band === 'High').length
    const revenueAtRisk = churnPredictions.reduce((sum, c) => {
      return sum + (c.churn_band === 'High' || c.churn_band === 'Medium' ? c.revenue_at_risk : 0)
    }, 0)
    const averageLtv = ltvPredictions.length > 0 ? ltvPredictions.reduce((sum, l) => sum + l.predicted_ltv, 0) / ltvPredictions.length : 0
    const lifetimeValuePotential = ltvPredictions.reduce((sum, l) => sum + l.predicted_ltv, 0)

    // Generate trend data
    const churnTrendData = generateChurnTrendData(churnPredictions, dateFilters)
    const ltvDistribution = generateLtvDistribution(ltvPredictions)

    console.log('📊 Customer insights KPIs:', {
      totalActiveCustomers,
      customersAtHighRisk,
      revenueAtRisk,
      averageLtv,
      lifetimeValuePotential
    })

    return {
      kpis: {
        totalActiveCustomers,
        customersAtHighRisk,
        revenueAtRisk,
        averageLtv,
        lifetimeValuePotential
      },
      churnPredictions,
      ltvPredictions,
      cohortAnalysis,
      customerSegments,
      customerClusters,
      clusterAnalysis,
      churnTrendData,
      ltvDistribution
    }
  } catch (error) {
    console.error('❌ Error in getCustomerInsightsData:', error)
    throw error
  }
}

async function getTotalActiveCustomers(merchantId: string, dateFilters?: { startDate: string; endDate: string }): Promise<number> {
  try {
    let query = supabase
      .from('orders')
      .select('customer_id')
      .eq('merchant_id', merchantId)
      .not('customer_id', 'is', null)

    if (dateFilters) {
      query = query
        .gte('created_at', dateFilters.startDate)
        .lte('created_at', dateFilters.endDate)
    } else {
      // Default: active in last 60 days
      query = query.gte('created_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('❌ Error fetching orders for active customer count:', error)
      return 0
    }

    if (!orders || orders.length === 0) {
      console.log('⚠️ No orders found for the specified period')
      return 0
    }

    const uniqueCustomerIds = new Set(orders.map(order => order.customer_id))
    const uniqueCount = uniqueCustomerIds.size
    
    console.log('✅ Total active customers (unique from orders in period):', uniqueCount)
    return uniqueCount
  } catch (error) {
    console.error('❌ Error in getTotalActiveCustomers:', error)
    return 0
  }
}

async function calculateCustomerSegments(customers: any[], orders: any[]): Promise<CustomerSegment[]> {
  try {
    if (!customers || customers.length === 0 || !orders || orders.length === 0) {
      console.log('⚠️ No customers or orders data for segmentation')
      return []
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
      
      // Calculate recency (days since last order)
      const lastOrderDate = customerOrders.length > 0 
        ? Math.max(...customerOrders.map(o => new Date(o.created_at).getTime()))
        : 0
      const daysSinceLastOrder = lastOrderDate > 0 
        ? Math.floor((Date.now() - lastOrderDate) / (1000 * 60 * 60 * 24))
        : 999

      // Calculate frequency (orders per month since first order)
      const firstOrderDate = customerOrders.length > 0 
        ? Math.min(...customerOrders.map(o => new Date(o.created_at).getTime()))
        : Date.now()
      const monthsSinceFirst = Math.max(1, Math.floor((Date.now() - firstOrderDate) / (1000 * 60 * 60 * 24 * 30)))
      const frequency = orderCount / monthsSinceFirst

      // Segment customers based on RFM analysis
      let segment = 'new_customer'
      
      if (orderCount === 0) {
        segment = 'inactive'
      } else if (orderCount === 1) {
        segment = daysSinceLastOrder <= 30 ? 'new_customer' : 'one_time_buyer'
      } else if (daysSinceLastOrder <= 30 && frequency >= 1) {
        segment = totalSpent >= 500 ? 'vip_customer' : 'loyal_customer'
      } else if (daysSinceLastOrder <= 60) {
        segment = totalSpent >= 300 ? 'potential_loyalist' : 'regular_customer'
      } else if (daysSinceLastOrder <= 180) {
        segment = 'at_risk'
      } else {
        segment = 'churned'
      }

      return {
        ...customer,
        totalSpent,
        orderCount,
        avgOrderValue,
        daysSinceLastOrder,
        frequency,
        segment,
        isActive30Days: daysSinceLastOrder <= 30,
        isActive60Days: daysSinceLastOrder <= 60
      }
    })

    // Group by segment and calculate aggregates
    const segmentGroups: { [segment: string]: any[] } = {}
    customerMetrics.forEach(customer => {
      if (!segmentGroups[customer.segment]) {
        segmentGroups[customer.segment] = []
      }
      segmentGroups[customer.segment].push(customer)
    })

    const segments: CustomerSegment[] = Object.entries(segmentGroups).map(([segment, customers]) => {
      const totalCustomers = customers.length
      const avgOrders = customers.reduce((sum, c) => sum + c.orderCount, 0) / totalCustomers
      const avgLtv = customers.reduce((sum, c) => sum + c.totalSpent, 0) / totalCustomers
      const avgOrderValue = customers.reduce((sum, c) => sum + c.avgOrderValue, 0) / totalCustomers
      const active30Days = customers.filter(c => c.isActive30Days).length
      const active60Days = customers.filter(c => c.isActive60Days).length

      return {
        calculated_segment: segment,
        customers_count: totalCustomers,
        avg_orders_per_customer: avgOrders,
        avg_customer_ltv: avgLtv,
        avg_order_value: avgOrderValue,
        active_last_30_days: active30Days,
        active_last_60_days: active60Days
      }
    })

    console.log('✅ Customer segments calculated:', segments.length)
    return segments
  } catch (error) {
    console.error('❌ Error calculating customer segments:', error)
    return []
  }
}

async function generateCohortAnalysisFromOrders(orders: any[]): Promise<CohortData[]> {
  try {
    if (!orders || orders.length === 0) {
      console.log('⚠️ No orders found for cohort analysis')
      return []
    }

    console.log('✅ Orders found for cohort analysis:', orders.length)

    // Group customers by their first order month (cohort)
    const customerCohorts: { [customerId: string]: string } = {}
    orders.forEach(order => {
      if (order.customer_id && !customerCohorts[order.customer_id]) {
        const orderDate = new Date(order.created_at)
        const cohortMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`
        customerCohorts[order.customer_id] = cohortMonth
      }
    })

    const cohortData: { [cohortMonth: string]: { [period: number]: { customers: Set<string>, revenue: number } } } = {}

    // Calculate metrics for each cohort period
    orders.forEach(order => {
      if (!order.customer_id) return
      const customerId = order.customer_id
      const cohortMonth = customerCohorts[customerId]
      if (!cohortMonth) return

      const orderDate = new Date(order.created_at)
      const cohortDate = new Date(cohortMonth + '-01')
      
      // Calculate period (months since cohort start)
      const period = (orderDate.getFullYear() - cohortDate.getFullYear()) * 12 + (orderDate.getMonth() - cohortDate.getMonth())
      
      if (!cohortData[cohortMonth]) {
        cohortData[cohortMonth] = {}
      }
      
      if (!cohortData[cohortMonth][period]) {
        cohortData[cohortMonth][period] = {
          customers: new Set(),
          revenue: 0
        }
      }
      
      cohortData[cohortMonth][period].customers.add(customerId)
      cohortData[cohortMonth][period].revenue += order.total_price || 0
    })

    // Convert to final format
    const result: CohortData[] = []
    
    Object.entries(cohortData).forEach(([cohortMonth, periods]) => {
      const cohortSize = periods[0]?.customers.size || 0
      if (cohortSize === 0) return

      let cumulativeRevenue = 0
      const maxPeriod = Math.max(...Object.keys(periods).map(p => parseInt(p, 10)))

      for (let p = 0; p <= maxPeriod; p++) {
        const periodData = periods[p]
        
        const customersRemaining = periodData?.customers.size || 0
        const retentionRate = cohortSize > 0 ? (customersRemaining / cohortSize) * 100 : 0
        const periodRevenue = periodData?.revenue || 0
        cumulativeRevenue += periodRevenue
        
        const avgRevenuePerCustomer = cohortSize > 0 ? cumulativeRevenue / cohortSize : 0
        
        result.push({
          cohort_month: cohortMonth,
          period_month: p,
          customers_remaining: customersRemaining,
          retention_rate: retentionRate,
          cumulative_revenue: cumulativeRevenue,
          avg_revenue_per_customer: avgRevenuePerCustomer
        })
      }
    })

    return result.sort((a, b) => {
      if (a.cohort_month !== b.cohort_month) {
        return a.cohort_month.localeCompare(b.cohort_month)
      }
      return a.period_month - b.period_month
    })
  } catch (error) {
    console.error('Error generating cohort analysis:', error)
    return []
  }
}

async function calculateChurnPredictions(customers: any[], orders: any[]): Promise<ChurnPrediction[]> {
  try {
    if (!customers || customers.length === 0 || !orders || orders.length === 0) {
      console.log('⚠️ No customers or orders data for churn predictions')
      return []
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

    const predictions: ChurnPrediction[] = customers.map((customer, index) => {
      const customerOrders = customerOrderMap[customer.id] || []
      
      // Calculate churn probability based on recency and frequency
      const lastOrderDate = customerOrders.length > 0 
        ? Math.max(...customerOrders.map(o => new Date(o.created_at).getTime()))
        : 0
      const daysSinceLastOrder = lastOrderDate > 0 
        ? Math.floor((Date.now() - lastOrderDate) / (1000 * 60 * 60 * 24))
        : 999

      const orderCount = customerOrders.length
      const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total_price || 0), 0)

      // Simple churn probability calculation
      let churnProbability = 0
      if (orderCount === 0) {
        churnProbability = 0.9
      } else if (daysSinceLastOrder > 180) {
        churnProbability = 0.8
      } else if (daysSinceLastOrder > 90) {
        churnProbability = 0.6
      } else if (daysSinceLastOrder > 60) {
        churnProbability = 0.4
      } else if (daysSinceLastOrder > 30) {
        churnProbability = 0.2
      } else {
        churnProbability = 0.1
      }

      // Adjust based on order frequency
      if (orderCount > 5) churnProbability *= 0.7
      else if (orderCount > 2) churnProbability *= 0.8

      const churnBand = churnProbability > 0.6 ? 'High' : churnProbability > 0.3 ? 'Medium' : 'Low'
      const revenueAtRisk = totalSpent * churnProbability

      return {
        id: `churn_${customer.id}`,
        customer_id: customer.id,
        churn_probability: churnProbability,
        churn_band: churnBand as 'High' | 'Medium' | 'Low',
        revenue_at_risk: revenueAtRisk,
        predicted_at: new Date().toISOString(),
        customer: {
          first_name: customer.first_name || '',
          last_name: customer.last_name || '',
          email: customer.email || '',
          total_spent: totalSpent,
          last_order_date: lastOrderDate > 0 ? new Date(lastOrderDate).toISOString() : ''
        }
      }
    }).filter(prediction => prediction.customer_id) // Only include customers with valid IDs

    console.log('✅ Churn predictions calculated:', predictions.length)
    return predictions
  } catch (error) {
    console.error('❌ Error calculating churn predictions:', error)
    return []
  }
}

async function calculateLtvPredictions(customers: any[], orders: any[]): Promise<LtvPrediction[]> {
  try {
    if (!customers || customers.length === 0 || !orders || orders.length === 0) {
      console.log('⚠️ No customers or orders data for LTV predictions')
      return []
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

    const predictions: LtvPrediction[] = customers.map((customer, index) => {
      const customerOrders = customerOrderMap[customer.id] || []
      const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total_price || 0), 0)
      const orderCount = customerOrders.length
      const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0

      // Simple LTV prediction based on current behavior
      let predictedLtv = totalSpent
      if (orderCount > 0) {
        // Predict future orders based on frequency
        const firstOrderDate = Math.min(...customerOrders.map(o => new Date(o.created_at).getTime()))
        const monthsSinceFirst = Math.max(1, Math.floor((Date.now() - firstOrderDate) / (1000 * 60 * 60 * 24 * 30)))
        const ordersPerMonth = orderCount / monthsSinceFirst
        
        // Predict 12 more months of activity
        const predictedFutureOrders = ordersPerMonth * 12
        predictedLtv = totalSpent + (predictedFutureOrders * avgOrderValue)
      }

      // Confidence based on order history
      let confidenceScore = 0.5
      if (orderCount >= 5) confidenceScore = 0.9
      else if (orderCount >= 3) confidenceScore = 0.7
      else if (orderCount >= 1) confidenceScore = 0.6

      const ltvSegment = predictedLtv > 1000 ? 'High Value' : 
                        predictedLtv > 500 ? 'Medium Value' : 'Low Value'

      return {
        id: `ltv_${customer.id}`,
        customer_id: customer.id,
        predicted_ltv: predictedLtv,
        confidence_score: confidenceScore,
        ltv_segment: ltvSegment,
        predicted_at: new Date().toISOString(),
        current_spend: totalSpent,
        customer: {
          first_name: customer.first_name || '',
          last_name: customer.last_name || '',
          email: customer.email || '',
          total_spent: totalSpent
        }
      }
    }).filter(prediction => prediction.customer_id)

    console.log('✅ LTV predictions calculated:', predictions.length)
    return predictions
  } catch (error) {
    console.error('❌ Error calculating LTV predictions:', error)
    return []
  }
}

async function generateClusterAnalysis(customers: any[], orders: any[]): Promise<ClusterAnalysis> {
  try {
    if (!customers || customers.length === 0 || !orders || orders.length === 0) {
      console.log('⚠️ No customers or orders data for cluster analysis')
      return {
        clusterSummaries: [],
        customerPoints: [],
        clusterCenters: []
      }
    }

    // Group orders by customer and calculate metrics
    const customerOrderMap: { [customerId: string]: any[] } = {}
    orders.forEach(order => {
      if (order.customer_id) {
        if (!customerOrderMap[order.customer_id]) {
          customerOrderMap[order.customer_id] = []
        }
        customerOrderMap[order.customer_id].push(order)
      }
    })

    // Create customer metrics with full customer info
    const customerMetrics = customers.map(customer => {
      const customerOrders = customerOrderMap[customer.id] || []
      const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total_price || 0), 0)
      const orderCount = customerOrders.length
      const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0

      return {
        customer_id: customer.id,
        customer_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown',
        customer_email: customer.email || '',
        total_spent: totalSpent,
        orders_count: orderCount,
        avg_order_value: avgOrderValue
      }
    }).filter(m => m.orders_count > 0) // Only customers with orders

    // Simple clustering based on spending and frequency
    const clusters: { [clusterId: string]: any[] } = {
      'high_value_frequent': [],
      'high_value_infrequent': [],
      'medium_value_frequent': [],
      'medium_value_infrequent': [],
      'low_value_frequent': [],
      'low_value_infrequent': []
    }

    // Assign customers to clusters
    customerMetrics.forEach(customer => {
      const isHighValue = customer.total_spent > 500
      const isMediumValue = customer.total_spent > 200 && customer.total_spent <= 500
      const isFrequent = customer.orders_count > 3

      let clusterId = 'low_value_infrequent'
      if (isHighValue) {
        clusterId = isFrequent ? 'high_value_frequent' : 'high_value_infrequent'
      } else if (isMediumValue) {
        clusterId = isFrequent ? 'medium_value_frequent' : 'medium_value_infrequent'
      } else {
        clusterId = isFrequent ? 'low_value_frequent' : 'low_value_infrequent'
      }

      clusters[clusterId].push({
        ...customer,
        cluster_label: clusterId
      })
    })

    // Define cluster colors
    const clusterColors = [
      '#ef4444', // red
      '#f59e0b', // amber
      '#10b981', // emerald
      '#3b82f6', // blue
      '#8b5cf6', // violet
      '#ec4899'  // pink
    ]

    // Generate cluster summaries and centers
    const clusterSummaries: CustomerCluster[] = []
    const clusterCenters: Array<{
      cluster_id: string
      cluster_label: string
      center_total_spent: number
      center_avg_order_value: number
      color: string
    }> = []
    const customerPoints: CustomerClusterPoint[] = []

    Object.entries(clusters)
      .filter(([_, customers]) => customers.length > 0)
      .forEach(([clusterId, customers], index) => {
        const totalSpent = customers.reduce((sum, c) => sum + c.total_spent, 0)
        const avgSpent = totalSpent / customers.length
        const avgOrders = customers.reduce((sum, c) => sum + c.orders_count, 0) / customers.length
        const avgOrderValue = customers.reduce((sum, c) => sum + c.avg_order_value, 0) / customers.length
        const color = clusterColors[index % clusterColors.length]

        const descriptions: { [key: string]: string } = {
          'high_value_frequent': 'VIP customers with high spending and frequent purchases',
          'high_value_infrequent': 'High-value customers who purchase infrequently',
          'medium_value_frequent': 'Regular customers with moderate spending and good frequency',
          'medium_value_infrequent': 'Occasional customers with moderate spending',
          'low_value_frequent': 'Frequent buyers with small basket sizes',
          'low_value_infrequent': 'Infrequent, low-value customers'
        }

        // Add cluster summary
        clusterSummaries.push({
          cluster_id: `cluster_${index + 1}`,
          cluster_label: clusterId,
          customer_count: customers.length,
          total_spent: totalSpent,
          avg_ltv: avgSpent,
          orders_count: avgOrders,
          avg_orders: avgOrders,
          avg_order_value: avgOrderValue,
          cluster_description: descriptions[clusterId] || 'Customer group',
          description: descriptions[clusterId] || 'Customer group'
        })

        // Add cluster center
        clusterCenters.push({
          cluster_id: `cluster_${index + 1}`,
          cluster_label: clusterId,
          center_total_spent: avgSpent,
          center_avg_order_value: avgOrderValue,
          color: color
        })

        // Add individual customer points
        customers.forEach(customer => {
          customerPoints.push({
            customer_id: customer.customer_id,
            cluster_id: `cluster_${index + 1}`,
            cluster_label: clusterId,
            total_spent: customer.total_spent,
            avg_order_value: customer.avg_order_value,
            orders_count: customer.orders_count,
            customer_name: customer.customer_name,
            customer_email: customer.customer_email
          })
        })
      })

    console.log('✅ Cluster analysis generated:', {
      summaries: clusterSummaries.length,
      customerPoints: customerPoints.length,
      centers: clusterCenters.length
    })

    return {
      clusterSummaries,
      customerPoints,
      clusterCenters
    }
  } catch (error) {
    console.error('❌ Error generating cluster analysis:', error)
    return {
      clusterSummaries: [],
      customerPoints: [],
      clusterCenters: []
    }
  }
}

async function generateCustomerClusters(customers: any[], orders: any[]): Promise<CustomerCluster[]> {
  try {
    if (!customers || customers.length === 0 || !orders || orders.length === 0) {
      console.log('⚠️ No customers or orders data for clustering')
      return []
    }

    // Group orders by customer and calculate metrics
    const customerOrderMap: { [customerId: string]: any[] } = {}
    orders.forEach(order => {
      if (order.customer_id) {
        if (!customerOrderMap[order.customer_id]) {
          customerOrderMap[order.customer_id] = []
        }
        customerOrderMap[order.customer_id].push(order)
      }
    })

    const customerMetrics = customers.map(customer => {
      const customerOrders = customerOrderMap[customer.id] || []
      const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total_price || 0), 0)
      const orderCount = customerOrders.length
      const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0

      return {
        customer_id: customer.id,
        total_spent: totalSpent,
        orders_count: orderCount,
        avg_order_value: avgOrderValue
      }
    }).filter(m => m.orders_count > 0) // Only customers with orders

    // Simple clustering based on spending and frequency
    const clusters: { [clusterId: string]: any[] } = {
      'high_value_frequent': [],
      'high_value_infrequent': [],
      'medium_value_frequent': [],
      'medium_value_infrequent': [],
      'low_value_frequent': [],
      'low_value_infrequent': []
    }

    customerMetrics.forEach(customer => {
      const isHighValue = customer.total_spent > 500
      const isMediumValue = customer.total_spent > 200 && customer.total_spent <= 500
      const isFrequent = customer.orders_count > 3

      let clusterId = 'low_value_infrequent'
      if (isHighValue) {
        clusterId = isFrequent ? 'high_value_frequent' : 'high_value_infrequent'
      } else if (isMediumValue) {
        clusterId = isFrequent ? 'medium_value_frequent' : 'medium_value_infrequent'
      } else {
        clusterId = isFrequent ? 'low_value_frequent' : 'low_value_infrequent'
      }

      clusters[clusterId].push(customer)
    })

    // Generate cluster summaries
    const clusterSummaries: CustomerCluster[] = Object.entries(clusters)
      .filter(([_, customers]) => customers.length > 0)
      .map(([clusterId, customers], index) => {
        const totalSpent = customers.reduce((sum, c) => sum + c.total_spent, 0)
        const avgSpent = totalSpent / customers.length
        const avgOrders = customers.reduce((sum, c) => sum + c.orders_count, 0) / customers.length
        const avgOrderValue = customers.reduce((sum, c) => sum + c.avg_order_value, 0) / customers.length

        const descriptions: { [key: string]: string } = {
          'high_value_frequent': 'VIP customers with high spending and frequent purchases',
          'high_value_infrequent': 'High-value customers who purchase infrequently',
          'medium_value_frequent': 'Regular customers with moderate spending and good frequency',
          'medium_value_infrequent': 'Occasional customers with moderate spending',
          'low_value_frequent': 'Frequent buyers with small basket sizes',
          'low_value_infrequent': 'Infrequent, low-value customers'
        }

        return {
          cluster_id: `cluster_${index + 1}`,
          cluster_label: clusterId,
          customer_count: customers.length,
          total_spent: totalSpent,
          avg_ltv: avgSpent,
          orders_count: avgOrders,
          avg_orders: avgOrders,
          avg_order_value: avgOrderValue,
          cluster_description: descriptions[clusterId] || 'Customer group',
          description: descriptions[clusterId] || 'Customer group'
        }
      })

    console.log('✅ Customer clusters generated:', clusterSummaries.length)
    return clusterSummaries
  } catch (error) {
    console.error('❌ Error generating customer clusters:', error)
    return []
  }
}

function generateChurnTrendData(churnPredictions: ChurnPrediction[], dateFilters?: { startDate: string; endDate: string }) {
  try {
    if (!churnPredictions || churnPredictions.length === 0) {
      console.log('⚠️ No churn predictions for trend data')
      return []
    }

    // Generate trend data for the last 30 days
    const endDate = dateFilters ? new Date(dateFilters.endDate) : new Date()
    const startDate = dateFilters ? new Date(dateFilters.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    const trendData = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      
      // For simplicity, distribute predictions across the date range
      const dayIndex = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      
      const highRiskCount = Math.floor(churnPredictions.filter(p => p.churn_band === 'High').length / totalDays)
      const mediumRiskCount = Math.floor(churnPredictions.filter(p => p.churn_band === 'Medium').length / totalDays)
      const lowRiskCount = Math.floor(churnPredictions.filter(p => p.churn_band === 'Low').length / totalDays)
      const totalRevenueAtRisk = churnPredictions.reduce((sum, p) => sum + p.revenue_at_risk, 0) / totalDays
      
      trendData.push({
        date: dateStr,
        high_risk_count: highRiskCount,
        medium_risk_count: mediumRiskCount,
        low_risk_count: lowRiskCount,
        total_revenue_at_risk: totalRevenueAtRisk
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }

    console.log('✅ Churn trend data generated:', trendData.length, 'data points')
    return trendData
  } catch (error) {
    console.error('❌ Error generating churn trend data:', error)
    return []
  }
}

function generateLtvDistribution(ltvPredictions: LtvPrediction[]) {
  try {
    if (!ltvPredictions || ltvPredictions.length === 0) {
      console.log('⚠️ No LTV predictions for distribution')
      return []
    }

    const ranges = [
      { min: 0, max: 500, label: '£0 - £500' },
      { min: 500, max: 1000, label: '£500 - £1,000' },
      { min: 1000, max: 2000, label: '£1,000 - £2,000' },
      { min: 2000, max: 3000, label: '£2,000 - £3,000' },
      { min: 3000, max: 5000, label: '£3,000 - £5,000' },
      { min: 5000, max: Infinity, label: '£5,000+' }
    ]

    const distribution = ranges.map(range => {
      const customersInRange = ltvPredictions.filter(
        ltv => ltv.predicted_ltv >= range.min && ltv.predicted_ltv < range.max
      )
      
      return {
        ltv_range: range.label,
        customer_count: customersInRange.length,
        total_ltv: customersInRange.reduce((sum, ltv) => sum + ltv.predicted_ltv, 0)
      }
    }).filter(range => range.customer_count > 0)

    console.log('✅ LTV distribution generated:', distribution.length, 'ranges')
    return distribution
  } catch (error) {
    console.error('❌ Error generating LTV distribution:', error)
    return []
  }
}

export async function getCustomerDetails(customerId: string) {
  try {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('merchant_id', MERCHANT_ID)
      .single()

    if (customerError) throw customerError

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          product:products(name, category)
        )
      `)
      .eq('customer_id', customerId)
      .eq('merchant_id', MERCHANT_ID)
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError

    const { data: refunds, error: refundsError } = await supabase
      .from('refunds')
      .select('*')
      .in('order_id', orders?.map(o => o.id) || [])
      .eq('merchant_id', MERCHANT_ID)

    if (refundsError) throw refundsError

    return {
      customer,
      orders: orders || [],
      refunds: refunds || []
    }
  } catch (error) {
    console.error('❌ Error fetching customer details:', error)
    throw error
  }
}