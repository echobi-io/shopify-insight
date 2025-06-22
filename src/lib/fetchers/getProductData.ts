import { supabase } from '../supabaseClient'
import { FilterState } from './getKpis'

export async function getProductData(filters: FilterState) {
  try {
    // Mock implementation - replace with actual Supabase queries
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400))
    
    // Return mock data that matches the expected structure
    return [
      { 
        product: 'Stainless Travel Mug', 
        unitsSold: 421, 
        revenue: 8715, 
        aov: 20.7, 
        refunds: 122, 
        repeatOrderRate: 61,
        trend: [20, 25, 22, 28, 32, 29, 35, 31, 28, 33, 30, 35]
      },
      { 
        product: 'Kids Water Bottle', 
        unitsSold: 188, 
        revenue: 3029, 
        aov: 16.1, 
        refunds: 0, 
        repeatOrderRate: 71,
        trend: [15, 18, 16, 20, 22, 19, 25, 23, 21, 24, 22, 26]
      },
      { 
        product: 'Premium Coffee Beans', 
        unitsSold: 312, 
        revenue: 7488, 
        aov: 24.0, 
        refunds: 45, 
        repeatOrderRate: 84,
        trend: [18, 22, 20, 24, 28, 26, 32, 30, 28, 31, 29, 33]
      },
      { 
        product: 'Eco Tote Bag', 
        unitsSold: 156, 
        revenue: 1872, 
        aov: 12.0, 
        refunds: 12, 
        repeatOrderRate: 45,
        trend: [8, 10, 9, 12, 14, 13, 16, 15, 14, 16, 15, 18]
      },
      { 
        product: 'Wireless Earbuds', 
        unitsSold: 89, 
        revenue: 7120, 
        aov: 80.0, 
        refunds: 320, 
        repeatOrderRate: 38,
        trend: [5, 7, 6, 8, 10, 9, 12, 11, 10, 12, 11, 13]
      }
    ]
    
    // Example of actual Supabase queries (commented out):
    /*
    const { data: orderItems } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        price,
        orders!inner(created_at, customer_id),
        products!inner(name)
      `)
      .gte('orders.created_at', filters.startDate)
      .lte('orders.created_at', filters.endDate)

    const productStats = orderItems?.reduce((acc, item) => {
      const productName = item.products.name
      if (!acc[productName]) {
        acc[productName] = {
          product: productName,
          unitsSold: 0,
          revenue: 0,
          orders: 0,
          customers: new Set(),
          refunds: 0
        }
      }
      
      acc[productName].unitsSold += item.quantity
      acc[productName].revenue += item.price * item.quantity
      acc[productName].orders += 1
      acc[productName].customers.add(item.orders.customer_id)
      
      return acc
    }, {} as Record<string, any>) || {}

    return Object.values(productStats).map((product: any) => ({
      ...product,
      aov: product.revenue / product.orders,
      repeatOrderRate: 65, // Calculate from repeat order data
      trend: Array.from({ length: 12 }, () => Math.floor(Math.random() * 30) + 10)
    }))
    */
  } catch (error) {
    console.error('Error fetching product data:', error)
    throw error
  }
}