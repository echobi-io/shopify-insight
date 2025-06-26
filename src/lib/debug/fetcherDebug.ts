import { supabase } from '@/lib/supabaseClient';
import { getKPIs } from '@/lib/fetchers/getKpis';
import { getRevenueByTimeRange } from '@/lib/fetchers/getRevenueByDate';
import { getSalesKPIs } from '@/lib/fetchers/getSalesData';
import { getDateRangeFromTimeframe, formatDateForSQL } from '@/lib/utils/dateUtils';

export interface DebugResult {
  test: string;
  success: boolean;
  data?: any;
  error?: string;
  count?: number;
  details?: any;
}

export async function runFetcherDebug(
  globalDateRange: string = 'all_2024',
  merchantId: string = '11111111-1111-1111-1111-111111111111'
): Promise<DebugResult[]> {
  const results: DebugResult[] = [];
  
  console.log('🔍 Starting comprehensive fetcher debug...');
  console.log('📅 Date Range:', globalDateRange);
  console.log('🏪 Merchant ID:', merchantId);

  // Generate date filters
  const { startDate, endDate } = getDateRangeFromTimeframe(globalDateRange);
  const filters = {
    startDate: formatDateForSQL(startDate),
    endDate: formatDateForSQL(endDate),
    segment: undefined
  };

  console.log('📊 Generated filters:', filters);

  // Test 1: Basic Supabase connection
  try {
    const { data, error } = await supabase.from('orders').select('count', { count: 'exact', head: true });
    results.push({
      test: 'Supabase Connection',
      success: !error,
      error: error?.message,
      count: data || 0
    });
  } catch (err) {
    results.push({
      test: 'Supabase Connection',
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }

  // Test 2: Check orders table structure
  try {
    const { data, error } = await supabase.from('orders').select('*').limit(1);
    results.push({
      test: 'Orders Table Structure',
      success: !error,
      error: error?.message,
      data: data?.[0] || null,
      details: data?.[0] ? Object.keys(data[0]) : []
    });
  } catch (err) {
    results.push({
      test: 'Orders Table Structure',
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }

  // Test 3: Check orders with merchant_id
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('merchant_id', merchantId)
      .limit(5);
    
    results.push({
      test: 'Orders with Merchant ID',
      success: !error,
      error: error?.message,
      count: data?.length || 0,
      data: data?.[0] || null
    });
  } catch (err) {
    results.push({
      test: 'Orders with Merchant ID',
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }

  // Test 4: Check orders within date range
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate)
      .limit(5);
    
    results.push({
      test: 'Orders in Date Range',
      success: !error,
      error: error?.message,
      count: data?.length || 0,
      data: data?.[0] || null
    });
  } catch (err) {
    results.push({
      test: 'Orders in Date Range',
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }

  // Test 5: Check orders with both merchant_id and date range
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('merchant_id', merchantId)
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate)
      .limit(5);
    
    results.push({
      test: 'Orders with Merchant ID + Date Range',
      success: !error,
      error: error?.message,
      count: data?.length || 0,
      data: data?.[0] || null
    });
  } catch (err) {
    results.push({
      test: 'Orders with Merchant ID + Date Range',
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }

  // Test 6: Check materialized views
  try {
    const { data, error } = await supabase
      .from('daily_revenue_summary')
      .select('*')
      .limit(5);
    
    results.push({
      test: 'Materialized View Access',
      success: !error,
      error: error?.message,
      count: data?.length || 0,
      data: data?.[0] || null
    });
  } catch (err) {
    results.push({
      test: 'Materialized View Access',
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }

  // Test 7: Check materialized views with filters
  try {
    const { data, error } = await supabase
      .from('daily_revenue_summary')
      .select('*')
      .eq('merchant_id', merchantId)
      .gte('date', filters.startDate.split('T')[0])
      .lte('date', filters.endDate.split('T')[0])
      .limit(5);
    
    results.push({
      test: 'Materialized View with Filters',
      success: !error,
      error: error?.message,
      count: data?.length || 0,
      data: data?.[0] || null
    });
  } catch (err) {
    results.push({
      test: 'Materialized View with Filters',
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }

  // Test 8: Test KPI fetcher
  try {
    const kpiData = await getKPIs(filters, merchantId);
    results.push({
      test: 'KPI Fetcher',
      success: true,
      data: kpiData,
      details: {
        hasRevenue: kpiData.totalRevenue > 0,
        hasOrders: kpiData.totalOrders > 0,
        hasCustomers: kpiData.newCustomers > 0
      }
    });
  } catch (err) {
    results.push({
      test: 'KPI Fetcher',
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }

  // Test 9: Test Revenue fetcher
  try {
    const revenueData = await getRevenueByTimeRange(filters, 'monthly', merchantId);
    results.push({
      test: 'Revenue Fetcher',
      success: true,
      count: revenueData.length,
      data: revenueData[0] || null,
      details: {
        hasData: revenueData.length > 0,
        totalRevenue: revenueData.reduce((sum, item) => sum + item.revenue, 0)
      }
    });
  } catch (err) {
    results.push({
      test: 'Revenue Fetcher',
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }

  // Test 10: Test Sales KPI fetcher
  try {
    const salesData = await getSalesKPIs(filters, merchantId);
    results.push({
      test: 'Sales KPI Fetcher',
      success: true,
      data: salesData,
      details: {
        hasRevenue: salesData.totalRevenue > 0,
        hasOrders: salesData.totalOrders > 0
      }
    });
  } catch (err) {
    results.push({
      test: 'Sales KPI Fetcher',
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }

  // Test 11: Check other tables
  const tables = ['customers', 'products', 'order_line_items', 'refunds'];
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      results.push({
        test: `${table} Table`,
        success: !error,
        error: error?.message,
        data: data?.[0] || null,
        details: data?.[0] ? Object.keys(data[0]) : []
      });
    } catch (err) {
      results.push({
        test: `${table} Table`,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  console.log('✅ Fetcher debug completed');
  return results;
}

export function logDebugResults(results: DebugResult[]) {
  console.log('\n📋 FETCHER DEBUG RESULTS:');
  console.log('========================');
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`\n${index + 1}. ${status} ${result.test}`);
    
    if (result.success) {
      if (result.count !== undefined) {
        console.log(`   Count: ${result.count}`);
      }
      if (result.details) {
        console.log(`   Details:`, result.details);
      }
      if (result.data && typeof result.data === 'object') {
        console.log(`   Sample Data:`, JSON.stringify(result.data, null, 2).substring(0, 200) + '...');
      }
    } else {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`\n📊 Summary: ${successCount}/${totalCount} tests passed`);
  
  if (successCount < totalCount) {
    console.log('\n🔧 Recommendations:');
    results.forEach((result, index) => {
      if (!result.success) {
        console.log(`   - Fix ${result.test}: ${result.error}`);
      }
    });
  }
}