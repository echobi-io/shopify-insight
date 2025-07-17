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

export async function getKPIs(filters: FilterState, merchant_id?: string): Promise<KPIData> {
  try {
    console.log('🔍 Fetching KPIs with filters:', filters, 'merchant_id:', merchant_id);

    // Try materialized view first, fallback to direct table queries
    let summaryData = null;
    let summaryError = null;

    try {
      let summaryQuery = supabase
        .from('daily_revenue_summary')
        .select('*')
        .gte('date', filters.startDate.split('T')[0])
        .lte('date', filters.endDate.split('T')[0]);

      if (merchant_id) {
        summaryQuery = summaryQuery.eq('merchant_id', merchant_id);
      }

      const result = await summaryQuery;
      summaryData = result.data;
      summaryError = result.error;
      
      console.log('📊 Materialized view query result:', { 
        success: !summaryError, 
        count: summaryData?.length || 0,
        error: summaryError?.message 
      });
    } catch (mvError) {
      console.log('⚠️ Materialized view not available, falling back to direct queries');
      summaryError = mvError;
    }

    // If materialized view fails, query orders table directly
    if (summaryError || !summaryData || summaryData.length === 0) {
      console.log('🔄 Falling back to direct orders table query');
      
      let ordersQuery = supabase
        .from('orders')
        .select('*')
        .gte('created_at', filters.startDate)
        .lte('created_at', filters.endDate);

      if (merchant_id) {
        ordersQuery = ordersQuery.eq('merchant_id', merchant_id);
      }

      // Use getAllRows to handle datasets larger than 1000 rows
      const orders = await getAllRows(ordersQuery, 100000); // Allow up to 100k orders for KPIs
      
      console.log('📦 Direct orders query result:', { 
        count: orders?.length || 0,
        truncationWarning: getTruncationWarning(orders?.length || 0)
      });

      // Log warning if we might be hitting limits
      const warning = getTruncationWarning(orders?.length || 0)
      if (warning) {
        console.warn('⚠️', warning)
      }

      if (!orders || orders.length === 0) {
        console.log('📭 No orders found, returning zero values');
        return {
          totalRevenue: 0,
          totalOrders: 0,
          avgOrderValue: 0,
          percentOrdering: 0,
          newCustomers: 0,
          churnRisk: 0
        };
      }

      // Calculate metrics from orders
      const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0);
      const totalOrders = orders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const uniqueCustomers = new Set(orders.map(o => o.customer_id).filter(Boolean)).size;

      console.log('📈 Calculated metrics from orders:', {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        uniqueCustomers
      });

      // Try to get total customers count
      let totalCustomersCount = 0;
      try {
        let customersQuery = supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });
        if (merchant_id) {
          customersQuery = customersQuery.eq('merchant_id', merchant_id);
        }
        const { count } = await customersQuery;
        totalCustomersCount = count || 0;
      } catch (customerError) {
        console.log('⚠️ Could not fetch customers count:', customerError);
        // Try profiles table as fallback
        try {
          let profilesQuery = supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
          const { count } = await profilesQuery;
          totalCustomersCount = count || 0;
        } catch (profileError) {
          console.log('⚠️ Could not fetch profiles count either:', profileError);
        }
      }

      const percentOrdering = totalCustomersCount > 0 ? (uniqueCustomers / totalCustomersCount) * 100 : 0;

      // Try to get new customers count
      let newCustomersCount = 0;
      try {
        let newCustomersQuery = supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', filters.startDate)
          .lte('created_at', filters.endDate);
        if (merchant_id) {
          newCustomersQuery = newCustomersQuery.eq('merchant_id', merchant_id);
        }
        const { count } = await newCustomersQuery;
        newCustomersCount = count || 0;
      } catch (newCustomerError) {
        console.log('⚠️ Could not fetch new customers count:', newCustomerError);
        // Estimate from orders with first-time customers
        const customerFirstOrders = new Map();
        orders.forEach(order => {
          if (order.customer_id) {
            if (!customerFirstOrders.has(order.customer_id)) {
              customerFirstOrders.set(order.customer_id, order.created_at);
            }
          }
        });
        newCustomersCount = customerFirstOrders.size;
      }

      // Calculate basic churn risk (simplified)
      const churnRisk = 0; // No fallback data - return 0 if no real data

      return {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalOrders,
        avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
        percentOrdering: parseFloat(percentOrdering.toFixed(1)),
        newCustomers: newCustomersCount,
        churnRisk: parseFloat(churnRisk.toFixed(1))
      };
    }

    // Use materialized view data
    const totalRevenue = summaryData.reduce((sum, row) => sum + (row.total_revenue || 0), 0);
    const totalOrders = summaryData.reduce((sum, row) => sum + (row.total_orders || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const uniqueCustomers = summaryData.reduce((sum, row) => sum + (row.unique_customers || 0), 0);

    console.log('📊 Calculated metrics from materialized view:', {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      uniqueCustomers
    });

    // Get additional metrics with fallbacks
    let totalCustomersCount = 0;
    let newCustomersCount = 0;
    let churnRisk = 0;

    try {
      // Total customers
      let customersQuery = supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      if (merchant_id) {
        customersQuery = customersQuery.eq('merchant_id', merchant_id);
      }
      const { count } = await customersQuery;
      totalCustomersCount = count || 0;
    } catch (error) {
      console.log('⚠️ Could not fetch total customers:', error);
    }

    try {
      // New customers
      let newCustomersQuery = supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', filters.startDate)
        .lte('created_at', filters.endDate);
      if (merchant_id) {
        newCustomersQuery = newCustomersQuery.eq('merchant_id', merchant_id);
      }
      const { count } = await newCustomersQuery;
      newCustomersCount = count || 0;
    } catch (error) {
      console.log('⚠️ Could not fetch new customers:', error);
    }

    try {
      // Churn risk from retention summary
      let retentionQuery = supabase
        .from('customer_retention_summary')
        .select('*');
      if (merchant_id) {
        retentionQuery = retentionQuery.eq('merchant_id', merchant_id);
      }
      const { data: retentionData } = await retentionQuery;

      const atRiskCustomers = retentionData?.find(r => r.calculated_segment === 'at_risk')?.customers_count || 0;
      const totalCustomersInRetention = retentionData?.reduce((sum, r) => sum + (r.customers_count || 0), 0) || 1;
      churnRisk = (atRiskCustomers / totalCustomersInRetention) * 100;
    } catch (error) {
      console.log('⚠️ Could not fetch churn risk:', error);
      churnRisk = 0; // No fallback data - return 0 if no real data
    }

    const percentOrdering = totalCustomersCount > 0 ? (uniqueCustomers / totalCustomersCount) * 100 : 0;

    const result = {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders,
      avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      percentOrdering: parseFloat(percentOrdering.toFixed(1)),
      newCustomers: newCustomersCount,
      churnRisk: parseFloat(churnRisk.toFixed(1))
    };

    console.log('✅ Final KPI result:', result);
    return result;

  } catch (error) {
    console.error('❌ Error fetching KPIs:', error);
    throw error; // Don't return fallback data, let the error bubble up
  }
}

// Get previous period KPIs for comparison
export async function getPreviousKPIs(filters: FilterState, merchant_id?: string): Promise<KPIData> {
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

    return await getKPIs(previousFilters, merchant_id)
  } catch (error) {
    console.error('Error fetching previous KPIs:', error)
    throw error; // Don't return fallback data, let the error bubble up
  }
}

// Get previous year KPIs for year-over-year comparison
export async function getPreviousYearKPIs(filters: FilterState, merchant_id?: string): Promise<KPIData> {
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

    return await getKPIs(previousYearFilters, merchant_id)
  } catch (error) {
    console.error('Error fetching previous year KPIs:', error)
    throw error; // Don't return fallback data, let the error bubble up
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