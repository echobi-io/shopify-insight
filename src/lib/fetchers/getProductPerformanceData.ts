import { createClient } from '@/util/supabase/component'

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

    // Use direct query method for better reliability
    console.log('🔄 Using direct query method to avoid RPC function issues')
    return await getProductPerformanceDataFallback(merchantId, filters)

  } catch (error) {
    console.error('❌ Error fetching product performance data:', error)
    // Return empty data instead of throwing to prevent page crashes
    console.warn('⚠️ Returning empty product data due to error')
    return getEmptyProductData()
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
    // First, try to get basic products data to see if tables exist
    // Try with shopify_product_id first, then fallback to sku, then just basic fields
    let basicProducts: any[] | null = null
    let basicError: any = null

    try {
      const result = await supabase
        .from('products')
        .select('id, name, shopify_product_id, category, price, cost, active, merchant_id')
        .eq('merchant_id', merchantId)
        .eq('active', true)
        .limit(10)
      basicProducts = result.data
      basicError = result.error
    } catch (error) {
      // If shopify_product_id doesn't exist, try with sku
      try {
        const result = await supabase
          .from('products')
          .select('id, name, sku, category, price, cost, active, merchant_id')
          .eq('merchant_id', merchantId)
          .eq('active', true)
          .limit(10)
        basicProducts = result.data
        basicError = result.error
      } catch (error2) {
        // If sku doesn't exist either, try with just basic fields
        const result = await supabase
          .from('products')
          .select('id, name, category, price, cost, active, merchant_id')
          .eq('merchant_id', merchantId)
          .eq('active', true)
          .limit(10)
        basicProducts = result.data
        basicError = result.error
      }
    }

    if (basicError) {
      console.error('❌ Error accessing products table:', basicError)
      // If products table doesn't exist, return empty data
      if (basicError.code === '42P01' || basicError.message?.includes('does not exist')) {
        console.warn('⚠️ Products table does not exist, returning empty data')
        return getEmptyProductData()
      }
      throw new Error(`Database access failed: ${basicError.message}`)
    }

    // If no products exist for this merchant, return empty data
    if (!basicProducts || basicProducts.length === 0) {
      console.warn('⚠️ No products found for merchant, returning empty data')
      return getEmptyProductData()
    }

    console.log('📊 Found products for merchant:', basicProducts.length)

    // Now try to get products with order data using direct queries
    // Try different column combinations based on what worked in the basic query
    let productsData: any[] | null = null
    let productsError: any = null

    // Determine which SKU field to use based on the basic products query
    const hasShopifyProductId = basicProducts.some(p => p.shopify_product_id !== undefined)
    const hasSku = basicProducts.some(p => p.sku !== undefined)

    if (hasShopifyProductId) {
      const result = await supabase
        .from('products')
        .select(`
          id,
          name,
          shopify_product_id,
          category,
          price,
          cost,
          active,
          order_items (
            quantity,
            price,
            orders (
              merchant_id,
              created_at
            )
          )
        `)
        .eq('merchant_id', merchantId)
        .eq('active', true)
      productsData = result.data
      productsError = result.error
    } else if (hasSku) {
      const result = await supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          category,
          price,
          cost,
          active,
          order_items (
            quantity,
            price,
            orders (
              merchant_id,
              created_at
            )
          )
        `)
        .eq('merchant_id', merchantId)
        .eq('active', true)
      productsData = result.data
      productsError = result.error
    } else {
      const result = await supabase
        .from('products')
        .select(`
          id,
          name,
          category,
          price,
          cost,
          active,
          order_items (
            quantity,
            price,
            orders (
              merchant_id,
              created_at
            )
          )
        `)
        .eq('merchant_id', merchantId)
        .eq('active', true)
      productsData = result.data
      productsError = result.error
    }

    if (productsError) {
      console.error('❌ Error in fallback query:', productsError)
      // If the join fails, just return basic product data without sales metrics
      console.warn('⚠️ Could not fetch order data, returning products without sales metrics')
      return getBasicProductData(basicProducts)
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
          sku: product.shopify_product_id || product.sku || product.id,
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

// Helper function to return empty product data structure
function getEmptyProductData(): ProductPerformanceData {
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

// Helper function to return basic product data without sales metrics
function getBasicProductData(basicProducts: any[]): ProductPerformanceData {
  const products: ProductMetrics[] = basicProducts.map(product => {
    const profitMargin = product.cost && product.price && product.price > 0 
      ? ((product.price - product.cost) / product.price) * 100 
      : 30.0

    return {
      id: product.id,
      name: product.name || 'Unknown Product',
      sku: product.shopify_product_id || product.id,
      category: product.category,
      totalRevenue: 0, // No sales data available
      unitsSold: 0, // No sales data available
      avgPrice: Number(product.price || 0),
      profitMargin,
      growthRate: 0,
      performanceScore: 0 // No performance data without sales
    }
  })

  // Calculate category performance (just product counts since no revenue data)
  const categoryMap = new Map<string, { revenue: number; units: number }>()
  
  products.forEach(product => {
    const category = product.category || 'Uncategorized'
    const existing = categoryMap.get(category) || { revenue: 0, units: 0 }
    categoryMap.set(category, {
      revenue: existing.revenue,
      units: existing.units + 1 // Count products instead of units sold
    })
  })

  const categoryPerformance: CategoryPerformance[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    revenue: 0,
    units: data.units,
    percentage: products.length > 0 ? (data.units / products.length) * 100 : 0
  }))

  return {
    summary: {
      totalProducts: products.length,
      totalRevenue: 0,
      totalUnitsSold: 0,
      avgProfitMargin: products.length > 0 ? products.reduce((sum, p) => sum + p.profitMargin, 0) / products.length : 0,
      previousTotalProducts: 0,
      previousTotalRevenue: 0,
      previousTotalUnitsSold: 0,
      previousAvgProfitMargin: 0
    },
    products,
    categoryPerformance,
    topProductsTrend: []
  }
}