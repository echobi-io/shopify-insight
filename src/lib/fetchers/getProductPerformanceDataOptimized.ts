import { executeQuery, executeRPC, fetchBatch, aggregateData, DataFetcherOptions } from '@/lib/utils/dataFetcher'

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

// Fallback data structure
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

export async function getProductPerformanceDataOptimized(
  merchantId: string,
  filters: { startDate: string; endDate: string },
  options: DataFetcherOptions = {}
): Promise<ProductPerformanceData> {
  console.log('🔄 Fetching optimized product performance data for merchant:', merchantId)

  // Try RPC function first with timeout and retry
  const rpcResult = await executeRPC<ProductPerformanceData>(
    'get_product_performance',
    {
      merchant_id: merchantId,
      start_date: filters.startDate,
      end_date: filters.endDate
    },
    {
      timeout: 15000, // 15 seconds for RPC
      retries: 2,
      cacheKey: `product_performance_${merchantId}_${filters.startDate}_${filters.endDate}`,
      cacheTTL: 300000, // 5 minutes
      fallbackData: null,
      ...options
    }
  )

  if (rpcResult.success && rpcResult.data) {
    console.log('✅ RPC function succeeded')
    return rpcResult.data
  }

  console.log('⚠️ RPC function failed, falling back to direct queries:', rpcResult.error?.message)

  // Fallback to direct table queries with batch processing
  try {
    const batchQueries = {
      products: () => executeQuery<any[]>({
        table: 'products',
        select: 'id, name, shopify_product_id, category, price, is_active',
        filters: { is_active: true },
        limit: 50 // Limit to prevent timeout
      }, merchantId, {
        timeout: 10000,
        retries: 2,
        fallbackData: []
      }),

      orderItems: () => executeQuery<any[]>({
        table: 'order_items',
        select: `
          product_id,
          quantity,
          price,
          orders!inner(
            id,
            merchant_id,
            created_at
          )
        `,
        filters: {
          'gte_orders.created_at': filters.startDate,
          'lte_orders.created_at': filters.endDate
        },
        limit: 1000 // Reasonable limit
      }, merchantId, {
        timeout: 15000,
        retries: 2,
        fallbackData: []
      })
    }

    const batchResults = await fetchBatch(batchQueries)

    const productsResult = batchResults.products
    const orderItemsResult = batchResults.orderItems

    if (!productsResult.success || !orderItemsResult.success) {
      console.error('❌ Batch queries failed:', {
        products: productsResult.error?.message,
        orderItems: orderItemsResult.error?.message
      })
      return EMPTY_PRODUCT_DATA
    }

    const products = productsResult.data || []
    const orderItems = orderItemsResult.data || []

    if (products.length === 0) {
      console.log('📭 No products found')
      return EMPTY_PRODUCT_DATA
    }

    console.log(`📊 Processing ${products.length} products and ${orderItems.length} order items`)

    // Create sales aggregation map
    const salesMap = new Map<string, { revenue: number; units: number; prices: number[] }>()
    
    orderItems.forEach((item: any) => {
      const productId = item.product_id
      const revenue = (item.price || 0) * (item.quantity || 0)
      const existing = salesMap.get(productId) || { revenue: 0, units: 0, prices: [] }
      
      salesMap.set(productId, {
        revenue: existing.revenue + revenue,
        units: existing.units + (item.quantity || 0),
        prices: [...existing.prices, item.price || 0]
      })
    })

    // Get previous period data for growth calculations
    const periodLength = new Date(filters.endDate).getTime() - new Date(filters.startDate).getTime()
    const previousStartDate = new Date(new Date(filters.startDate).getTime() - periodLength).toISOString()
    const previousEndDate = new Date(filters.startDate).toISOString()

    const previousOrderItemsResult = await executeQuery<any[]>({
      table: 'order_items',
      select: `
        product_id,
        quantity,
        price,
        orders!inner(
          id,
          merchant_id,
          created_at
        )
      `,
      filters: {
        'gte_orders.created_at': previousStartDate,
        'lte_orders.created_at': previousEndDate
      },
      limit: 1000
    }, merchantId, {
      timeout: 10000,
      retries: 1,
      fallbackData: []
    })

    const previousOrderItems = previousOrderItemsResult.data || []
    const previousSalesMap = new Map<string, { revenue: number; units: number }>()
    
    previousOrderItems.forEach((item: any) => {
      const productId = item.product_id
      const revenue = (item.price || 0) * (item.quantity || 0)
      const existing = previousSalesMap.get(productId) || { revenue: 0, units: 0 }
      
      previousSalesMap.set(productId, {
        revenue: existing.revenue + revenue,
        units: existing.units + (item.quantity || 0)
      })
    })

    // Transform products data with real sales metrics
    const productMetrics: ProductMetrics[] = products.map((product: any) => {
      const salesData = salesMap.get(product.id) || { revenue: 0, units: 0, prices: [] }
      const previousSalesData = previousSalesMap.get(product.id) || { revenue: 0, units: 0 }
      
      // Calculate average price from actual sales
      const avgPrice = salesData.prices.length > 0 
        ? salesData.prices.reduce((sum, price) => sum + price, 0) / salesData.prices.length
        : product.price || 0
      
      // Calculate growth rate
      let growthRate = 0
      if (previousSalesData.revenue > 0) {
        growthRate = ((salesData.revenue - previousSalesData.revenue) / previousSalesData.revenue) * 100
      } else if (salesData.revenue > 0) {
        growthRate = 100 // New product with sales
      }
      
      // Calculate performance score based on revenue and units
      const maxRevenue = Math.max(...Array.from(salesMap.values()).map(s => s.revenue), 1)
      const performanceScore = Math.min(100, (salesData.revenue / maxRevenue) * 100)

      return {
        id: product.id,
        name: product.name || 'Unknown Product',
        sku: product.shopify_product_id || '',
        category: product.category || 'Uncategorized',
        totalRevenue: salesData.revenue,
        unitsSold: salesData.units,
        avgPrice: avgPrice,
        profitMargin: avgPrice > 0 ? avgPrice * 0.3 : 0, // Assume 30% margin
        growthRate: growthRate,
        performanceScore: performanceScore
      }
    }).sort((a, b) => b.totalRevenue - a.totalRevenue)

    // Calculate category performance using aggregation utility
    const categoryData = aggregateData(
      productMetrics,
      'category',
      {
        revenue: { field: 'totalRevenue', operation: 'sum' },
        units: { field: 'unitsSold', operation: 'sum' }
      }
    )

    const totalRevenue = productMetrics.reduce((sum, p) => sum + p.totalRevenue, 0)
    const categoryPerformance: CategoryPerformance[] = categoryData.map(cat => ({
      category: cat.category || 'Uncategorized',
      revenue: cat.revenue || 0,
      units: cat.units || 0,
      percentage: totalRevenue > 0 ? ((cat.revenue || 0) / totalRevenue) * 100 : 0
    }))

    // Get trend data for top 5 products
    const topProductIds = productMetrics.slice(0, 5).map(p => p.id)
    let topProductsTrend: ProductTrend[] = []
    
    if (topProductIds.length > 0) {
      const trendResult = await executeQuery<any[]>({
        table: 'order_items',
        select: `
          quantity,
          price,
          orders!inner(
            created_at,
            merchant_id
          )
        `,
        filters: {
          'in_product_id': topProductIds,
          'gte_orders.created_at': filters.startDate,
          'lte_orders.created_at': filters.endDate
        },
        orderBy: { column: 'orders.created_at', ascending: true }
      }, merchantId, {
        timeout: 10000,
        retries: 1,
        fallbackData: []
      })

      if (trendResult.success && trendResult.data) {
        // Aggregate trend data by date
        const trendData = aggregateData(
          trendResult.data.map((item: any) => ({
            date: new Date(item.orders.created_at).toISOString().split('T')[0],
            revenue: (item.price || 0) * (item.quantity || 0),
            units: item.quantity || 0
          })),
          'date',
          {
            revenue: { field: 'revenue', operation: 'sum' },
            units: { field: 'units', operation: 'sum' }
          }
        )

        topProductsTrend = trendData.map(d => ({
          date: d.date,
          revenue: d.revenue || 0,
          units: d.units || 0
        })).sort((a, b) => a.date.localeCompare(b.date))
      }
    }

    // Calculate summary metrics
    const currentSummary = {
      totalProducts: productMetrics.length,
      totalRevenue: productMetrics.reduce((sum, p) => sum + p.totalRevenue, 0),
      totalUnitsSold: productMetrics.reduce((sum, p) => sum + p.unitsSold, 0),
      avgProfitMargin: productMetrics.length > 0 
        ? productMetrics.reduce((sum, p) => sum + p.profitMargin, 0) / productMetrics.length 
        : 0
    }

    const previousSummary = {
      totalProducts: products.length,
      totalRevenue: Array.from(previousSalesMap.values()).reduce((sum, data) => sum + data.revenue, 0),
      totalUnitsSold: Array.from(previousSalesMap.values()).reduce((sum, data) => sum + data.units, 0),
      avgProfitMargin: currentSummary.avgProfitMargin * 0.95 // Estimate
    }

    const summary: ProductSummary = {
      ...currentSummary,
      previousTotalProducts: previousSummary.totalProducts,
      previousTotalRevenue: previousSummary.totalRevenue,
      previousTotalUnitsSold: previousSummary.totalUnitsSold,
      previousAvgProfitMargin: previousSummary.avgProfitMargin
    }

    console.log('✅ Product performance data processed successfully')

    return {
      summary,
      products: productMetrics,
      categoryPerformance,
      topProductsTrend
    }

  } catch (error) {
    console.error('❌ Error in fallback product performance data:', error)
    return EMPTY_PRODUCT_DATA
  }
}