import { executeQuery, fetchBatch, aggregateData, DataFetcherOptions, fetchWithRetry, DataFetcherResult } from '@/lib/utils/dataFetcher'
import { supabase } from '../supabaseClient'
import { getAllRows, isLikelyHittingLimit, getTruncationWarning } from '../utils/supabaseUtils'

export interface FilterState {
  startDate: string
  endDate: string
  segment?: string
  channel?: string
  product?: string
}

export interface KPIData {
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  percentOrdering: number
  newCustomers: number
  churnRisk: number
}

// Fallback data structure
const EMPTY_KPI_DATA: KPIData = {
  totalRevenue: 0,
  totalOrders: 0,
  avgOrderValue: 0,
  percentOrdering: 0,
  newCustomers: 0,
  churnRisk: 0
}

export async function getKPIsOptimized(
  filters: FilterState, 
  shopId?: string,
  options: DataFetcherOptions = {}
): Promise<DataFetcherResult<KPIData>> {
  return fetchWithRetry(async () => {
    console.log('🔍 Fetching optimized KPIs with filters:', filters, 'shop_id:', shopId)

    // First try materialized view with timeout and retry
    const materializedViewResult = await executeQuery<any[]>({
      table: 'daily_revenue_summary',
      select: '*',
      filters: {
        'gte_date': filters.startDate.split('T')[0],
        'lte_date': filters.endDate.split('T')[0]
      }
    }, shopId, {
      timeout: 10000,
      retries: 2,
      cacheKey: `kpis_mv_${shopId}_${filters.startDate}_${filters.endDate}`,
      cacheTTL: 180000, // 3 minutes
      fallbackData: null
    })

    if (materializedViewResult.success && materializedViewResult.data && materializedViewResult.data.length > 0) {
      console.log('✅ Using materialized view data')
      return calculateKPIsFromMaterializedView(materializedViewResult.data, shopId, filters)
    }

    console.log('⚠️ Materialized view failed or empty, falling back to direct queries')

    // Fallback to direct table queries using getAllRows to handle large datasets
    console.log('🔄 Falling back to direct orders table query')
    
    let ordersQuery = supabase
      .from('orders')
      .select('*')
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate)

    if (shopId) {
      ordersQuery = ordersQuery.eq('shop_id', shopId)
    }

    // Use getAllRows to handle datasets larger than 1000 rows
    const orders = await getAllRows(ordersQuery, 100000) // Allow up to 100k orders for KPIs
    
    console.log('📦 Direct orders query result:', { 
      count: orders?.length || 0,
      truncationWarning: getTruncationWarning(orders?.length || 0)
    })

    // Log warning if we might be hitting limits
    const warning = getTruncationWarning(orders?.length || 0)
    if (warning) {
      console.warn('⚠️', warning)
    }

    if (!orders || orders.length === 0) {
      console.log('📭 No orders found, returning zero values')
      return EMPTY_KPI_DATA
    }

    console.log(`📊 Processing ${orders.length} orders`)

    // Try to get new customers count
    let newCustomersCount = 0
    try {
      let newCustomersQuery = supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', filters.startDate)
        .lte('created_at', filters.endDate)
      if (shopId) {
        newCustomersQuery = newCustomersQuery.eq('shop_id', shopId)
      }
      const { count } = await newCustomersQuery
      newCustomersCount = count || 0
    } catch (newCustomerError) {
      console.log('⚠️ Could not fetch new customers count:', newCustomerError)
      // Estimate from orders with first-time customers
      const customerFirstOrders = new Map()
      orders.forEach(order => {
        if (order.customer_id) {
          if (!customerFirstOrders.has(order.customer_id)) {
            customerFirstOrders.set(order.customer_id, order.created_at)
          }
        }
      })
      newCustomersCount = customerFirstOrders.size
    }

    // Calculate basic metrics from orders
    const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0)
    const totalOrders = orders.length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const uniqueCustomers = new Set(orders.map(o => o.customer_id).filter(Boolean)).size

    // Get total customers count for percentage calculation
    let totalCustomersCount = 0
    try {
      let customersQuery = supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
      if (shopId) {
        customersQuery = customersQuery.eq('shop_id', shopId)
      }
      const { count } = await customersQuery
      totalCustomersCount = count || 0
    } catch (customerError) {
      console.log('⚠️ Could not fetch customers count:', customerError)
      // Try profiles table as fallback - this might not be shop-specific
      try {
        let profilesQuery = supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
        const { count } = await profilesQuery
        totalCustomersCount = count || 0
      } catch (profileError) {
        console.log('⚠️ Could not fetch profiles count either:', profileError)
      }
    }

    const percentOrdering = totalCustomersCount > 0 ? (uniqueCustomers / totalCustomersCount) * 100 : 0

    // Calculate basic churn risk (simplified approach)
    let churnRisk = 0
    try {
      const retentionResult = await executeQuery<any[]>({
        table: 'customer_retention_summary',
        select: 'calculated_segment, customers_count'
      }, shopId, {
        timeout: 5000,
        retries: 1,
        fallbackData: []
      })

      if (retentionResult.success && retentionResult.data) {
        const retentionData = retentionResult.data
        const atRiskCustomers = retentionData.find(r => r.calculated_segment === 'at_risk')?.customers_count || 0
        const totalCustomersInRetention = retentionData.reduce((sum, r) => sum + (r.customers_count || 0), 0) || 1
        churnRisk = (atRiskCustomers / totalCustomersInRetention) * 100
      }
    } catch (error) {
      console.log('⚠️ Could not fetch churn risk data:', error)
      churnRisk = 0
    }

    const result: KPIData = {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders,
      avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      percentOrdering: parseFloat(percentOrdering.toFixed(1)),
      newCustomers: newCustomersCount,
      churnRisk: parseFloat(churnRisk.toFixed(1))
    }

    console.log('✅ KPIs calculated from direct queries:', result)
    return result
  }, {
    fallbackData: EMPTY_KPI_DATA,
    ...options
  })
}

// Helper function to calculate KPIs from materialized view
function calculateKPIsFromMaterializedView(summaryData: any[], shopId?: string, filters?: FilterState): KPIData {
  const totalRevenue = summaryData.reduce((sum, row) => sum + (row.total_revenue || 0), 0)
  const totalOrders = summaryData.reduce((sum, row) => sum + (row.total_orders || 0), 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const uniqueCustomers = summaryData.reduce((sum, row) => sum + (row.unique_customers || 0), 0)

  return {
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalOrders,
    avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
    percentOrdering: 0, // Would need additional query for total customers
    newCustomers: 0, // Would need additional query for new customers
    churnRisk: 0 // Would need additional query for churn data
  }
}

// Get previous period KPIs for comparison
export async function getPreviousKPIsOptimized(
  filters: FilterState, 
  shopId?: string,
  options: DataFetcherOptions = {}
): Promise<DataFetcherResult<KPIData>> {
  try {
    // Calculate previous period dates
    const startDate = new Date(filters.startDate)
    const endDate = new Date(filters.endDate)
    const duration = endDate.getTime() - startDate.getTime()
    
    const previousEndDate = new Date(startDate.getTime() - 1) // Day before current period
    const previousStartDate = new Date(previousEndDate.getTime() - duration)

    const previousFilters: FilterState = {
      ...filters,
      startDate: previousStartDate.toISOString(),
      endDate: previousEndDate.toISOString()
    }

    return await getKPIsOptimized(previousFilters, shopId, {
      ...options,
      cacheKey: options.cacheKey ? `${options.cacheKey}_previous` : undefined
    })
  } catch (error) {
    console.error('❌ Error fetching previous KPIs:', error)
    return {
      data: EMPTY_KPI_DATA,
      error: error instanceof Error ? error : new Error(String(error)),
      loading: false,
      success: false
    }
  }
}

// Get previous year KPIs for year-over-year comparison
export async function getPreviousYearKPIsOptimized(
  filters: FilterState, 
  shopId?: string,
  options: DataFetcherOptions = {}
): Promise<DataFetcherResult<KPIData>> {
  try {
    // Calculate previous year dates
    const startDate = new Date(filters.startDate)
    const endDate = new Date(filters.endDate)
    
    // Subtract one year from both dates
    const previousYearStartDate = new Date(startDate)
    previousYearStartDate.setFullYear(startDate.getFullYear() - 1)
    
    const previousYearEndDate = new Date(endDate)
    previousYearEndDate.setFullYear(endDate.getFullYear() - 1)

    const previousYearFilters: FilterState = {
      ...filters,
      startDate: previousYearStartDate.toISOString(),
      endDate: previousYearEndDate.toISOString()
    }

    console.log('🔍 Fetching previous year KPIs:', {
      current: { start: filters.startDate, end: filters.endDate },
      previousYear: { start: previousYearFilters.startDate, end: previousYearFilters.endDate }
    })

    return await getKPIsOptimized(previousYearFilters, shopId, {
      ...options,
      cacheKey: options.cacheKey ? `${options.cacheKey}_previous_year` : undefined
    })
  } catch (error) {
    console.error('❌ Error fetching previous year KPIs:', error)
    return {
      data: EMPTY_KPI_DATA,
      error: error instanceof Error ? error : new Error(String(error)),
      loading: false,
      success: false
    }
  }
}

// Calculate KPI changes and trends
export function calculateKPIChanges(current: KPIData, previous: KPIData) {
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  return {
    totalRevenue: {
      current: current.totalRevenue,
      previous: previous.totalRevenue,
      change: calculateChange(current.totalRevenue, previous.totalRevenue),
      trend: current.totalRevenue >= previous.totalRevenue ? 'up' : 'down'
    },
    totalOrders: {
      current: current.totalOrders,
      previous: previous.totalOrders,
      change: calculateChange(current.totalOrders, previous.totalOrders),
      trend: current.totalOrders >= previous.totalOrders ? 'up' : 'down'
    },
    avgOrderValue: {
      current: current.avgOrderValue,
      previous: previous.avgOrderValue,
      change: calculateChange(current.avgOrderValue, previous.avgOrderValue),
      trend: current.avgOrderValue >= previous.avgOrderValue ? 'up' : 'down'
    },
    percentOrdering: {
      current: current.percentOrdering,
      previous: previous.percentOrdering,
      change: calculateChange(current.percentOrdering, previous.percentOrdering),
      trend: current.percentOrdering >= previous.percentOrdering ? 'up' : 'down'
    },
    newCustomers: {
      current: current.newCustomers,
      previous: previous.newCustomers,
      change: calculateChange(current.newCustomers, previous.newCustomers),
      trend: current.newCustomers >= previous.newCustomers ? 'up' : 'down'
    },
    churnRisk: {
      current: current.churnRisk,
      previous: previous.churnRisk,
      change: calculateChange(current.churnRisk, previous.churnRisk),
      trend: current.churnRisk <= previous.churnRisk ? 'up' : 'down' // Lower churn is better
    }
  }
}