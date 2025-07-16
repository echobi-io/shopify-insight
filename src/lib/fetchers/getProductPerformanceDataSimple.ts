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
  try {
    // Step 1: Get basic products list
    const productsResult = await executeQuery<any[]>({
      table: 'products',
      select: 'id, name, shopify_product_id, category, price, is_active',
      filters: { is_active: true },
      orderBy: { column: 'created_at', ascending: false }
    }, merchantId, {
      timeout: 15000,
      retries: 2,
      fallbackData: [],
      ...options
    })

    if (!productsResult.success || !productsResult.data) {
      return EMPTY_PRODUCT_DATA
    }

    const products = productsResult.data
    if (products.length === 0) {
      return EMPTY_PRODUCT_DATA
    }

    // Step 2: Get order items for the current period
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
      orderBy: { column: 'created_at', ascending: false }
    }, merchantId, {
      timeout: 15000,
      retries: 2,
      fallbackData: [],
      ...options
    })

    const orderItems = orderItemsResult.data || []

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

    // Step 4: Create product metrics - only include products with sales data
    const productMetrics: ProductMetrics[] = products
      .map((product: any) => {
        const salesData = productSalesMap.get(product.id)
        if (!salesData || salesData.revenue === 0) return null
        
        // Calculate average price from actual sales or fallback to product price
        const avgPrice = salesData.prices.length > 0 
          ? salesData.prices.reduce((sum, price) => sum + price, 0) / salesData.prices.length
          : product.price || 0
        
        // Simple performance score based on revenue ranking
        const performanceScore = Math.min(100, (salesData.revenue / 1000) * 10)
        
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
      .filter((product): product is ProductMetrics => product !== null)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)

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

    // Step 7: Calculate summary
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
    }

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