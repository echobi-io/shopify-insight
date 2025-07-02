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
      return [];
    }

    if (!data || data.length === 0) {
      console.log('No top customers data returned');
      return [];
    }

    console.log('Top customers data fetched successfully:', data.length, 'customers');
    return data;
  } catch (error) {
    console.error('Error in getTopCustomersData:', error);
    return [];
  }
}