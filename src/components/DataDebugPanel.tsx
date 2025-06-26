import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabaseClient'
import { AlertCircle, CheckCircle, Database, RefreshCw } from 'lucide-react'

const MERCHANT_ID = '11111111-1111-1111-1111-111111111111'

interface ViewStatus {
  name: string
  exists: boolean
  rowCount: number
  merchantData: number
  error?: string
}

export default function DataDebugPanel() {
  const [viewStatuses, setViewStatuses] = useState<ViewStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [rawTableData, setRawTableData] = useState<any>({})

  const materializedViews = [
    'daily_revenue_summary',
    'product_performance_summary', 
    'customer_segment_summary',
    'channel_performance_summary',
    'customer_retention_summary',
    'refund_summary'
  ]

  const rawTables = [
    'orders',
    'order_items',
    'products',
    'customers'
  ]

  const checkViewStatus = async (viewName: string): Promise<ViewStatus> => {
    try {
      // Check if view exists and get total row count
      const { data: allData, error: allError } = await supabase
        .from(viewName)
        .select('*', { count: 'exact', head: true })

      if (allError) {
        return {
          name: viewName,
          exists: false,
          rowCount: 0,
          merchantData: 0,
          error: allError.message
        }
      }

      const totalRows = allData?.length || 0

      // Check merchant-specific data
      const { data: merchantData, error: merchantError } = await supabase
        .from(viewName)
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', MERCHANT_ID)

      const merchantRows = merchantData?.length || 0

      return {
        name: viewName,
        exists: true,
        rowCount: totalRows,
        merchantData: merchantRows,
        error: merchantError?.message
      }
    } catch (error) {
      return {
        name: viewName,
        exists: false,
        rowCount: 0,
        merchantData: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  const checkRawTableData = async (tableName: string) => {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (error) {
        return { error: error.message, count: 0 }
      }

      // Check merchant-specific data if merchant_id column exists
      const { data: merchantData, error: merchantError, count: merchantCount } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', MERCHANT_ID)

      return {
        count: count || 0,
        merchantCount: merchantError ? 'N/A' : (merchantCount || 0),
        error: null
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0,
        merchantCount: 0
      }
    }
  }

  const runDiagnostics = async () => {
    setLoading(true)
    try {
      // Check materialized views
      const viewPromises = materializedViews.map(checkViewStatus)
      const viewResults = await Promise.all(viewPromises)
      setViewStatuses(viewResults)

      // Check raw tables
      const tablePromises = rawTables.map(async (tableName) => {
        const result = await checkRawTableData(tableName)
        return { [tableName]: result }
      })
      const tableResults = await Promise.all(tablePromises)
      const combinedTableData = tableResults.reduce((acc, curr) => ({ ...acc, ...curr }), {})
      setRawTableData(combinedTableData)

    } catch (error) {
      console.error('Error running diagnostics:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshMaterializedViews = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('refresh_analytics_views')
      
      if (error) {
        console.error('Error refreshing views:', error)
        alert(`Error refreshing views: ${error.message}`)
      } else {
        alert('Materialized views refreshed successfully!')
        // Re-run diagnostics
        await runDiagnostics()
      }
    } catch (error) {
      console.error('Error calling refresh function:', error)
      alert('Error calling refresh function')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Data Debug Panel
          </CardTitle>
          <div className="flex space-x-2">
            <Button onClick={runDiagnostics} disabled={loading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Run Diagnostics
            </Button>
            <Button onClick={refreshMaterializedViews} disabled={loading} size="sm" variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Refresh Views
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Merchant ID: {MERCHANT_ID}</h4>
            </div>

            {/* Raw Tables Status */}
            <div>
              <h4 className="font-semibold mb-2">Raw Tables Status</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(rawTableData).map(([tableName, data]: [string, any]) => (
                  <div key={tableName} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-medium">{tableName}</span>
                    <div className="flex items-center space-x-2">
                      {data.error ? (
                        <Badge variant="destructive">Error</Badge>
                      ) : (
                        <>
                          <Badge variant="secondary">Total: {data.count}</Badge>
                          <Badge variant="default">Merchant: {data.merchantCount}</Badge>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Materialized Views Status */}
            <div>
              <h4 className="font-semibold mb-2">Materialized Views Status</h4>
              <div className="space-y-2">
                {viewStatuses.map((status) => (
                  <div key={status.name} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-2">
                      {status.exists ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">{status.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {status.error ? (
                        <Badge variant="destructive">Error</Badge>
                      ) : (
                        <>
                          <Badge variant="secondary">Total: {status.rowCount}</Badge>
                          <Badge variant={status.merchantData > 0 ? "default" : "destructive"}>
                            Merchant: {status.merchantData}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Details */}
            {viewStatuses.some(v => v.error) && (
              <div>
                <h4 className="font-semibold mb-2 text-red-600">Errors</h4>
                <div className="space-y-1">
                  {viewStatuses
                    .filter(v => v.error)
                    .map((status) => (
                      <div key={status.name} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        <strong>{status.name}:</strong> {status.error}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}