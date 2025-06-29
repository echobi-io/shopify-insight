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
  confidence: number
  predicted_at: string
  current_spend?: number
  customer?: {
    first_name: string
    last_name: string
    email: string
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
  cluster_label: string
  customers_count: number
  avg_ltv: number
  avg_orders: number
  avg_order_value: number
  description: string
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

export async function getCustomerInsightsData(): Promise<CustomerInsightsData> {
  try {
    console.log('Fetching customer insights data...')

    // Get customer retention summary (base metrics)
    const { data: customerSegments, error: segmentError } = await supabase
      .from('customer_retention_summary')
      .select('*')
      .eq('merchant_id', MERCHANT_ID)

    if (segmentError) {
      console.error('Error fetching customer segments:', segmentError)
    }

    // Get churn predictions with customer details
    const { data: churnData, error: churnError } = await supabase
      .from('churn_predictions')
      .select(`
        *,
        customer:customers(
          first_name,
          last_name,
          email,
          total_spent,
          last_order_date
        )
      `)
      .eq('merchant_id', MERCHANT_ID)
      .order('churn_probability', { ascending: false })

    if (churnError) {
      console.error('Error fetching churn predictions:', churnError)
    }

    // Get LTV predictions with customer details
    const { data: ltvData, error: ltvError } = await supabase
      .from('ltv_predictions')
      .select(`
        *,
        customer:customers(
          first_name,
          last_name,
          email,
          total_spent
        )
      `)
      .eq('merchant_id', MERCHANT_ID)
      .order('predicted_ltv', { ascending: false })

    if (ltvError) {
      console.error('Error fetching LTV predictions:', ltvError)
    }

    // Enhance LTV data with current spend
    const enhancedLtvData = (ltvData || []).map(ltv => ({
      ...ltv,
      current_spend: ltv.customer?.total_spent || 0
    }))

    // Get customer clusters
    const customerClusters = await getCustomerClusters()

    // Generate cohort analysis
    const cohortAnalysis = await generateCohortAnalysis()

    // Calculate KPIs
    const totalActiveCustomers = await getTotalActiveCustomers()
    const customersAtHighRisk = churnData?.filter(c => c.churn_band === 'High').length || 0
    const revenueAtRisk = churnData?.reduce((sum, c) => {
      return sum + (c.churn_band === 'High' || c.churn_band === 'Medium' ? c.revenue_at_risk : 0)
    }, 0) || 0
    const averageLtv = enhancedLtvData?.length ? enhancedLtvData.reduce((sum, l) => sum + l.predicted_ltv, 0) / enhancedLtvData.length : 0
    const lifetimeValuePotential = enhancedLtvData?.reduce((sum, l) => sum + l.predicted_ltv, 0) || 0

    // Generate trend and distribution data
    const churnTrendData = await generateChurnTrendData()
    const ltvDistribution = generateLtvDistribution(enhancedLtvData || [])

    return {
      kpis: {
        totalActiveCustomers,
        customersAtHighRisk,
        revenueAtRisk,
        averageLtv,
        lifetimeValuePotential
      },
      churnPredictions: churnData || [],
      ltvPredictions: enhancedLtvData || [],
      cohortAnalysis,
      customerSegments: customerSegments || [],
      customerClusters,
      churnTrendData,
      ltvDistribution
    }
  } catch (error) {
    console.error('Error in getCustomerInsightsData:', error)
    throw error
  }
}

async function getTotalActiveCustomers(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', MERCHANT_ID)
      .gte('last_order_date', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())

    if (error) {
      console.error('Error counting active customers:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error in getTotalActiveCustomers:', error)
    return 0
  }
}

async function generateCohortAnalysis(): Promise<CohortData[]> {
  try {
    // Generate cohort analysis from orders data
    const { data: orders, error } = await supabase
      .from('orders')
      .select('customer_id, created_at, total_price')
      .eq('merchant_id', MERCHANT_ID)
      .not('customer_id', 'is', null)
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching orders for cohort analysis:', error)
      return []
    }

    if (!orders || orders.length === 0) {
      return []
    }

    // Group customers by their first order month (cohort)
    const customerCohorts: { [customerId: string]: string } = {}
    const cohortData: { [cohortMonth: string]: { [period: number]: { customers: Set<string>, revenue: number } } } = {}

    // First pass: identify each customer's cohort (first order month)
    orders.forEach(order => {
      const orderDate = new Date(order.created_at)
      const cohortMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`
      
      if (!customerCohorts[order.customer_id]) {
        customerCohorts[order.customer_id] = cohortMonth
      }
    })

    // Second pass: calculate metrics for each cohort period
    orders.forEach(order => {
      const customerId = order.customer_id
      const cohortMonth = customerCohorts[customerId]
      const orderDate = new Date(order.created_at)
      const cohortDate = new Date(cohortMonth + '-01')
      
      // Calculate period (months since cohort start)
      const period = Math.floor((orderDate.getTime() - cohortDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
      
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
      cohortData[cohortMonth][period].revenue += order.total_price
    })

    // Convert to final format
    const result: CohortData[] = []
    
    Object.entries(cohortData).forEach(([cohortMonth, periods]) => {
      const cohortSize = periods[0]?.customers.size || 0
      
      Object.entries(periods).forEach(([periodStr, data]) => {
        const period = parseInt(periodStr)
        const customersRemaining = data.customers.size
        const retentionRate = cohortSize > 0 ? (customersRemaining / cohortSize) * 100 : 0
        const avgRevenuePerCustomer = cohortSize > 0 ? data.revenue / cohortSize : 0
        
        result.push({
          cohort_month: cohortMonth,
          period_month: period,
          customers_remaining: customersRemaining,
          retention_rate: retentionRate,
          cumulative_revenue: data.revenue,
          avg_revenue_per_customer: avgRevenuePerCustomer
        })
      })
    })

    return result.sort((a, b) => {
      if (a.cohort_month !== b.cohort_month) {
        return a.cohort_month.localeCompare(b.cohort_month)
      }
      return a.period_month - b.period_month
    }).slice(0, 50) // Limit results
  } catch (error) {
    console.error('Error generating cohort analysis:', error)
    return []
  }
}

async function getCustomerClusters(): Promise<CustomerCluster[]> {
  try {
    // Check if customer_clusters table exists and has data
    const { data: clusters, error } = await supabase
      .from('customer_clusters')
      .select(`
        cluster_label,
        customer:customers!inner(total_spent, orders_count)
      `)
      .eq('customers.merchant_id', MERCHANT_ID)

    if (error) {
      console.log('Customer clusters not available yet:', error.message)
      return []
    }

    if (!clusters || clusters.length === 0) {
      return []
    }

    // Group by cluster and calculate metrics
    const clusterMetrics: { [label: string]: { customers: any[], ltv: number[], orders: number[], aov: number[] } } = {}
    
    clusters.forEach(cluster => {
      const label = cluster.cluster_label
      if (!clusterMetrics[label]) {
        clusterMetrics[label] = { customers: [], ltv: [], orders: [], aov: [] }
      }
      
      clusterMetrics[label].customers.push(cluster.customer)
      clusterMetrics[label].ltv.push(cluster.customer.total_spent || 0)
      clusterMetrics[label].orders.push(cluster.customer.orders_count || 0)
      
      const aov = cluster.customer.orders_count > 0 
        ? (cluster.customer.total_spent || 0) / cluster.customer.orders_count 
        : 0
      clusterMetrics[label].aov.push(aov)
    })

    // Generate cluster descriptions based on metrics
    const generateClusterDescription = (avgLtv: number, avgOrders: number, avgAov: number): string => {
      if (avgLtv > 1000 && avgOrders > 5) {
        return "High-value loyal customers with frequent purchases and high lifetime value"
      } else if (avgLtv > 500 && avgOrders <= 3) {
        return "High-spending customers with low frequency - potential for retention campaigns"
      } else if (avgOrders > 5 && avgAov < 50) {
        return "Frequent buyers with small baskets - perfect for upselling and bundles"
      } else if (avgLtv < 200 && avgOrders <= 2) {
        return "New or low-engagement customers - focus on activation and onboarding"
      } else {
        return "Moderate engagement customers with balanced spending patterns"
      }
    }

    return Object.entries(clusterMetrics).map(([label, metrics]) => {
      const avgLtv = metrics.ltv.reduce((sum, val) => sum + val, 0) / metrics.ltv.length
      const avgOrders = metrics.orders.reduce((sum, val) => sum + val, 0) / metrics.orders.length
      const avgAov = metrics.aov.reduce((sum, val) => sum + val, 0) / metrics.aov.length

      return {
        cluster_label: label,
        customers_count: metrics.customers.length,
        avg_ltv: avgLtv,
        avg_orders: avgOrders,
        avg_order_value: avgAov,
        description: generateClusterDescription(avgLtv, avgOrders, avgAov)
      }
    })
  } catch (error) {
    console.error('Error fetching customer clusters:', error)
    return []
  }
}

async function generateChurnTrendData() {
  try {
    // Get historical churn data by aggregating by date
    const { data, error } = await supabase
      .from('churn_predictions')
      .select('churn_band, revenue_at_risk, predicted_at')
      .eq('merchant_id', MERCHANT_ID)
      .gte('predicted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('predicted_at', { ascending: true })

    if (error) {
      console.error('Error fetching churn trend data:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Group by date
    const groupedData: { [key: string]: any } = {}
    
    data.forEach(item => {
      const date = new Date(item.predicted_at).toISOString().split('T')[0]
      if (!groupedData[date]) {
        groupedData[date] = {
          date,
          high_risk_count: 0,
          medium_risk_count: 0,
          low_risk_count: 0,
          total_revenue_at_risk: 0
        }
      }
      
      if (item.churn_band === 'High') groupedData[date].high_risk_count++
      else if (item.churn_band === 'Medium') groupedData[date].medium_risk_count++
      else if (item.churn_band === 'Low') groupedData[date].low_risk_count++
      
      groupedData[date].total_revenue_at_risk += item.revenue_at_risk
    })

    return Object.values(groupedData)
  } catch (error) {
    console.error('Error generating churn trend data:', error)
    return []
  }
}

function generateLtvDistribution(ltvData: LtvPrediction[]) {
  const ranges = [
    { min: 0, max: 500, label: '£0 - £500' },
    { min: 500, max: 1000, label: '£500 - £1,000' },
    { min: 1000, max: 2000, label: '£1,000 - £2,000' },
    { min: 2000, max: 3000, label: '£2,000 - £3,000' },
    { min: 3000, max: 5000, label: '£3,000 - £5,000' },
    { min: 5000, max: Infinity, label: '£5,000+' }
  ]

  return ranges.map(range => {
    const customersInRange = ltvData.filter(
      ltv => ltv.predicted_ltv >= range.min && ltv.predicted_ltv < range.max
    )
    
    return {
      ltv_range: range.label,
      customer_count: customersInRange.length,
      total_ltv: customersInRange.reduce((sum, ltv) => sum + ltv.predicted_ltv, 0)
    }
  }).filter(range => range.customer_count > 0)
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
    console.error('Error fetching customer details:', error)
    throw error
  }
}