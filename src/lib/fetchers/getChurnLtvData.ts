import { supabase } from '@/lib/supabaseClient'
import { getSettings } from '@/lib/utils/settingsUtils'

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
}

export interface ChurnTrend {
  month: string
  churnRate: number
  customersLost: number
  revenueImpact: number
}

export interface RiskSegment {
  riskLevel: 'High' | 'Medium' | 'Low'
  customerCount: number
  percentage: number
  revenueAtRisk: number
}

export interface ChurnRiskFactor {
  factor: string
  value: number
  weight: number
  contribution: number
  description: string
}

export interface ChurnCustomer {
  id: string
  name: string
  email: string
  segment: string
  riskLevel: 'High' | 'Medium' | 'Low'
  ltv: number
  revenueAtRisk: number
  daysSinceLastOrder: number
  totalOrders: number
  lastOrderDate: string | null
  riskScore: number
  riskFactors: ChurnRiskFactor[]
  predictionConfidence: number
}

export interface ChurnAnalyticsData {
  summary: {
    churnRate: number
    previousChurnRate: number
    customersAtRisk: number
    previousCustomersAtRisk: number
    revenueAtRisk: number
    previousRevenueAtRisk: number
    avgCustomerLTV: number
    previousAvgCustomerLTV: number
  }
  churnTrend: ChurnTrend[]
  riskSegments: RiskSegment[]
  customers: ChurnCustomer[]
}

export interface ChurnLtvKpis {
  customersAtHighRisk: number
  revenueAtRisk: number
  averageLtv: number
  lifetimeValuePotential: number
}

export interface ChurnLtvData {
  kpis: ChurnLtvKpis
  churnPredictions: ChurnPrediction[]
  ltvPredictions: LtvPrediction[]
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

export async function getChurnLtvData(
  merchantId: string,
  filters: { startDate: string; endDate: string }
): Promise<ChurnAnalyticsData> {
  try {
    console.log('🔄 Fetching churn analytics data for merchant:', merchantId, 'with filters:', filters)

    // Since churn_predictions and ltv_predictions tables may not exist or have data,
    // we'll generate analytics based on actual customer behavior from existing data
    
    // Get customers with their order history to calculate churn risk
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select(`
        id,
        first_name,
        last_name,
        email,
        total_spent,
        created_at,
        orders!inner(
          id,
          created_at,
          total_price,
          order_items(
            quantity,
            price
          )
        )
      `)
      .eq('merchant_id', merchantId)
      .gte('orders.created_at', filters.startDate)
      .lte('orders.created_at', filters.endDate)

    if (customersError) {
      console.error('Error fetching customers:', customersError)
      // Return empty data structure instead of throwing
      return generateEmptyChurnData()
    }

    console.log('📊 Found customers:', customers?.length || 0)

    // Calculate churn analytics from customer behavior
    const analytics = calculateChurnAnalytics(customers || [], filters)
    
    return analytics
  } catch (error) {
    console.error('Error in getChurnLtvData:', error)
    // Return empty data structure instead of throwing
    return generateEmptyChurnData()
  }
}

function generateEmptyChurnData(): ChurnAnalyticsData {
  return {
    summary: {
      churnRate: 0,
      previousChurnRate: 0,
      customersAtRisk: 0,
      previousCustomersAtRisk: 0,
      revenueAtRisk: 0,
      previousRevenueAtRisk: 0,
      avgCustomerLTV: 0,
      previousAvgCustomerLTV: 0
    },
    churnTrend: [],
    riskSegments: [
      { riskLevel: 'High', customerCount: 0, percentage: 0, revenueAtRisk: 0 },
      { riskLevel: 'Medium', customerCount: 0, percentage: 0, revenueAtRisk: 0 },
      { riskLevel: 'Low', customerCount: 0, percentage: 0, revenueAtRisk: 0 }
    ],
    customers: []
  }
}

function calculateChurnAnalytics(customers: any[], filters: { startDate: string; endDate: string }): ChurnAnalyticsData {
  const endDate = new Date(filters.endDate)
  const startDate = new Date(filters.startDate)
  const settings = getSettings()
  const churnPeriodDays = settings.churnPeriodDays
  
  console.log('📊 Calculating churn analytics for date range:', { 
    startDate: startDate.toISOString(), 
    endDate: endDate.toISOString(),
    churnPeriodDays 
  })

  // Process customers and calculate detailed risk predictions
  const processedCustomers: ChurnCustomer[] = customers.map(customer => {
    const orders = customer.orders || []
    
    // Filter orders to only include those within the selected date range
    const ordersInRange = orders.filter((order: any) => {
      const orderDate = new Date(order.created_at)
      return orderDate >= startDate && orderDate <= endDate
    })
    
    // Find the last order within the date range
    const lastOrderInRange = ordersInRange.length > 0 ? 
      new Date(Math.max(...ordersInRange.map((o: any) => new Date(o.created_at).getTime()))) : null
    
    // Calculate days since last order from the END of the selected date range
    const daysSinceLastOrder = lastOrderInRange ? 
      Math.floor((endDate.getTime() - lastOrderInRange.getTime()) / (1000 * 60 * 60 * 24)) : 999
    
    // Calculate LTV from orders within the date range
    const ltvInRange = ordersInRange.reduce((sum: number, order: any) => sum + (order.total_price || 0), 0)
    
    // Calculate average order value
    const avgOrderValue = ordersInRange.length > 0 ? ltvInRange / ordersInRange.length : 0
    
    // Calculate order frequency (orders per month)
    const dateRangeDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const orderFrequency = dateRangeDays > 0 ? (ordersInRange.length / dateRangeDays) * 30 : 0
    
    // Calculate detailed risk factors with weights and contributions
    const riskFactors = calculateRiskFactors({
      daysSinceLastOrder,
      totalOrders: ordersInRange.length,
      avgOrderValue,
      orderFrequency,
      ltv: ltvInRange,
      dateRangeDays,
      churnPeriodDays
    })
    
    // Calculate overall risk score (0-100)
    const riskScore = riskFactors.reduce((sum, factor) => sum + factor.contribution, 0)
    
    // Determine risk level based on risk score
    let riskLevel: 'High' | 'Medium' | 'Low' = 'Low'
    if (riskScore >= 70) {
      riskLevel = 'High'
    } else if (riskScore >= 40) {
      riskLevel = 'Medium'
    }
    
    // Calculate prediction confidence based on data availability
    const predictionConfidence = calculatePredictionConfidence({
      hasRecentOrders: ordersInRange.length > 0,
      orderCount: ordersInRange.length,
      dataCompleteness: dateRangeDays > 30 ? 1 : dateRangeDays / 30
    })
    
    // Calculate revenue at risk (percentage of LTV based on risk score)
    const riskMultiplier = riskScore / 100
    const revenueAtRisk = ltvInRange * riskMultiplier
    
    // Determine customer segment based on LTV in the selected range
    let segment = 'Bronze'
    if (ltvInRange > 5000) segment = 'Platinum'
    else if (ltvInRange > 2000) segment = 'Gold'
    else if (ltvInRange > 500) segment = 'Silver'

    return {
      id: customer.id,
      name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown',
      email: customer.email || '',
      segment,
      riskLevel,
      ltv: ltvInRange,
      revenueAtRisk,
      daysSinceLastOrder,
      totalOrders: ordersInRange.length,
      lastOrderDate: lastOrderInRange ? lastOrderInRange.toISOString() : null,
      riskScore,
      riskFactors,
      predictionConfidence
    }
  })

  // Calculate summary metrics
  const totalCustomers = processedCustomers.length
  const highRiskCustomers = processedCustomers.filter(c => c.riskLevel === 'High')
  const mediumRiskCustomers = processedCustomers.filter(c => c.riskLevel === 'Medium')
  const lowRiskCustomers = processedCustomers.filter(c => c.riskLevel === 'Low')
  
  const churnRate = totalCustomers > 0 ? (highRiskCustomers.length / totalCustomers) * 100 : 0
  const customersAtRisk = highRiskCustomers.length + mediumRiskCustomers.length
  const revenueAtRisk = processedCustomers.reduce((sum, c) => sum + c.revenueAtRisk, 0)
  const avgCustomerLTV = totalCustomers > 0 ? processedCustomers.reduce((sum, c) => sum + c.ltv, 0) / totalCustomers : 0

  // Generate risk segments
  const riskSegments: RiskSegment[] = [
    {
      riskLevel: 'High',
      customerCount: highRiskCustomers.length,
      percentage: totalCustomers > 0 ? Math.round((highRiskCustomers.length / totalCustomers) * 100) : 0,
      revenueAtRisk: highRiskCustomers.reduce((sum, c) => sum + c.revenueAtRisk, 0)
    },
    {
      riskLevel: 'Medium',
      customerCount: mediumRiskCustomers.length,
      percentage: totalCustomers > 0 ? Math.round((mediumRiskCustomers.length / totalCustomers) * 100) : 0,
      revenueAtRisk: mediumRiskCustomers.reduce((sum, c) => sum + c.revenueAtRisk, 0)
    },
    {
      riskLevel: 'Low',
      customerCount: lowRiskCustomers.length,
      percentage: totalCustomers > 0 ? Math.round((lowRiskCustomers.length / totalCustomers) * 100) : 0,
      revenueAtRisk: lowRiskCustomers.reduce((sum, c) => sum + c.revenueAtRisk, 0)
    }
  ]

  // Generate trend data based on the selected date range
  const churnTrend: ChurnTrend[] = generateChurnTrendForDateRange(customers, startDate, endDate, churnPeriodDays)

  // Calculate previous period metrics for comparison
  const dateRangeDuration = endDate.getTime() - startDate.getTime()
  const previousEndDate = new Date(startDate.getTime() - 1) // Day before start date
  const previousStartDate = new Date(previousEndDate.getTime() - dateRangeDuration)
  
  const previousPeriodAnalytics = calculatePreviousPeriodMetrics(customers, {
    startDate: previousStartDate.toISOString(),
    endDate: previousEndDate.toISOString()
  }, churnPeriodDays)

  console.log('📈 Churn analytics calculated:', {
    totalCustomers,
    churnRate: churnRate.toFixed(1),
    customersAtRisk,
    revenueAtRisk: revenueAtRisk.toFixed(2),
    trendPoints: churnTrend.length
  })

  return {
    summary: {
      churnRate,
      previousChurnRate: previousPeriodAnalytics.churnRate,
      customersAtRisk,
      previousCustomersAtRisk: previousPeriodAnalytics.customersAtRisk,
      revenueAtRisk,
      previousRevenueAtRisk: previousPeriodAnalytics.revenueAtRisk,
      avgCustomerLTV,
      previousAvgCustomerLTV: previousPeriodAnalytics.avgCustomerLTV
    },
    churnTrend,
    riskSegments,
    customers: processedCustomers
  }
}

function generateChurnTrendForDateRange(customers: any[], startDate: Date, endDate: Date, churnPeriodDays: number): ChurnTrend[] {
  const churnTrend: ChurnTrend[] = []
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // If date range is less than 6 months, show monthly data
  // If more than 6 months, show quarterly data
  const isLongRange = totalDays > 180
  const intervals = isLongRange ? 4 : Math.min(6, Math.ceil(totalDays / 30))
  
  for (let i = 0; i < intervals; i++) {
    const intervalDuration = totalDays / intervals
    const intervalStart = new Date(startDate.getTime() + (i * intervalDuration * 24 * 60 * 60 * 1000))
    const intervalEnd = new Date(startDate.getTime() + ((i + 1) * intervalDuration * 24 * 60 * 60 * 1000))
    
    // Calculate customers who had their last order in this interval and then became inactive
    const customersInInterval = customers.filter((customer: any) => {
      const orders = customer.orders || []
      const ordersInInterval = orders.filter((order: any) => {
        const orderDate = new Date(order.created_at)
        return orderDate >= intervalStart && orderDate <= intervalEnd
      })
      return ordersInInterval.length > 0
    })
    
    // Calculate churn rate for this interval
    const totalCustomersAtStart = customers.filter((customer: any) => {
      const orders = customer.orders || []
      const hasOrdersBeforeInterval = orders.some((order: any) => {
        const orderDate = new Date(order.created_at)
        return orderDate < intervalStart
      })
      return hasOrdersBeforeInterval
    }).length
    
    const churnedCustomers = customers.filter((customer: any) => {
      const orders = customer.orders || []
      const lastOrder = orders.length > 0 ? 
        new Date(Math.max(...orders.map((o: any) => new Date(o.created_at).getTime()))) : null
      
      if (!lastOrder) return false
      
      // Customer churned if their last order was in this interval and they haven't ordered since
      // Use settings-based churn period instead of hardcoded 90 days
      return lastOrder >= intervalStart && lastOrder <= intervalEnd &&
             Math.floor((endDate.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24)) > churnPeriodDays
    })
    
    const intervalChurnRate = totalCustomersAtStart > 0 ? 
      (churnedCustomers.length / totalCustomersAtStart) * 100 : 0
    
    const revenueImpact = churnedCustomers.reduce((sum: number, customer: any) => {
      const orders = customer.orders || []
      const customerRevenue = orders.reduce((orderSum: number, order: any) => 
        orderSum + (order.total_price || 0), 0)
      return sum + customerRevenue
    }, 0)
    
    churnTrend.push({
      month: intervalStart.toISOString(),
      churnRate: intervalChurnRate,
      customersLost: churnedCustomers.length,
      revenueImpact
    })
  }
  
  return churnTrend
}

function calculateRiskFactors(customerData: {
  daysSinceLastOrder: number
  totalOrders: number
  avgOrderValue: number
  orderFrequency: number
  ltv: number
  dateRangeDays: number
  churnPeriodDays: number
}): ChurnRiskFactor[] {
  const factors: ChurnRiskFactor[] = []
  
  // Factor 1: Recency (Days since last order) - Weight: 35%
  // Use settings-based churn period instead of hardcoded values
  const recencyWeight = 35
  let recencyScore = 0
  const churnThreshold = customerData.churnPeriodDays
  const mediumRiskThreshold = Math.floor(churnThreshold * 0.67) // 67% of churn period
  const lowRiskThreshold = Math.floor(churnThreshold * 0.33) // 33% of churn period
  
  if (customerData.daysSinceLastOrder >= churnThreshold) {
    recencyScore = 100
  } else if (customerData.daysSinceLastOrder >= mediumRiskThreshold) {
    recencyScore = 70
  } else if (customerData.daysSinceLastOrder >= lowRiskThreshold) {
    recencyScore = 40
  } else {
    recencyScore = 10
  }
  
  factors.push({
    factor: 'Recency',
    value: customerData.daysSinceLastOrder,
    weight: recencyWeight,
    contribution: (recencyScore * recencyWeight) / 100,
    description: `${customerData.daysSinceLastOrder} days since last order`
  })
  
  // Factor 2: Order Frequency - Weight: 25%
  const frequencyWeight = 25
  let frequencyScore = 0
  if (customerData.orderFrequency < 0.5) {
    frequencyScore = 80
  } else if (customerData.orderFrequency < 1) {
    frequencyScore = 50
  } else if (customerData.orderFrequency < 2) {
    frequencyScore = 20
  } else {
    frequencyScore = 5
  }
  
  factors.push({
    factor: 'Frequency',
    value: customerData.orderFrequency,
    weight: frequencyWeight,
    contribution: (frequencyScore * frequencyWeight) / 100,
    description: `${customerData.orderFrequency.toFixed(1)} orders per month`
  })
  
  // Factor 3: Order Count - Weight: 20%
  const orderCountWeight = 20
  let orderCountScore = 0
  if (customerData.totalOrders === 0) {
    orderCountScore = 100
  } else if (customerData.totalOrders === 1) {
    orderCountScore = 70
  } else if (customerData.totalOrders <= 3) {
    orderCountScore = 40
  } else {
    orderCountScore = 10
  }
  
  factors.push({
    factor: 'Order Count',
    value: customerData.totalOrders,
    weight: orderCountWeight,
    contribution: (orderCountScore * orderCountWeight) / 100,
    description: `${customerData.totalOrders} total orders in period`
  })
  
  // Factor 4: Average Order Value - Weight: 10%
  const aovWeight = 10
  let aovScore = 0
  if (customerData.avgOrderValue < 50) {
    aovScore = 60
  } else if (customerData.avgOrderValue < 100) {
    aovScore = 40
  } else if (customerData.avgOrderValue < 200) {
    aovScore = 20
  } else {
    aovScore = 5
  }
  
  factors.push({
    factor: 'Avg Order Value',
    value: customerData.avgOrderValue,
    weight: aovWeight,
    contribution: (aovScore * aovWeight) / 100,
    description: `£${customerData.avgOrderValue.toFixed(2)} average order value`
  })
  
  // Factor 5: Customer Value (LTV) - Weight: 10%
  const ltvWeight = 10
  let ltvScore = 0
  if (customerData.ltv < 100) {
    ltvScore = 50
  } else if (customerData.ltv < 500) {
    ltvScore = 30
  } else if (customerData.ltv < 1000) {
    ltvScore = 15
  } else {
    ltvScore = 5
  }
  
  factors.push({
    factor: 'Customer Value',
    value: customerData.ltv,
    weight: ltvWeight,
    contribution: (ltvScore * ltvWeight) / 100,
    description: `£${customerData.ltv.toFixed(2)} lifetime value`
  })
  
  return factors
}

function calculatePredictionConfidence(data: {
  hasRecentOrders: boolean
  orderCount: number
  dataCompleteness: number
}): number {
  let confidence = 0
  
  // Base confidence from data availability
  confidence += data.dataCompleteness * 40 // Up to 40% from data completeness
  
  // Confidence from order history
  if (data.hasRecentOrders) {
    confidence += 30 // 30% if has recent orders
  }
  
  // Confidence from order count
  if (data.orderCount >= 5) {
    confidence += 30 // 30% if sufficient order history
  } else if (data.orderCount >= 2) {
    confidence += 20 // 20% if some order history
  } else if (data.orderCount >= 1) {
    confidence += 10 // 10% if minimal order history
  }
  
  return Math.min(100, Math.max(0, confidence))
}

function calculatePreviousPeriodMetrics(customers: any[], filters: { startDate: string; endDate: string }, churnPeriodDays: number) {
  const endDate = new Date(filters.endDate)
  const startDate = new Date(filters.startDate)
  
  // Process customers for the previous period
  const processedCustomers = customers.map((customer: any) => {
    const orders = customer.orders || []
    
    // Filter orders to only include those within the previous period
    const ordersInRange = orders.filter((order: any) => {
      const orderDate = new Date(order.created_at)
      return orderDate >= startDate && orderDate <= endDate
    })
    
    const lastOrderInRange = ordersInRange.length > 0 ? 
      new Date(Math.max(...ordersInRange.map((o: any) => new Date(o.created_at).getTime()))) : null
    
    const daysSinceLastOrder = lastOrderInRange ? 
      Math.floor((endDate.getTime() - lastOrderInRange.getTime()) / (1000 * 60 * 60 * 24)) : 999
    
    const ltvInRange = ordersInRange.reduce((sum: number, order: any) => sum + (order.total_price || 0), 0)
    
    // Use settings-based churn period instead of hardcoded values
    const mediumRiskThreshold = Math.floor(churnPeriodDays * 0.67)
    
    let riskLevel: 'High' | 'Medium' | 'Low' = 'Low'
    if (daysSinceLastOrder >= churnPeriodDays || ordersInRange.length === 0) {
      riskLevel = 'High'
    } else if (daysSinceLastOrder >= mediumRiskThreshold) {
      riskLevel = 'Medium'
    }
    
    const riskMultiplier = riskLevel === 'High' ? 0.8 : riskLevel === 'Medium' ? 0.4 : 0.1
    const revenueAtRisk = ltvInRange * riskMultiplier
    
    return {
      riskLevel,
      ltv: ltvInRange,
      revenueAtRisk,
      ordersInRange: ordersInRange.length
    }
  })
  
  const totalCustomers = processedCustomers.length
  const highRiskCustomers = processedCustomers.filter(c => c.riskLevel === 'High')
  const mediumRiskCustomers = processedCustomers.filter(c => c.riskLevel === 'Medium')
  
  return {
    churnRate: totalCustomers > 0 ? (highRiskCustomers.length / totalCustomers) * 100 : 0,
    customersAtRisk: highRiskCustomers.length + mediumRiskCustomers.length,
    revenueAtRisk: processedCustomers.reduce((sum, c) => sum + c.revenueAtRisk, 0),
    avgCustomerLTV: totalCustomers > 0 ? processedCustomers.reduce((sum, c) => sum + c.ltv, 0) / totalCustomers : 0
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

    // Group by date
    const groupedData: { [key: string]: any } = {}
    
    data?.forEach(item => {
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

export async function getChurnCustomerDetails(customerId: string) {
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

export interface ChurnedCustomerProductData {
  combination: string
  firstProduct: string
  lastProduct: string
  count: number
  customers: string[]
}

export async function getChurnedCustomerProductData(
  merchantId: string,
  filters: { startDate: string; endDate: string }
): Promise<ChurnedCustomerProductData[]> {
  try {
    console.log('🔄 Fetching churned customer product data for merchant:', merchantId, 'with filters:', filters)
    
    const settings = getSettings()
    const churnPeriodDays = settings.churnPeriodDays
    
    // Get customers with their order history and products
    const { data: customers, error } = await supabase
      .from('customers')
      .select(`
        id,
        email,
        first_name,
        last_name,
        orders!inner (
          id,
          created_at,
          order_items!inner (
            id,
            product_id,
            quantity,
            price,
            products!inner (
              id,
              name,
              shopify_product_id
            )
          )
        )
      `)
      .eq('merchant_id', merchantId)
      .gte('orders.created_at', filters.startDate)
      .lte('orders.created_at', filters.endDate)

    if (error) {
      console.error('Error fetching churned customer product data:', error)
      return []
    }

    console.log('📊 Found customers with orders:', customers?.length || 0)

    // Process data to find churned customers and their first/last products
    const now = new Date()
    const churnThreshold = new Date(now.getTime() - (churnPeriodDays * 24 * 60 * 60 * 1000))
    
    const churnedCustomerProducts = []
    
    for (const customer of customers || []) {
      const orders = customer.orders || []
      if (orders.length === 0) continue
      
      // Check if customer is churned (last order before churn threshold)
      const lastOrderDate = new Date(orders[orders.length - 1].created_at)
      if (lastOrderDate > churnThreshold) continue
      
      // Get all products from all orders, sorted by order date
      const allProducts = []
      for (const order of orders) {
        for (const item of order.order_items || []) {
          if (item.products) {
            allProducts.push({
              productTitle: item.products.name,
              productId: item.products.id,
              orderDate: new Date(order.created_at),
              quantity: item.quantity,
              price: item.price
            })
          }
        }
      }
      
      if (allProducts.length === 0) continue
      
      // Sort products by order date to get chronological order
      allProducts.sort((a, b) => a.orderDate.getTime() - b.orderDate.getTime())
      
      const firstProduct = allProducts[0]
      const lastProduct = allProducts[allProducts.length - 1]
      
      // Only include if first and last products are different
      if (firstProduct.productTitle !== lastProduct.productTitle) {
        churnedCustomerProducts.push({
          customerId: customer.id,
          customerName: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email,
          firstProduct: firstProduct.productTitle,
          lastProduct: lastProduct.productTitle,
          firstProductId: firstProduct.productId,
          lastProductId: lastProduct.productId,
          daysBetween: Math.floor((lastProduct.orderDate.getTime() - firstProduct.orderDate.getTime()) / (1000 * 60 * 60 * 24))
        })
      }
    }
    
    console.log('📈 Found churned customers with different first/last products:', churnedCustomerProducts.length)
    
    // Aggregate data by product combinations
    const productCombinations: { [key: string]: ChurnedCustomerProductData } = {}
    
    for (const customer of churnedCustomerProducts) {
      const key = `${customer.firstProduct} → ${customer.lastProduct}`
      if (!productCombinations[key]) {
        productCombinations[key] = {
          combination: key,
          firstProduct: customer.firstProduct,
          lastProduct: customer.lastProduct,
          count: 0,
          customers: []
        }
      }
      productCombinations[key].count++
      productCombinations[key].customers.push(customer.customerName)
    }
    
    // Convert to array and sort by count
    const result = Object.values(productCombinations)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15) // Top 15 combinations for better chart readability
    
    console.log('📊 Top product combinations for churned customers:', result.length)
    return result
    
  } catch (error) {
    console.error('Error in getChurnedCustomerProductData:', error)
    return []
  }
}