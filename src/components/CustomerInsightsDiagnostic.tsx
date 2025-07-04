import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database } from 'lucide-react';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
}

const MERCHANT_ID = '11111111-1111-1111-1111-111111111111';

export const CustomerInsightsDiagnostic: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnosticResults: DiagnosticResult[] = [];

    // Test 1: Core Tables - Customers
    try {
      const { data, error, count } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email, total_spent, orders_count, created_at', { count: 'exact' })
        .eq('merchant_id', MERCHANT_ID)
        .limit(5);
      
      diagnosticResults.push({
        test: 'Customers Table',
        status: error ? 'error' : (count && count > 0 ? 'success' : 'warning'),
        message: error 
          ? `Error: ${error.message}` 
          : `Found ${count || 0} customers`,
        details: error || { count, sampleData: data?.[0] }
      });
    } catch (err) {
      diagnosticResults.push({
        test: 'Customers Table',
        status: 'error',
        message: `Error: ${err}`,
        details: err
      });
    }

    // Test 2: Core Tables - Orders
    try {
      const { data, error, count } = await supabase
        .from('orders')
        .select('id, customer_id, total_price, created_at', { count: 'exact' })
        .eq('merchant_id', MERCHANT_ID)
        .not('customer_id', 'is', null)
        .limit(5);
      
      diagnosticResults.push({
        test: 'Orders Table',
        status: error ? 'error' : (count && count > 0 ? 'success' : 'warning'),
        message: error 
          ? `Error: ${error.message}` 
          : `Found ${count || 0} orders with customers`,
        details: error || { count, sampleData: data?.[0] }
      });
    } catch (err) {
      diagnosticResults.push({
        test: 'Orders Table',
        status: 'error',
        message: `Error: ${err}`,
        details: err
      });
    }

    // Test 3: Customer Retention Summary Table
    try {
      const { data, error, count } = await supabase
        .from('customer_retention_summary')
        .select('*', { count: 'exact' })
        .eq('merchant_id', MERCHANT_ID)
        .limit(5);
      
      diagnosticResults.push({
        test: 'Customer Retention Summary',
        status: error ? 'error' : (count && count > 0 ? 'success' : 'warning'),
        message: error 
          ? `Error: ${error.message}` 
          : `Found ${count || 0} retention summary records`,
        details: error || { count, sampleData: data?.[0] }
      });
    } catch (err) {
      diagnosticResults.push({
        test: 'Customer Retention Summary',
        status: 'error',
        message: `Error: ${err}`,
        details: err
      });
    }

    // Test 4: Churn Predictions Table
    try {
      const { data, error, count } = await supabase
        .from('churn_predictions')
        .select('*', { count: 'exact' })
        .eq('merchant_id', MERCHANT_ID)
        .limit(5);
      
      diagnosticResults.push({
        test: 'Churn Predictions Table',
        status: error ? 'error' : (count && count > 0 ? 'success' : 'warning'),
        message: error 
          ? `Error: ${error.message}` 
          : `Found ${count || 0} churn predictions`,
        details: error || { count, sampleData: data?.[0] }
      });
    } catch (err) {
      diagnosticResults.push({
        test: 'Churn Predictions Table',
        status: 'error',
        message: `Error: ${err}`,
        details: err
      });
    }

    // Test 5: LTV Predictions Table
    try {
      const { data, error, count } = await supabase
        .from('ltv_predictions')
        .select('*', { count: 'exact' })
        .eq('merchant_id', MERCHANT_ID)
        .limit(5);
      
      diagnosticResults.push({
        test: 'LTV Predictions Table',
        status: error ? 'error' : (count && count > 0 ? 'success' : 'warning'),
        message: error 
          ? `Error: ${error.message}` 
          : `Found ${count || 0} LTV predictions`,
        details: error || { count, sampleData: data?.[0] }
      });
    } catch (err) {
      diagnosticResults.push({
        test: 'LTV Predictions Table',
        status: 'error',
        message: `Error: ${err}`,
        details: err
      });
    }

    // Test 6: Customer Clusters Table
    try {
      const { data, error, count } = await supabase
        .from('customer_clusters')
        .select('*', { count: 'exact' })
        .eq('merchant_id', MERCHANT_ID)
        .limit(5);
      
      diagnosticResults.push({
        test: 'Customer Clusters Table',
        status: error ? 'error' : (count && count > 0 ? 'success' : 'warning'),
        message: error 
          ? `Error: ${error.message}` 
          : `Found ${count || 0} customer clusters`,
        details: error || { count, sampleData: data?.[0] }
      });
    } catch (err) {
      diagnosticResults.push({
        test: 'Customer Clusters Table',
        status: 'error',
        message: `Error: ${err}`,
        details: err
      });
    }

    // Test 7: Customer Segments Calculation
    try {
      // Try to calculate customer segments from orders data
      const { data: orders, error } = await supabase
        .from('orders')
        .select('customer_id, total_price, created_at')
        .eq('merchant_id', MERCHANT_ID)
        .not('customer_id', 'is', null)
        .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
        .limit(100);
      
      if (error) {
        diagnosticResults.push({
          test: 'Customer Segments Calculation',
          status: 'error',
          message: `Error fetching orders for segmentation: ${error.message}`,
          details: error
        });
      } else {
        const uniqueCustomers = new Set(orders?.map(o => o.customer_id) || []);
        diagnosticResults.push({
          test: 'Customer Segments Calculation',
          status: uniqueCustomers.size > 0 ? 'success' : 'warning',
          message: `Can calculate segments from ${orders?.length || 0} orders for ${uniqueCustomers.size} unique customers`,
          details: { orderCount: orders?.length, uniqueCustomers: uniqueCustomers.size }
        });
      }
    } catch (err) {
      diagnosticResults.push({
        test: 'Customer Segments Calculation',
        status: 'error',
        message: `Error: ${err}`,
        details: err
      });
    }

    // Test 8: Cohort Analysis Data Availability
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('customer_id, created_at, total_price')
        .eq('merchant_id', MERCHANT_ID)
        .not('customer_id', 'is', null)
        .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true })
        .limit(200);
      
      if (error) {
        diagnosticResults.push({
          test: 'Cohort Analysis Data',
          status: 'error',
          message: `Error fetching orders for cohort analysis: ${error.message}`,
          details: error
        });
      } else {
        const customerFirstOrders: { [key: string]: string } = {};
        orders?.forEach(order => {
          if (order.customer_id && !customerFirstOrders[order.customer_id]) {
            customerFirstOrders[order.customer_id] = order.created_at;
          }
        });
        
        const cohortMonths = new Set();
        Object.values(customerFirstOrders).forEach(date => {
          const orderDate = new Date(date);
          const cohortMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
          cohortMonths.add(cohortMonth);
        });

        diagnosticResults.push({
          test: 'Cohort Analysis Data',
          status: cohortMonths.size > 0 ? 'success' : 'warning',
          message: `Can generate cohort analysis with ${cohortMonths.size} cohort months from ${Object.keys(customerFirstOrders).length} customers`,
          details: { 
            cohortMonths: Array.from(cohortMonths).sort(),
            customerCount: Object.keys(customerFirstOrders).length,
            orderCount: orders?.length
          }
        });
      }
    } catch (err) {
      diagnosticResults.push({
        test: 'Cohort Analysis Data',
        status: 'error',
        message: `Error: ${err}`,
        details: err
      });
    }

    // Test 9: Date Range Analysis
    try {
      const { data: dateRange, error } = await supabase
        .from('orders')
        .select('created_at')
        .eq('merchant_id', MERCHANT_ID)
        .not('customer_id', 'is', null)
        .order('created_at', { ascending: true })
        .limit(1);

      const { data: latestDate, error: latestError } = await supabase
        .from('orders')
        .select('created_at')
        .eq('merchant_id', MERCHANT_ID)
        .not('customer_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error || latestError) {
        diagnosticResults.push({
          test: 'Data Date Range',
          status: 'error',
          message: `Error fetching date range: ${error?.message || latestError?.message}`,
          details: error || latestError
        });
      } else {
        const earliest = dateRange?.[0]?.created_at;
        const latest = latestDate?.[0]?.created_at;
        const daysDiff = earliest && latest ? Math.floor((new Date(latest).getTime() - new Date(earliest).getTime()) / (1000 * 60 * 60 * 24)) : 0;
        
        diagnosticResults.push({
          test: 'Data Date Range',
          status: daysDiff > 60 ? 'success' : daysDiff > 30 ? 'warning' : 'error',
          message: `Data spans ${daysDiff} days (${earliest ? new Date(earliest).toLocaleDateString() : 'N/A'} to ${latest ? new Date(latest).toLocaleDateString() : 'N/A'})`,
          details: { earliest, latest, daysDiff }
        });
      }
    } catch (err) {
      diagnosticResults.push({
        test: 'Data Date Range',
        status: 'error',
        message: `Error: ${err}`,
        details: err
      });
    }

    setResults(diagnosticResults);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-xl font-medium">Customer Insights Data Diagnostic</CardTitle>
          </div>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            Run Tests
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.map((result, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(result.status)}
                  <h3 className="font-medium">{result.test}</h3>
                </div>
              </div>
              <p className="text-sm mb-2">{result.message}</p>
              {result.details && (
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium mb-1">Details</summary>
                  <pre className="bg-white bg-opacity-50 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
        
        {results.length === 0 && (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Running customer insights diagnostics...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};