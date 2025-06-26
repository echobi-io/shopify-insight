import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, AlertCircle, CheckCircle, Bug } from 'lucide-react';
import { runFetcherDebug, logDebugResults, DebugResult } from '@/lib/debug/fetcherDebug';

interface DatabaseDebugProps {
  merchantId?: string;
}

export default function DatabaseDebug({ merchantId = '11111111-1111-1111-1111-111111111111' }: DatabaseDebugProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [debugResults, setDebugResults] = useState<DebugResult[]>([]);
  const [showAdvancedDebug, setShowAdvancedDebug] = useState(false);

  const runDatabaseTests = async () => {
    setLoading(true);
    setError(null);
    const testResults: any = {};

    try {
      // Test 1: Basic connection
      console.log('Testing basic Supabase connection...');
      const { count: connectionCount, error: connectionError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      
      testResults.connection = {
        success: !connectionError,
        error: connectionError?.message,
        count: connectionCount || 0
      };

      // Test 2: Check if orders table has data
      console.log('Testing orders table...');
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .limit(5);
      
      testResults.orders = {
        success: !ordersError,
        error: ordersError?.message,
        count: orders?.length || 0,
        sample: orders?.[0] || null
      };

      // Test 3: Check if orders have merchant_id
      console.log('Testing merchant_id in orders...');
      const { data: merchantOrders, error: merchantError } = await supabase
        .from('orders')
        .select('*')
        .eq('merchant_id', merchantId)
        .limit(5);
      
      testResults.merchantOrders = {
        success: !merchantError,
        error: merchantError?.message,
        count: merchantOrders?.length || 0,
        sample: merchantOrders?.[0] || null
      };

      // Test 4: Check materialized views
      console.log('Testing materialized views...');
      const { data: dailyRevenue, error: dailyRevenueError } = await supabase
        .from('daily_revenue_summary')
        .select('*')
        .limit(5);
      
      testResults.materializedViews = {
        success: !dailyRevenueError,
        error: dailyRevenueError?.message,
        count: dailyRevenue?.length || 0,
        sample: dailyRevenue?.[0] || null
      };

      // Test 5: Check materialized views with merchant_id
      console.log('Testing materialized views with merchant_id...');
      const { data: merchantRevenue, error: merchantRevenueError } = await supabase
        .from('daily_revenue_summary')
        .select('*')
        .eq('merchant_id', merchantId)
        .limit(5);
      
      testResults.merchantMaterializedViews = {
        success: !merchantRevenueError,
        error: merchantRevenueError?.message,
        count: merchantRevenue?.length || 0,
        sample: merchantRevenue?.[0] || null
      };

      // Test 6: Check other tables
      console.log('Testing other tables...');
      const tables = ['customers', 'products', 'order_line_items', 'refunds'];
      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          testResults[table] = {
            success: !error,
            error: error?.message,
            count: count || 0
          };
        } catch (err) {
          testResults[table] = {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
            count: 0
          };
        }
      }

      setResults(testResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const runAdvancedDebug = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Running advanced fetcher debug...');
      const results = await runFetcherDebug('all_2024', merchantId);
      setDebugResults(results);
      logDebugResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Advanced debug failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDatabaseTests();
  }, [merchantId]);

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge variant="default" className="bg-green-500">
        <CheckCircle className="w-3 h-3 mr-1" />
        Success
      </Badge>
    ) : (
      <Badge variant="destructive">
        <AlertCircle className="w-3 h-3 mr-1" />
        Failed
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Debug Panel
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={runDatabaseTests} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Basic Tests
            </Button>
            <Button 
              onClick={runAdvancedDebug} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <Bug className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Advanced Debug
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Testing database connectivity and data availability for merchant: {merchantId}
        </p>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Basic Test Results */}
        {Object.keys(results).length > 0 && (
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold">Basic Database Tests</h3>
            {Object.entries(results).map(([testName, result]: [string, any]) => (
              <div key={testName} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium capitalize">{testName.replace(/([A-Z])/g, ' $1')}</h4>
                  {getStatusBadge(result.success)}
                </div>
                
                <div className="text-sm space-y-1">
                  <p><strong>Count:</strong> {result.count}</p>
                  {result.error && (
                    <p className="text-red-600"><strong>Error:</strong> {result.error}</p>
                  )}
                  {result.sample && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                        View Sample Data
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(result.sample, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Advanced Debug Results */}
        {debugResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Advanced Fetcher Debug Results</h3>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800 text-sm">
                ✅ {debugResults.filter(r => r.success).length}/{debugResults.length} tests passed
              </p>
            </div>
            {debugResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{result.test}</h4>
                  {getStatusBadge(result.success)}
                </div>
                
                <div className="text-sm space-y-1">
                  {result.count !== undefined && (
                    <p><strong>Count:</strong> {result.count}</p>
                  )}
                  {result.error && (
                    <p className="text-red-600"><strong>Error:</strong> {result.error}</p>
                  )}
                  {result.details && (
                    <div>
                      <strong>Details:</strong>
                      <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </div>
                  )}
                  {result.data && typeof result.data === 'object' && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                        View Data Sample
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(result.data, null, 2).substring(0, 500)}...
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {Object.keys(results).length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No test results yet. Click "Refresh Tests" to run database diagnostics.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}