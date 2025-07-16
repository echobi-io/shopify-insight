import { supabase } from '../supabaseClient'

export interface ProductMetrics {
  id: string
  name: string
  sku: string
  category?: string
  totalRevenue: number
  unitsSold: number
  avgPrice: number
  profitMargin: number
  growthRate: number
  performanceScore: number
}

export interface ProductTrend {
  date: string
  revenue: number
  units: number
}

export interface CategoryPerformance {
  category: string
  revenue: number
  units: number
  percentage: number
}

export interface ProductSummary {
  totalProducts: number
  totalRevenue: number
  totalUnitsSold: number
  avgProfitMargin: number
  previousTotalProducts?: number
  previousTotalRevenue?: number
  previousTotalUnitsSold?: number
  previousAvgProfitMargin?: number
}

export interface ProductPerformanceData {
  summary: ProductSummary
  products: ProductMetrics[]
  categoryPerformance: CategoryPerformance[]
  topProductsTrend: ProductTrend[]
}

// Empty data structure for fallback
const EMPTY_PRODUCT_DATA: ProductPerformanceData = {
  summary: {
    totalProducts: 0,
    totalRevenue: 0,
    totalUnitsSold: 0,
    avgProfitMargin: 0,
    previousTotalProducts: 0,
    previousTotalRevenue: 0,
    previousTotalUnitsSold: 0,
    previousAvgProfitMargin: 0
  },
  products: [],
  categoryPerformance: [],
  topProductsTrend: []
}

export async function getProductPerformanceDataSimple(
  merchantId: string,
  filters: { startDate: string; endDate: string }
): Promise<ProductPerformanceData> {
  try {
    console.log('🔄 Fetching product performance data for merchant:', merchantId, 'filters:', filters);

    // Step 1: Get order items with product and order data for the period
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        price,
        products!inner(id, name, shopify_product_id, category, price),
        orders!inner(created_at, merchant_id)
      `)
      .eq('orders.merchant_id', merchantId)
      .gte('orders.created_at', filters.startDate)
      .lte('orders.created_at', filters.endDate);

    if (orderItemsError) {
      console.error('❌ Error fetching order items:', orderItemsError);
      return EMPTY_PRODUCT_DATA;
    }

    if (!orderItems || orderItems.length === 0) {
      console.log('📭 No order items found for the period');
      return EMPTY_PRODUCT_DATA;
    }

    console.log(`📊 Found ${orderItems.length} order items`);

    // Step 2: Process data to create product metrics
    const productSalesMap = new Map<string, {
      product: any;
      revenue: number;
      units: number;
      prices: number[];
    }>();

    orderItems.forEach((item: any) => {
      const productId = item.product_id;
      const product = item.products;
      
      if (!productId || !product) return;

      const revenue = (item.price || 0) * (item.quantity || 0);
      const existing = productSalesMap.get(productId) || {
        product,
        revenue: 0,
        units: 0,
        prices: []
      };

      productSalesMap.set(productId, {
        product,
        revenue: existing.revenue + revenue,
        units: existing.units + (item.quantity || 0),
        prices: [...existing.prices, item.price || 0]
      });
    });

    // Step 3: Create product metrics array
    const productMetrics: ProductMetrics[] = Array.from(productSalesMap.entries())
      .map(([productId, data]) => {
        const avgPrice = data.prices.length > 0
          ? data.prices.reduce((sum, price) => sum + price, 0) / data.prices.length
          : data.product.price || 0;

        const performanceScore = Math.min(100, (data.revenue / 1000) * 10);

        return {
          id: productId,
          name: data.product.name || 'Unknown Product',
          sku: data.product.shopify_product_id || productId.substring(0, 8),
          category: data.product.category || 'Uncategorized',
          totalRevenue: data.revenue,
          unitsSold: data.units,
          avgPrice: avgPrice,
          profitMargin: avgPrice * 0.25, // Assume 25% margin
          growthRate: 0, // Skip complex growth calculation
          performanceScore: performanceScore
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    console.log(`📈 Processed ${productMetrics.length} products with sales`);

    // Step 4: Calculate category performance
    const categoryMap = new Map<string, { revenue: number; units: number }>();
    
    productMetrics.forEach(product => {
      const category = product.category || 'Uncategorized';
      const existing = categoryMap.get(category) || { revenue: 0, units: 0 };
      
      categoryMap.set(category, {
        revenue: existing.revenue + product.totalRevenue,
        units: existing.units + product.unitsSold
      });
    });

    const totalRevenue = productMetrics.reduce((sum, p) => sum + p.totalRevenue, 0);
    const categoryPerformance: CategoryPerformance[] = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        revenue: data.revenue,
        units: data.units,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Step 5: Create trend data for top products
    const topProductIds = productMetrics.slice(0, 5).map(p => p.id);
    const trendMap = new Map<string, { revenue: number; units: number }>();
    
    orderItems
      .filter((item: any) => topProductIds.includes(item.product_id))
      .forEach((item: any) => {
        const date = new Date(item.orders.created_at).toISOString().split('T')[0];
        const revenue = (item.price || 0) * (item.quantity || 0);
        const existing = trendMap.get(date) || { revenue: 0, units: 0 };
        
        trendMap.set(date, {
          revenue: existing.revenue + revenue,
          units: existing.units + (item.quantity || 0)
        });
      });

    const topProductsTrend: ProductTrend[] = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        units: data.units
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Step 6: Calculate summary
    const summary: ProductSummary = {
      totalProducts: productMetrics.length,
      totalRevenue: totalRevenue,
      totalUnitsSold: productMetrics.reduce((sum, p) => sum + p.unitsSold, 0),
      avgProfitMargin: productMetrics.length > 0 
        ? productMetrics.reduce((sum, p) => sum + p.profitMargin, 0) / productMetrics.length 
        : 0,
      // Skip previous period calculations for performance
      previousTotalProducts: 0,
      previousTotalRevenue: 0,
      previousTotalUnitsSold: 0,
      previousAvgProfitMargin: 0
    };

    console.log('✅ Product performance data processed successfully:', {
      totalProducts: summary.totalProducts,
      totalRevenue: summary.totalRevenue,
      categoriesCount: categoryPerformance.length,
      trendDataPoints: topProductsTrend.length
    });

    return {
      summary,
      products: productMetrics,
      categoryPerformance,
      topProductsTrend
    };

  } catch (error) {
    console.error('❌ Error in product performance data:', error);
    return EMPTY_PRODUCT_DATA;
  }
}