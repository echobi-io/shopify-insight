import { createClient } from '@/util/supabase/api'

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

export async function getProductPerformanceData(
  merchantId: string,
  filters: { startDate: string; endDate: string }
): Promise<ProductPerformanceData> {
  try {
    console.log('🔄 Fetching product performance data for merchant:', merchantId, 'with filters:', filters)

    const supabase = createClient()

    // Get current period data using Supabase RPC or direct query
    const { data: currentProducts, error: currentError } = await supabase.rpc('get_product_performance', {
      merchant_id: merchantId,
      start_date: filters.startDate,
      end_date: filters.endDate
    })

    console.log('📊 Current products response:', { data: currentProducts, error: currentError })

    if (currentError) {
      console.error('❌ Error fetching current products:', currentError)
      // Check if it's a function not found error
      if (currentError.message?.includes('function') || currentError.code === '42883') {
        console.warn('⚠️ RPC function not found, falling back to direct query')
        // Fallback to direct query if RPC function doesn't exist
        return await getProductPerformanceDataFallback(merchantId, filters)
      }
      throw new Error(`Failed to fetch product data: ${currentError.message}`)
    }

    // Check if we got any data
    if (!currentProducts || currentProducts.length === 0) {
      console.warn('⚠️ No product data returned from RPC function')
      // Try fallback method
      return await getProductPerformanceDataFallback(merchantId, filters)
    }

    // Get previous period data for comparison
    const startDate = new Date(filters.startDate)
    const endDate = new Date(filters.endDate)
    const periodLength = endDate.getTime() - startDate.getTime()
    const previousStartDate = new Date(startDate.getTime() - periodLength)
    const previousEndDate = new Date(startDate.getTime())

    const { data: previousProducts, error: previousError } = await supabase.rpc('get_product_performance', {
      merchant_id: merchantId,
      start_date: previousStartDate.toISOString(),
      end_date: previousEndDate.toISOString()
    })

    // Create a map for previous period data
    const previousDataMap = new Map()
    if (previousProducts && !previousError) {
      previousProducts.forEach((product: any) => {
        previousDataMap.set(product.id, {
          revenue: Number(product.total_revenue || 0),
          units: Number(product.units_sold || 0)
        })
      })
    }

    // Process current products with growth calculations
    const products: ProductMetrics[] = (currentProducts || []).map((product: any) => {
      const currentRevenue = Number(product.total_revenue || 0)
      const currentUnits = Number(product.units_sold || 0)
      const previousData = previousDataMap.get(product.id)
      const previousRevenue = previousData?.revenue || 0

      let growthRate = 0
      if (previousRevenue > 0) {
        growthRate = ((currentRevenue - previousRevenue) / previousRevenue) * 100
      } else if (currentRevenue > 0) {
        growthRate = 100 // New product with revenue
      }

      return {
        id: product.id,
        name: product.name || 'Unknown Product',
        sku: product.sku || product.id,
        category: product.category,
        totalRevenue: currentRevenue,
        unitsSold: currentUnits,
        avgPrice: Number(product.avg_price || 0),
        profitMargin: Number(product.profit_margin || 30),
        growthRate,
        performanceScore: Number(product.performance_score || 0)
      }
    })

    // Calculate category performance
    const categoryMap = new Map<string, { revenue: number; units: number }>()
    let totalRevenue = 0

    products.forEach(product => {
      const category = product.category || 'Uncategorized'
      const existing = categoryMap.get(category) || { revenue: 0, units: 0 }
      categoryMap.set(category, {
        revenue: existing.revenue + product.totalRevenue,
        units: existing.units + product.unitsSold
      })
      totalRevenue += product.totalRevenue
    })

    const categoryPerformance: CategoryPerformance[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      revenue: data.revenue,
      units: data.units,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
    }))

    // Get trend data for top products
    const topProductIds = products.slice(0, 5).map(p => p.id)
    const { data: trendData } = await supabase.rpc('get_product_trend', {
      merchant_id: merchantId,
      product_ids: topProductIds,
      start_date: filters.startDate,
      end_date: filters.endDate
    })

    const topProductsTrend: ProductTrend[] = (trendData || []).map((row: any) => ({
      date: row.date,
      revenue: Number(row.revenue || 0),
      units: Number(row.units || 0)
    }))

    // Calculate summary metrics
    const currentSummary = {
      totalProducts: products.length,
      totalRevenue: products.reduce((sum, p) => sum + p.totalRevenue, 0),
      totalUnitsSold: products.reduce((sum, p) => sum + p.unitsSold, 0),
      avgProfitMargin: products.length > 0 ? products.reduce((sum, p) => sum + p.profitMargin, 0) / products.length : 0
    }

    const previousSummary = {
      totalProducts: previousProducts?.length || 0,
      totalRevenue: (previousProducts || []).reduce((sum: number, p: any) => sum + Number(p.total_revenue || 0), 0),
      totalUnitsSold: (previousProducts || []).reduce((sum: number, p: any) => sum + Number(p.units_sold || 0), 0),
      avgProfitMargin: 30.0 // Assuming same margin for previous period
    }

    const summary: ProductSummary = {
      ...currentSummary,
      previousTotalProducts: previousSummary.totalProducts,
      previousTotalRevenue: previousSummary.totalRevenue,
      previousTotalUnitsSold: previousSummary.totalUnitsSold,
      previousAvgProfitMargin: previousSummary.avgProfitMargin
    }

    console.log('✅ Product performance data loaded successfully')

    return {
      summary,
      products,
      categoryPerformance,
      topProductsTrend
    }

  } catch (error) {
    console.error('❌ Error fetching product performance data:', error)
    throw new Error('Failed to fetch product performance data')
  }
}

// Fallback function using direct Supabase queries
async function getProductPerformanceDataFallback(
  merchantId: string,
  filters: { startDate: string; endDate: string }
): Promise<ProductPerformanceData> {
  console.log('🔄 Using fallback method for product performance data')
  
  const supabase = createClient()

  try {
    // Get products with order data using direct queries
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        category,
        price,
        cost,
        active,
        order_items!inner (
          quantity,
          price,
          orders!inner (
            merchant_id,
            created_at,
            status
          )
        )
      `)
      .eq('merchant_id', merchantId)
      .eq('active', true)
      .eq('order_items.orders.merchant_id', merchantId)
      .gte('order_items.orders.created_at', filters.startDate)
      .lte('order_items.orders.created_at', filters.endDate)
      .in('order_items.orders.status', ['confirmed', 'shipped', 'delivered'])

    if (productsError) {
      console.error('❌ Error in fallback query:', productsError)
      throw new Error(`Fallback query failed: ${productsError.message}`)
    }

    console.log('📊 Fallback products data:', productsData)

    // If no data, return empty structure
    if (!productsData || productsData.length === 0) {
      console.warn('⚠️ No products found in fallback query')
      return {
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
    }

    // Process the data to calculate metrics
    const productMetrics = new Map<string, {
      id: string
      name: string
      sku: string
      category?: string
      price: number
      cost?: number
      totalRevenue: number
      unitsSold: number
    }>()

    // Aggregate data by product
    productsData.forEach((product: any) => {
      const productId = product.id
      
      if (!productMetrics.has(productId)) {
        productMetrics.set(productId, {
          id: product.id,
          name: product.name,
          sku: product.sku || product.id,
          category: product.category,
          price: Number(product.price || 0),
          cost: Number(product.cost || 0),
          totalRevenue: 0,
          unitsSold: 0
        })
      }

      const metrics = productMetrics.get(productId)!
      
      // Sum up order items for this product
      if (product.order_items && Array.isArray(product.order_items)) {
        product.order_items.forEach((item: any) => {
          metrics.totalRevenue += Number(item.price || 0) * Number(item.quantity || 0)
          metrics.unitsSold += Number(item.quantity || 0)
        })
      }
    })

    // Convert to ProductMetrics array
    const products: ProductMetrics[] = Array.from(productMetrics.values()).map(product => {
      const avgPrice = product.unitsSold > 0 ? product.totalRevenue / product.unitsSold : 0
      const profitMargin = product.cost && product.price && product.price > 0 
        ? ((product.price - product.cost) / product.price) * 100 
        : 30.0
      const performanceScore = Math.min(100, (product.totalRevenue / 1000.0) * 20 + (product.unitsSold / 10.0) * 10)

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        totalRevenue: product.totalRevenue,
        unitsSold: product.unitsSold,
        avgPrice,
        profitMargin,
        growthRate: 0, // Can't calculate without previous period data in fallback
        performanceScore
      }
    }).filter(p => p.totalRevenue > 0 || p.unitsSold > 0) // Only include products with activity

    // Calculate category performance
    const categoryMap = new Map<string, { revenue: number; units: number }>()
    let totalRevenue = 0

    products.forEach(product => {
      const category = product.category || 'Uncategorized'
      const existing = categoryMap.get(category) || { revenue: 0, units: 0 }
      categoryMap.set(category, {
        revenue: existing.revenue + product.totalRevenue,
        units: existing.units + product.unitsSold
      })
      totalRevenue += product.totalRevenue
    })

    const categoryPerformance: CategoryPerformance[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      revenue: data.revenue,
      units: data.units,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
    }))

    // Calculate summary
    const summary: ProductSummary = {
      totalProducts: products.length,
      totalRevenue: products.reduce((sum, p) => sum + p.totalRevenue, 0),
      totalUnitsSold: products.reduce((sum, p) => sum + p.unitsSold, 0),
      avgProfitMargin: products.length > 0 ? products.reduce((sum, p) => sum + p.profitMargin, 0) / products.length : 0,
      previousTotalProducts: 0,
      previousTotalRevenue: 0,
      previousTotalUnitsSold: 0,
      previousAvgProfitMargin: 0
    }

    console.log('✅ Fallback product performance data loaded successfully')

    return {
      summary,
      products: products.sort((a, b) => b.totalRevenue - a.totalRevenue),
      categoryPerformance,
      topProductsTrend: [] // Empty for fallback - would need separate query
    }

  } catch (error) {
    console.error('❌ Error in fallback product performance data:', error)
    throw new Error('Failed to fetch product performance data using fallback method')
  }
}