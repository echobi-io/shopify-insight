import { supabase } from '../supabaseClient'

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

export async function getKPIs(filters: FilterState, merchant_id?: string): Promise<KPIData> {
  try {
    // Use materialized view for better performance
    let summaryQuery = supabase
      .from('daily_revenue_summary')
      .select('*')
      .gte('date', filters.startDate.split('T')[0])
      .lte('date', filters.endDate.split('T')[0]);

    // Apply filters
    if (merchant_id) {
      summaryQuery = summaryQuery.eq('merchant_id', merchant_id);
    }
    if (filters.segment && filters.segment !== 'all') {
      summaryQuery = summaryQuery.eq('customer_segment', filters.segment);
    }
    if (filters.channel && filters.channel !== 'all') {
      summaryQuery = summaryQuery.eq('channel', filters.channel);
    }

    const { data: summaryData, error: summaryError } = await summaryQuery;

    if (summaryError) {
      console.error('Error fetching summary data:', summaryError);
      throw summaryError;
    }

    // Aggregate the summary data
    const totalRevenue = summaryData?.reduce((sum, row) => sum + (row.total_revenue || 0), 0) || 0;
    const totalOrders = summaryData?.reduce((sum, row) => sum + (row.total_orders || 0), 0) || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const uniqueCustomers = summaryData?.reduce((sum, row) => sum + (row.unique_customers || 0), 0) || 0;

    // Get total customers count for percentage calculation
    let customersQuery = supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    if (merchant_id) {
      customersQuery = customersQuery.eq('merchant_id', merchant_id);
    }
    const { count: totalCustomersCount } = await customersQuery;

    const percentOrdering = totalCustomersCount ? (uniqueCustomers / totalCustomersCount) * 100 : 0;

    // Get new customers count
    let newCustomersQuery = supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate);
    if (merchant_id) {
      newCustomersQuery = newCustomersQuery.eq('merchant_id', merchant_id);
    }
    const { count: newCustomersCount } = await newCustomersQuery;

    // Use customer retention summary for churn risk calculation
    let retentionQuery = supabase
      .from('customer_retention_summary')
      .select('*');
    if (merchant_id) {
      retentionQuery = retentionQuery.eq('merchant_id', merchant_id);
    }
    const { data: retentionData, error: retentionError } = await retentionQuery;

    if (retentionError) {
      console.error('Error fetching retention data:', retentionError);
    }

    // Calculate churn risk from retention data
    const atRiskCustomers = retentionData?.find(r => r.calculated_segment === 'at_risk')?.customers_count || 0;
    const totalCustomersInRetention = retentionData?.reduce((sum, r) => sum + (r.customers_count || 0), 0) || 1;
    const churnRisk = (atRiskCustomers / totalCustomersInRetention) * 100;

    return {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders,
      avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      percentOrdering: parseFloat(percentOrdering.toFixed(1)),
      newCustomers: newCustomersCount || 0,
      churnRisk: parseFloat(churnRisk.toFixed(1))
    };
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    // Return default values on error to prevent crashes
    return {
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      percentOrdering: 0,
      newCustomers: 0,
      churnRisk: 0
    };
  }
}

// Get previous period KPIs for comparison
export async function getPreviousKPIs(filters: FilterState): Promise<KPIData> {
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

    return await getKPIs(previousFilters)
  } catch (error) {
    console.error('Error fetching previous KPIs:', error)
    return {
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      percentOrdering: 0,
      newCustomers: 0,
      churnRisk: 0
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