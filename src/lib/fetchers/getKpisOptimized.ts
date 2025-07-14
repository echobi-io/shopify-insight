import { executeQuery, fetchBatch, aggregateData, DataFetcherOptions } from '@/lib/utils/dataFetcher'

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
  merchantId?: string,
  options: DataFetcherOptions = {}
): Promise<KPIData> {
  console.log('🔍 Fetching optimized KPIs with filters:', filters, 'merchant_id:', merchantId)

  try {
    // First try materialized view with timeout and retry
    const materializedViewResult = await executeQuery<any[]>({
      table: 'daily_revenue_summary',
      select: '*',
      filters: {
        'gte_date': filters.startDate.split('T')[0],
        'lte_date': filters.endDate.split('T')[0]
      }
    }, merchantId, {
      timeout: 10000,
      retries: 2,
      cacheKey: `kpis_mv_${merchantId}_${filters.startDate}_${filters.endDate}`,
      cacheTTL: 180000, // 3 minutes
      fallbackData: null,
      ...options
    })

    if (materializedViewResult.success && materializedViewResult.data && materializedViewResult.data.length > 0) {
      console.log('✅ Using materialized view data')
      return calculateKPIsFromMaterializedView(materializedViewResult.data, merchantId, filters)
    }

    console.log('⚠️ Materialized view failed or empty, falling back to direct queries')

    // Fallback to direct table queries with batch processing
    const batchQueries = {
      orders: () => executeQuery<any[]>({
        table: 'orders',
        select: 'id, customer_id, total_price, created_at',
        filters: {
          'gte_created_at': filters.startDate,
          'lte_created_at': filters.endDate
        },
        limit: 5000 // Reasonable limit to prevent timeout
      }, merchantId, {
        timeout: 15000,
        retries: 2,
        fallbackData: []
      }),

      customers: () => executeQuery<any[]>({
        table: 'customers',
        select: 'id, created_at',
        filters: {
          'gte_created_at': filters.startDate,
          'lte_created_at': filters.endDate
        },
        limit: 2000
      }, merchantId, {
        timeout: 10000,
        retries: 2,
        fallbackData: []
      }),

      totalCustomers: () => executeQuery<any[]>({
        table: 'customers',
        select: 'id',
        limit: 1
      }, merchantId, {
        timeout: 5000,
        retries: 1,
        fallbackData: []
      })
    }

    const batchResults = await fetchBatch(batchQueries)

    const ordersResult = batchResults.orders
    const customersResult = batchResults.customers
    const totalCustomersResult = batchResults.totalCustomers

    if (!ordersResult.success) {
      console.error('❌ Orders query failed:', ordersResult.error?.message)
      return EMPTY_KPI_DATA
    }

    const orders = ordersResult.data || []
    const newCustomers = customersResult.data || []

    console.log(`📊 Processing ${orders.length} orders and ${newCustomers.length} new customers`)

    // Calculate basic metrics from orders
    const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0)
    const totalOrders = orders.length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const uniqueCustomers = new Set(orders.map(o => o.customer_id).filter(Boolean)).size

    // Get total customers count for percentage calculation
    let totalCustomersCount = 0
    if (totalCustomersResult.success) {
      // Use count query for better performance
      const countResult = await executeQuery<any>({
        table: 'customers',
        select: '*'
      }, merchantId, {
        timeout: 5000,
        retries: 1,
        fallbackData: null
      })

      if (countResult.success && countResult.data) {
        totalCustomersCount = Array.isArray(countResult.data) ? countResult.data.length : 1
      }
    }

    const percentOrdering = totalCustomersCount > 0 ? (uniqueCustomers / totalCustomersCount) * 100 : 0
    const newCustomersCount = newCustomers.length

    // Calculate basic churn risk (simplified approach)
    let churnRisk = 0
    try {
      const retentionResult = await executeQuery<any[]>({
        table: 'customer_retention_summary',
        select: 'calculated_segment, customers_count'
      }, merchantId, {
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

  } catch (error) {
    console.error('❌ Error fetching optimized KPIs:', error)
    return EMPTY_KPI_DATA
  }
}

// Helper function to calculate KPIs from materialized view
function calculateKPIsFromMaterializedView(summaryData: any[], merchantId?: string, filters?: FilterState): KPIData {
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
  merchantId?: string,
  options: DataFetcherOptions = {}
): Promise<KPIData> {
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

    return await getKPIsOptimized(previousFilters, merchantId, {
      ...options,
      cacheKey: options.cacheKey ? `${options.cacheKey}_previous` : undefined
    })
  } catch (error) {
    console.error('❌ Error fetching previous KPIs:', error)
    return EMPTY_KPI_DATA
  }
}

// Get previous year KPIs for year-over-year comparison
export async function getPreviousYearKPIsOptimized(
  filters: FilterState, 
  merchantId?: string,
  options: DataFetcherOptions = {}
): Promise<KPIData> {
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

    return await getKPIsOptimized(previousYearFilters, merchantId, {
      ...options,
      cacheKey: options.cacheKey ? `${options.cacheKey}_previous_year` : undefined
    })
  } catch (error) {
    console.error('❌ Error fetching previous year KPIs:', error)
    return EMPTY_KPI_DATA
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