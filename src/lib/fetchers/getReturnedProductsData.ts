import { createClient } from '@/util/supabase/component'

export interface ReturnReason {
  reason: string
  count: number
  totalValue: number
  percentage: number
}

export interface ReturnedProduct {
  id: string
  name: string
  sku: string
  category?: string
  totalReturns: number
  totalReturnValue: number
  returnRate: number
  avgReturnValue: number
  returnReasons: ReturnReason[]
}

export interface ReturnedProductsData {
  products: ReturnedProduct[]
  totalReturns: number
  totalReturnValue: number
  avgReturnRate: number
}

export async function getReturnedProductsData(
  merchantId: string,
  filters: { startDate: string; endDate: string }
): Promise<ReturnedProductsData> {
  console.log('🔄 Fetching returned products data for merchant:', merchantId, 'with filters:', filters)

  const supabase = createClient()

  try {
    // First, let's check if we have any refunds data at all
    const { data: allRefunds, error: allRefundsError } = await supabase
      .from('refunds')
      .select('*')
      .eq('merchant_id', merchantId)
      .limit(5)

    console.log('🔍 All refunds check:', { data: allRefunds, error: allRefundsError })

    // If refunds table doesn't exist or has no data, return empty structure
    if (allRefundsError || !allRefunds || allRefunds.length === 0) {
      console.log('📭 No refunds data available')
      return {
        products: [],
        totalReturns: 0,
        totalReturnValue: 0,
        avgReturnRate: 0
      }
    }

    // Get refunds data
    const { data: refunds, error: refundsError } = await supabase
      .from('refunds')
      .select(`
        id,
        product_id,
        amount,
        reason,
        created_at
      `)
      .eq('merchant_id', merchantId)
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate)

    if (refundsError) {
      console.error('❌ Error fetching refunds:', refundsError)
      // If there's an error, return empty structure instead of throwing
      return {
        products: [],
        totalReturns: 0,
        totalReturnValue: 0,
        avgReturnRate: 0
      }
    }

    if (!refunds || refunds.length === 0) {
      console.log('📭 No refunds found for the specified period')
      return {
        products: [],
        totalReturns: 0,
        totalReturnValue: 0,
        avgReturnRate: 0
      }
    }

    // Get unique product IDs from refunds
    const productIds = [...new Set(refunds.map(refund => refund.product_id).filter(Boolean))]
    console.log('🔍 Product IDs from refunds:', productIds)
    
    // Get product information for the refunded products
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, name, category')
      .eq('merchant_id', merchantId)
      .in('id', productIds)

    console.log('🔍 Products data response:', { data: productsData, error: productsError })

    // Create products map for easy lookup
    const productsMap = new Map()
    if (productsData && !productsError) {
      productsData.forEach((product: any) => {
        productsMap.set(product.id, product)
      })
    }
    console.log('🔍 Products map size:', productsMap.size)

    // Get total sales data for return rate calculation
    const { data: salesData, error: salesError } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        price,
        orders!inner(created_at, merchant_id)
      `)
      .eq('orders.merchant_id', merchantId)
      .gte('orders.created_at', filters.startDate)
      .lte('orders.created_at', filters.endDate)

    // Create sales map for return rate calculation
    const salesMap = new Map<string, { quantity: number; revenue: number }>()
    if (salesData && !salesError) {
      salesData.forEach((item: any) => {
        const productId = item.product_id
        const existing = salesMap.get(productId) || { quantity: 0, revenue: 0 }
        salesMap.set(productId, {
          quantity: existing.quantity + (item.quantity || 0),
          revenue: existing.revenue + ((item.quantity || 0) * (item.price || 0))
        })
      })
    }

    // Group refunds by product
    const productReturnsMap = new Map<string, {
      product: any
      refunds: any[]
      totalCount: number
      totalValue: number
      reasons: Map<string, { count: number; value: number }>
    }>()

    refunds.forEach((refundItem: any) => {
      const productId = refundItem.product_id
      const product = productsMap.get(productId)
      
      if (!productReturnsMap.has(productId)) {
        productReturnsMap.set(productId, {
          product,
          refunds: [],
          totalCount: 0,
          totalValue: 0,
          reasons: new Map()
        })
      }

      const productData = productReturnsMap.get(productId)!
      productData.refunds.push(refundItem)
      productData.totalCount += 1 // Each refund record represents one return
      productData.totalValue += refundItem.amount || 0

      // Track return reasons
      const reason = refundItem.reason || 'Unknown'
      const existingReason = productData.reasons.get(reason) || { count: 0, value: 0 }
      productData.reasons.set(reason, {
        count: existingReason.count + 1, // Count each refund as one return
        value: existingReason.value + (refundItem.amount || 0)
      })
    })

    // Convert to ReturnedProduct array
    const products: ReturnedProduct[] = Array.from(productReturnsMap.entries()).map(([productId, data]) => {
      const salesInfo = salesMap.get(productId) || { quantity: 0, revenue: 0 }
      const returnRate = salesInfo.quantity > 0 ? (data.totalCount / salesInfo.quantity) * 100 : 0

      // Convert reasons map to array
      const returnReasons: ReturnReason[] = Array.from(data.reasons.entries()).map(([reason, reasonData]) => ({
        reason,
        count: reasonData.count,
        totalValue: reasonData.value,
        percentage: data.totalCount > 0 ? (reasonData.count / data.totalCount) * 100 : 0
      })).sort((a, b) => b.count - a.count)

      return {
        id: productId,
        name: data.product?.name || 'Unknown Product',
        sku: productId, // Use product ID as SKU since sku column doesn't exist
        category: data.product?.category,
        totalReturns: data.totalCount,
        totalReturnValue: data.totalValue,
        returnRate,
        avgReturnValue: data.totalCount > 0 ? data.totalValue / data.totalCount : 0,
        returnReasons
      }
    }).sort((a, b) => b.totalReturns - a.totalReturns)

    // Calculate summary metrics
    const totalReturns = products.reduce((sum, p) => sum + p.totalReturns, 0)
    const totalReturnValue = products.reduce((sum, p) => sum + p.totalReturnValue, 0)
    const avgReturnRate = products.length > 0 ? products.reduce((sum, p) => sum + p.returnRate, 0) / products.length : 0

    console.log('✅ Returned products data loaded successfully')

    return {
      products,
      totalReturns,
      totalReturnValue,
      avgReturnRate
    }

  } catch (error) {
    console.error('❌ Error in getReturnedProductsData:', error)
    // Return empty structure instead of throwing error
    return {
      products: [],
      totalReturns: 0,
      totalReturnValue: 0,
      avgReturnRate: 0
    }
  }
}