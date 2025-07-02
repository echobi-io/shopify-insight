import { supabase } from '@/lib/supabaseClient';

export interface TopCustomer {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  total_spent: number;
  order_count: number;
  avg_order_value: number;
  last_order_date: string;
}

export async function getTopCustomersData(startDate: string, endDate: string): Promise<TopCustomer[]> {
  try {
    console.log('Fetching top customers data for date range:', { startDate, endDate });

    const { data, error } = await supabase.rpc('get_top_customers', {
      start_date: startDate,
      end_date: endDate,
      limit_count: 10
    });

    if (error) {
      console.error('Error fetching top customers:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('No top customers data returned');
      
      // Debug: Check if we have any customers at all
      const { data: customersCheck, error: customersError } = await supabase
        .from('customers')
        .select('count(*)')
        .single();
      
      if (customersError) {
        console.error('Error checking customers table:', customersError);
      } else {
        console.log('Total customers in database:', customersCheck?.count || 0);
      }
      
      // Debug: Check if we have any orders in the date range
      const { data: ordersCheck, error: ordersError } = await supabase
        .from('orders')
        .select('count(*)')
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      
      if (ordersError) {
        console.error('Error checking orders table:', ordersError);
      } else {
        console.log('Total orders in date range:', ordersCheck?.[0]?.count || 0);
      }
      
      return [];
    }

    console.log('Top customers data fetched successfully:', data.length, 'customers');
    console.log('Sample customer data:', data[0]);
    return data;
  } catch (error) {
    console.error('Error in getTopCustomersData:', error);
    return [];
  }
}