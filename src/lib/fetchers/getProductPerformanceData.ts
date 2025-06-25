import { supabase } from '../supabaseClient'
import { FilterState } from './getKpis'

export interface ProductPerformanceData {
  // KPI Tiles Data
  topProductBySales: {
    name: string
    revenue: number
  }
  mostSoldProduct: {
    name: string
    unitsSold: number
  }
  highestAOVProduct: {
    name: string
    aov: number
  }
  highestRefundRateProduct: {
    name: string
    refundRate: number
  }
  
  // Top Products Table Data
  topProducts: Array<{
    id: string
    product: string
    totalRevenue: number
    orders: number
    unitsSold: number
    aov: number
    refundRate: number
    firstOrdered: string
    lastOrdered: string
    trend: number[]
  }>
  
  // Product Sales Trend Data
  productTrendData: Array<{
    date: string
    [productName: string]: number | string
  }>
  
  // Product Churn & Repurchase Data
  productRepurchaseData: Array<{
    product: string
    repurchaseRate: number
    medianDaysBetweenOrders: number
    customersWhoReordered: number
    totalCustomers: number
  }>
  
  // Product Segmentation Data
  productSegmentData: Array<{
    product: string
    newCustomers: number
    returningCustomers: number
    vipCustomers: number
    atRiskCustomers: number
  }>
}

export async function getProductPerformanceData(filters: FilterState, merchant_id?: string): Promise<ProductPerformanceData> {
  try {
    // Fetch comprehensive product data with all related information
    let orderItemsQuery = supabase
      .from('order_line_items')
      .select(`
        *,
        orders!inner(
          id,
          created_at,
          customer_id,
          merchant_id,
          status
        ),
        products!inner(
          id,
          name,
          category,
          price as product_price
        )
      `)
      .gte('orders.created_at', filters.startDate)
      .lte('orders.created_at', filters.endDate)

    // Apply merchant_id filter
    if (merchant_id) {
      orderItemsQuery = orderItemsQuery.eq('orders.merchant_id', merchant_id)
    }

    const { data: orderItems, error: orderItemsError } = await orderItemsQuery

    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError)
      console.error('Error details:', orderItemsError)
      throw orderItemsError
    }

    // Fetch refunds data
    let refundsQuery = supabase
      .from('refunds')
      .select(`
        *,
        products!inner(name)
      `)
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate)

    if (merchant_id) {
      refundsQuery = refundsQuery.eq('merchant_id', merchant_id)
    }

    const { data: refunds, error: refundsError } = await refundsQuery

    if (refundsError) {
      console.error('Error fetching refunds:', refundsError)
    }

    if (!orderItems || orderItems.length === 0) {
      console.log('No order items found for product performance. Filters:', filters, 'merchant_id:', merchant_id)
      return getEmptyProductPerformanceData()
    }

    // Group data by product
    const productGroups = orderItems.reduce((acc, item) => {
      const productId = item.products.id
      const productName = item.products.name
      
      if (!acc[productId]) {
        acc[productId] = {
          id: productId,
          name: productName,
          category: item.products.category,
          unitsSold: 0,
          revenue: 0,
          orders: new Set(),
          customers: new Set(),
          customerSegments: {
            new: new Set(),
            returning: new Set(),
            vip: new Set(),
            at_risk: new Set()
          },
          orderDates: [],
          customerOrderHistory: {} as Record<string, string[]>
        }
      }
      
      const group = acc[productId]
      group.unitsSold += item.quantity || 0
      group.revenue += (item.price || 0) * (item.quantity || 0)
      group.orders.add(item.orders.id)
      
      if (item.orders.customer_id) {
        group.customers.add(item.orders.customer_id)
        
        // Track customer segments
        const segment = item.orders.customer_segment || 'new'
        if (group.customerSegments[segment as keyof typeof group.customerSegments]) {
          group.customerSegments[segment as keyof typeof group.customerSegments].add(item.orders.customer_id)
        }
        
        // Track customer order history for repurchase analysis
        if (!group.customerOrderHistory[item.orders.customer_id]) {
          group.customerOrderHistory[item.orders.customer_id] = []
        }
        group.customerOrderHistory[item.orders.customer_id].push(item.orders.created_at)
      }
      
      group.orderDates.push(item.orders.created_at)
      
      return acc
    }, {} as Record<string, any>)

    // Process refunds by product
    const refundsByProduct = refunds?.reduce((acc, refund) => {
      const productName = refund.products?.name
      if (productName) {
        if (!acc[productName]) {
          acc[productName] = { amount: 0, count: 0 }
        }
        acc[productName].amount += refund.amount || 0
        acc[productName].count += 1
      }
      return acc
    }, {} as Record<string, { amount: number, count: number }>) || {}

    // Calculate metrics for each product
    const productMetrics = Object.values(productGroups).map((group: any) => {
      const orderCount = group.orders.size
      const customerCount = group.customers.size
      const aov = orderCount > 0 ? group.revenue / orderCount : 0
      
      // Calculate refund rate
      const productRefunds = refundsByProduct[group.name] || { amount: 0, count: 0 }
      const refundRate = group.unitsSold > 0 ? (productRefunds.count / group.unitsSold) * 100 : 0
      
      // Calculate repurchase metrics
      const customersWithMultipleOrders = Object.values(group.customerOrderHistory)
        .filter((dates: any) => dates.length > 1).length
      const repurchaseRate = customerCount > 0 ? (customersWithMultipleOrders / customerCount) * 100 : 0
      
      // Calculate median days between orders
      const daysBetweenOrders: number[] = []
      Object.values(group.customerOrderHistory).forEach((dates: any) => {
        if (dates.length > 1) {
          const sortedDates = dates.sort()
          for (let i = 1; i < sortedDates.length; i++) {
            const daysDiff = Math.floor(
              (new Date(sortedDates[i]).getTime() - new Date(sortedDates[i-1]).getTime()) / (1000 * 60 * 60 * 24)
            )
            daysBetweenOrders.push(daysDiff)
          }
        }
      })
      
      const medianDaysBetweenOrders = daysBetweenOrders.length > 0 
        ? daysBetweenOrders.sort((a, b) => a - b)[Math.floor(daysBetweenOrders.length / 2)]
        : 0

      // Generate trend data (simplified - based on order dates distribution)
      const trend = generateTrendData(group.orderDates)
      
      // Get first and last order dates
      const sortedDates = group.orderDates.sort()
      const firstOrdered = sortedDates[0]
      const lastOrdered = sortedDates[sortedDates.length - 1]

      return {
        id: group.id,
        product: group.name,
        totalRevenue: parseFloat(group.revenue.toFixed(2)),
        orders: orderCount,
        unitsSold: group.unitsSold,
        aov: parseFloat(aov.toFixed(2)),
        refundRate: parseFloat(refundRate.toFixed(2)),
        firstOrdered,
        lastOrdered,
        trend,
        repurchaseRate: parseFloat(repurchaseRate.toFixed(1)),
        medianDaysBetweenOrders,
        customersWhoReordered: customersWithMultipleOrders,
        totalCustomers: customerCount,
        customerSegments: {
          newCustomers: group.customerSegments.new.size,
          returningCustomers: group.customerSegments.returning.size,
          vipCustomers: group.customerSegments.vip.size,
          atRiskCustomers: group.customerSegments.at_risk.size
        }
      }
    })

    // Sort products by revenue
    const sortedProducts = productMetrics.sort((a, b) => b.totalRevenue - a.totalRevenue)

    // Generate KPI data
    const topProductBySales = sortedProducts[0] || { product: 'N/A', totalRevenue: 0 }
    const mostSoldProduct = [...productMetrics].sort((a, b) => b.unitsSold - a.unitsSold)[0] || { product: 'N/A', unitsSold: 0 }
    const highestAOVProduct = [...productMetrics].sort((a, b) => b.aov - a.aov)[0] || { product: 'N/A', aov: 0 }
    const highestRefundRateProduct = [...productMetrics].sort((a, b) => b.refundRate - a.refundRate)[0] || { product: 'N/A', refundRate: 0 }

    // Generate trend data for top products
    const productTrendData = generateProductTrendData(sortedProducts.slice(0, 5), filters)

    // Prepare repurchase data
    const productRepurchaseData = sortedProducts.slice(0, 10).map(product => ({
      product: product.product,
      repurchaseRate: product.repurchaseRate,
      medianDaysBetweenOrders: product.medianDaysBetweenOrders,
      customersWhoReordered: product.customersWhoReordered,
      totalCustomers: product.totalCustomers
    }))

    // Prepare segmentation data
    const productSegmentData = sortedProducts.slice(0, 10).map(product => ({
      product: product.product,
      newCustomers: product.customerSegments.newCustomers,
      returningCustomers: product.customerSegments.returningCustomers,
      vipCustomers: product.customerSegments.vipCustomers,
      atRiskCustomers: product.customerSegments.atRiskCustomers
    }))

    return {
      topProductBySales: {
        name: topProductBySales.product,
        revenue: topProductBySales.totalRevenue
      },
      mostSoldProduct: {
        name: mostSoldProduct.product,
        unitsSold: mostSoldProduct.unitsSold
      },
      highestAOVProduct: {
        name: highestAOVProduct.product,
        aov: highestAOVProduct.aov
      },
      highestRefundRateProduct: {
        name: highestRefundRateProduct.product,
        refundRate: highestRefundRateProduct.refundRate
      },
      topProducts: sortedProducts.slice(0, 20), // Top 20 products
      productTrendData,
      productRepurchaseData,
      productSegmentData
    }

  } catch (error) {
    console.error('Error fetching product performance data:', error)
    throw error
  }
}

function generateTrendData(orderDates: string[]): number[] {
  // Generate a 12-point trend based on order distribution
  const trend = Array(12).fill(0)
  
  if (orderDates.length === 0) return trend
  
  // Distribute orders across 12 periods
  orderDates.forEach((date, index) => {
    const periodIndex = Math.floor((index / orderDates.length) * 12)
    trend[Math.min(periodIndex, 11)]++
  })
  
  // Smooth the trend and add some variation
  return trend.map((value, index) => {
    const baseValue = Math.max(1, value * 5) // Scale up
    const variation = Math.random() * 10 - 5 // Add some randomness
    return Math.max(1, Math.floor(baseValue + variation))
  })
}

function generateProductTrendData(products: any[], filters: FilterState) {
  // Generate daily trend data for the date range
  const startDate = new Date(filters.startDate)
  const endDate = new Date(filters.endDate)
  const trendData = []
  
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const dataPoint: any = { date: dateStr }
    
    // Add revenue data for each product (simplified simulation)
    products.forEach(product => {
      const dailyRevenue = (product.totalRevenue / 30) * (0.5 + Math.random()) // Simulate daily variation
      dataPoint[product.product] = Math.floor(dailyRevenue)
    })
    
    trendData.push(dataPoint)
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return trendData.slice(0, 30) // Limit to 30 days for performance
}

function getEmptyProductPerformanceData(): ProductPerformanceData {
  return {
    topProductBySales: { name: 'N/A', revenue: 0 },
    mostSoldProduct: { name: 'N/A', unitsSold: 0 },
    highestAOVProduct: { name: 'N/A', aov: 0 },
    highestRefundRateProduct: { name: 'N/A', refundRate: 0 },
    topProducts: [],
    productTrendData: [],
    productRepurchaseData: [],
    productSegmentData: []
  }
}