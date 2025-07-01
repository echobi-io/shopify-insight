import prisma from '@/lib/prisma'

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

    // Get current period data
    const currentProducts = await prisma.$queryRaw<any[]>`
      SELECT 
        p.id,
        p.title as name,
        p.handle as sku,
        p.product_type as category,
        COALESCE(SUM(li.price * li.quantity), 0) as total_revenue,
        COALESCE(SUM(li.quantity), 0) as units_sold,
        CASE 
          WHEN SUM(li.quantity) > 0 
          THEN SUM(li.price * li.quantity) / SUM(li.quantity)
          ELSE 0 
        END as avg_price,
        -- Simple profit margin calculation (assuming 30% base margin)
        30.0 as profit_margin,
        -- Performance score based on revenue and units
        CASE 
          WHEN SUM(li.price * li.quantity) > 0 
          THEN LEAST(100, (SUM(li.price * li.quantity) / 1000.0) * 20 + (SUM(li.quantity) / 10.0) * 10)
          ELSE 0 
        END as performance_score
      FROM "Product" p
      LEFT JOIN "LineItem" li ON p.id = li.product_id
      LEFT JOIN "Order" o ON li.order_id = o.id
      WHERE o.merchant_id = ${merchantId}
        AND o.created_at >= ${filters.startDate}::timestamp
        AND o.created_at <= ${filters.endDate}::timestamp
        AND o.financial_status = 'paid'
      GROUP BY p.id, p.title, p.handle, p.product_type
      ORDER BY total_revenue DESC
    `

    // Get previous period data for comparison
    const startDate = new Date(filters.startDate)
    const endDate = new Date(filters.endDate)
    const periodLength = endDate.getTime() - startDate.getTime()
    const previousStartDate = new Date(startDate.getTime() - periodLength)
    const previousEndDate = new Date(startDate.getTime())

    const previousProducts = await prisma.$queryRaw<any[]>`
      SELECT 
        p.id,
        COALESCE(SUM(li.price * li.quantity), 0) as total_revenue,
        COALESCE(SUM(li.quantity), 0) as units_sold
      FROM "Product" p
      LEFT JOIN "LineItem" li ON p.id = li.product_id
      LEFT JOIN "Order" o ON li.order_id = o.id
      WHERE o.merchant_id = ${merchantId}
        AND o.created_at >= ${previousStartDate.toISOString()}::timestamp
        AND o.created_at <= ${previousEndDate.toISOString()}::timestamp
        AND o.financial_status = 'paid'
      GROUP BY p.id
    `

    // Create a map for previous period data
    const previousDataMap = new Map()
    previousProducts.forEach(product => {
      previousDataMap.set(product.id, {
        revenue: Number(product.total_revenue),
        units: Number(product.units_sold)
      })
    })

    // Process current products with growth calculations
    const products: ProductMetrics[] = currentProducts.map(product => {
      const currentRevenue = Number(product.total_revenue)
      const currentUnits = Number(product.units_sold)
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
        avgPrice: Number(product.avg_price),
        profitMargin: Number(product.profit_margin),
        growthRate,
        performanceScore: Number(product.performance_score)
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
    const trendData = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE(o.created_at) as date,
        SUM(li.price * li.quantity) as revenue,
        SUM(li.quantity) as units
      FROM "Order" o
      JOIN "LineItem" li ON o.id = li.order_id
      WHERE o.merchant_id = ${merchantId}
        AND li.product_id = ANY(${topProductIds})
        AND o.created_at >= ${filters.startDate}::timestamp
        AND o.created_at <= ${filters.endDate}::timestamp
        AND o.financial_status = 'paid'
      GROUP BY DATE(o.created_at)
      ORDER BY date
    `

    const topProductsTrend: ProductTrend[] = trendData.map(row => ({
      date: row.date.toISOString().split('T')[0],
      revenue: Number(row.revenue),
      units: Number(row.units)
    }))

    // Calculate summary metrics
    const currentSummary = {
      totalProducts: products.length,
      totalRevenue: products.reduce((sum, p) => sum + p.totalRevenue, 0),
      totalUnitsSold: products.reduce((sum, p) => sum + p.unitsSold, 0),
      avgProfitMargin: products.length > 0 ? products.reduce((sum, p) => sum + p.profitMargin, 0) / products.length : 0
    }

    const previousSummary = {
      totalProducts: previousProducts.length,
      totalRevenue: previousProducts.reduce((sum, p) => sum + Number(p.total_revenue), 0),
      totalUnitsSold: previousProducts.reduce((sum, p) => sum + Number(p.units_sold), 0),
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