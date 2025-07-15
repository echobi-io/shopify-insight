import { supabase } from '@/lib/supabaseClient';
import { DataFetcherResult } from '@/lib/utils/dataFetcher';

interface DetailedKPIData {
  revenueTimeSeries?: Array<{ date: string; value: number }>;
  ordersTimeSeries?: Array<{ date: string; value: number }>;
  aovTimeSeries?: Array<{ date: string; value: number }>;
  conversionTimeSeries?: Array<{ date: string; value: number }>;
  topRevenueProducts?: Array<{ name: string; value: number; percentage: number; trend: 'up' | 'down' | 'stable' }>;
  topOrderSources?: Array<{ name: string; value: number; percentage: number; trend: 'up' | 'down' | 'stable' }>;
  highValueProducts?: Array<{ name: string; value: number; percentage: number; trend: 'up' | 'down' | 'stable' }>;
  topConvertingPages?: Array<{ name: string; value: number; percentage: number; trend: 'up' | 'down' | 'stable' }>;
}

export async function getDetailedKPIData(
  kpiType: string,
  dateRange: { startDate: string; endDate: string }
): Promise<DataFetcherResult<DetailedKPIData>> {
  try {
    const { startDate, endDate } = dateRange;
    
    switch (kpiType.toLowerCase()) {
      case 'total revenue':
        return await getRevenueDetailedData(startDate, endDate);
      case 'total orders':
        return await getOrdersDetailedData(startDate, endDate);
      case 'average order value':
        return await getAOVDetailedData(startDate, endDate);
      case 'conversion rate':
        return await getConversionDetailedData(startDate, endDate);
      default:
        return {
          data: {},
          error: null,
          lastFetched: new Date().toISOString()
        };
    }
  } catch (error) {
    console.error('Error fetching detailed KPI data:', error);
    return {
      data: {},
      error: error instanceof Error ? error.message : 'Unknown error',
      lastFetched: new Date().toISOString()
    };
  }
}

async function getRevenueDetailedData(startDate: string, endDate: string): Promise<DataFetcherResult<DetailedKPIData>> {
  try {
    // Get daily revenue time series using correct column names
    const { data: revenueData, error: revenueError } = await supabase
      .from('orders')
      .select('created_at, total_price')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at');

    if (revenueError) throw revenueError;

    // Process revenue time series
    const revenueByDate = revenueData?.reduce((acc: Record<string, number>, order) => {
      const date = order.created_at.split('T')[0];
      acc[date] = (acc[date] || 0) + (parseFloat(order.total_price) || 0);
      return acc;
    }, {}) || {};

    const revenueTimeSeries = Object.entries(revenueByDate).map(([date, value]) => ({
      date,
      value: Number(value)
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Get top revenue products using correct joins
    const { data: productData, error: productError } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        price,
        products!inner(name),
        orders!inner(created_at)
      `)
      .gte('orders.created_at', startDate)
      .lte('orders.created_at', endDate);

    if (productError) throw productError;

    const productRevenue = productData?.reduce((acc: Record<string, { name: string; value: number }>, item) => {
      const productId = item.product_id;
      const revenue = (item.quantity || 0) * (parseFloat(item.price) || 0);
      
      if (!acc[productId]) {
        acc[productId] = {
          name: item.products?.name || 'Unknown Product',
          value: 0
        };
      }
      acc[productId].value += revenue;
      return acc;
    }, {}) || {};

    const totalRevenue = Object.values(productRevenue).reduce((sum, product) => sum + product.value, 0);
    const topRevenueProducts = Object.values(productRevenue)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .map(product => ({
        name: product.name,
        value: product.value,
        percentage: totalRevenue > 0 ? (product.value / totalRevenue) * 100 : 0,
        trend: 'stable' as const // Would need historical data to determine actual trend
      }));

    return {
      data: {
        revenueTimeSeries,
        topRevenueProducts
      },
      error: null,
      lastFetched: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching revenue detailed data:', error);
    return {
      data: {},
      error: error instanceof Error ? error.message : 'Unknown error',
      lastFetched: new Date().toISOString()
    };
  }
}

async function getOrdersDetailedData(startDate: string, endDate: string): Promise<DataFetcherResult<DetailedKPIData>> {
  try {
    // Get daily orders time series
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('created_at, customer_id')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at');

    if (ordersError) throw ordersError;

    // Process orders time series
    const ordersByDate = ordersData?.reduce((acc: Record<string, number>, order) => {
      const date = order.created_at.split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {}) || {};

    const ordersTimeSeries = Object.entries(ordersByDate).map(([date, value]) => ({
      date,
      value: Number(value)
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Get actual customer breakdown (new vs returning)
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('id, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (customerError) throw customerError;

    const newCustomersCount = customerData?.length || 0;
    const totalOrdersCount = ordersData?.length || 0;
    const returningCustomerOrders = Math.max(0, totalOrdersCount - newCustomersCount);

    const topOrderSources = [
      { name: 'New Customers', value: newCustomersCount, percentage: totalOrdersCount > 0 ? (newCustomersCount / totalOrdersCount) * 100 : 0, trend: 'up' as const },
      { name: 'Returning Customers', value: returningCustomerOrders, percentage: totalOrdersCount > 0 ? (returningCustomerOrders / totalOrdersCount) * 100 : 0, trend: 'stable' as const },
    ];

    return {
      data: {
        ordersTimeSeries,
        topOrderSources
      },
      error: null,
      lastFetched: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching orders detailed data:', error);
    return {
      data: {},
      error: error instanceof Error ? error.message : 'Unknown error',
      lastFetched: new Date().toISOString()
    };
  }
}

async function getAOVDetailedData(startDate: string, endDate: string): Promise<DataFetcherResult<DetailedKPIData>> {
  try {
    // Get daily AOV time series using correct column name
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('created_at, total_price')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at');

    if (ordersError) throw ordersError;

    // Process AOV time series
    const aovByDate = ordersData?.reduce((acc: Record<string, { total: number; count: number }>, order) => {
      const date = order.created_at.split('T')[0];
      if (!acc[date]) acc[date] = { total: 0, count: 0 };
      acc[date].total += parseFloat(order.total_price) || 0;
      acc[date].count += 1;
      return acc;
    }, {}) || {};

    const aovTimeSeries = Object.entries(aovByDate).map(([date, data]) => ({
      date,
      value: data.count > 0 ? data.total / data.count : 0
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Get high-value products that drive AOV
    const { data: productData, error: productError } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        price,
        products!inner(name),
        orders!inner(created_at)
      `)
      .gte('orders.created_at', startDate)
      .lte('orders.created_at', endDate);

    if (productError) throw productError;

    const productAOV = productData?.reduce((acc: Record<string, { name: string; totalValue: number; orderCount: number }>, item) => {
      const productId = item.product_id;
      const value = (item.quantity || 0) * (parseFloat(item.price) || 0);
      
      if (!acc[productId]) {
        acc[productId] = {
          name: item.products?.name || 'Unknown Product',
          totalValue: 0,
          orderCount: 0
        };
      }
      acc[productId].totalValue += value;
      acc[productId].orderCount += 1;
      return acc;
    }, {}) || {};

    const totalProductValue = Object.values(productAOV).reduce((sum, product) => sum + product.totalValue, 0);
    const highValueProducts = Object.values(productAOV)
      .map(product => ({
        name: product.name,
        value: product.orderCount > 0 ? product.totalValue / product.orderCount : 0,
        percentage: totalProductValue > 0 ? (product.totalValue / totalProductValue) * 100 : 0,
        trend: 'stable' as const
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return {
      data: {
        aovTimeSeries,
        highValueProducts
      },
      error: null,
      lastFetched: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching AOV detailed data:', error);
    return {
      data: {},
      error: error instanceof Error ? error.message : 'Unknown error',
      lastFetched: new Date().toISOString()
    };
  }
}

async function getConversionDetailedData(startDate: string, endDate: string): Promise<DataFetcherResult<DetailedKPIData>> {
  try {
    // Mock conversion data since we don't have visitor tracking
    const conversionTimeSeries = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        value: 2.5 + Math.random() * 2 // Mock conversion rate between 2.5% and 4.5%
      };
    });

    const topConvertingPages = [
      { name: 'Product Page A', value: 4.2, percentage: 15, trend: 'up' as const },
      { name: 'Landing Page B', value: 3.8, percentage: 12, trend: 'stable' as const },
      { name: 'Category Page C', value: 2.9, percentage: 8, trend: 'down' as const },
      { name: 'Homepage', value: 2.1, percentage: 25, trend: 'stable' as const },
      { name: 'Search Results', value: 3.5, percentage: 18, trend: 'up' as const },
    ];

    return {
      data: {
        conversionTimeSeries,
        topConvertingPages
      },
      error: null,
      lastFetched: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching conversion detailed data:', error);
    return {
      data: {},
      error: error instanceof Error ? error.message : 'Unknown error',
      lastFetched: new Date().toISOString()
    };
  }
}