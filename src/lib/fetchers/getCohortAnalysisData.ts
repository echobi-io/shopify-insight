import { supabase } from '../supabaseClient';

export interface CohortAnalysisResult {
  cohortMonth: string; // e.g. '2023-01'
  monthIndex: number; // 0 = signup month, 1 = next month, etc.
  avgIncome: number;
}

/**
 * Returns cumulative average income per customer by cohort month.
 * Each cohort is a group of customers who signed up in the same month.
 * For each cohort, for each month since signup, calculates the average cumulative income per customer.
 */
export async function getCohortAnalysisData(merchantId: string): Promise<CohortAnalysisResult[]> {
  try {
    // 1. Get all customers with their signup date
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, created_at')
      .eq('merchant_id', merchantId);

    if (customersError || !customers) {
      console.error('Error fetching customers:', customersError);
      return [];
    }

    if (customers.length === 0) {
      console.log('No customers found for merchant:', merchantId);
      return [];
    }

    // 2. Group customers by cohort month
    const cohorts: Record<string, { customerIds: string[]; signupDate: Date }[]> = {};
    customers.forEach((customer: any) => {
      const signupDate = new Date(customer.created_at);
      const cohortMonth = `${signupDate.getFullYear()}-${String(signupDate.getMonth() + 1).padStart(2, '0')}`;
      if (!cohorts[cohortMonth]) cohorts[cohortMonth] = [];
      cohorts[cohortMonth].push({ customerIds: [customer.id], signupDate });
    });

    // 3. For each cohort, get all orders for those customers
    const results: CohortAnalysisResult[] = [];
    for (const cohortMonth of Object.keys(cohorts)) {
      const cohortCustomers = cohorts[cohortMonth].flatMap(c => c.customerIds);
      if (cohortCustomers.length === 0) continue;

      // Get all orders for these customers
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('customer_id, created_at, total_price')
        .in('customer_id', cohortCustomers)
        .eq('merchant_id', merchantId);

      if (ordersError || !orders) {
        console.error(`Error fetching orders for cohort ${cohortMonth}:`, ordersError);
        continue;
      }

      // Map: customer_id -> signupDate
      const customerSignup: Record<string, Date> = {};
      customers.forEach((c: any) => {
        customerSignup[c.id] = new Date(c.created_at);
      });

      // For each order, compute months since signup
      const cohortOrders = orders.map((order: any) => {
        const signup = customerSignup[order.customer_id];
        const orderDate = new Date(order.created_at);
        const monthIndex = (orderDate.getFullYear() - signup.getFullYear()) * 12 + (orderDate.getMonth() - signup.getMonth());
        return {
          customer_id: order.customer_id,
          monthIndex,
          total_price: parseFloat(order.total_price) || 0,
        };
      });

      // For each monthIndex, calculate cumulative income per customer
      const maxMonth = Math.max(...cohortOrders.map((o: any) => o.monthIndex), 0);
      for (let m = 0; m <= maxMonth; m++) {
        // For each customer, sum orders up to month m
        let totalIncome = 0;
        cohortCustomers.forEach(cid => {
          const income = cohortOrders
            .filter((o: any) => o.customer_id === cid && o.monthIndex <= m)
            .reduce((sum: number, o: any) => sum + o.total_price, 0);
          totalIncome += income;
        });
        const avgIncome = cohortCustomers.length > 0 ? totalIncome / cohortCustomers.length : 0;
        results.push({ cohortMonth, monthIndex: m, avgIncome: parseFloat(avgIncome.toFixed(2)) });
      }
    }

    return results.sort((a, b) => {
      // Sort by cohort month first, then by month index
      if (a.cohortMonth !== b.cohortMonth) {
        return a.cohortMonth.localeCompare(b.cohortMonth);
      }
      return a.monthIndex - b.monthIndex;
    });
  } catch (error) {
    console.error('Error in getCohortAnalysisData:', error);
    return [];
  }
}

/**
 * Get cohort retention data - percentage of customers who made purchases in each month
 */
export async function getCohortRetentionData(merchantId: string): Promise<any[]> {
  try {
    // Get all customers with their signup date
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, created_at')
      .eq('merchant_id', merchantId);

    if (customersError || !customers) {
      console.error('Error fetching customers:', customersError);
      return [];
    }

    if (customers.length === 0) {
      return [];
    }

    // Group customers by cohort month
    const cohorts: Record<string, string[]> = {};
    customers.forEach((customer: any) => {
      const signupDate = new Date(customer.created_at);
      const cohortMonth = `${signupDate.getFullYear()}-${String(signupDate.getMonth() + 1).padStart(2, '0')}`;
      if (!cohorts[cohortMonth]) cohorts[cohortMonth] = [];
      cohorts[cohortMonth].push(customer.id);
    });

    const retentionResults: any[] = [];

    for (const cohortMonth of Object.keys(cohorts)) {
      const cohortCustomers = cohorts[cohortMonth];
      if (cohortCustomers.length === 0) continue;

      // Get all orders for these customers
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('customer_id, created_at')
        .in('customer_id', cohortCustomers)
        .eq('merchant_id', merchantId);

      if (ordersError || !orders) {
        console.error(`Error fetching orders for cohort ${cohortMonth}:`, ordersError);
        continue;
      }

      // Map customer signup dates
      const customerSignup: Record<string, Date> = {};
      customers.forEach((c: any) => {
        customerSignup[c.id] = new Date(c.created_at);
      });

      // Calculate retention for each month
      const maxMonths = 12; // Show up to 12 months
      const retentionData: any = {
        cohortMonth,
        cohortSize: cohortCustomers.length,
        retention: {}
      };

      for (let m = 0; m < maxMonths; m++) {
        const activeCustomers = new Set();
        
        orders.forEach((order: any) => {
          const signup = customerSignup[order.customer_id];
          const orderDate = new Date(order.created_at);
          const monthIndex = (orderDate.getFullYear() - signup.getFullYear()) * 12 + (orderDate.getMonth() - signup.getMonth());
          
          if (monthIndex === m) {
            activeCustomers.add(order.customer_id);
          }
        });

        const retentionRate = (activeCustomers.size / cohortCustomers.length) * 100;
        retentionData.retention[`month_${m}`] = parseFloat(retentionRate.toFixed(2));
      }

      retentionResults.push(retentionData);
    }

    return retentionResults.sort((a, b) => a.cohortMonth.localeCompare(b.cohortMonth));
  } catch (error) {
    console.error('Error in getCohortRetentionData:', error);
    return [];
  }
}