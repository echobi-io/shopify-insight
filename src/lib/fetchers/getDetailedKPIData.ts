import { supabase } from '../supabaseClient'
import { FilterState } from './getKpis'

export interface DailyRevenueData {
  date: string
  revenue: number
  orders: number
  avg_order_value: number
}

export interface OrdersByProductData {
  product_name: string
  orders_count: number
  revenue: number
  avg_order_value: number
  percentage_of_total: number
}

export interface NewCustomerData {
  customer_id: string
  customer_name: string
  email: string
  first_order_date: string
  first_order_value: number
  total_orders: number
  total_spent: number
}

export interface AOVStatsData {
  date: string
  avg_order_value: number
  orders_count: number
  total_revenue: number
  min_order_value: number
  max_order_value: number
}

export async function getDailyRevenueBreakdown(merchant_id: string, filters: FilterState): Promise<DailyRevenueData[]> {
  try {
    console.log('📊 Fetching daily revenue breakdown for merchant:', merchant_id, 'with filters:', filters);

    let query = supabase
      .from('orders')
      .select('created_at, total_price')
      .eq('merchant_id', merchant_id);

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate + 'T00:00:00.000Z');
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate + 'T23:59:59.999Z');
    }

    const { data, error } = await query.order('created_at');

    if (error) {
      console.error('❌ Error fetching daily revenue data:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('📭 No daily revenue data found');
      return [];
    }

    // Group by date and calculate daily metrics
    const dailyData: Record<string, { revenue: number; orders: number }> = {};
    
    data.forEach(order => {
      const date = order.created_at.split('T')[0];
      const revenue = parseFloat(order.total_price) || 0;
      
      if (!dailyData[date]) {
        dailyData[date] = { revenue: 0, orders: 0 };
      }
      
      dailyData[date].revenue += revenue;
      dailyData[date].orders += 1;
    });

    const result = Object.entries(dailyData).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
      avg_order_value: data.orders > 0 ? data.revenue / data.orders : 0
    })).sort((a, b) => a.date.localeCompare(b.date));

    console.log('✅ Daily revenue breakdown result:', { count: result.length });
    return result;

  } catch (error) {
    console.error('❌ Error fetching daily revenue breakdown:', error);
    return [];
  }
}

export async function getOrdersByProduct(merchant_id: string, filters: FilterState): Promise<OrdersByProductData[]> {
  try {
    console.log('📦 Fetching orders by product for merchant:', merchant_id, 'with filters:', filters);

    // Get orders with line items to calculate product-level metrics
    let ordersQuery = supabase
      .from('orders')
      .select(`
        id,
        total_price,
        created_at,
        line_items (
          product_id,
          quantity,
          price,
          products (
            name
          )
        )
      `)
      .eq('merchant_id', merchant_id);

    if (filters.startDate) {
      ordersQuery = ordersQuery.gte('created_at', filters.startDate + 'T00:00:00.000Z');
    }
    if (filters.endDate) {
      ordersQuery = ordersQuery.lte('created_at', filters.endDate + 'T23:59:59.999Z');
    }

    const { data: orders, error } = await ordersQuery;

    if (error) {
      console.error('❌ Error fetching orders by product:', error);
      return [];
    }

    if (!orders || orders.length === 0) {
      console.log('📭 No orders by product data found');
      return [];
    }

    // Calculate product metrics
    const productMetrics: Record<string, { orders: Set<string>; revenue: number; quantity: number }> = {};
    let totalRevenue = 0;

    orders.forEach(order => {
      const orderRevenue = parseFloat(order.total_price) || 0;
      totalRevenue += orderRevenue;

      if (order.line_items && order.line_items.length > 0) {
        order.line_items.forEach((lineItem: any) => {
          const productName = lineItem.products?.name || 'Unknown Product';
          const itemRevenue = parseFloat(lineItem.price) * parseInt(lineItem.quantity);
          
          if (!productMetrics[productName]) {
            productMetrics[productName] = { orders: new Set(), revenue: 0, quantity: 0 };
          }
          
          productMetrics[productName].orders.add(order.id);
          productMetrics[productName].revenue += itemRevenue;
          productMetrics[productName].quantity += parseInt(lineItem.quantity);
        });
      }
    });

    const result = Object.entries(productMetrics).map(([productName, metrics]) => ({
      product_name: productName,
      orders_count: metrics.orders.size,
      revenue: metrics.revenue,
      avg_order_value: metrics.orders.size > 0 ? metrics.revenue / metrics.orders.size : 0,
      percentage_of_total: totalRevenue > 0 ? (metrics.revenue / totalRevenue) * 100 : 0
    })).sort((a, b) => b.revenue - a.revenue);

    console.log('✅ Orders by product result:', { count: result.length });
    return result;

  } catch (error) {
    console.error('❌ Error fetching orders by product:', error);
    return [];
  }
}

export async function getNewCustomersDetail(merchant_id: string, filters: FilterState): Promise<NewCustomerData[]> {
  try {
    console.log('👥 Fetching new customers detail for merchant:', merchant_id, 'with filters:', filters);

    // Get customers created in the specified period
    let customersQuery = supabase
      .from('customers')
      .select(`
        id,
        first_name,
        last_name,
        email,
        created_at
      `)
      .eq('merchant_id', merchant_id);

    if (filters.startDate) {
      customersQuery = customersQuery.gte('created_at', filters.startDate + 'T00:00:00.000Z');
    }
    if (filters.endDate) {
      customersQuery = customersQuery.lte('created_at', filters.endDate + 'T23:59:59.999Z');
    }

    const { data: customers, error: customersError } = await customersQuery.order('created_at', { ascending: false });

    if (customersError) {
      console.error('❌ Error fetching new customers:', customersError);
      return [];
    }

    if (!customers || customers.length === 0) {
      console.log('📭 No new customers found');
      return [];
    }

    // Get order data for each customer
    const customerIds = customers.map(c => c.id);
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('customer_id, total_price, created_at')
      .eq('merchant_id', merchant_id)
      .in('customer_id', customerIds)
      .order('created_at');

    if (ordersError) {
      console.error('❌ Error fetching customer orders:', ordersError);
    }

    // Calculate customer metrics
    const customerMetrics: Record<string, { totalOrders: number; totalSpent: number; firstOrderDate: string; firstOrderValue: number }> = {};

    if (orders) {
      orders.forEach(order => {
        const customerId = order.customer_id;
        const orderValue = parseFloat(order.total_price) || 0;
        
        if (!customerMetrics[customerId]) {
          customerMetrics[customerId] = {
            totalOrders: 0,
            totalSpent: 0,
            firstOrderDate: order.created_at,
            firstOrderValue: orderValue
          };
        }
        
        customerMetrics[customerId].totalOrders += 1;
        customerMetrics[customerId].totalSpent += orderValue;
        
        // Update first order if this is earlier
        if (order.created_at < customerMetrics[customerId].firstOrderDate) {
          customerMetrics[customerId].firstOrderDate = order.created_at;
          customerMetrics[customerId].firstOrderValue = orderValue;
        }
      });
    }

    const result = customers.map(customer => {
      const metrics = customerMetrics[customer.id] || {
        totalOrders: 0,
        totalSpent: 0,
        firstOrderDate: customer.created_at,
        firstOrderValue: 0
      };

      return {
        customer_id: customer.id,
        customer_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown Customer',
        email: customer.email || 'No email',
        first_order_date: metrics.firstOrderDate,
        first_order_value: metrics.firstOrderValue,
        total_orders: metrics.totalOrders,
        total_spent: metrics.totalSpent
      };
    });

    console.log('✅ New customers detail result:', { count: result.length });
    return result;

  } catch (error) {
    console.error('❌ Error fetching new customers detail:', error);
    return [];
  }
}

export async function getAOVStats(merchant_id: string, filters: FilterState): Promise<AOVStatsData[]> {
  try {
    console.log('💰 Fetching AOV stats for merchant:', merchant_id, 'with filters:', filters);

    let query = supabase
      .from('orders')
      .select('created_at, total_price')
      .eq('merchant_id', merchant_id);

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate + 'T00:00:00.000Z');
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate + 'T23:59:59.999Z');
    }

    const { data, error } = await query.order('created_at');

    if (error) {
      console.error('❌ Error fetching AOV stats:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('📭 No AOV stats data found');
      return [];
    }

    // Group by date and calculate daily AOV stats
    const dailyStats: Record<string, { orders: number[]; totalRevenue: number }> = {};
    
    data.forEach(order => {
      const date = order.created_at.split('T')[0];
      const orderValue = parseFloat(order.total_price) || 0;
      
      if (!dailyStats[date]) {
        dailyStats[date] = { orders: [], totalRevenue: 0 };
      }
      
      dailyStats[date].orders.push(orderValue);
      dailyStats[date].totalRevenue += orderValue;
    });

    const result = Object.entries(dailyStats).map(([date, stats]) => {
      const ordersCount = stats.orders.length;
      const avgOrderValue = ordersCount > 0 ? stats.totalRevenue / ordersCount : 0;
      const minOrderValue = ordersCount > 0 ? Math.min(...stats.orders) : 0;
      const maxOrderValue = ordersCount > 0 ? Math.max(...stats.orders) : 0;

      return {
        date,
        avg_order_value: avgOrderValue,
        orders_count: ordersCount,
        total_revenue: stats.totalRevenue,
        min_order_value: minOrderValue,
        max_order_value: maxOrderValue
      };
    }).sort((a, b) => a.date.localeCompare(b.date));

    console.log('✅ AOV stats result:', { count: result.length });
    return result;

  } catch (error) {
    console.error('❌ Error fetching AOV stats:', error);
    return [];
  }
}