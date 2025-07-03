import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
}

export const SupabaseDiagnostic: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnosticResults: DiagnosticResult[] = [];

    // Test 1: Environment Variables
    diagnosticResults.push({
      test: 'Environment Variables',
      status: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'success' : 'error',
      message: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
        ? 'Environment variables are configured' 
        : 'Missing environment variables',
      details: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
      }
    });

    // Test 2: Basic Connection
    try {
      const { data, error, count } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true });
      
      diagnosticResults.push({
        test: 'Basic Connection',
        status: error ? 'error' : 'success',
        message: error ? `Connection failed: ${error.message}` : 'Successfully connected to Supabase',
        details: error || { count }
      });
    } catch (err) {
      diagnosticResults.push({
        test: 'Basic Connection',
        status: 'error',
        message: `Connection error: ${err}`,
        details: err
      });
    }

    // Test 3: Customers Table
    try {
      const { data, error, count } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true });
      
      diagnosticResults.push({
        test: 'Customers Table',
        status: error ? 'error' : (count && count > 0 ? 'success' : 'warning'),
        message: error 
          ? `Error accessing customers table: ${error.message}` 
          : `Found ${count || 0} customers`,
        details: error || { count }
      });
    } catch (err) {
      diagnosticResults.push({
        test: 'Customers Table',
        status: 'error',
        message: `Error: ${err}`,
        details: err
      });
    }

    // Test 4: Orders Table
    try {
      const { data, error, count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true });
      
      diagnosticResults.push({
        test: 'Orders Table',
        status: error ? 'error' : (count && count > 0 ? 'success' : 'warning'),
        message: error 
          ? `Error accessing orders table: ${error.message}` 
          : `Found ${count || 0} orders`,
        details: error || { count }
      });
    } catch (err) {
      diagnosticResults.push({
        test: 'Orders Table',
        status: 'error',
        message: `Error: ${err}`,
        details: err
      });
    }

    // Test 5: RPC Function - Top Customers
    try {
      const { data, error } = await supabase.rpc('get_top_customers', {
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        limit_count: 5
      });
      
      diagnosticResults.push({
        test: 'get_top_customers RPC',
        status: error ? 'error' : 'success',
        message: error 
          ? `RPC function error: ${error.message}` 
          : `RPC function working, returned ${data?.length || 0} results`,
        details: error || { resultCount: data?.length, sampleData: data?.[0] }
      });
    } catch (err) {
      diagnosticResults.push({
        test: 'get_top_customers RPC',
        status: 'error',
        message: `RPC error: ${err}`,
        details: err
      });
    }

    // Test 6: Product Performance RPC Function
    try {
      const { data, error } = await supabase.rpc('get_product_performance', {
        merchant_id: '11111111-1111-1111-1111-111111111111',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z'
      });
      
      diagnosticResults.push({
        test: 'get_product_performance RPC',
        status: error ? 'error' : 'success',
        message: error 
          ? `Product RPC error: ${error.message}` 
          : `Product RPC working, returned ${data?.length || 0} products`,
        details: error || { resultCount: data?.length, sampleData: data?.[0] }
      });
    } catch (err) {
      diagnosticResults.push({
        test: 'get_product_performance RPC',
        status: 'error',
        message: `Product RPC error: ${err}`,
        details: err
      });
    }

    // Test 7: Network/Latency
    const startTime = Date.now();
    try {
      await supabase.from('customers').select('id').limit(1);
      const latency = Date.now() - startTime;
      diagnosticResults.push({
        test: 'Network Latency',
        status: latency < 2000 ? 'success' : latency < 5000 ? 'warning' : 'error',
        message: `Response time: ${latency}ms`,
        details: { latency }
      });
    } catch (err) {
      diagnosticResults.push({
        test: 'Network Latency',
        status: 'error',
        message: 'Network test failed',
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-medium">Supabase Diagnostic</CardTitle>
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
                  <pre className="bg-white bg-opacity-50 p-2 rounded overflow-auto">
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
            <p className="text-gray-600">Running diagnostics...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};