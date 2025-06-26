import { supabase } from '../supabaseClient'
import { FilterState } from './getKpis'

export interface DashboardKPIs {
  revenueToday: number
  ordersToday: number
  newCustomers: number
  avgOrderValue7d: number
}

export interface DashboardTrendData {
  date: string
  total_revenue: number
  total_orders: number
}

export interface CustomerSegmentData {
  customer_segment: string
  orders_count: number
  percentage: number
}

export interface AICommentaryData {
  revenueChange: number
  topProduct: string
  topProductGrowth: number
  customerChurnIndicator: number
  commentary: string
}

export async function getDashboardKPIs(merchant_id: string): Promise<DashboardKPIs> {
  try {
    console.log('📊 Fetching dashboard KPIs for merchant:', merchant_id);

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get today's revenue and orders
    const { data: todayData, error: todayError } = await supabase
      .from('daily_revenue_summary')
      .select('total_orders, total_revenue')
      .eq('merchant_id', merchant_id)
      .eq('date', today)
      .single();

    if (todayError && todayError.code !== 'PGRST116') {
      console.error('❌ Error fetching today data:', todayError);
    }

    // Get 7-day AOV
    const { data: aovData, error: aovError } = await supabase
      .from('daily_revenue_summary')
      .select('total_orders, total_revenue')
      .eq('merchant_id', merchant_id)
      .gte('date', sevenDaysAgo)
      .lte('date', today);

    if (aovError) {
      console.error('❌ Error fetching AOV data:', aovError);
    }

    // Calculate 7-day AOV
    let avgOrderValue7d = 0;
    if (aovData && aovData.length > 0) {
      const totalRevenue = aovData.reduce((sum, row) => sum + (row.total_revenue || 0), 0);
      const totalOrders = aovData.reduce((sum, row) => sum + (row.total_orders || 0), 0);
      avgOrderValue7d = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    }

    // Get new customers (customers with only 1 lifetime order)
    const { data: newCustomersData, error: newCustomersError } = await supabase
      .from('customer_retention_summary')
      .select('customers_count')
      .eq('merchant_id', merchant_id)
      .eq('calculated_segment', 'new')
      .single();

    if (newCustomersError && newCustomersError.code !== 'PGRST116') {
      console.error('❌ Error fetching new customers:', newCustomersError);
    }

    const result = {
      revenueToday: todayData?.total_revenue || 0,
      ordersToday: todayData?.total_orders || 0,
      newCustomers: newCustomersData?.customers_count || 0,
      avgOrderValue7d: parseFloat(avgOrderValue7d.toFixed(2))
    };

    console.log('✅ Dashboard KPIs result:', result);
    
    // Check if we have any meaningful data
    const hasData = result.revenueToday > 0 || result.ordersToday > 0 || result.newCustomers > 0 || result.avgOrderValue7d > 0;
    
    if (!hasData) {
      console.log('⚠️ No real data found, but returning zeros for "Not enough data yet" display');
    }
    
    return result;

  } catch (error) {
    console.error('❌ Error fetching dashboard KPIs:', error);
    return {
      revenueToday: 0,
      ordersToday: 0,
      newCustomers: 0,
      avgOrderValue7d: 0
    };
  }
}

export async function getDashboardTrendData(merchant_id: string, filters?: FilterState): Promise<DashboardTrendData[]> {
  try {
    console.log('📈 Fetching dashboard trend data for merchant:', merchant_id, 'with filters:', filters);

    let query = supabase
      .from('daily_revenue_summary')
      .select('date, total_orders, total_revenue')
      .eq('merchant_id', merchant_id);

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }

    const { data, error } = await query.order('date');

    if (error) {
      console.error('❌ Error fetching trend data:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('📭 No trend data found');
      return [];
    }

    const result = data.map(row => ({
      date: row.date,
      total_revenue: row.total_revenue || 0,
      total_orders: row.total_orders || 0
    }));

    console.log('✅ Dashboard trend data result:', { count: result.length });
    return result;

  } catch (error) {
    console.error('❌ Error fetching dashboard trend data:', error);
    return [];
  }
}

export async function getCustomerSegmentBreakdown(merchant_id: string, filters?: FilterState): Promise<CustomerSegmentData[]> {
  try {
    console.log('👥 Fetching customer segment breakdown for merchant:', merchant_id, 'with filters:', filters);

    let query = supabase
      .from('customer_segment_summary')
      .select('customer_segment, orders_count')
      .eq('merchant_id', merchant_id);

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching segment data:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('📭 No segment data found');
      return [];
    }

    // Group by segment and sum orders
    const segmentTotals = data.reduce((acc, row) => {
      const segment = row.customer_segment;
      if (!acc[segment]) {
        acc[segment] = 0;
      }
      acc[segment] += row.orders_count || 0;
      return acc;
    }, {} as Record<string, number>);

    const totalOrders = Object.values(segmentTotals).reduce((sum, count) => sum + count, 0);

    const result = Object.entries(segmentTotals).map(([segment, orders_count]) => ({
      customer_segment: segment,
      orders_count,
      percentage: totalOrders > 0 ? parseFloat(((orders_count / totalOrders) * 100).toFixed(1)) : 0
    }));

    console.log('✅ Customer segment breakdown result:', result);
    return result;

  } catch (error) {
    console.error('❌ Error fetching customer segment breakdown:', error);
    return [];
  }
}

export async function generateAICommentary(merchant_id: string, filters?: FilterState): Promise<AICommentaryData> {
  try {
    console.log('🤖 Generating AI commentary for merchant:', merchant_id, 'with filters:', filters);

    // Use filters if provided, otherwise default to last 30 days for comparison
    const endDate = filters?.endDate || new Date().toISOString().split('T')[0];
    const startDate = filters?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Calculate previous period for comparison
    const periodLength = new Date(endDate).getTime() - new Date(startDate).getTime();
    const previousEndDate = new Date(new Date(startDate).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const previousStartDate = new Date(new Date(startDate).getTime() - periodLength).toISOString().split('T')[0];

    // Get current period revenue
    const { data: currentPeriodData, error: currentError } = await supabase
      .from('daily_revenue_summary')
      .select('total_revenue')
      .eq('merchant_id', merchant_id)
      .gte('date', startDate)
      .lte('date', endDate);

    // Get previous period revenue
    const { data: previousPeriodData, error: previousError } = await supabase
      .from('daily_revenue_summary')
      .select('total_revenue')
      .eq('merchant_id', merchant_id)
      .gte('date', previousStartDate)
      .lte('date', previousEndDate);

    if (currentError || previousError) {
      console.error('❌ Error fetching revenue data for AI commentary:', currentError || previousError);
    }

    // Calculate revenue change
    const currentRevenue = currentPeriodData?.reduce((sum, row) => sum + (row.total_revenue || 0), 0) || 0;
    const previousRevenue = previousPeriodData?.reduce((sum, row) => sum + (row.total_revenue || 0), 0) || 0;
    const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Get top product for the selected period
    let productQuery = supabase
      .from('product_performance_summary')
      .select('product_name, total_revenue')
      .eq('merchant_id', merchant_id)
      .order('total_revenue', { ascending: false })
      .limit(1);

    if (filters?.startDate) {
      productQuery = productQuery.gte('order_date', filters.startDate);
    }
    if (filters?.endDate) {
      productQuery = productQuery.lte('order_date', filters.endDate);
    }

    const { data: topProductData, error: productError } = await productQuery.single();

    if (productError && productError.code !== 'PGRST116') {
      console.error('❌ Error fetching top product:', productError);
    }

    // Get churn indicator
    const { data: churnData, error: churnError } = await supabase
      .from('customer_retention_summary')
      .select('customers_count')
      .eq('merchant_id', merchant_id)
      .eq('calculated_segment', 'at_risk')
      .single();

    if (churnError && churnError.code !== 'PGRST116') {
      console.error('❌ Error fetching churn data:', churnError);
    }

    const topProduct = topProductData?.product_name || 'Unknown Product';
    const topProductGrowth = Math.abs(revenueChange); // Simplified for now
    const customerChurnIndicator = churnData?.customers_count || 0;

    // Generate dynamic commentary based on actual data
    let commentary = '';
    
    if (revenueChange > 0) {
      commentary = `Revenue grew by ${Math.abs(revenueChange).toFixed(1)}% compared to the previous period`;
      if (topProduct !== 'Unknown Product') {
        commentary += `, largely driven by strong performance from ${topProduct}`;
      }
      if (customerChurnIndicator > 0) {
        commentary += `. However, ${customerChurnIndicator} customers are at risk of churning`;
      }
      commentary += '.';
    } else if (revenueChange < 0) {
      commentary = `Revenue declined by ${Math.abs(revenueChange).toFixed(1)}% compared to the previous period`;
      if (customerChurnIndicator > 0) {
        commentary += `, with ${customerChurnIndicator} customers at risk of churning`;
      }
      commentary += '. Focus on customer retention strategies.';
    } else {
      commentary = 'Revenue remained stable compared to the previous period';
      if (topProduct !== 'Unknown Product') {
        commentary += `, with ${topProduct} being your top performer`;
      }
      commentary += '.';
    }

    const result = {
      revenueChange: parseFloat(revenueChange.toFixed(1)),
      topProduct,
      topProductGrowth: parseFloat(topProductGrowth.toFixed(1)),
      customerChurnIndicator,
      commentary
    };

    console.log('✅ AI commentary result:', result);
    return result;

  } catch (error) {
    console.error('❌ Error generating AI commentary:', error);
    return {
      revenueChange: 0,
      topProduct: 'Unknown Product',
      topProductGrowth: 0,
      customerChurnIndicator: 0,
      commentary: 'Not enough data yet to generate insights.'
    };
  }
}

export async function getAllDashboardData(merchant_id: string, filters?: FilterState) {
  try {
    console.log('🔄 Fetching all dashboard data for merchant:', merchant_id, 'with filters:', filters);

    const [kpis, trendData, segmentData, aiCommentary] = await Promise.all([
      getDashboardKPIs(merchant_id),
      getDashboardTrendData(merchant_id, filters),
      getCustomerSegmentBreakdown(merchant_id, filters),
      generateAICommentary(merchant_id, filters)
    ]);

    return {
      kpis,
      trendData,
      segmentData,
      aiCommentary
    };

  } catch (error) {
    console.error('❌ Error fetching all dashboard data:', error);
    throw error;
  }
}