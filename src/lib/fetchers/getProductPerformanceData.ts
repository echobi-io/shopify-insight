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

    if (currentError) {
      console.error('Error fetching current products:', currentError)
      // Return empty data structure if no data available
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