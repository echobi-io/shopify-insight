import { supabase } from '../supabaseClient'
import { FilterState } from './getKpis'

export interface DrillThroughData {
  type: string
  title: string
  subtitle: string
  value: string
  change: string
  changeType: 'positive' | 'negative'
  data: any[]
  timeSeriesData: any[]
  filters: any
}

const MERCHANT_ID = '11111111-1111-1111-1111-111111111111'

export async function getDrillThroughData(
  type: string, 
  filters: FilterState, 
  additionalFilters?: any
): Promise<DrillThroughData | null> {
  try {
    const baseData = {
      filters: {
        dateRange: `${filters.startDate} to ${filters.endDate}`,
        segment: filters.segment,
        ...additionalFilters
      }
    }

    switch (type) {
      case 'revenue_today':
        return await getRevenueTodayDrillThrough(filters, baseData)
      
      case 'orders_today':
        return await getOrdersTodayDrillThrough(filters, baseData)
      
      case 'new_customers':
        return await getNewCustomersDrillThrough(filters, baseData)
      
      case 'avg_order_value':
        return await getAOVDrillThrough(filters, baseData)
      
      case 'filtered_revenue':
        return await getFilteredRevenueDrillThrough(filters, baseData)
      
      case 'filtered_orders':
        return await getFilteredOrdersDrillThrough(filters, baseData)
      
      case 'filtered_customers':
        return await getFilteredCustomersDrillThrough(filters, baseData)
      
      case 'filtered_aov':
        return await getFilteredAOVDrillThrough(filters, baseData)
      
      default:
        return null
    }
  } catch (error) {
    console.error('Error fetching drill-through data:', error)
    return null
  }
}

async function getRevenueTodayDrillThrough(filters: FilterState, baseData: any): Promise<DrillThroughData> {
  const today = new Date().toISOString().split('T')[0]
  
  console.log('🔍 Fetching revenue today drill-through for date:', today)
  
  // Get today's orders with left join to profiles
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      total_price,
      created_at,
      status,
      customer_id,
      profiles!left(first_name, last_name, email)
    `)
    .eq('merchant_id', MERCHANT_ID)
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lte('created_at', `${today}T23:59:59.999Z`)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('❌ Error fetching today revenue orders:', error)
    return createEmptyDrillThrough('revenue', 'Revenue Today', 'Error loading data')
  }

  console.log('✅ Revenue today orders fetched:', orders?.length || 0, 'orders')
  console.log('📊 Sample order data:', orders?.[0])

  const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0

  // Create hourly time series data
  const timeSeriesData = Array.from({ length: 24 }, (_, hour) => {
    const hourOrders = orders?.filter(order => 
      new Date(order.created_at).getHours() === hour
    ) || []
    
    return {
      time: `${String(hour).padStart(2, '0')}:00`,
      revenue: hourOrders.reduce((sum, order) => sum + (order.total_price || 0), 0),
      orders: hourOrders.length
    }
  })

  return {
    type: 'revenue',
    title: 'Revenue Today - Detailed Breakdown',
    subtitle: `All revenue transactions for ${today}`,
    value: `$${totalRevenue.toLocaleString()}`,
    change: calculateDayOverDayChange(totalRevenue, 'revenue'),
    changeType: 'positive',
    filters: baseData.filters,
    timeSeriesData,
    data: orders?.map(order => ({
      date: new Date(order.created_at).toLocaleDateString(),
      time: new Date(order.created_at).toLocaleTimeString(),
      order_id: order.order_number || order.id,
      customer: `${order.profiles?.first_name || ''} ${order.profiles?.last_name || ''}`.trim() || order.profiles?.email || 'Unknown Customer',
      value: order.total_price || 0,
      status: order.status || 'unknown'
    })) || []
  }
}

async function getOrdersTodayDrillThrough(filters: FilterState, baseData: any): Promise<DrillThroughData> {
  const today = new Date().toISOString().split('T')[0]
  
  console.log('🔍 Fetching orders today drill-through for date:', today)
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      total_price,
      created_at,
      status,
      customer_id,
      profiles!left(first_name, last_name, email)
    `)
    .eq('merchant_id', MERCHANT_ID)
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lte('created_at', `${today}T23:59:59.999Z`)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('❌ Error fetching today orders:', error)
    return createEmptyDrillThrough('orders', 'Orders Today', 'Error loading data')
  }

  console.log('✅ Orders today fetched:', orders?.length || 0, 'orders')

  // Create hourly time series data
  const timeSeriesData = Array.from({ length: 24 }, (_, hour) => {
    const hourOrders = orders?.filter(order => 
      new Date(order.created_at).getHours() === hour
    ) || []
    
    return {
      time: `${String(hour).padStart(2, '0')}:00`,
      orders: hourOrders.length,
      revenue: hourOrders.reduce((sum, order) => sum + (order.total_price || 0), 0)
    }
  })

  return {
    type: 'orders',
    title: 'Orders Today - Detailed View',
    subtitle: `All orders placed on ${today}`,
    value: orders?.length.toString() || '0',
    change: calculateDayOverDayChange(orders?.length || 0, 'orders'),
    changeType: 'positive',
    filters: baseData.filters,
    timeSeriesData,
    data: orders?.map(order => ({
      date: new Date(order.created_at).toLocaleDateString(),
      time: new Date(order.created_at).toLocaleTimeString(),
      order_id: order.order_number || order.id,
      customer: `${order.profiles?.first_name || ''} ${order.profiles?.last_name || ''}`.trim() || order.profiles?.email || 'Unknown Customer',
      items: 1, // Default to 1 item per order since we don't have line items data
      value: order.total_price || 0,
      status: order.status || 'unknown'
    })) || []
  }
}

async function getNewCustomersDrillThrough(filters: FilterState, baseData: any): Promise<DrillThroughData> {
  const today = new Date().toISOString().split('T')[0]
  
  console.log('🔍 Fetching new customers drill-through for date:', today)
  
  const { data: customers, error } = await supabase
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name,
      email,
      created_at,
      orders!left(id, total_price, created_at)
    `)
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lte('created_at', `${today}T23:59:59.999Z`)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('❌ Error fetching new customers:', error)
    return createEmptyDrillThrough('customers', 'New Customers Today', 'Error loading data')
  }

  console.log('✅ New customers today fetched:', customers?.length || 0, 'customers')

  // Create hourly time series data
  const timeSeriesData = Array.from({ length: 24 }, (_, hour) => {
    const hourCustomers = customers?.filter(customer => 
      new Date(customer.created_at).getHours() === hour
    ) || []
    
    return {
      time: `${String(hour).padStart(2, '0')}:00`,
      customers: hourCustomers.length,
      revenue: hourCustomers.reduce((sum, customer) => 
        sum + (customer.orders?.reduce((orderSum, order) => orderSum + (order.total_price || 0), 0) || 0), 0
      )
    }
  })

  return {
    type: 'customers',
    title: 'New Customers Today',
    subtitle: `Customers who signed up on ${today}`,
    value: customers?.length.toString() || '0',
    change: calculateDayOverDayChange(customers?.length || 0, 'customers'),
    changeType: 'positive',
    filters: baseData.filters,
    timeSeriesData,
    data: customers?.map(customer => ({
      name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown',
      email: customer.email,
      signup_date: new Date(customer.created_at).toLocaleDateString(),
      signup_time: new Date(customer.created_at).toLocaleTimeString(),
      orders: customer.orders?.length || 0,
      ltv: customer.orders?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0,
      segment: 'new'
    })) || []
  }
}

async function getAOVDrillThrough(filters: FilterState, baseData: any): Promise<DrillThroughData> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select('total_price, created_at')
    .eq('merchant_id', MERCHANT_ID)
    .gte('created_at', sevenDaysAgo.toISOString())
    .not('total_price', 'is', null)

  if (error) {
    console.error('Error fetching AOV data:', error)
    return createEmptyDrillThrough('aov', 'Average Order Value (7d)', 'No orders found for the last 7 days')
  }

  // Create daily time series data
  const timeSeriesData = Array.from({ length: 7 }, (_, dayIndex) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - dayIndex))
    const dateStr = date.toISOString().split('T')[0]
    
    const dayOrders = orders?.filter(order => 
      order.created_at.startsWith(dateStr)
    ) || []
    
    const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.total_price || 0), 0)
    const dayOrderCount = dayOrders.length
    
    return {
      date: dateStr,
      aov: dayOrderCount > 0 ? dayRevenue / dayOrderCount : 0,
      orders: dayOrderCount,
      revenue: dayRevenue
    }
  })

  // Create AOV distribution
  const aovRanges = [
    { range: '£0-50', min: 0, max: 50, count: 0 },
    { range: '£51-100', min: 51, max: 100, count: 0 },
    { range: '£101-200', min: 101, max: 200, count: 0 },
    { range: '£201-500', min: 201, max: 500, count: 0 },
    { range: '£500+', min: 501, max: Infinity, count: 0 }
  ]

  orders?.forEach(order => {
    const price = order.total_price || 0
    const range = aovRanges.find(r => price >= r.min && price <= r.max)
    if (range) range.count++
  })

  const avgOrderValue = orders?.length ? 
    orders.reduce((sum, order) => sum + (order.total_price || 0), 0) / orders.length : 0

  return {
    type: 'aov',
    title: 'Average Order Value (7 Days)',
    subtitle: 'AOV analysis for the last 7 days',
    value: `£${avgOrderValue.toFixed(2)}`,
    change: calculatePercentageChange(avgOrderValue, avgOrderValue * 0.95), // Mock comparison
    changeType: 'positive',
    filters: baseData.filters,
    timeSeriesData,
    data: aovRanges
  }
}

async function getFilteredRevenueDrillThrough(filters: FilterState, baseData: any): Promise<DrillThroughData> {
  console.log('🔍 Fetching filtered revenue drill-through for period:', filters.startDate, 'to', filters.endDate)
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      total_price,
      created_at,
      status,
      customer_id,
      profiles!left(first_name, last_name, email)
    `)
    .eq('merchant_id', MERCHANT_ID)
    .gte('created_at', filters.startDate)
    .lte('created_at', filters.endDate)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('❌ Error fetching filtered revenue orders:', error)
    return createEmptyDrillThrough('revenue', 'Total Revenue', 'Error loading data')
  }

  console.log('✅ Filtered revenue orders fetched:', orders?.length || 0, 'orders')

  // Create daily time series from orders data
  const dailyRevenue = orders?.reduce((acc, order) => {
    const date = order.created_at.split('T')[0]
    if (!acc[date]) {
      acc[date] = { date, revenue: 0, orders: 0 }
    }
    acc[date].revenue += order.total_price || 0
    acc[date].orders++
    return acc
  }, {} as Record<string, any>) || {}

  const timeSeriesData = Object.values(dailyRevenue).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0

  return {
    type: 'revenue',
    title: 'Total Revenue - Detailed Breakdown',
    subtitle: `Revenue analysis for ${baseData.filters.dateRange}`,
    value: `$${totalRevenue.toLocaleString()}`,
    change: calculatePercentageChange(totalRevenue, totalRevenue * 0.85), // Mock comparison
    changeType: 'positive',
    filters: baseData.filters,
    timeSeriesData,
    data: orders?.map(order => ({
      date: new Date(order.created_at).toLocaleDateString(),
      time: new Date(order.created_at).toLocaleTimeString(),
      order_id: order.order_number || order.id,
      customer: `${order.profiles?.first_name || ''} ${order.profiles?.last_name || ''}`.trim() || order.profiles?.email || 'Unknown Customer',
      value: order.total_price || 0,
      status: order.status || 'unknown'
    })) || []
  }
}

async function getFilteredOrdersDrillThrough(filters: FilterState, baseData: any): Promise<DrillThroughData> {
  console.log('🔍 Fetching filtered orders drill-through for period:', filters.startDate, 'to', filters.endDate)
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      total_price,
      created_at,
      status,
      customer_id,
      profiles!left(first_name, last_name, email)
    `)
    .eq('merchant_id', MERCHANT_ID)
    .gte('created_at', filters.startDate)
    .lte('created_at', filters.endDate)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('❌ Error fetching filtered orders:', error)
    return createEmptyDrillThrough('orders', 'Total Orders', 'Error loading data')
  }

  console.log('✅ Filtered orders fetched:', orders?.length || 0, 'orders')

  // Create daily time series from orders data
  const dailyOrders = orders?.reduce((acc, order) => {
    const date = order.created_at.split('T')[0]
    if (!acc[date]) {
      acc[date] = { date, orders: 0, revenue: 0 }
    }
    acc[date].orders++
    acc[date].revenue += order.total_price || 0
    return acc
  }, {} as Record<string, any>) || {}

  const timeSeriesData = Object.values(dailyOrders).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  return {
    type: 'orders',
    title: 'Total Orders - Detailed View',
    subtitle: `Orders analysis for ${baseData.filters.dateRange}`,
    value: orders?.length.toString() || '0',
    change: calculatePercentageChange(orders?.length || 0, (orders?.length || 0) * 0.8), // Mock comparison
    changeType: 'positive',
    filters: baseData.filters,
    timeSeriesData,
    data: orders?.map(order => ({
      date: new Date(order.created_at).toLocaleDateString(),
      time: new Date(order.created_at).toLocaleTimeString(),
      order_id: order.order_number || order.id,
      customer: `${order.profiles?.first_name || ''} ${order.profiles?.last_name || ''}`.trim() || order.profiles?.email || 'Unknown Customer',
      items: 1, // Default to 1 item per order since we don't have line items data
      value: order.total_price || 0,
      status: order.status || 'unknown'
    })) || []
  }
}

async function getFilteredCustomersDrillThrough(filters: FilterState, baseData: any): Promise<DrillThroughData> {
  console.log('🔍 Fetching filtered customers drill-through for period:', filters.startDate, 'to', filters.endDate)
  
  const { data: customers, error } = await supabase
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name,
      email,
      created_at,
      orders!left(id, total_price, created_at)
    `)
    .gte('created_at', filters.startDate)
    .lte('created_at', filters.endDate)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('❌ Error fetching filtered customers:', error)
    return createEmptyDrillThrough('customers', 'New Customers', 'Error loading data')
  }

  console.log('✅ Filtered customers fetched:', customers?.length || 0, 'customers')

  // Create daily time series data
  const dailyCustomers = customers?.reduce((acc, customer) => {
    const date = customer.created_at.split('T')[0]
    if (!acc[date]) {
      acc[date] = { date, customers: 0, revenue: 0 }
    }
    acc[date].customers++
    acc[date].revenue += customer.orders?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0
    return acc
  }, {} as Record<string, any>) || {}

  const timeSeriesData = Object.values(dailyCustomers).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  return {
    type: 'customers',
    title: 'New Customers - Detailed Analysis',
    subtitle: `Customer acquisition for ${baseData.filters.dateRange}`,
    value: customers?.length.toString() || '0',
    change: calculatePercentageChange(customers?.length || 0, (customers?.length || 0) * 0.7), // Mock comparison
    changeType: 'positive',
    filters: baseData.filters,
    timeSeriesData,
    data: customers?.map(customer => ({
      name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown',
      email: customer.email,
      signup_date: new Date(customer.created_at).toLocaleDateString(),
      signup_time: new Date(customer.created_at).toLocaleTimeString(),
      orders: customer.orders?.length || 0,
      ltv: customer.orders?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0,
      segment: customer.orders?.length === 1 ? 'new' : customer.orders?.length > 5 ? 'vip' : 'returning'
    })) || []
  }
}

async function getFilteredAOVDrillThrough(filters: FilterState, baseData: any): Promise<DrillThroughData> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('total_price, created_at')
    .eq('merchant_id', MERCHANT_ID)
    .gte('created_at', filters.startDate)
    .lte('created_at', filters.endDate)
    .not('total_price', 'is', null)

  if (error) {
    console.error('Error fetching filtered AOV data:', error)
    return createEmptyDrillThrough('aov', 'Average Order Value', 'No orders found for selected period')
  }

  // Create daily AOV time series
  const dailyAOV = orders?.reduce((acc, order) => {
    const date = order.created_at.split('T')[0]
    if (!acc[date]) {
      acc[date] = { date, revenue: 0, orders: 0, aov: 0 }
    }
    acc[date].revenue += order.total_price || 0
    acc[date].orders++
    return acc
  }, {} as Record<string, any>) || {}

  // Calculate AOV for each day
  Object.values(dailyAOV).forEach((day: any) => {
    day.aov = day.orders > 0 ? day.revenue / day.orders : 0
  })

  const timeSeriesData = Object.values(dailyAOV).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Create AOV distribution
  const aovRanges = [
    { range: '£0-50', min: 0, max: 50, count: 0 },
    { range: '£51-100', min: 51, max: 100, count: 0 },
    { range: '£101-200', min: 101, max: 200, count: 0 },
    { range: '£201-500', min: 201, max: 500, count: 0 },
    { range: '£500+', min: 501, max: Infinity, count: 0 }
  ]

  orders?.forEach(order => {
    const price = order.total_price || 0
    const range = aovRanges.find(r => price >= r.min && price <= r.max)
    if (range) range.count++
  })

  const avgOrderValue = orders?.length ? 
    orders.reduce((sum, order) => sum + (order.total_price || 0), 0) / orders.length : 0

  return {
    type: 'aov',
    title: 'Average Order Value - Distribution Analysis',
    subtitle: `AOV breakdown for ${baseData.filters.dateRange}`,
    value: `£${avgOrderValue.toFixed(2)}`,
    change: calculatePercentageChange(avgOrderValue, avgOrderValue * 0.9), // Mock comparison
    changeType: 'positive',
    filters: baseData.filters,
    timeSeriesData,
    data: aovRanges
  }
}

// Helper functions
function createEmptyDrillThrough(type: string, title: string, subtitle: string): DrillThroughData {
  return {
    type,
    title,
    subtitle,
    value: '0',
    change: '0%',
    changeType: 'positive',
    filters: {},
    timeSeriesData: [],
    data: []
  }
}

function calculateDayOverDayChange(currentValue: number, metric: string): string {
  // Mock day-over-day calculation - in real implementation, you'd fetch yesterday's data
  const mockPreviousValue = currentValue * (0.8 + Math.random() * 0.4) // Random between 80-120% of current
  return calculatePercentageChange(currentValue, mockPreviousValue)
}

function calculatePercentageChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '0%'
  const change = ((current - previous) / previous) * 100
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
}