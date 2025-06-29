// Demo data generator for when database is empty
export interface DemoKPIs {
  revenueToday: number
  ordersToday: number
  newCustomers: number
  avgOrderValue7d: number
}

export interface DemoTrendData {
  date: string
  total_revenue: number
  total_orders: number
}

export interface DemoSegmentData {
  customer_segment: string
  orders_count: number
  percentage: number
}

export interface DemoProductData {
  product: string
  unitsSold: number
  revenue: number
  aov: number
  refunds: number
  repeatOrderRate: number
  trend: number[]
}

export function generateDemoKPIs(): DemoKPIs {
  return {
    revenueToday: Math.floor(Math.random() * 5000) + 1000,
    ordersToday: Math.floor(Math.random() * 50) + 10,
    newCustomers: Math.floor(Math.random() * 20) + 5,
    avgOrderValue7d: Math.floor(Math.random() * 100) + 50
  }
}

export function generateDemoTrendData(days: number = 30): DemoTrendData[] {
  const data: DemoTrendData[] = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    data.push({
      date: date.toISOString().split('T')[0],
      total_revenue: Math.floor(Math.random() * 3000) + 500,
      total_orders: Math.floor(Math.random() * 40) + 5
    })
  }
  
  return data
}

export function generateDemoSegmentData(): DemoSegmentData[] {
  const segments = [
    { customer_segment: 'new', orders_count: 45, percentage: 35.0 },
    { customer_segment: 'returning', orders_count: 52, percentage: 40.0 },
    { customer_segment: 'vip', orders_count: 20, percentage: 15.0 },
    { customer_segment: 'at_risk', orders_count: 13, percentage: 10.0 }
  ]
  
  return segments
}

export function generateDemoProductData(): DemoProductData[] {
  const products = [
    'Premium Wireless Headphones',
    'Smart Fitness Tracker',
    'Organic Coffee Blend',
    'Eco-Friendly Water Bottle',
    'Bluetooth Speaker',
    'Yoga Mat Pro',
    'Protein Powder',
    'LED Desk Lamp'
  ]
  
  return products.slice(0, 5).map(product => ({
    product,
    unitsSold: Math.floor(Math.random() * 200) + 50,
    revenue: Math.floor(Math.random() * 10000) + 2000,
    aov: Math.floor(Math.random() * 100) + 40,
    refunds: Math.floor(Math.random() * 10),
    repeatOrderRate: Math.floor(Math.random() * 40) + 10,
    trend: Array.from({ length: 7 }, () => Math.floor(Math.random() * 1000) + 100)
  }))
}

export function generateDemoAICommentary() {
  const commentaries = [
    "Revenue is trending upward with strong performance in electronics. Customer retention looks healthy with 15% repeat purchase rate.",
    "Sales have been steady this month. Consider focusing on customer acquisition to boost growth in the coming weeks.",
    "Excellent growth in premium products! Your VIP customers are driving significant revenue. Keep nurturing these relationships.",
    "Revenue dipped slightly but order volume remained stable, indicating customers are choosing lower-priced items. Consider promotional strategies."
  ]
  
  return {
    revenueChange: (Math.random() - 0.5) * 20, // -10% to +10%
    topProduct: 'Premium Wireless Headphones',
    topProductGrowth: Math.random() * 25 + 5, // 5% to 30%
    customerChurnIndicator: Math.floor(Math.random() * 15) + 5,
    commentary: commentaries[Math.floor(Math.random() * commentaries.length)]
  }
}