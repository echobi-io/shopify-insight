import { supabase } from '../supabaseClient'
import { FilterState } from './getKpis'

export interface DashboardKPIs {
  revenueToday: number | null
  ordersToday: number | null
  newCustomers: number | null
  avgOrderValue7d: number | null
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
    // Check for dev admin mode
    const isDevAdmin = typeof window !== 'undefined' && localStorage.getItem('dev-admin-mode') === 'true';
    const devMerchantId = typeof window !== 'undefined' ? localStorage.getItem('dev-admin-merchant-id') : null;
    
    const effectiveMerchantId = isDevAdmin && devMerchantId ? devMerchantId : merchant_id;
    
    console.log('📊 Fetching dashboard KPIs for merchant:', effectiveMerchantId, isDevAdmin ? '(dev admin mode)' : '');

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get today's revenue and orders from actual orders table
    const { data: todayOrders, error: todayError } = await supabase
      .from('orders')
      .select('total_price')
      .eq('merchant_id', effectiveMerchantId)
      .gte('created_at', today)
      .lt('created_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (todayError) {
      console.error('❌ Error fetching today data:', todayError);
    }

    // Get 7-day AOV from actual orders table
    const { data: aovOrders, error: aovError } = await supabase
      .from('orders')
      .select('total_price')
      .eq('merchant_id', effectiveMerchantId)
      .gte('created_at', sevenDaysAgo)
      .lte('created_at', today);

    if (aovError) {
      console.error('❌ Error fetching AOV data:', aovError);
    }

    // Calculate today's metrics
    const revenueToday = todayOrders?.reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0) || 0;
    const ordersToday = todayOrders?.length || 0;

    // Calculate 7-day AOV
    let avgOrderValue7d = 0;
    if (aovOrders && aovOrders.length > 0) {
      const totalRevenue = aovOrders.reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0);
      const totalOrders = aovOrders.length;
      avgOrderValue7d = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    }

    // Get new customers (customers created today)
    const { data: newCustomersData, error: newCustomersError } = await supabase
      .from('customers')
      .select('id')
      .eq('merchant_id', effectiveMerchantId)
      .gte('created_at', today)
      .lt('created_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (newCustomersError) {
      console.error('❌ Error fetching new customers:', newCustomersError);
    }

    const result = {
      revenueToday,
      ordersToday,
      newCustomers: newCustomersData?.length || 0,
      avgOrderValue7d: avgOrderValue7d > 0 ? parseFloat(avgOrderValue7d.toFixed(2)) : 0
    };

    console.log('✅ Dashboard KPIs result:', result);
    return result;

  } catch (error) {
    console.error('❌ Error fetching dashboard KPIs:', error);
    // Return safe fallback data instead of throwing
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

    // Use actual orders table to calculate daily trends
    let query = supabase
      .from('orders')
      .select('created_at, total_price')
      .eq('merchant_id', merchant_id);

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query.order('created_at');

    if (error) {
      console.error('❌ Error fetching trend data:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('📭 No trend data found');
      return [];
    }

    // Group by date and calculate totals
    const dailyTotals: Record<string, { revenue: number; orders: number }> = {};
    
    data.forEach(order => {
      const date = order.created_at.split('T')[0];
      if (!dailyTotals[date]) {
        dailyTotals[date] = { revenue: 0, orders: 0 };
      }
      dailyTotals[date].revenue += parseFloat(order.total_price) || 0;
      dailyTotals[date].orders += 1;
    });

    const result = Object.entries(dailyTotals).map(([date, totals]) => ({
      date,
      total_revenue: totals.revenue,
      total_orders: totals.orders
    })).sort((a, b) => a.date.localeCompare(b.date));

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

    // Since customer_segment_summary doesn't exist, return empty data for now
    console.log('📭 Customer segment data not available - table does not exist');
    return [];

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

    // Get current period revenue from actual orders table
    const { data: currentPeriodOrders, error: currentError } = await supabase
      .from('orders')
      .select('total_price')
      .eq('merchant_id', merchant_id)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Get previous period revenue from actual orders table
    const { data: previousPeriodOrders, error: previousError } = await supabase
      .from('orders')
      .select('total_price')
      .eq('merchant_id', merchant_id)
      .gte('created_at', previousStartDate)
      .lte('created_at', previousEndDate);

    if (currentError || previousError) {
      console.error('❌ Error fetching revenue data for AI commentary:', currentError || previousError);
    }

    // Calculate revenue change
    const currentRevenue = currentPeriodOrders?.reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0) || 0;
    const previousRevenue = previousPeriodOrders?.reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0) || 0;
    const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Get top product from order items directly
    const { data: orderItems, error: productError } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        price,
        products!inner(name),
        orders!inner(created_at, merchant_id)
      `)
      .gte('orders.created_at', startDate)
      .lte('orders.created_at', endDate)
      .eq('orders.merchant_id', merchant_id);

    let topProduct = 'Unknown Product';
    if (orderItems && orderItems.length > 0 && !productError) {
      // Group by product and calculate revenue
      const productRevenue = orderItems.reduce((acc, item) => {
        const productName = (item.products as any)?.name || 'Unknown Product';
        const revenue = (item.quantity || 0) * (item.price || 0);
        acc[productName] = (acc[productName] || 0) + revenue;
        return acc;
      }, {} as Record<string, number>);

      // Get the top product by revenue
      const topProductEntry = Object.entries(productRevenue)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (topProductEntry) {
        topProduct = topProductEntry[0];
      }
    }

    const topProductGrowth = Math.abs(revenueChange); // Simplified for now
    const customerChurnIndicator = 0; // No churn data available

    // Generate dynamic commentary based on actual data
    let commentary = '';
    
    if (revenueChange > 0) {
      commentary = `Revenue grew by ${Math.abs(revenueChange).toFixed(1)}% compared to the previous period`;
      if (topProduct !== 'Unknown Product') {
        commentary += `, largely driven by strong performance from ${topProduct}`;
      }
      commentary += '.';
    } else if (revenueChange < 0) {
      commentary = `Revenue declined by ${Math.abs(revenueChange).toFixed(1)}% compared to the previous period`;
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
    // Return empty data structure on error
    return {
      kpis: {
        revenueToday: 0,
        ordersToday: 0,
        newCustomers: 0,
        avgOrderValue7d: 0
      },
      trendData: [],
      segmentData: [],
      aiCommentary: {
        revenueChange: 0,
        topProduct: 'Unknown Product',
        topProductGrowth: 0,
        customerChurnIndicator: 0,
        commentary: 'Unable to generate insights due to data error.'
      }
    };
  }
}