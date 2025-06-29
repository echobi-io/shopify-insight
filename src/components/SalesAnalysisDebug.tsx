import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabaseClient'

const HARDCODED_MERCHANT_ID = '11111111-1111-1111-1111-111111111111'

export const SalesAnalysisDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const runDebugChecks = async () => {
    setLoading(true)
    const results: any = {}

    try {
      // Check if materialized views exist
      console.log('🔍 Checking materialized views...')
      
      // Check daily_revenue_summary
      const { data: dailyRevenue, error: dailyError } = await supabase
        .from('daily_revenue_summary')
        .select('*')
        .eq('merchant_id', HARDCODED_MERCHANT_ID)
        .limit(5)

      results.dailyRevenue = {
        exists: !dailyError,
        error: dailyError?.message,
        count: dailyRevenue?.length || 0,
        sample: dailyRevenue?.slice(0, 2) || []
      }

      // Check channel_performance_summary
      const { data: channelData, error: channelError } = await supabase
        .from('channel_performance_summary')
        .select('*')
        .eq('merchant_id', HARDCODED_MERCHANT_ID)
        .limit(5)

      results.channelData = {
        exists: !channelError,
        error: channelError?.message,
        count: channelData?.length || 0,
        sample: channelData?.slice(0, 2) || []
      }

      // Check base orders table
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('merchant_id', HARDCODED_MERCHANT_ID)
        .limit(5)

      results.orders = {
        exists: !ordersError,
        error: ordersError?.message,
        count: orders?.length || 0,
        sample: orders?.slice(0, 2) || []
      }

      // Check if tables exist at all
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['orders', 'daily_revenue_summary', 'channel_performance_summary'])

      results.tableCheck = {
        exists: !tablesError,
        error: tablesError?.message,
        tables: tables || []
      }

    } catch (error) {
      console.error('Debug check error:', error)
      results.generalError = error instanceof Error ? error.message : 'Unknown error'
    }

    setDebugInfo(results)
    setLoading(false)
  }

  useEffect(() => {
    runDebugChecks()
  }, [])

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Sales Analysis Debug Info
          <Button onClick={runDebugChecks} disabled={loading} size="sm">
            {loading ? 'Checking...' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold">Table Existence Check:</h4>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
              {JSON.stringify(debugInfo.tableCheck, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold">Orders Table:</h4>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
              {JSON.stringify(debugInfo.orders, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold">Daily Revenue Summary:</h4>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
              {JSON.stringify(debugInfo.dailyRevenue, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold">Channel Performance Summary:</h4>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
              {JSON.stringify(debugInfo.channelData, null, 2)}
            </pre>
          </div>

          {debugInfo.generalError && (
            <div>
              <h4 className="font-semibold text-red-600">General Error:</h4>
              <p className="text-sm text-red-600">{debugInfo.generalError}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}