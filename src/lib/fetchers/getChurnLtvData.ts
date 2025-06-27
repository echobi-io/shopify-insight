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

export async function getChurnLtvData(): Promise<ChurnLtvData> {
  try {
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
      throw churnError
    }

    // Get LTV predictions
    const { data: ltvData, error: ltvError } = await supabase
      .from('ltv_predictions')
      .select('*')
      .eq('merchant_id', MERCHANT_ID)
      .order('predicted_ltv', { ascending: false })

    if (ltvError) {
      console.error('Error fetching LTV predictions:', ltvError)
      throw ltvError
    }

    // Calculate KPIs
    const customersAtHighRisk = churnData?.filter(c => c.churn_band === 'High').length || 0
    const revenueAtRisk = churnData?.reduce((sum, c) => {
      return sum + (c.churn_band === 'High' || c.churn_band === 'Medium' ? c.revenue_at_risk : 0)
    }, 0) || 0
    const averageLtv = ltvData?.length ? ltvData.reduce((sum, l) => sum + l.predicted_ltv, 0) / ltvData.length : 0
    const lifetimeValuePotential = ltvData?.reduce((sum, l) => sum + l.predicted_ltv, 0) || 0

    // Generate churn trend data (last 30 days)
    const churnTrendData = await generateChurnTrendData()

    // Generate LTV distribution
    const ltvDistribution = generateLtvDistribution(ltvData || [])

    return {
      kpis: {
        customersAtHighRisk,
        revenueAtRisk,
        averageLtv,
        lifetimeValuePotential
      },
      churnPredictions: churnData || [],
      ltvPredictions: ltvData || [],
      churnTrendData,
      ltvDistribution
    }
  } catch (error) {
    console.error('Error in getChurnLtvData:', error)
    throw error
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