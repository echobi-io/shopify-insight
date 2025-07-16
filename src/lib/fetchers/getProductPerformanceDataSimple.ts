import { executeQuery, DataFetcherOptions } from '@/lib/utils/dataFetcher'

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
  filters: { startDate: string; endDate: string },
  options: DataFetcherOptions = {}
): Promise<ProductPerformanceData> {
  console.log('🔄 Fetching simple product performance data for merchant:', merchantId, 'filters:', filters)

  try {
    // Step 1: Get basic products list (limited to prevent timeout)
    const productsResult = await executeQuery<any[]>({
      table: 'products',
      select: 'id, name, shopify_product_id, category, price, is_active',
      filters: { is_active: true },
      limit: 100, // Reasonable limit
      orderBy: { column: 'created_at', ascending: false }
    }, merchantId, {
      timeout: 8000,
      retries: 1,
      fallbackData: [],
      ...options
    })

    console.log('📦 Products query result:', { 
      success: productsResult.success, 
      dataLength: productsResult.data?.length,
      error: productsResult.error?.message 
    })

    if (!productsResult.success || !productsResult.data) {
      console.error('❌ Failed to fetch products:', productsResult.error?.message)
      return EMPTY_PRODUCT_DATA
    }

    const products = productsResult.data
    console.log(`📦 Found ${products.length} products`)

    // Show products even if there are no sales - this helps with debugging
    if (products.length === 0) {
      console.log('📭 No products found in database')
      return EMPTY_PRODUCT_DATA
    }

    // Step 2: Get order items for the current period (with strict limits)
    const orderItemsResult = await executeQuery<any[]>({
      table: 'order_items',
      select: `
        product_id,
        quantity,
        price,
        orders!inner(created_at, merchant_id)
      `,
      filters: {
        'gte_orders.created_at': filters.startDate,
        'lte_orders.created_at': filters.endDate
      },
      limit: 2000, // Strict limit to prevent timeout
      orderBy: { column: 'created_at', ascending: false }
    }, merchantId, {
      timeout: 10000,
      retries: 1,
      fallbackData: [],
      ...options
    })

    const orderItems = orderItemsResult.data || []
    console.log(`📊 Found ${orderItems.length} order items`)

    // Step 3: Process data efficiently
    const productSalesMap = new Map<string, { revenue: number; units: number; prices: number[] }>()
    
    // Aggregate sales data
    orderItems.forEach((item: any) => {
      const productId = item.product_id
      if (!productId) return
      
      const revenue = (item.price || 0) * (item.quantity || 0)
      const existing = productSalesMap.get(productId) || { revenue: 0, units: 0, prices: [] }
      
      productSalesMap.set(productId, {
        revenue: existing.revenue + revenue,
        units: existing.units + (item.quantity || 0),
        prices: [...existing.prices, item.price || 0]
      })
    })

    // Step 4: Create product metrics - include all products, not just those with sales
    const productMetrics: ProductMetrics[] = products
      .map((product: any) => {
        const salesData = productSalesMap.get(product.id) || { revenue: 0, units: 0, prices: [] }
        
        // Calculate average price from actual sales or fallback to product price
        const avgPrice = salesData.prices.length > 0 
          ? salesData.prices.reduce((sum, price) => sum + price, 0) / salesData.prices.length
          : product.price || 0
        
        // Simple performance score based on revenue ranking
        const performanceScore = salesData.revenue > 0 ? Math.min(100, (salesData.revenue / 1000) * 10) : 0
        
        return {
          id: product.id,
          name: product.name || 'Unknown Product',
          sku: product.shopify_product_id || product.id.substring(0, 8),
          category: product.category || 'Uncategorized',
          totalRevenue: salesData.revenue,
          unitsSold: salesData.units,
          avgPrice: avgPrice,
          profitMargin: avgPrice * 0.25, // Assume 25% margin
          growthRate: 0, // Skip complex growth calculation for performance
          performanceScore: performanceScore
        }
      })
      .sort((a, b) => {
        // Sort by revenue first, then by name for products with no sales
        if (a.totalRevenue !== b.totalRevenue) {
          return b.totalRevenue - a.totalRevenue
        }
        return a.name.localeCompare(b.name)
      })
      .slice(0, 50) // Limit to top 50 products

    console.log(`📈 Processed ${productMetrics.length} products (${productSalesMap.size} with sales data)`)

    // Step 5: Calculate category performance
    const categoryMap = new Map<string, { revenue: number; units: number }>()
    
    productMetrics.forEach(product => {
      const category = product.category || 'Uncategorized'
      const existing = categoryMap.get(category) || { revenue: 0, units: 0 }
      
      categoryMap.set(category, {
        revenue: existing.revenue + product.totalRevenue,
        units: existing.units + product.unitsSold
      })
    })

    const totalRevenue = productMetrics.reduce((sum, p) => sum + p.totalRevenue, 0)
    const categoryPerformance: CategoryPerformance[] = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        revenue: data.revenue,
        units: data.units,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10) // Top 10 categories

    // Step 6: Create simple trend data (daily aggregation for top 5 products)
    const topProductIds = productMetrics.slice(0, 5).map(p => p.id)
    const trendMap = new Map<string, { revenue: number; units: number }>()
    
    orderItems
      .filter((item: any) => topProductIds.includes(item.product_id))
      .forEach((item: any) => {
        const date = new Date(item.orders.created_at).toISOString().split('T')[0]
        const revenue = (item.price || 0) * (item.quantity || 0)
        const existing = trendMap.get(date) || { revenue: 0, units: 0 }
        
        trendMap.set(date, {
          revenue: existing.revenue + revenue,
          units: existing.units + (item.quantity || 0)
        })
      })

    const topProductsTrend: ProductTrend[] = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        units: data.units
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30) // Last 30 days

    // Step 7: Calculate summary - use all products, not just those with sales
    const summary: ProductSummary = {
      totalProducts: products.length, // Use all products from database
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
    }

    console.log('✅ Simple product performance data processed successfully:', {
      totalProducts: summary.totalProducts,
      productsWithSales: productMetrics.length,
      totalRevenue: summary.totalRevenue,
      categoriesCount: categoryPerformance.length,
      trendDataPoints: topProductsTrend.length
    })

    return {
      summary,
      products: productMetrics,
      categoryPerformance,
      topProductsTrend
    }

  } catch (error) {
    console.error('❌ Error in simple product performance data:', error)
    return EMPTY_PRODUCT_DATA
  }
}