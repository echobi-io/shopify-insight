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
    // First, let's check if we have any returns data at all
    const { data: allReturns, error: allReturnsError } = await supabase
      .from('returns')
      .select('*')
      .eq('merchant_id', merchantId)
      .limit(5)

    console.log('🔍 All returns check:', { data: allReturns, error: allReturnsError })

    // If returns table doesn't exist or has no data, return empty structure
    if (allReturnsError || !allReturns || allReturns.length === 0) {
      console.log('📭 No returns data available')
      return {
        products: [],
        totalReturns: 0,
        totalReturnValue: 0,
        avgReturnRate: 0
      }
    }

    // Get returns data with product information
    const { data: returns, error: returnsError } = await supabase
      .from('returns')
      .select(`
        id,
        product_id,
        quantity,
        reason,
        refund_amount,
        created_at,
        products!inner(id, name, category)
      `)
      .eq('merchant_id', merchantId)
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate)

    if (returnsError) {
      console.error('❌ Error fetching returns:', returnsError)
      // If there's an error, return empty structure instead of throwing
      return {
        products: [],
        totalReturns: 0,
        totalReturnValue: 0,
        avgReturnRate: 0
      }
    }

    if (!returns || returns.length === 0) {
      console.log('📭 No returns found for the specified period')
      return {
        products: [],
        totalReturns: 0,
        totalReturnValue: 0,
        avgReturnRate: 0
      }
    }

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

    // Group returns by product
    const productReturnsMap = new Map<string, {
      product: any
      returns: any[]
      totalQuantity: number
      totalValue: number
      reasons: Map<string, { count: number; value: number }>
    }>()

    returns.forEach((returnItem: any) => {
      const productId = returnItem.product_id
      const product = returnItem.products
      
      if (!productReturnsMap.has(productId)) {
        productReturnsMap.set(productId, {
          product,
          returns: [],
          totalQuantity: 0,
          totalValue: 0,
          reasons: new Map()
        })
      }

      const productData = productReturnsMap.get(productId)!
      productData.returns.push(returnItem)
      productData.totalQuantity += returnItem.quantity || 0
      productData.totalValue += returnItem.refund_amount || 0

      // Track return reasons
      const reason = returnItem.reason || 'Unknown'
      const existingReason = productData.reasons.get(reason) || { count: 0, value: 0 }
      productData.reasons.set(reason, {
        count: existingReason.count + (returnItem.quantity || 0),
        value: existingReason.value + (returnItem.refund_amount || 0)
      })
    })

    // Convert to ReturnedProduct array
    const products: ReturnedProduct[] = Array.from(productReturnsMap.entries()).map(([productId, data]) => {
      const salesInfo = salesMap.get(productId) || { quantity: 0, revenue: 0 }
      const returnRate = salesInfo.quantity > 0 ? (data.totalQuantity / salesInfo.quantity) * 100 : 0

      // Convert reasons map to array
      const returnReasons: ReturnReason[] = Array.from(data.reasons.entries()).map(([reason, reasonData]) => ({
        reason,
        count: reasonData.count,
        totalValue: reasonData.value,
        percentage: data.totalQuantity > 0 ? (reasonData.count / data.totalQuantity) * 100 : 0
      })).sort((a, b) => b.count - a.count)

      return {
        id: productId,
        name: data.product?.name || 'Unknown Product',
        sku: productId, // Using product ID as SKU fallback
        category: data.product?.category,
        totalReturns: data.totalQuantity,
        totalReturnValue: data.totalValue,
        returnRate,
        avgReturnValue: data.totalQuantity > 0 ? data.totalValue / data.totalQuantity : 0,
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