import { supabase } from '../supabaseClient'
import { FilterState } from './getKpis'

export async function getProductData(filters: FilterState, merchant_id?: string) {
  try {
    // Fetch order items with product details
    let orderItemsQuery = supabase
      .from('order_items')
      .select(`
        *,
        orders!inner(created_at, customer_id, merchant_id),
        products(name)
      `)
      .gte('orders.created_at', filters.startDate)
      .lte('orders.created_at', filters.endDate)

    // Apply merchant_id filter
    if (merchant_id) {
      orderItemsQuery = orderItemsQuery.eq('orders.merchant_id', merchant_id)
    }

    const { data: orderItems, error } = await orderItemsQuery

    if (error) {
      console.error('Error fetching product data:', error)
      console.error('Error details:', error)
      throw error
    }

    if (!orderItems || orderItems.length === 0) {
      console.log('No order items found, returning empty array')
      return []
    }

    // Group by product and calculate metrics
    const productGroups = orderItems.reduce((acc, item) => {
      const productName = item.products?.name || 'Unknown Product'
      
      if (!acc[productName]) {
        acc[productName] = {
          product: productName,
          unitsSold: 0,
          revenue: 0,
          orders: new Set(),
          customers: new Set(),
          refunds: 0,
          trend: []
        }
      }
      
      acc[productName].unitsSold += item.quantity || 0
      acc[productName].revenue += (item.price || 0) * (item.quantity || 0)
      acc[productName].orders.add(item.order_id)
      if (item.orders?.customer_id) {
        acc[productName].customers.add(item.orders.customer_id)
      }
      
      return acc
    }, {} as Record<string, any>)

    // Fetch refunds by product (simplified - distribute evenly for demo)
    let refundsQuery = supabase
      .from('refunds')
      .select('amount, product_id')
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate)

    if (merchant_id) {
      refundsQuery = refundsQuery.eq('merchant_id', merchant_id)
    }

    const { data: refunds } = await refundsQuery
    const totalRefunds = refunds?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0

    // Calculate repeat order rates and format data
    const result = Object.values(productGroups).map((group: any) => {
      // Calculate repeat order rate for this product
      const customerOrderCounts = Array.from(group.customers).length
      const totalOrders = group.orders.size
      const repeatOrderRate = customerOrderCounts > 0 ? 
        Math.max(0, Math.min(100, ((totalOrders - customerOrderCounts) / customerOrderCounts) * 100)) : 0

      // Distribute refunds evenly across products for demo
      const productRefunds = Math.floor(totalRefunds / Object.keys(productGroups).length)

      // Generate trend data (simplified - would need historical data)
      const trend: number[] = [] // No fallback data - return empty array if no real data

      return {
        product: group.product,
        unitsSold: group.unitsSold,
        revenue: parseFloat(group.revenue.toFixed(2)),
        aov: parseFloat((group.revenue / group.orders.size).toFixed(2)),
        refunds: productRefunds,
        repeatOrderRate: parseFloat(repeatOrderRate.toFixed(1)),
        trend,
        // Additional metadata for drill-through
        orderCount: totalOrders,
        customerCount: customerOrderCounts,
        avgOrderValue: parseFloat((group.revenue / group.orders.size).toFixed(2))
      }
    })

    return result.sort((a, b) => b.revenue - a.revenue).slice(0, 10) // Top 10 products
  } catch (error) {
    console.error('Error fetching product data:', error)
    throw error
  }
}